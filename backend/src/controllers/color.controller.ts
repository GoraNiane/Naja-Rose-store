import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';

export class ColorController {
  static async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const colors = await prisma.color.findMany({
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { variants: true },
          },
        },
      });
      return ApiResponse.success(res, colors);
    } catch (error) {
      return next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, hex } = req.body;
      const existing = await prisma.color.findUnique({ where: { name } });
      if (existing) {
        throw ApiError.conflict(`La couleur "${name}" existe déjà`);
      }

      const color = await prisma.color.create({
        data: { name, hex },
      });
      return ApiResponse.created(res, color, 'Couleur créée avec succès');
    } catch (error) {
      return next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const { name, hex } = req.body;

      const existing = await prisma.color.findUnique({ where: { id } });
      if (!existing) {
        throw ApiError.notFound('Couleur introuvable');
      }

      const updated = await prisma.color.update({
        where: { id },
        data: {
          ...(name ? { name } : {}),
          ...(hex ? { hex } : {}),
        },
      });
      return ApiResponse.success(res, updated, 'Couleur mise à jour avec succès');
    } catch (error) {
      return next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const existing = await prisma.color.findUnique({
        where: { id },
        include: { _count: { select: { variants: true } } },
      });

      if (!existing) {
        throw ApiError.notFound('Couleur introuvable');
      }

      if (existing._count.variants > 0) {
        throw ApiError.badRequest(
          `Impossible de supprimer cette couleur car elle est associée à ${existing._count.variants} variante(s)`
        );
      }

      await prisma.color.delete({ where: { id } });
      return ApiResponse.success(res, null, 'Couleur supprimée avec succès');
    } catch (error) {
      return next(error);
    }
  }
}

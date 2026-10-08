import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';

export class SizeController {
  static async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const sizes = await prisma.size.findMany({
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { variants: true },
          },
        },
      });
      return ApiResponse.success(res, sizes);
    } catch (error) {
      return next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { name } = req.body;
      const existing = await prisma.size.findUnique({ where: { name } });
      if (existing) {
        throw ApiError.conflict(`La taille "${name}" existe déjà`);
      }

      const size = await prisma.size.create({
        data: { name },
      });
      return ApiResponse.created(res, size, 'Taille créée avec succès');
    } catch (error) {
      return next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const { name } = req.body;

      const existing = await prisma.size.findUnique({ where: { id } });
      if (!existing) {
        throw ApiError.notFound('Taille introuvable');
      }

      const updated = await prisma.size.update({
        where: { id },
        data: { name },
      });
      return ApiResponse.success(res, updated, 'Taille mise à jour avec succès');
    } catch (error) {
      return next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const existing = await prisma.size.findUnique({
        where: { id },
        include: { _count: { select: { variants: true } } },
      });

      if (!existing) {
        throw ApiError.notFound('Taille introuvable');
      }

      if (existing._count.variants > 0) {
        throw ApiError.badRequest(
          `Impossible de supprimer cette taille car elle est associée à ${existing._count.variants} variante(s)`
        );
      }

      await prisma.size.delete({ where: { id } });
      return ApiResponse.success(res, null, 'Taille supprimée avec succès');
    } catch (error) {
      return next(error);
    }
  }
}

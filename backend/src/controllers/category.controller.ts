import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { slugify } from '../utils/slugify.js';
import { ApiError } from '../utils/apiError.js';
import { Prisma } from '@prisma/client';

export class CategoryController {
  static async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await prisma.category.findMany({
        where: { isActive: true },
        include: {
          children: true,
          _count: {
            select: { products: true },
          },
        },
        orderBy: { name: 'asc' },
      });
      return ApiResponse.success(res, categories);
    } catch (error) {
      return next(error);
    }
  }

  static async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const slug = String(req.params.slug);
      const category = await prisma.category.findUnique({
        where: { slug },
        include: {
          products: {
            where: { isActive: true },
            include: {
              images: { orderBy: { position: 'asc' } },
              variants: { where: { isActive: true } },
            },
          },
        },
      });

      if (!category) {
        throw ApiError.notFound('Catégorie introuvable');
      }

      return ApiResponse.success(res, category);
    } catch (error) {
      return next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, description, imageUrl, parentId, isActive } = req.body;
      const baseSlug = slugify(name);
      let slug = baseSlug;
      let count = 1;
      while (await prisma.category.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${count}`;
        count++;
      }

      const category = await prisma.category.create({
        data: {
          name,
          slug,
          description,
          imageUrl,
          parentId: parentId || null,
          isActive: isActive !== undefined ? isActive : true,
        },
      });

      return ApiResponse.created(res, category, 'Catégorie créée avec succès');
    } catch (error) {
      return next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const { name, description, imageUrl, parentId, isActive } = req.body;

      const existing = await prisma.category.findUnique({ where: { id } });
      if (!existing) {
        throw ApiError.notFound('Catégorie introuvable');
      }

      const updateData: Prisma.CategoryUpdateInput = {};
      if (name !== undefined) {
        updateData.name = name;
        updateData.slug = slugify(name);
      }
      if (description !== undefined) updateData.description = description;
      if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
      if (parentId !== undefined) {
        updateData.parent = parentId ? { connect: { id: parentId } } : { disconnect: true };
      }
      if (isActive !== undefined) updateData.isActive = isActive;

      const updated = await prisma.category.update({
        where: { id },
        data: updateData,
      });

      return ApiResponse.success(res, updated, 'Catégorie mise à jour avec succès');
    } catch (error) {
      return next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const existing = await prisma.category.findUnique({
        where: { id },
        include: { _count: { select: { products: true, children: true } } },
      });

      if (!existing) {
        throw ApiError.notFound('Catégorie introuvable');
      }

      if (existing._count.products > 0) {
        throw ApiError.badRequest(
          `Impossible de supprimer cette catégorie car elle contient ${existing._count.products} produit(s)`
        );
      }

      if (existing._count.children > 0) {
        throw ApiError.badRequest('Impossible de supprimer une catégorie parente contenant des sous-catégories');
      }

      await prisma.category.delete({ where: { id } });
      return ApiResponse.success(res, null, 'Catégorie supprimée avec succès');
    } catch (error) {
      return next(error);
    }
  }
}

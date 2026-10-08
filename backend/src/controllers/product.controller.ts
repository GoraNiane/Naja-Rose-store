import { Request, Response, NextFunction } from 'express';
import { productService } from '../services/product.service.js';
import { ApiResponse } from '../utils/apiResponse.js';

export class ProductController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await productService.getAll(req.query as any);
      return ApiResponse.success(res, result.items, 'Produits récupérés avec succès', 200, {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const slug = String(req.params.slug);
      const product = await productService.getBySlug(slug);
      return ApiResponse.success(res, product);
    } catch (error) {
      return next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const product = await productService.getById(id);
      return ApiResponse.success(res, product);
    } catch (error) {
      return next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productService.create(req.body);
      return ApiResponse.created(res, product, 'Produit créé avec succès');
    } catch (error) {
      return next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const product = await productService.update(id, req.body);
      return ApiResponse.success(res, product, 'Produit mis à jour avec succès');
    } catch (error) {
      return next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      await productService.delete(id);
      return ApiResponse.success(res, null, 'Produit supprimé avec succès');
    } catch (error) {
      return next(error);
    }
  }
}

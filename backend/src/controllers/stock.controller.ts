import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';
import { stockService } from '../services/stock.service.js';
import { ApiResponse } from '../utils/apiResponse.js';

export class StockController {
  static async getStockList(req: Request, res: Response, next: NextFunction) {
    try {
      const search = req.query.search as string;
      const lowStockOnly = req.query.lowStock === 'true';

      const variants = await prisma.productVariant.findMany({
        where: {
          ...(lowStockOnly ? { stock: { lte: 5 } } : {}),
          ...(search
            ? {
                OR: [
                  { sku: { contains: search, mode: 'insensitive' } },
                  { product: { name: { contains: search, mode: 'insensitive' } } },
                ],
              }
            : {}),
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              price: true,
              category: { select: { name: true } },
            },
          },
          color: true,
          size: true,
          stockMovements: {
            take: 3,
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { stock: 'asc' },
      });

      return ApiResponse.success(res, variants, 'État des stocks récupéré');
    } catch (error) {
      return next(error);
    }
  }

  static async updateStock(req: Request, res: Response, next: NextFunction) {
    try {
      const variantId = String(req.params.variantId);
      const { type, quantity, reason, reference } = req.body;

      const result = await stockService.recordMovement({
        variantId,
        type,
        quantity,
        reason,
        reference,
      });

      return ApiResponse.success(res, result, 'Mouvement de stock enregistré avec succès');
    } catch (error) {
      return next(error);
    }
  }

  static async getMovements(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 30;
      const skip = (page - 1) * limit;

      const [movements, total] = await Promise.all([
        prisma.stockMovement.findMany({
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            variant: {
              include: {
                product: { select: { id: true, name: true, slug: true } },
                color: true,
                size: true,
              },
            },
          },
        }),
        prisma.stockMovement.count(),
      ]);

      return ApiResponse.success(res, movements, 'Historique des mouvements de stock', 200, {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      return next(error);
    }
  }
}

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import { Prisma } from '@prisma/client';

export class DeliveryZoneController {
  static async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const zones = await prisma.deliveryZone.findMany({
        orderBy: { price: 'asc' },
        include: {
          _count: {
            select: { orders: true },
          },
        },
      });
      return ApiResponse.success(res, zones);
    } catch (error) {
      return next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, price, estimatedDelivery, isActive } = req.body;
      const zone = await prisma.deliveryZone.create({
        data: {
          name,
          price: new Prisma.Decimal(price),
          estimatedDelivery: estimatedDelivery || '24h - 48h',
          isActive: isActive !== undefined ? isActive : true,
        },
      });
      return ApiResponse.created(res, zone, 'Zone de livraison créée avec succès');
    } catch (error) {
      return next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const { name, price, estimatedDelivery, isActive } = req.body;

      const existing = await prisma.deliveryZone.findUnique({ where: { id } });
      if (!existing) {
        throw ApiError.notFound('Zone de livraison introuvable');
      }

      const updateData: Prisma.DeliveryZoneUpdateInput = {};
      if (name !== undefined) updateData.name = name;
      if (price !== undefined) updateData.price = new Prisma.Decimal(price);
      if (estimatedDelivery !== undefined) updateData.estimatedDelivery = estimatedDelivery;
      if (isActive !== undefined) updateData.isActive = isActive;

      const updated = await prisma.deliveryZone.update({
        where: { id },
        data: updateData,
      });

      return ApiResponse.success(res, updated, 'Zone de livraison mise à jour');
    } catch (error) {
      return next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const existing = await prisma.deliveryZone.findUnique({
        where: { id },
        include: { _count: { select: { orders: true } } },
      });

      if (!existing) {
        throw ApiError.notFound('Zone de livraison introuvable');
      }

      if (existing._count.orders > 0) {
        // Soft deactivate if referenced by past orders
        const deactivated = await prisma.deliveryZone.update({
          where: { id },
          data: { isActive: false },
        });
        return ApiResponse.success(
          res,
          deactivated,
          'Zone désactivée (conservée car liée à des commandes existantes)'
        );
      }

      await prisma.deliveryZone.delete({ where: { id } });
      return ApiResponse.success(res, null, 'Zone de livraison supprimée avec succès');
    } catch (error) {
      return next(error);
    }
  }
}

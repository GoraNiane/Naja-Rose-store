import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';

export class CustomerController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const search = req.query.search as string;
      const skip = (page - 1) * limit;

      const where = search
        ? {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' as const } },
              { lastName: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
              { phone: { contains: search } },
            ],
          }
        : {};

      const [customers, total] = await Promise.all([
        prisma.customer.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            _count: {
              select: { orders: true },
            },
          },
        }),
        prisma.customer.count({ where }),
      ]);

      return ApiResponse.success(res, customers, 'Clients récupérés', 200, {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      return next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const customer = await prisma.customer.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              isActive: true,
              createdAt: true,
            },
          },
          orders: {
            orderBy: { createdAt: 'desc' },
            include: {
              deliveryZone: true,
              items: true,
              payments: true,
            },
          },
        },
      });

      if (!customer) {
        throw ApiError.notFound('Client introuvable');
      }

      return ApiResponse.success(res, customer);
    } catch (error) {
      return next(error);
    }
  }
}

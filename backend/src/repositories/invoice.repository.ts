import { BaseRepository } from './base.repository.js';
import { Prisma, PaymentStatus } from '@prisma/client';

export class InvoiceRepository extends BaseRepository {
  async findByInvoiceNumber(invoiceNumber: string) {
    return this.db.invoice.findUnique({
      where: { invoiceNumber },
      include: {
        order: {
          include: {
            customer: true,
            deliveryZone: true,
            items: {
              include: {
                product: {
                  include: {
                    images: true,
                  },
                },
                variant: true,
              },
            },
            payments: {
              orderBy: { createdAt: 'desc' },
            },
            invoice: true,
          },
        },
      },
    });
  }

  async findByOrderId(orderId: string) {
    return this.db.invoice.findUnique({
      where: { orderId },
      include: {
        order: {
          include: {
            customer: true,
            deliveryZone: true,
            items: {
              include: {
                product: {
                  include: {
                    images: true,
                  },
                },
                variant: true,
              },
            },
            payments: {
              orderBy: { createdAt: 'desc' },
            },
            invoice: true,
          },
        },
      },
    });
  }

  async findMany(params: {
    page?: number;
    limit?: number;
    search?: string;
    paymentStatus?: PaymentStatus;
    startDate?: Date;
    endDate?: Date;
  }) {
    const { page = 1, limit = 20, search, paymentStatus, startDate, endDate } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.InvoiceWhereInput = {};

    if (search && search.trim() !== '') {
      const q = search.trim();
      where.OR = [
        { invoiceNumber: { contains: q, mode: 'insensitive' } },
        { order: { orderNumber: { contains: q, mode: 'insensitive' } } },
        { order: { customer: { firstName: { contains: q, mode: 'insensitive' } } } },
        { order: { customer: { lastName: { contains: q, mode: 'insensitive' } } } },
        { order: { phone: { contains: q, mode: 'insensitive' } } },
      ];
    }

    if (paymentStatus) {
      where.order = {
        is: {
          paymentStatus,
        },
      };
    }

    if (startDate || endDate) {
      where.createdAt = {
        ...(startDate ? { gte: startDate } : {}),
        ...(endDate ? { lte: endDate } : {}),
      };
    }

    const [items, total] = await Promise.all([
      this.db.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          order: {
            include: {
              customer: true,
              deliveryZone: true,
              items: true,
              payments: true,
            },
          },
        },
      }),
      this.db.invoice.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

export const invoiceRepository = new InvoiceRepository();

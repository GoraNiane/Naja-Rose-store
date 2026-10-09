import { BaseRepository } from './base.repository.js';
import { Prisma, OrderStatus, PaymentStatus } from '@prisma/client';

export class OrderRepository extends BaseRepository {
  async findById(id: string) {
    return this.db.order.findUnique({
      where: { id },
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
    });
  }

  async findByOrderNumber(orderNumber: string) {
    return this.db.order.findUnique({
      where: { orderNumber },
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
    });
  }

  async findMany(params: { page?: number; limit?: number; status?: OrderStatus; customerId?: string }) {
    const { page = 1, limit = 20, status, customerId } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {
      ...(status ? { status } : {}),
      ...(customerId ? { customerId } : {}),
    };

    const [items, total] = await Promise.all([
      this.db.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
      }),
      this.db.order.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateStatus(id: string, status?: OrderStatus, paymentStatus?: PaymentStatus) {
    return this.db.order.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(paymentStatus ? { paymentStatus } : {}),
      },
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
    });
  }
}

export const orderRepository = new OrderRepository();

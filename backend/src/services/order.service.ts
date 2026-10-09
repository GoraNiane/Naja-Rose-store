import { prisma } from '../config/prisma.js';
import { orderRepository } from '../repositories/order.repository.js';
import { ApiError } from '../utils/apiError.js';
import { generateOrderNumber, generateInvoiceNumber } from '../utils/generator.js';
import { CreateOrderInput, UpdateOrderStatusInput } from '../validators/order.validator.js';
import { Prisma, OrderStatus, PaymentStatus, StockMovementType } from '@prisma/client';

export class OrderService {
  async create(input: CreateOrderInput) {
    return prisma.$transaction(async (tx) => {
      // 1. Verify delivery zone
      const zone = await tx.deliveryZone.findUnique({
        where: { id: input.deliveryZoneId },
      });
      if (!zone || !zone.isActive) {
        throw ApiError.badRequest('Zone de livraison invalide ou indisponible');
      }

      // 2. Fetch and check variants & prices (using unique variant IDs set)
      const uniqueVariantIds = Array.from(new Set(input.items.map((i) => i.variantId)));
      const variants = await tx.productVariant.findMany({
        where: { id: { in: uniqueVariantIds }, isActive: true },
        include: {
          product: true,
          color: true,
          size: true,
        },
      });

      if (variants.length !== uniqueVariantIds.length) {
        throw ApiError.badRequest('Certains articles sélectionnés ne sont plus disponibles');
      }

      // 3. Aggregate requested quantity per variant to prevent overselling
      const requestedQtyMap = new Map<string, number>();
      for (const item of input.items) {
        const current = requestedQtyMap.get(item.variantId) || 0;
        requestedQtyMap.set(item.variantId, current + item.quantity);
      }

      for (const variant of variants) {
        const requestedQty = requestedQtyMap.get(variant.id) || 0;
        if (variant.stock < requestedQty) {
          const variantLabel = [
            variant.product.name,
            variant.color?.name ? `Couleur ${variant.color.name}` : null,
            variant.size?.name ? `Taille ${variant.size.name}` : null,
          ].filter(Boolean).join(' - ');
          throw ApiError.badRequest(
            `Stock insuffisant pour "${variantLabel}" (Demandé: ${requestedQty}, Disponible: ${variant.stock})`
          );
        }
      }

      // 4. Prepare Order Numbers & Sequences
      const currentYear = new Date().getFullYear();

      // Find highest sequential order number for current year
      const lastOrder = await tx.order.findFirst({
        where: {
          orderNumber: {
            startsWith: `CMD-${currentYear}-`,
          },
        },
        orderBy: {
          orderNumber: 'desc',
        },
      });

      let nextOrderSeq = 1;
      if (lastOrder) {
        const match = lastOrder.orderNumber.match(/(\d+)$/);
        if (match) {
          nextOrderSeq = parseInt(match[1], 10) + 1;
        }
      }

      // Find highest sequential invoice number for current year
      const lastInvoice = await tx.invoice.findFirst({
        where: {
          OR: [
            { invoiceNumber: { startsWith: `NRS-${currentYear}-` } },
            { invoiceNumber: { startsWith: `FAC-${currentYear}-` } },
          ],
        },
        orderBy: {
          invoiceNumber: 'desc',
        },
      });

      let nextInvoiceSeq = nextOrderSeq;
      if (lastInvoice) {
        const match = lastInvoice.invoiceNumber.match(/(\d+)$/);
        if (match) {
          nextInvoiceSeq = Math.max(nextOrderSeq, parseInt(match[1], 10) + 1);
        }
      }

      const orderNumber = generateOrderNumber(nextOrderSeq, currentYear);
      const invoiceNumber = generateInvoiceNumber(nextInvoiceSeq, currentYear);

      // 5. Calculate Subtotal, Build Line Snapshots & Decrement Inventory
      let subtotal = new Prisma.Decimal(0);
      const itemsToCreate = [];

      for (const itemInput of input.items) {
        const variant = variants.find((v) => v.id === itemInput.variantId);
        if (!variant) {
          throw ApiError.badRequest(`Variante ${itemInput.variantId} non trouvée`);
        }

        // Determine price snapshot: variant specific price or product base price
        const unitPrice = variant.price ? variant.price : variant.product.price;
        const lineTotal = unitPrice.mul(itemInput.quantity);
        subtotal = subtotal.add(lineTotal);

        itemsToCreate.push({
          productId: variant.productId,
          variantId: variant.id,
          productName: variant.product.name,
          colorName: variant.color?.name ?? null,
          sizeName: variant.size?.name ?? null,
          quantity: itemInput.quantity,
          unitPrice,
          total: lineTotal,
        });

        // Decrement stock and record movement
        await tx.productVariant.update({
          where: { id: variant.id },
          data: { stock: { decrement: itemInput.quantity } },
        });

        await tx.stockMovement.create({
          data: {
            variantId: variant.id,
            type: StockMovementType.STOCK_OUT,
            quantity: itemInput.quantity,
            reason: `Commande client ${orderNumber}`,
          },
        });
      }

      const deliveryFee = zone.price;
      const total = subtotal.add(deliveryFee);

      // 6. Find or create Customer record (with optional email)
      const customerEmail =
        input.customer.email && input.customer.email.trim() !== ''
          ? input.customer.email.toLowerCase().trim()
          : null;
      const phoneClean = input.customer.phone.trim();

      let customer = await tx.customer.findFirst({
        where: {
          OR: [
            ...(customerEmail ? [{ email: customerEmail }] : []),
            { phone: phoneClean },
          ],
        },
      });

      if (!customer) {
        customer = await tx.customer.create({
          data: {
            firstName: input.customer.firstName.trim(),
            lastName: input.customer.lastName.trim(),
            email: customerEmail,
            phone: phoneClean,
            address: input.customer.address.trim(),
            city: input.customer.city || 'Dakar',
          },
        });
      } else {
        await tx.customer.update({
          where: { id: customer.id },
          data: {
            firstName: input.customer.firstName.trim(),
            lastName: input.customer.lastName.trim(),
            ...(customerEmail ? { email: customerEmail } : {}),
            address: input.customer.address.trim(),
            city: input.customer.city || customer.city || 'Dakar',
          },
        });
      }

      // 7. Create Order
      const order = await tx.order.create({
        data: {
          orderNumber,
          customerId: customer.id,
          deliveryZoneId: zone.id,
          deliveryAddress: input.deliveryAddress.trim(),
          phone: input.phone.trim(),
          email: customerEmail || (input.email && input.email.trim() !== '' ? input.email.toLowerCase().trim() : null),
          notes: input.notes?.trim() || null,
          subtotal,
          deliveryFee,
          total,
          paymentMethod: input.paymentMethod,
          paymentStatus: PaymentStatus.PENDING,
          status: OrderStatus.NEW,
          items: {
            create: itemsToCreate,
          },
          payments: {
            create: {
              provider: input.paymentMethod,
              amount: total,
              status: PaymentStatus.PENDING,
            },
          },
          invoice: {
            create: {
              invoiceNumber,
            },
          },
        },
        include: {
          customer: true,
          deliveryZone: true,
          items: true,
          payments: true,
          invoice: true,
        },
      });

      return order;
    });
  }

  async getById(id: string) {
    const order = await orderRepository.findById(id);
    if (!order) {
      throw ApiError.notFound('Commande introuvable');
    }
    return order;
  }

  async getByOrderNumber(orderNumber: string) {
    const order = await orderRepository.findByOrderNumber(orderNumber);
    if (!order) {
      throw ApiError.notFound('Commande introuvable');
    }
    return order;
  }

  async list(params: { page?: number; limit?: number; status?: OrderStatus; customerId?: string }) {
    return orderRepository.findMany(params);
  }

  async updateStatus(id: string, input: UpdateOrderStatusInput) {
    const existing = await orderRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound('Commande introuvable');
    }

    return prisma.$transaction(async (tx) => {
      // If status changed to CANCELLED and was not already cancelled, restore inventory
      if (input.status === OrderStatus.CANCELLED && existing.status !== OrderStatus.CANCELLED) {
        for (const item of existing.items) {
          if (item.variantId) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stock: { increment: item.quantity } },
            });

            await tx.stockMovement.create({
              data: {
                variantId: item.variantId,
                type: StockMovementType.RELEASE,
                quantity: item.quantity,
                reason: `Annulation commande ${existing.orderNumber}`,
              },
            });
          }
        }
      }

      // Auto-set payment status to PAID if DELIVERED with CASH_ON_DELIVERY
      let effectivePaymentStatus = input.paymentStatus;
      if (
        input.status === OrderStatus.DELIVERED &&
        existing.paymentMethod === 'CASH_ON_DELIVERY' &&
        existing.paymentStatus !== PaymentStatus.PAID &&
        !input.paymentStatus
      ) {
        effectivePaymentStatus = PaymentStatus.PAID;
      }

      const updated = await tx.order.update({
        where: { id },
        data: {
          ...(input.status ? { status: input.status } : {}),
          ...(effectivePaymentStatus ? { paymentStatus: effectivePaymentStatus } : {}),
        },
        include: {
          customer: true,
          deliveryZone: true,
          items: true,
          payments: true,
          invoice: true,
        },
      });

      return updated;
    });
  }
}

export const orderService = new OrderService();

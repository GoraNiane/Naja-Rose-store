import { prisma } from '../config/prisma.js';
import { StockMovementType } from '../types/index.js';
import { ApiError } from '../utils/apiError.js';

export class StockService {
  async recordMovement(params: {
    variantId: string;
    type: StockMovementType;
    quantity: number;
    reason?: string;
    reference?: string;
  }) {
    const { variantId, type, quantity, reason, reference } = params;

    if (quantity <= 0) {
      throw ApiError.badRequest('La quantité de mouvement doit être positive');
    }

    return prisma.$transaction(async (tx) => {
      const variant = await tx.productVariant.findUnique({
        where: { id: variantId },
      });

      if (!variant) {
        throw ApiError.notFound('Variante de produit introuvable');
      }

      let newStock = variant.stock;
      if (type === StockMovementType.STOCK_IN || type === StockMovementType.RELEASE) {
        newStock += quantity;
      } else if (type === StockMovementType.STOCK_OUT || type === StockMovementType.RESERVATION) {
        if (variant.stock < quantity) {
          throw ApiError.badRequest(`Stock insuffisant pour cette variante (Disponible: ${variant.stock})`);
        }
        newStock -= quantity;
      } else if (type === StockMovementType.ADJUSTMENT) {
        newStock = quantity;
      }

      const movement = await tx.stockMovement.create({
        data: {
          variantId,
          type,
          quantity,
          reason,
          reference,
        },
      });

      await tx.productVariant.update({
        where: { id: variantId },
        data: { stock: newStock },
      });

      return { movement, newStock };
    });
  }

  async getMovementsByVariant(variantId: string) {
    return prisma.stockMovement.findMany({
      where: { variantId },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const stockService = new StockService();

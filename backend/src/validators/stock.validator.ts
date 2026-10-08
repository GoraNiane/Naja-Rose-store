import { z } from 'zod';
import { StockMovementType } from '../types/index.js';

export const updateStockSchema = z.object({
  params: z.object({
    variantId: z.string().uuid('ID de variante invalide'),
  }),
  body: z.object({
    type: z.nativeEnum(StockMovementType, {
      errorMap: () => ({ message: 'Type de mouvement invalide (STOCK_IN, STOCK_OUT, ADJUSTMENT, RESERVATION, RELEASE)' }),
    }),
    quantity: z.number().int().min(1, 'La quantité doit être un entier positif (>= 1)'),
    reason: z.string().optional(),
    reference: z.string().optional(),
  }),
});

export type UpdateStockInput = z.infer<typeof updateStockSchema>['body'];

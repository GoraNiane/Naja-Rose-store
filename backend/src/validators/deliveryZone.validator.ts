import { z } from 'zod';

export const createDeliveryZoneSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Le nom de la zone est requis (ex: Dakar Plateau)'),
    price: z.number().nonnegative('Le tarif de livraison doit être supérieur ou égal à 0'),
    estimatedDelivery: z.string().optional().default('24h - 48h'),
    isActive: z.boolean().optional().default(true),
  }),
});

export const updateDeliveryZoneSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID de zone invalide'),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    price: z.number().nonnegative().optional(),
    estimatedDelivery: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export type CreateDeliveryZoneInput = z.infer<typeof createDeliveryZoneSchema>['body'];
export type UpdateDeliveryZoneInput = z.infer<typeof updateDeliveryZoneSchema>['body'];

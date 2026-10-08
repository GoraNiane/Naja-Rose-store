import { z } from 'zod';
import { PaymentMethod, OrderStatus, PaymentStatus } from '../types/index.js';

export const orderItemInputSchema = z.object({
  variantId: z.string().uuid('ID de variante invalide'),
  quantity: z.number().int().min(1, 'La quantité doit être supérieure ou égale à 1'),
});

export const createOrderSchema = z.object({
  body: z.object({
    customer: z.object({
      firstName: z.string().min(2, 'Le prénom est requis'),
      lastName: z.string().min(2, 'Le nom est requis'),
      email: z.string().email('Email invalide').optional().nullable().or(z.literal('')),
      phone: z.string().min(8, 'Numéro de téléphone requis (ex: +221 77 000 00 00)'),
      address: z.string().min(3, "L'adresse de livraison est requise"),
      city: z.string().default('Dakar'),
    }),
    deliveryZoneId: z.string().uuid('Zone de livraison requise'),
    deliveryAddress: z.string().min(3, 'Adresse détaillée requise'),
    phone: z.string().min(8, 'Téléphone de livraison requis'),
    email: z.string().email('Email invalide').optional().nullable().or(z.literal('')),
    notes: z.string().optional().nullable(),
    paymentMethod: z.nativeEnum(PaymentMethod),
    items: z.array(orderItemInputSchema).min(1, 'La commande doit contenir au moins 1 article'),
  }),
});

export const updateOrderStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    status: z.nativeEnum(OrderStatus).optional(),
    paymentStatus: z.nativeEnum(PaymentStatus).optional(),
  }),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>['body'];
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>['body'];

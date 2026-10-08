import { z } from 'zod';

export const createSizeSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Le nom de la taille est requis (ex: S, M, L, XL, TU)'),
  }),
});

export const updateSizeSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID de taille invalide'),
  }),
  body: z.object({
    name: z.string().min(1, 'Le nom de la taille ne peut pas être vide'),
  }),
});

export type CreateSizeInput = z.infer<typeof createSizeSchema>['body'];
export type UpdateSizeInput = z.infer<typeof updateSizeSchema>['body'];

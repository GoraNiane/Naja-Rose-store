import { z } from 'zod';

export const createColorSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Le nom de la couleur doit comporter au moins 2 caractères'),
    hex: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Format hexadécimal invalide (ex: #111111)'),
  }),
});

export const updateColorSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID de couleur invalide'),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    hex: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/).optional(),
  }),
});

export type CreateColorInput = z.infer<typeof createColorSchema>['body'];
export type UpdateColorInput = z.infer<typeof updateColorSchema>['body'];

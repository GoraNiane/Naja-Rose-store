import { z } from 'zod';

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Le nom de la catégorie doit contenir au moins 2 caractères'),
    description: z.string().optional().nullable(),
    imageUrl: z.string().url('URL invalide').optional().nullable(),
    parentId: z.string().uuid().optional().nullable(),
    isActive: z.boolean().default(true),
  }),
});

export const updateCategorySchema = z.object({
  params: z.object({
    id: z.string().uuid('ID de catégorie invalide'),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional().nullable(),
    imageUrl: z.string().url().optional().nullable(),
    parentId: z.string().uuid().optional().nullable(),
    isActive: z.boolean().optional(),
  }),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>['body'];
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>['body'];

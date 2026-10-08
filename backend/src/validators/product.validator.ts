import { z } from 'zod';

export const productImageSchema = z.object({
  url: z.string().url('URL d\'image invalide'),
  publicId: z.string().min(1, 'PublicId requis'),
  position: z.number().int().min(0).default(0),
  isPrimary: z.boolean().default(false),
});

export const productVariantInputSchema = z.object({
  colorId: z.string().uuid().optional().nullable(),
  sizeId: z.string().uuid().optional().nullable(),
  sku: z.string().min(3, 'SKU requis'),
  stock: z.number().int().min(0, 'Le stock doit être un entier positif ou nul'),
  price: z.number().positive().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Le nom du produit doit contenir au moins 2 caractères'),
    description: z.string().optional().nullable(),
    categoryId: z.string().uuid('ID de catégorie invalide'),
    price: z.number().positive('Le prix doit être supérieur à zéro'),
    oldPrice: z.number().positive('L\'ancien prix doit être positif').optional().nullable(),
    isActive: z.boolean().default(true),
    // Maximum 7 images enforced
    images: z.array(productImageSchema).max(7, 'Un produit ne peut pas avoir plus de 7 images').optional().default([]),
    variants: z.array(productVariantInputSchema).min(1, 'Le produit doit contenir au moins une variante/SKU'),
  }),
});

export const updateProductSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID de produit invalide'),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional().nullable(),
    categoryId: z.string().uuid().optional(),
    price: z.number().positive().optional(),
    oldPrice: z.number().positive().optional().nullable(),
    isActive: z.boolean().optional(),
    images: z.array(productImageSchema).max(7, 'Un produit ne peut pas avoir plus de 7 images').optional(),
    variants: z.array(productVariantInputSchema).optional(),
  }),
});

export const productQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
    limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 20)),
    search: z.string().optional(),
    categoryId: z.string().optional(),
    colorId: z.string().optional(),
    sizeId: z.string().optional(),
    inStock: z.string().optional().transform((val) => val === 'true'),
    onSale: z.string().optional().transform((val) => val === 'true'),
    minPrice: z.string().optional().transform((val) => (val ? parseFloat(val) : undefined)),
    maxPrice: z.string().optional().transform((val) => (val ? parseFloat(val) : undefined)),
    sortBy: z.enum(['price_asc', 'price_desc', 'newest', 'name', 'popular']).optional().default('newest'),
  }),
});

export type CreateProductInput = z.infer<typeof createProductSchema>['body'];
export type UpdateProductInput = z.infer<typeof updateProductSchema>['body'];
export type ProductQueryParams = z.infer<typeof productQuerySchema>['query'];

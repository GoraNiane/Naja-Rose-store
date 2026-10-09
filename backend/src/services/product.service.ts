import { prisma } from '../config/prisma.js';
import { productRepository } from '../repositories/product.repository.js';
import { ApiError } from '../utils/apiError.js';
import { slugify } from '../utils/slugify.js';
import { CreateProductInput, UpdateProductInput, ProductQueryParams } from '../validators/product.validator.js';
import { Prisma } from '@prisma/client';

export class ProductService {
  async getAll(params: ProductQueryParams) {
    return productRepository.findMany(params);
  }

  async getBySlug(slug: string) {
    const product = await productRepository.findBySlug(slug);
    if (!product) {
      throw ApiError.notFound('Produit introuvable');
    }
    return product;
  }

  async getById(id: string) {
    const product = await productRepository.findById(id);
    if (!product) {
      throw ApiError.notFound('Produit introuvable');
    }
    return product;
  }

  async create(input: CreateProductInput) {
    // 7 images limit business logic verification
    if (input.images && input.images.length > 7) {
      throw ApiError.badRequest('Un produit ne peut pas contenir plus de 7 images');
    }

    const baseSlug = slugify(input.name);
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.product.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name: input.name,
          slug,
          description: input.description,
          categoryId: input.categoryId,
          price: new Prisma.Decimal(input.price),
          oldPrice: input.oldPrice ? new Prisma.Decimal(input.oldPrice) : null,
          isActive: input.isActive ?? true,
          images: {
            create: input.images.map((img, index) => ({
              url: img.url,
              publicId: img.publicId,
              position: img.position ?? index,
              isPrimary: img.isPrimary ?? index === 0,
            })),
          },
          variants: {
            create: input.variants.map((v) => ({
              colorId: v.colorId || null,
              sizeId: v.sizeId || null,
              sku: v.sku,
              stock: v.stock,
              price: v.price ? new Prisma.Decimal(v.price) : null,
              isActive: v.isActive ?? true,
            })),
          },
        },
        include: {
          category: true,
          images: { orderBy: { position: 'asc' } },
          variants: { include: { color: true, size: true } },
        },
      });

      return product;
    });
  }

  async update(id: string, input: UpdateProductInput) {
    const existing = await productRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound('Produit introuvable');
    }

    if (input.images && input.images.length > 7) {
      throw ApiError.badRequest('Un produit ne peut pas contenir plus de 7 images');
    }

    return prisma.$transaction(async (tx) => {
      const updateData: Prisma.ProductUpdateInput = {};
      if (input.name !== undefined) {
        updateData.name = input.name;
        // Optionally update slug if name changed
      }
      if (input.description !== undefined) updateData.description = input.description;
      if (input.price !== undefined) updateData.price = new Prisma.Decimal(input.price);
      if (input.oldPrice !== undefined) updateData.oldPrice = input.oldPrice ? new Prisma.Decimal(input.oldPrice) : null;
      if (input.isActive !== undefined) updateData.isActive = input.isActive;
      if (input.categoryId !== undefined) {
        updateData.category = { connect: { id: input.categoryId } };
      }

      // Sync images if provided
      if (input.images !== undefined) {
        await tx.productImage.deleteMany({ where: { productId: id } });
        await tx.productImage.createMany({
          data: input.images.map((img, index) => ({
            productId: id,
            url: img.url,
            publicId: img.publicId,
            position: img.position ?? index,
            isPrimary: img.isPrimary ?? index === 0,
          })),
        });
      }

      // Sync variants if provided
      if (input.variants !== undefined) {
        const currentVariantIds: string[] = [];

        for (const v of input.variants) {
          const existingVariant = await tx.productVariant.findFirst({
            where: {
              productId: id,
              colorId: v.colorId || null,
              sizeId: v.sizeId || null,
            },
          });

          if (existingVariant) {
            currentVariantIds.push(existingVariant.id);
            await tx.productVariant.update({
              where: { id: existingVariant.id },
              data: {
                sku: v.sku,
                stock: v.stock,
                price: v.price ? new Prisma.Decimal(v.price) : null,
                isActive: v.isActive ?? true,
              },
            });
          } else {
            const createdVar = await tx.productVariant.create({
              data: {
                productId: id,
                colorId: v.colorId || null,
                sizeId: v.sizeId || null,
                sku: v.sku,
                stock: v.stock,
                price: v.price ? new Prisma.Decimal(v.price) : null,
                isActive: v.isActive ?? true,
              },
            });
            currentVariantIds.push(createdVar.id);
          }
        }

        // Deactivate or delete variants that are no longer part of the product
        if (currentVariantIds.length > 0) {
          await tx.productVariant.updateMany({
            where: {
              productId: id,
              id: { notIn: currentVariantIds },
            },
            data: {
              isActive: false,
              stock: 0,
            },
          });
        }
      }

      return tx.product.update({
        where: { id },
        data: updateData,
        include: {
          category: true,
          images: { orderBy: { position: 'asc' } },
          variants: { include: { color: true, size: true } },
        },
      });
    });
  }

  async delete(id: string) {
    const existing = await productRepository.findById(id);
    if (!existing) {
      throw ApiError.notFound('Produit introuvable');
    }

    return prisma.$transaction(async (tx) => {
      const variants = await tx.productVariant.findMany({
        where: { productId: id },
      });
      const variantIds = variants.map((v) => v.id);

      if (variantIds.length > 0) {
        await tx.stockMovement.deleteMany({
          where: { variantId: { in: variantIds } },
        });
        await tx.productVariant.deleteMany({
          where: { productId: id },
        });
      }

      await tx.productImage.deleteMany({
        where: { productId: id },
      });

      return tx.product.delete({
        where: { id },
      });
    });
  }
}

export const productService = new ProductService();

import { BaseRepository } from './base.repository.js';
import { Prisma } from '@prisma/client';
import { ProductQueryParams } from '../validators/product.validator.js';

export class ProductRepository extends BaseRepository {
  async findMany(params: ProductQueryParams) {
    const {
      page = 1,
      limit = 20,
      search,
      categoryId,
      colorId,
      sizeId,
      inStock,
      onSale,
      minPrice,
      maxPrice,
      sortBy,
    } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      isActive: true,
      ...(categoryId ? { categoryId } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(minPrice !== undefined || maxPrice !== undefined
        ? {
            price: {
              ...(minPrice !== undefined ? { gte: minPrice } : {}),
              ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
            },
          }
        : {}),
      ...(onSale
        ? {
            oldPrice: { not: null },
          }
        : {}),
      ...(colorId || sizeId || inStock
        ? {
            variants: {
              some: {
                isActive: true,
                ...(colorId ? { colorId } : {}),
                ...(sizeId ? { sizeId } : {}),
                ...(inStock ? { stock: { gt: 0 } } : {}),
              },
            },
          }
        : {}),
    };

    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };
    if (sortBy === 'price_asc') orderBy = { price: 'asc' };
    if (sortBy === 'price_desc') orderBy = { price: 'desc' };
    if (sortBy === 'name') orderBy = { name: 'asc' };
    if (sortBy === 'popular') orderBy = { orderItems: { _count: 'desc' } };

    const [items, total] = await Promise.all([
      this.db.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          category: true,
          images: {
            orderBy: { position: 'asc' },
          },
          variants: {
            where: { isActive: true },
            include: {
              color: true,
              size: true,
            },
          },
        },
      }),
      this.db.product.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string) {
    return this.db.product.findUnique({
      where: { id },
      include: {
        category: true,
        images: {
          orderBy: { position: 'asc' },
        },
        variants: {
          include: {
            color: true,
            size: true,
          },
        },
      },
    });
  }

  async findBySlug(slug: string) {
    return this.db.product.findUnique({
      where: { slug },
      include: {
        category: true,
        images: {
          orderBy: { position: 'asc' },
        },
        variants: {
          where: { isActive: true },
          include: {
            color: true,
            size: true,
          },
        },
      },
    });
  }

  async create(data: Prisma.ProductCreateInput) {
    return this.db.product.create({
      data,
      include: {
        category: true,
        images: true,
        variants: {
          include: {
            color: true,
            size: true,
          },
        },
      },
    });
  }

  async update(id: string, data: Prisma.ProductUpdateInput) {
    return this.db.product.update({
      where: { id },
      data,
      include: {
        category: true,
        images: true,
        variants: true,
      },
    });
  }

  async delete(id: string) {
    return this.db.product.delete({
      where: { id },
    });
  }
}

export const productRepository = new ProductRepository();

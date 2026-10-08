import api from './api';
import { Product, Category, DeliveryZone, Color, Size, ProductVariant } from '../types';

export interface ProductFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  colorId?: string;
  sizeId?: string;
  inStock?: boolean;
  onSale?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'name' | 'popular';
}

export interface ProductsResponse {
  data: Product[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateProductPayload {
  name: string;
  description?: string | null;
  categoryId: string;
  price: number;
  oldPrice?: number | null;
  isActive?: boolean;
  images: {
    url: string;
    publicId: string;
    position: number;
    isPrimary: boolean;
  }[];
  variants: {
    colorId?: string | null;
    sizeId?: string | null;
    sku: string;
    stock: number;
    price?: number | null;
    isActive?: boolean;
  }[];
}

export interface StockMovementPayload {
  type: 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT' | 'RESERVATION' | 'RELEASE';
  quantity: number;
  reason?: string;
  reference?: string;
}

export const productService = {
  // Public catalog
  async getProducts(params?: ProductFilterParams): Promise<ProductsResponse> {
    const res: any = await api.get('/products', { params });
    return {
      data: res.data,
      meta: res.meta,
    };
  },

  async getProductBySlug(slug: string): Promise<Product> {
    const res: any = await api.get(`/products/${slug}`);
    return res.data;
  },

  async getProductById(id: string): Promise<Product> {
    const res: any = await api.get(`/products/id/${id}`);
    return res.data;
  },

  async getCategories(): Promise<Category[]> {
    const res: any = await api.get('/categories');
    return res.data;
  },

  async getDeliveryZones(): Promise<DeliveryZone[]> {
    const res: any = await api.get('/delivery-zones');
    return res.data;
  },

  async getColors(): Promise<Color[]> {
    const res: any = await api.get('/colors');
    return res.data;
  },

  async getSizes(): Promise<Size[]> {
    const res: any = await api.get('/sizes');
    return res.data;
  },

  // Admin Product Mutations
  async createProduct(payload: CreateProductPayload): Promise<Product> {
    const res: any = await api.post('/admin/products', payload);
    return res.data;
  },

  async updateProduct(id: string, payload: Partial<CreateProductPayload>): Promise<Product> {
    const res: any = await api.put(`/admin/products/${id}`, payload);
    return res.data;
  },

  async deleteProduct(id: string): Promise<void> {
    await api.delete(`/admin/products/${id}`);
  },

  // Admin Colors & Sizes Mutations
  async createColor(data: { name: string; hex: string }): Promise<Color> {
    const res: any = await api.post('/admin/colors', data);
    return res.data;
  },

  async createSize(data: { name: string }): Promise<Size> {
    const res: any = await api.post('/admin/sizes', data);
    return res.data;
  },

  // Admin Stock Management
  async getStock(params?: { search?: string; lowStock?: boolean }): Promise<(ProductVariant & { product: { id: string; name: string; slug: string; price: number; category?: { name: string } } })[]> {
    const res: any = await api.get('/admin/stock', { params });
    return res.data;
  },

  async updateStock(variantId: string, payload: StockMovementPayload) {
    const res: any = await api.put(`/admin/stock/${variantId}`, payload);
    return res.data;
  },

  async getStockMovements(params?: { page?: number; limit?: number }) {
    const res: any = await api.get('/admin/stock/movements', { params });
    return res;
  },

  // Admin Media Upload (Cloudinary)
  async uploadMedia(image: string, folder?: string) {
    const res: any = await api.post('/admin/media/upload', { image, folder });
    return res.data;
  },

  async deleteMedia(publicId: string) {
    const res: any = await api.delete(`/admin/media/${encodeURIComponent(publicId)}`);
    return res.data;
  },
};

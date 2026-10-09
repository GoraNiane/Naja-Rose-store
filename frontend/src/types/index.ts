export type Role = 'ADMIN' | 'CUSTOMER';

export type OrderStatus = 'NEW' | 'CONFIRMED' | 'PREPARING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'REFUNDED';

export type PaymentMethod = 'PAYTECH' | 'WAVE' | 'ORANGE_MONEY' | 'CASH_ON_DELIVERY';

export interface Color {
  id: string;
  name: string;
  hex: string;
}

export interface Size {
  id: string;
  name: string;
}

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  publicId: string;
  position: number;
  isPrimary: boolean;
}

export interface ProductVariant {
  id: string;
  productId: string;
  colorId?: string | null;
  color?: Color | null;
  sizeId?: string | null;
  size?: Size | null;
  sku: string;
  stock: number;
  price?: number | string | null;
  isActive: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  parentId?: string | null;
  _count?: {
    products: number;
  };
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  categoryId: string;
  category?: Category;
  price: number | string;
  oldPrice?: number | string | null;
  isActive: boolean;
  images: ProductImage[];
  variants: ProductVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryZone {
  id: string;
  name: string;
  price: number | string;
  estimatedDelivery?: string;
  isActive: boolean;
}

export interface CartItem {
  variantId: string;
  productId: string;
  productName: string;
  productSlug: string;
  imageUrl: string;
  colorName?: string | null;
  colorHex?: string | null;
  sizeName?: string | null;
  sku?: string | null;
  price: number;
  quantity: number;
  maxStock: number;
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: Role;
}

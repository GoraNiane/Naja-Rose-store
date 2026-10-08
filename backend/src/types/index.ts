import { Role, OrderStatus, PaymentStatus, PaymentMethod, StockMovementType } from '@prisma/client';

export interface UserPayload {
  userId: string;
  email: string;
  role: Role;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export { Role, OrderStatus, PaymentStatus, PaymentMethod, StockMovementType };

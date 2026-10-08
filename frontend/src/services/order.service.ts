import api from './api';

export interface CreateOrderPayload {
  customer: {
    firstName: string;
    lastName: string;
    email?: string;
    phone: string;
    address: string;
    city: string;
  };
  deliveryZoneId: string;
  deliveryAddress: string;
  phone: string;
  email?: string;
  notes?: string;
  paymentMethod: 'WAVE' | 'ORANGE_MONEY' | 'CASH_ON_DELIVERY';
  items: {
    variantId: string;
    quantity: number;
  }[];
}

export const orderService = {
  async createOrder(payload: CreateOrderPayload) {
    const res: any = await api.post('/orders', payload);
    return res.data;
  },

  async getOrderByNumber(orderNumber: string) {
    const res: any = await api.get(`/orders/number/${orderNumber}`);
    return res.data;
  },

  async getOrderById(id: string) {
    const res: any = await api.get(`/orders/${id}`);
    return res.data;
  },

  async getOrders(params?: { page?: number; limit?: number; status?: string; customerId?: string }) {
    const res: any = await api.get('/admin/orders', { params });
    return res;
  },

  async updateOrderStatus(id: string, payload: { status?: string; paymentStatus?: string }) {
    const res: any = await api.put(`/admin/orders/${id}/status`, payload);
    return res.data;
  },

  getInvoiceUrl(idOrNumber: string) {
    return `/api/orders/${idOrNumber}/invoice`;
  },
};

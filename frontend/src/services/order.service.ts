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
  paymentMethod?: 'WAVE' | 'ORANGE_MONEY' | 'CASH_ON_DELIVERY';
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

  async getInvoice(orderNumberOrId: string) {
    const res: any = await api.get(`/orders/number/${orderNumberOrId}/invoice`).catch(() => {
      return api.get(`/orders/${orderNumberOrId}/invoice`);
    });
    return res.data;
  },

  async getInvoiceByInvoiceNumber(invoiceNumber: string) {
    const res: any = await api.get(`/invoices/${invoiceNumber}`);
    return res.data;
  },

  async getOrders(params?: { page?: number; limit?: number; status?: string; customerId?: string }) {
    const res: any = await api.get('/admin/orders', { params });
    return res;
  },

  async getInvoices(params?: {
    page?: number;
    limit?: number;
    search?: string;
    paymentStatus?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const res: any = await api.get('/admin/invoices', { params });
    return res;
  },

  async updateOrderStatus(id: string, payload: { status?: string; paymentStatus?: string }) {
    const res: any = await api.put(`/admin/orders/${id}/status`, payload);
    return res.data;
  },

  getInvoicePdfUrl(idOrNumber: string) {
    return `/api/orders/${idOrNumber}/invoice/pdf`;
  },

  getInvoiceUrl(idOrNumber: string) {
    return `/api/orders/${idOrNumber}/invoice/pdf`;
  },
};

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

  async downloadInvoicePdf(idOrNumber: string, invoiceNumber?: string): Promise<void> {
    const filename = `facture-${invoiceNumber || idOrNumber}.pdf`;

    try {
      // 1. Fetch PDF binary stream via Fetch API
      const response = await fetch(`/api/orders/${encodeURIComponent(idOrNumber)}/invoice/pdf`, {
        headers: {
          Accept: 'application/pdf',
        },
      });

      if (!response.ok) {
        // Fallback to /api/v1/ prefix
        const fallbackRes = await fetch(`/api/v1/orders/${encodeURIComponent(idOrNumber)}/invoice/pdf`);
        if (!fallbackRes.ok) {
          throw new Error(`Erreur serveur (${fallbackRes.status})`);
        }
        const blob = await fallbackRes.blob();
        this.triggerBlobDownload(blob, filename);
        return;
      }

      const blob = await response.blob();
      this.triggerBlobDownload(blob, filename);
    } catch (err) {
      console.warn('[PDF Download] Blob fetch failed, attempting direct window open fallback:', err);
      // Fallback: direct window open or print
      const directUrl = `/api/orders/${encodeURIComponent(idOrNumber)}/invoice/pdf`;
      const win = window.open(directUrl, '_blank');
      if (!win) {
        window.location.href = directUrl;
      }
    }
  },

  triggerBlobDownload(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => window.URL.revokeObjectURL(url), 2000);
  },
};

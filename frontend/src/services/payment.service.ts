import api from './api';

export interface PaymentStatusResponse {
  orderId: string;
  orderNumber: string;
  paymentMethod: 'WAVE' | 'ORANGE_MONEY' | 'CASH_ON_DELIVERY';
  paymentStatus: 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'REFUNDED';
  orderStatus: string;
  total: number;
  subtotal: number;
  deliveryFee: number;
  transactionId?: string;
  isPaid: boolean;
  updatedAt: string;
}

export const paymentService = {
  async initiatePayment(orderId: string, customRedirects?: { successUrl?: string; cancelUrl?: string }) {
    const res: any = await api.post('/payments/initiate', {
      orderId,
      ...customRedirects,
    });
    return res.data;
  },

  async getPaymentStatus(orderIdOrNumber: string): Promise<PaymentStatusResponse> {
    const res: any = await api.get(`/payments/${orderIdOrNumber}/status`);
    return res.data;
  },

  async simulateSandbox(orderNumber: string, status: 'PAID' | 'FAILED' = 'PAID') {
    const res: any = await api.post('/payments/sandbox/simulate', {
      orderNumber,
      status,
    });
    return res.data;
  },
};

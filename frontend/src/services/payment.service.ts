import api from './api';
import { PaymentMethod, PaymentStatus } from '../types';

export interface PaymentStatusResponse {
  orderId: string;
  orderNumber: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: string;
  total: number;
  subtotal: number;
  deliveryFee: number;
  transactionId?: string;
  isPaid: boolean;
  updatedAt: string;
}

export const paymentService = {
  async initiatePayment(params: {
    orderId?: string;
    orderNumber?: string;
    paymentMethod?: PaymentMethod;
    successUrl?: string;
    cancelUrl?: string;
  }) {
    const res: any = await api.post('/payments/initiate', params);
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

import { PaymentMethod, PaymentStatus } from '@prisma/client';

export interface CreatePaymentParams {
  orderId: string;
  orderNumber: string;
  amount: number;
  currency?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerName?: string;
  successUrl: string;
  cancelUrl: string;
  webhookUrl?: string;
}

export interface PaymentResult {
  transactionId?: string;
  paymentUrl?: string;
  launchUrl?: string;
  waveLaunchUrl?: string;
  customerPhone?: string;
  token?: string;
  status: PaymentStatus;
  isSandbox: boolean;
  instructions?: string;
  metadata?: Record<string, unknown>;
}

export interface WebhookResult {
  success: boolean;
  orderId?: string;
  orderNumber?: string;
  transactionId?: string;
  paymentStatus: PaymentStatus;
  amount?: number;
  currency?: string;
  metadata?: Record<string, unknown>;
  message?: string;
}

export interface PaymentProvider {
  readonly method: PaymentMethod;
  readonly isSandbox: boolean;

  /**
   * Initializes a payment checkout session with the payment provider
   */
  createPayment(params: CreatePaymentParams): Promise<PaymentResult>;

  /**
   * Queries the official payment gateway for transaction status
   */
  getPaymentStatus(transactionIdOrOrderId: string): Promise<PaymentResult>;

  /**
   * Processes server-to-server webhook notification callback
   */
  handleWebhook(
    payload: unknown,
    headers?: Record<string, string | string[] | undefined>,
    rawBody?: string
  ): Promise<WebhookResult>;
}

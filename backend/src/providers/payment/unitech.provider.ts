import { PaymentMethod, PaymentStatus } from '@prisma/client';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import {
  PaymentProvider,
  CreatePaymentParams,
  PaymentResult,
  WebhookResult,
} from './payment.interface.js';
import { unitechService, UnitechWebhookPayload } from '../../services/unitech.service.js';

export class UnitechProvider implements PaymentProvider {
  public readonly method: PaymentMethod = PaymentMethod.UNITECH;
  public readonly isSandbox: boolean;

  constructor() {
    this.isSandbox =
      !env.UNITECH_API_KEY ||
      env.UNITECH_API_KEY.includes('unitech_test') ||
      env.UNITECH_ENV === 'test' ||
      env.NODE_ENV !== 'production';

    logger.info('[UnitechPay Senegal] Provider initialized');
  }

  async createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
    logger.info(
      `[UnitechProvider] Initiating unified mobile payment for order ${params.orderNumber} (${params.amount} XOF)`
    );

    const result = await unitechService.createPaymentSession({
      orderIdOrNumber: params.orderNumber || params.orderId,
      amount: params.amount,
      phone: params.customerPhone,
      method: 'unitech',
      successUrl: params.successUrl,
      cancelUrl: params.cancelUrl,
      webhookUrl: params.webhookUrl,
    });

    return {
      transactionId: result.transactionId,
      paymentUrl: result.paymentUrl,
      launchUrl: result.redirectUrl,
      token: result.token,
      status: PaymentStatus.PENDING,
      isSandbox: result.isSandbox,
      instructions: result.instructions,
      metadata: {
        provider: 'UNITECH',
        gateway: 'UNITECH_PAY',
        redirectUrl: result.redirectUrl,
        initiatedAt: new Date().toISOString(),
      },
    };
  }

  async getPaymentStatus(transactionIdOrOrderId: string): Promise<PaymentResult> {
    return {
      transactionId: transactionIdOrOrderId,
      status: PaymentStatus.PENDING,
      isSandbox: this.isSandbox,
    };
  }

  async handleWebhook(
    payload: unknown,
    headers?: Record<string, string | string[] | undefined>,
    rawBody?: string
  ): Promise<WebhookResult> {
    const webhookPayload = payload as UnitechWebhookPayload;
    const signatureHeader = (headers?.['x-unitechpay-signature'] ||
      headers?.['X-UnitechPay-Signature'] ||
      headers?.['x-unitech-signature'] ||
      headers?.['X-Unitech-Signature'] ||
      headers?.['signature'] ||
      headers?.['wave-signature'] ||
      headers?.['Wave-Signature']) as string | undefined;

    const result = await unitechService.handleWebhookNotification(
      webhookPayload,
      signatureHeader,
      rawBody
    );

    return {
      success: result.success,
      orderNumber: result.orderNumber,
      transactionId: result.transactionId,
      paymentStatus: result.paymentStatus,
      amount: result.amount,
      currency: result.currency,
      metadata: result.metadata,
      message: result.message,
    };
  }
}

export const unitechProvider = new UnitechProvider();

import { PaymentMethod, PaymentStatus } from '@prisma/client';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import {
  PaymentProvider,
  CreatePaymentParams,
  PaymentResult,
  WebhookResult,
} from './payment.interface.js';
import { paytechService, PayTechIpnPayload } from '../../services/paytech.service.js';

export class PayTechProvider implements PaymentProvider {
  public readonly method: PaymentMethod = PaymentMethod.PAYTECH;
  public readonly isSandbox: boolean;

  constructor() {
    this.isSandbox = env.PAYTECH_ENV === 'test' || env.NODE_ENV !== 'production';
  }

  async createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
    logger.info(`[PayTechProvider] Initiating payment for order ${params.orderNumber} (${params.amount} XOF)`);

    const result = await paytechService.createPaymentSession({
      orderIdOrNumber: params.orderNumber || params.orderId,
      successUrl: params.successUrl,
      cancelUrl: params.cancelUrl,
      ipnUrl: params.webhookUrl,
    });

    return {
      transactionId: result.token,
      paymentUrl: result.paymentUrl,
      launchUrl: result.redirectUrl,
      token: result.token,
      status: PaymentStatus.PENDING,
      isSandbox: result.isSandbox,
      instructions: result.instructions,
      metadata: {
        provider: 'PAYTECH',
        redirectUrl: result.redirectUrl,
      },
    };
  }

  async getPaymentStatus(transactionIdOrOrderId: string): Promise<PaymentResult> {
    // Return standard pending or check status
    return {
      transactionId: transactionIdOrOrderId,
      status: PaymentStatus.PENDING,
      isSandbox: this.isSandbox,
    };
  }

  async handleWebhook(
    payload: unknown,
    _headers?: Record<string, string | string[] | undefined>,
    _rawBody?: string
  ): Promise<WebhookResult> {
    const ipnPayload = payload as PayTechIpnPayload;
    const result = await paytechService.handleIpnNotification(ipnPayload);

    return {
      success: result.success as boolean,
      orderNumber: result.orderNumber,
      orderId: result.orderId,
      transactionId: result.token,
      paymentStatus: (result.paymentStatus as PaymentStatus) || PaymentStatus.PENDING,
      message: result.message,
    };
  }
}

export const paytechProvider = new PayTechProvider();

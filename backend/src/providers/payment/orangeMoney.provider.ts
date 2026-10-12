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

export class OrangeMoneyProvider implements PaymentProvider {
  public readonly method: PaymentMethod = PaymentMethod.ORANGE_MONEY;
  public readonly isSandbox: boolean;

  constructor() {
    this.isSandbox =
      !env.UNITECHPAY_API_KEY &&
      !env.UNITECH_API_KEY;

    logger.info('[Orange Money Senegal via UnitechPay] Provider initialized');
  }

  async createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
    logger.info(
      `[Orange Money Senegal] Initiating payment for order ${params.orderNumber} (${params.amount} XOF) via UnitechPay`
    );

    const result = await unitechService.createOrangePayment({
      orderIdOrNumber: params.orderNumber || params.orderId,
      amount: params.amount,
      phone: params.customerPhone,
      description: `Commande Naja Rose Store ${params.orderNumber}`,
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
      instructions: `Paiement Orange Money sécurisé via la passerelle UnitechPay`,
      metadata: {
        provider: 'ORANGE_MONEY',
        gateway: 'UNITECHPAY',
        reference: result.reference,
        qrCode: result.qrCode,
        deepLinks: result.deepLinks,
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
    logger.info('[Orange Money Senegal] Processing incoming Webhook notification via UnitechPay');
    const webhookPayload = payload as UnitechWebhookPayload;
    const signatureHeader = (headers?.['x-unitechpay-signature'] ||
      headers?.['X-UnitechPay-Signature'] ||
      headers?.['x-unitech-signature'] ||
      headers?.['X-Unitech-Signature'] ||
      headers?.['signature']) as string | undefined;

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
      metadata: {
        ...result.metadata,
        provider: 'ORANGE_MONEY',
      },
      message: result.message,
    };
  }
}

export const orangeMoneyProvider = new OrangeMoneyProvider();


import { PaymentMethod, PaymentStatus } from '@prisma/client';
import { logger } from '../../utils/logger.js';
import {
  PaymentProvider,
  CreatePaymentParams,
  PaymentResult,
  WebhookResult,
} from './payment.interface.js';

export class CashOnDeliveryProvider implements PaymentProvider {
  public readonly method: PaymentMethod = PaymentMethod.CASH_ON_DELIVERY;
  public readonly isSandbox: boolean = false;

  async createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
    logger.info(
      `[Cash On Delivery] Registering pending COD payment for order ${params.orderNumber} (${params.amount} XOF)`
    );

    const transactionId = `cod_${params.orderNumber}`;

    return {
      transactionId,
      status: PaymentStatus.PENDING,
      isSandbox: false,
      instructions:
        'Paiement à la livraison : vous règlerez le montant exact en espèces ou par Wave / Orange Money direct auprès du livreur NAJA lors de la réception de votre colis.',
      metadata: {
        provider: 'CASH_ON_DELIVERY',
        orderNumber: params.orderNumber,
        amount: params.amount,
        currency: params.currency || 'XOF',
        initiatedAt: new Date().toISOString(),
      },
    };
  }

  async getPaymentStatus(transactionIdOrOrderId: string): Promise<PaymentResult> {
    return {
      transactionId: transactionIdOrOrderId,
      status: PaymentStatus.PENDING,
      isSandbox: false,
      metadata: {
        provider: 'CASH_ON_DELIVERY',
      },
    };
  }

  async handleWebhook(
    payload: unknown,
    _headers?: Record<string, string | string[] | undefined>
  ): Promise<WebhookResult> {
    logger.info('[Cash On Delivery] Handling delivery confirmation event');

    const data = (payload || {}) as {
      orderId?: string;
      orderNumber?: string;
      status?: string;
      amount?: number;
    };

    const status = (data.status || 'PAID').toUpperCase() === 'PAID' ? PaymentStatus.PAID : PaymentStatus.PENDING;

    return {
      success: true,
      orderId: data.orderId,
      orderNumber: data.orderNumber,
      paymentStatus: status,
      amount: data.amount,
      metadata: {
        provider: 'CASH_ON_DELIVERY',
        rawPayload: payload,
      },
      message: `Cash on delivery status confirmed (${status})`,
    };
  }
}

export const cashOnDeliveryProvider = new CashOnDeliveryProvider();

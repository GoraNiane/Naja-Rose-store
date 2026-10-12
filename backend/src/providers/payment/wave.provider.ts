import { PaymentMethod, PaymentStatus } from '@prisma/client';
import { logger } from '../../utils/logger.js';
import { ApiError } from '../../utils/apiError.js';
import {
  PaymentProvider,
  CreatePaymentParams,
  PaymentResult,
  WebhookResult,
} from './payment.interface.js';
import { waveService, WaveWebhookPayload } from '../../services/wave.service.js';

export class WaveProvider implements PaymentProvider {
  public readonly method: PaymentMethod = PaymentMethod.WAVE;
  public readonly isSandbox: boolean;

  constructor() {
    this.isSandbox = waveService.isSandbox;
    logger.info(
      `[Wave Checkout Direct] Provider registered (mode: ${
        this.isSandbox ? 'SANDBOX' : 'PRODUCTION'
      })`
    );
  }

  /**
   * Initializes a direct Wave Checkout session via POST https://api.wave.com/v1/checkout/sessions
   */
  async createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
    logger.info(
      `[Wave Checkout Direct] Creating checkout session for order ${params.orderNumber} (${params.amount} XOF)`
    );

    const session = await waveService.createCheckoutSession({
      orderId: params.orderId,
      orderNumber: params.orderNumber,
      amount: params.amount,
      currency: params.currency || 'XOF',
      customerPhone: params.customerPhone,
      customerEmail: params.customerEmail,
      customerName: params.customerName,
      successUrl: params.successUrl,
      errorUrl: params.cancelUrl,
    });

    return {
      transactionId: session.id, // Wave Checkout Session ID: cos-...
      paymentUrl: session.wave_launch_url,
      launchUrl: session.wave_launch_url,
      waveLaunchUrl: session.wave_launch_url,
      customerPhone: params.customerPhone,
      status: PaymentStatus.PENDING,
      isSandbox: this.isSandbox,
      instructions: `Session Wave Checkout officielle créée. Redirection vers ${session.wave_launch_url}`,
      metadata: {
        provider: 'WAVE',
        directWave: true,
        checkoutSessionId: session.id,
        waveLaunchUrl: session.wave_launch_url,
        businessName: session.business_name || 'NAJA ROSE STORE',
        merchantId: 'M_sn_UoRxc-HJ7lK-',
        amount: session.amount,
        currency: session.currency,
        clientReference: session.client_reference,
        whenCreated: session.when_created,
        whenExpires: session.when_expires,
        initiatedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Queries Wave Checkout session status via GET https://api.wave.com/v1/checkout/sessions/:id
   */
  async getPaymentStatus(transactionIdOrOrderId: string): Promise<PaymentResult> {
    const session = await waveService.getCheckoutSession(transactionIdOrOrderId);

    if (session) {
      const isPaid =
        session.payment_status === 'succeeded' ||
        session.checkout_status === 'complete';
      const isFailed =
        session.checkout_status === 'expired' ||
        session.checkout_status === 'cancelled' ||
        session.last_payment_error !== null;

      const mappedStatus: PaymentStatus = isPaid
        ? PaymentStatus.PAID
        : isFailed
        ? PaymentStatus.FAILED
        : PaymentStatus.PENDING;

      return {
        transactionId: session.transaction_id || session.id,
        paymentUrl: session.wave_launch_url,
        waveLaunchUrl: session.wave_launch_url,
        status: mappedStatus,
        isSandbox: this.isSandbox,
        metadata: {
          checkoutSessionId: session.id,
          paymentStatus: session.payment_status,
          checkoutStatus: session.checkout_status,
          transactionId: session.transaction_id,
        },
      };
    }

    return {
      transactionId: transactionIdOrOrderId,
      status: PaymentStatus.PENDING,
      isSandbox: this.isSandbox,
    };
  }

  /**
   * Processes incoming server-to-server webhook notifications from Wave
   * Verifies HMAC signature using Wave-Signature header and raw request body
   */
  async handleWebhook(
    payload: unknown,
    headers?: Record<string, string | string[] | undefined>,
    rawBody?: string
  ): Promise<WebhookResult> {
    logger.info('[Wave Checkout Direct] Processing incoming Webhook notification');

    const signatureHeader = (headers?.['wave-signature'] ||
      headers?.['Wave-Signature'] ||
      headers?.['wavesignature']) as string | undefined;

    // 1. Verify cryptographic signature if secret is active
    const verification = waveService.verifyWebhookSignature(signatureHeader, rawBody);
    if (!verification.isValid) {
      logger.error(
        `[Wave Checkout Direct] Signature verification rejected: ${verification.reason}`
      );
      throw ApiError.unauthorized(`Signature Wave invalide: ${verification.reason}`);
    }

    // 2. Parse event payload
    const event = (payload || {}) as WaveWebhookPayload & Record<string, any>;
    const eventType = event.type || 'checkout.session.completed';
    const data = event.data || event;

    const sessionId = data.id;
    const clientReference = data.client_reference || event.client_reference || '';
    const waveTxId = data.transaction_id || sessionId;
    const amountNum = data.amount ? Number(data.amount) : undefined;
    const currency = data.currency || 'XOF';

    const isComplete =
      data.payment_status === 'succeeded' ||
      data.checkout_status === 'complete';
    const isFailed =
      data.checkout_status === 'cancelled' ||
      data.checkout_status === 'expired';

    const mappedStatus: PaymentStatus = isComplete
      ? PaymentStatus.PAID
      : isFailed
      ? PaymentStatus.FAILED
      : PaymentStatus.PENDING;

    logger.info(
      `[Wave Checkout Direct] Webhook verified: type=${eventType}, ref=${clientReference}, session=${sessionId}, tx=${waveTxId}, status=${mappedStatus}`
    );

    return {
      success: true,
      orderNumber: clientReference || undefined,
      transactionId: waveTxId || sessionId,
      paymentStatus: mappedStatus,
      amount: amountNum,
      currency,
      metadata: {
        provider: 'WAVE',
        gateway: 'WAVE_CHECKOUT_DIRECT',
        checkoutSessionId: sessionId,
        transactionId: waveTxId,
        paymentStatus: data.payment_status,
        checkoutStatus: data.checkout_status,
        whenCompleted: data.when_completed,
        webhookVerifiedAt: new Date().toISOString(),
      },
      message: `Notification Wave traitée avec succès (${mappedStatus})`,
    };
  }
}

export const waveProvider = new WaveProvider();

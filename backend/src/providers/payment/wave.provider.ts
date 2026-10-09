import crypto from 'crypto';
import { PaymentMethod, PaymentStatus } from '@prisma/client';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import {
  PaymentProvider,
  CreatePaymentParams,
  PaymentResult,
  WebhookResult,
} from './payment.interface.js';
import { ApiError } from '../../utils/apiError.js';

export class WaveProvider implements PaymentProvider {
  public readonly method: PaymentMethod = PaymentMethod.WAVE;
  public readonly isSandbox: boolean;

  private apiKey?: string;
  private secret?: string;
  private webhookSecret?: string;
  private baseUrl = 'https://api.wave.com/v1';

  constructor() {
    this.apiKey = env.WAVE_API_KEY;
    this.secret = env.WAVE_SECRET;
    this.webhookSecret = env.WAVE_WEBHOOK_SECRET || env.WAVE_SECRET;

    // Detect sandbox / test mode if API keys are missing, placeholder or set to test
    this.isSandbox =
      !this.apiKey ||
      this.apiKey.includes('your_wave_api_key') ||
      this.apiKey.toLowerCase().includes('test') ||
      this.apiKey.toLowerCase().includes('sandbox') ||
      this.apiKey.toLowerCase().includes('mock') ||
      process.env.NODE_ENV === 'test';

    if (this.isSandbox) {
      logger.info(
        '[Wave Senegal] Initialized in SANDBOX / MOCK mode (Official keys not provided or set to test)'
      );
    } else {
      logger.info('[Wave Senegal] Initialized in PRODUCTION LIVE mode with official API endpoint');
    }
  }

  async createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
    logger.info(`[Wave Senegal] Initiating payment for order ${params.orderNumber} (${params.amount} XOF)`);

    // 1. Sandbox / Mock mode fallback
    if (this.isSandbox) {
      const mockSessionId = `wave_sess_sbx_${params.orderNumber}_${Date.now()}`;
      const sandboxRedirectUrl = `/checkout/payment-redirect?method=WAVE&orderId=${params.orderId}&orderNumber=${params.orderNumber}&amount=${params.amount}&txId=${mockSessionId}&sandbox=true`;

      return {
        transactionId: mockSessionId,
        paymentUrl: sandboxRedirectUrl,
        launchUrl: sandboxRedirectUrl,
        status: PaymentStatus.PENDING,
        isSandbox: true,
        instructions: 'Scannez le QR code Wave ou validez la transaction sur votre application Wave (Simulation)',
        metadata: {
          provider: 'WAVE',
          mode: 'SANDBOX',
          clientReference: params.orderNumber,
          amount: params.amount,
          currency: params.currency || 'XOF',
          initiatedAt: new Date().toISOString(),
        },
      };
    }

    // 2. Official Wave Senegal v1 Checkout Sessions API
    try {
      const response = await fetch(`${this.baseUrl}/checkout/sessions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(params.amount).toString(),
          currency: params.currency || 'XOF',
          client_reference: params.orderNumber,
          success_url: params.successUrl,
          error_url: params.cancelUrl,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        logger.error(`[Wave Senegal] API Error response (${response.status}):`, errorBody);
        throw ApiError.badRequest(`Échec de création de session Wave: ${errorBody}`);
      }

      const data = (await response.json()) as {
        id: string;
        wave_launch_url: string;
        checkout_status?: string;
      };

      return {
        transactionId: data.id,
        paymentUrl: data.wave_launch_url,
        launchUrl: data.wave_launch_url,
        status: PaymentStatus.PENDING,
        isSandbox: false,
        metadata: {
          provider: 'WAVE',
          waveSessionId: data.id,
          rawStatus: data.checkout_status,
          initiatedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      logger.error('[Wave Senegal] Communication failure with Wave Checkout API:', error);
      throw error instanceof ApiError
        ? error
        : ApiError.internal('Erreur de communication avec la passerelle Wave Senegal');
    }
  }

  async getPaymentStatus(transactionIdOrOrderId: string): Promise<PaymentResult> {
    if (this.isSandbox) {
      return {
        transactionId: transactionIdOrOrderId,
        status: PaymentStatus.PENDING,
        isSandbox: true,
        metadata: { mode: 'SANDBOX' },
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/checkout/sessions/${transactionIdOrOrderId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Wave status error: ${response.statusText}`);
      }

      const data = (await response.json()) as {
        id: string;
        checkout_status: string;
        payment_status?: string;
        amount: string;
      };

      let status: PaymentStatus = PaymentStatus.PENDING;
      if (data.payment_status === 'succeeded' || data.checkout_status === 'complete') {
        status = PaymentStatus.PAID;
      } else if (data.checkout_status === 'cancelled' || data.checkout_status === 'expired') {
        status = PaymentStatus.FAILED;
      } else if (data.checkout_status === 'processing') {
        status = PaymentStatus.PROCESSING;
      }

      return {
        transactionId: data.id,
        status,
        isSandbox: false,
        metadata: data as unknown as Record<string, unknown>,
      };
    } catch (error) {
      logger.error('[Wave Senegal] Error retrieving session status:', error);
      throw ApiError.internal('Impossible de vérifier le statut de la session Wave');
    }
  }

  async handleWebhook(
    payload: unknown,
    headers?: Record<string, string | string[] | undefined>,
    rawBody?: string
  ): Promise<WebhookResult> {
    logger.info('[Wave Senegal] Processing incoming webhook notification');

    // 1. Signature Verification
    if (this.webhookSecret && !this.isSandbox) {
      const signatureHeader = (headers?.['wave-signature'] ||
        headers?.['Wave-Signature'] ||
        headers?.['wave_signature']) as string | undefined;

      if (!signatureHeader) {
        logger.error('[Wave Senegal] Missing wave-signature header in live mode');
        throw ApiError.unauthorized('En-tête de signature Wave manquant');
      }

      const isValid = this.verifySignature(signatureHeader, rawBody || JSON.stringify(payload));
      if (!isValid) {
        logger.error('[Wave Senegal] Invalid webhook signature detected');
        throw ApiError.unauthorized('Signature webhook Wave non valide');
      }
    }

    // 2. Parse standard Wave event object
    const event = payload as {
      type?: string;
      id?: string;
      data?: {
        id?: string;
        client_reference?: string;
        order_id?: string;
        amount?: string | number;
        currency?: string;
        payment_status?: string;
        checkout_status?: string;
        [key: string]: unknown;
      };
    };

    const sessionData = (event.data || payload || {}) as Record<string, unknown>;
    const transactionId = sessionData.id ? String(sessionData.id) : event.id ? String(event.id) : undefined;
    const orderNumber = (sessionData.client_reference || sessionData.order_id || '') as string;
    const rawPaymentStatus = String(
      sessionData.payment_status || sessionData.checkout_status || ''
    ).toLowerCase();

    let paymentStatus: PaymentStatus = PaymentStatus.PENDING;

    if (
      rawPaymentStatus === 'cancelled' ||
      rawPaymentStatus === 'expired' ||
      rawPaymentStatus === 'failed'
    ) {
      paymentStatus = PaymentStatus.FAILED;
    } else if (
      rawPaymentStatus === 'succeeded' ||
      rawPaymentStatus === 'complete' ||
      rawPaymentStatus === 'paid' ||
      event.type === 'checkout.session.completed'
    ) {
      paymentStatus = PaymentStatus.PAID;
    } else if (rawPaymentStatus === 'processing') {
      paymentStatus = PaymentStatus.PROCESSING;
    }

    const amount = sessionData.amount ? parseFloat(String(sessionData.amount)) : undefined;

    return {
      success: true,
      orderNumber,
      transactionId,
      paymentStatus,
      amount,
      currency: (sessionData.currency as string) || 'XOF',
      metadata: {
        provider: 'WAVE',
        eventType: event.type,
        rawPayload: payload,
      },
      message: `Wave payment notification processed (${paymentStatus})`,
    };
  }

  private verifySignature(header: string, payloadString: string): boolean {
    try {
      // Wave format: t=1492774577,v1=5257a869e7ecebeda32affa62cd49f...
      const parts = header.split(',');
      const timestampPart = parts.find((p) => p.startsWith('t='));
      const sigPart = parts.find((p) => p.startsWith('v1='));

      if (!timestampPart || !sigPart || !this.webhookSecret) {
        return false;
      }

      const timestamp = timestampPart.slice(2);
      const signature = sigPart.slice(3);

      const computedSig = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(`${timestamp}.${payloadString}`)
        .digest('hex');

      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computedSig));
    } catch {
      return false;
    }
  }
}

export const waveProvider = new WaveProvider();

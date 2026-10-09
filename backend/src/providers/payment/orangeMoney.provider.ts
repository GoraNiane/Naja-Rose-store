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
import { paytechService } from '../../services/paytech.service.js';

export class OrangeMoneyProvider implements PaymentProvider {
  public readonly method: PaymentMethod = PaymentMethod.ORANGE_MONEY;
  public readonly isSandbox: boolean;

  private clientId?: string;
  private clientSecret?: string;
  private merchantKey?: string;
  private apiKey?: string;
  private apiUrl: string;
  private oauthUrl = 'https://api.orange.com/oauth/v3/token';

  constructor() {
    this.clientId = env.ORANGE_MONEY_CLIENT_ID;
    this.clientSecret = env.ORANGE_MONEY_CLIENT_SECRET;
    this.merchantKey = env.ORANGE_MONEY_MERCHANT_KEY;
    this.apiKey = env.ORANGE_MONEY_API_KEY;
    this.apiUrl = env.ORANGE_MONEY_API_URL || 'https://api.orange.com/orange-money-webpay/dev/v1';

    // Detect sandbox mode if credentials missing or placeholder
    this.isSandbox =
      !this.clientId ||
      this.clientId.includes('your_orange_money_client_id') ||
      this.clientId.toLowerCase().includes('test') ||
      this.clientId.toLowerCase().includes('sandbox') ||
      this.clientId.toLowerCase().includes('mock') ||
      process.env.NODE_ENV === 'test';

    logger.info('[Orange Money Senegal] Initialized using PayTech unified merchant gateway');
  }

  async createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
    logger.info(
      `[Orange Money Senegal] Initiating payment for order ${params.orderNumber} (${params.amount} XOF)`
    );

    // 1. Official PayTech Unified Gateway session (Handles Orange Money Senegal directly to merchant)
    if (env.PAYTECH_API_KEY && env.PAYTECH_API_SECRET) {
      logger.info(
        `[Orange Money Senegal] Creating official PayTech session for merchant NAJA ROSE STORE (Order #${params.orderNumber})`
      );
      const paytechResult = await paytechService.createPaymentSession({
        orderIdOrNumber: params.orderNumber || params.orderId,
        successUrl: params.successUrl,
        cancelUrl: params.cancelUrl,
        ipnUrl: params.webhookUrl,
      });

      return {
        transactionId: paytechResult.token,
        paymentUrl: paytechResult.paymentUrl,
        launchUrl: paytechResult.redirectUrl,
        token: paytechResult.token,
        status: PaymentStatus.PENDING,
        isSandbox: paytechResult.isSandbox,
        instructions: `Paiement Orange Money sécurisé via la passerelle officielle PayTech vers le marchand NAJA ROSE STORE`,
        metadata: {
          provider: 'ORANGE_MONEY',
          gateway: 'PAYTECH',
          redirectUrl: paytechResult.redirectUrl,
          initiatedAt: new Date().toISOString(),
        },
      };
    }

    // 1. Sandbox / Mock mode fallback
    if (this.isSandbox) {
      const mockToken = `om_tok_sbx_${params.orderNumber}_${Date.now()}`;
      const customerPhone = params.customerPhone || '';
      const sandboxRedirectUrl = `/checkout/payment-redirect?method=ORANGE_MONEY&orderId=${params.orderId}&orderNumber=${params.orderNumber}&amount=${params.amount}&phone=${encodeURIComponent(customerPhone)}&txId=${mockToken}&sandbox=true`;

      return {
        transactionId: mockToken,
        token: mockToken,
        paymentUrl: sandboxRedirectUrl,
        launchUrl: sandboxRedirectUrl,
        customerPhone,
        status: PaymentStatus.PENDING,
        isSandbox: true,
        instructions:
          `Ouvrez directement votre application Orange Max it pour approuver le règlement de ${params.amount} FCFA`,
        metadata: {
          provider: 'ORANGE_MONEY',
          mode: 'SANDBOX',
          orderReference: `NAJA-${params.orderNumber}`,
          customerPhone,
          amount: params.amount,
          currency: params.currency || 'XOF',
          initiatedAt: new Date().toISOString(),
        },
      };
    }

    // 2. Live Orange Money WebPay API
    try {
      const accessToken = await this.getOAuthToken();

      const headers: Record<string, string> = {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };

      if (this.apiKey) {
        headers['X-API-KEY'] = this.apiKey;
      }

      const notifUrl = params.webhookUrl || `${env.API_URL}/payments/orange-money/webhook`;

      const response = await fetch(`${this.apiUrl}/webpayment`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          merchant_key: this.merchantKey,
          currency: 'OUV', // West African CFA notation in Orange Money WebPay
          order_id: params.orderId,
          amount: Math.round(params.amount),
          return_url: params.successUrl,
          cancel_url: params.cancelUrl,
          notif_url: notifUrl,
          lang: 'fr',
          reference: `NAJA-${params.orderNumber}`,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`[Orange Money Senegal] WebPay Error (${response.status}):`, errorText);
        throw ApiError.badRequest(`Échec d'initialisation Orange Money: ${errorText}`);
      }

      const data = (await response.json()) as {
        payment_url: string;
        pay_token: string;
        notif_token?: string;
        message?: string;
      };

      return {
        transactionId: data.pay_token,
        token: data.pay_token,
        paymentUrl: data.payment_url,
        launchUrl: data.payment_url,
        status: PaymentStatus.PENDING,
        isSandbox: false,
        metadata: {
          provider: 'ORANGE_MONEY',
          payToken: data.pay_token,
          notifToken: data.notif_token,
          initiatedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      logger.error('[Orange Money Senegal] Gateway communication failure:', error);
      throw error instanceof ApiError
        ? error
        : ApiError.internal('Erreur de communication avec la passerelle Orange Money Senegal');
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
      const accessToken = await this.getOAuthToken();
      const headers: Record<string, string> = {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      };
      if (this.apiKey) {
        headers['X-API-KEY'] = this.apiKey;
      }

      const response = await fetch(`${this.apiUrl}/transactionstatus`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          order_id: transactionIdOrOrderId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Orange Money status check failed: ${response.statusText}`);
      }

      const data = (await response.json()) as {
        status: string;
        txnid?: string;
        amount?: number;
      };

      let status: PaymentStatus = PaymentStatus.PENDING;
      if (data.status === 'SUCCESS') {
        status = PaymentStatus.PAID;
      } else if (data.status === 'FAILED' || data.status === 'EXPIRED') {
        status = PaymentStatus.FAILED;
      } else if (data.status === 'INITIATED' || data.status === 'PENDING') {
        status = PaymentStatus.PROCESSING;
      }

      return {
        transactionId: data.txnid || transactionIdOrOrderId,
        status,
        isSandbox: false,
        metadata: data as unknown as Record<string, unknown>,
      };
    } catch (error) {
      logger.error('[Orange Money Senegal] Error checking status:', error);
      throw ApiError.internal('Impossible de vérifier le statut Orange Money');
    }
  }

  async handleWebhook(
    payload: unknown,
    _headers?: Record<string, string | string[] | undefined>
  ): Promise<WebhookResult> {
    logger.info('[Orange Money Senegal] Processing incoming WebPay notification');

    const data = (payload || {}) as {
      status?: string;
      notif_token?: string;
      txnid?: string;
      order_id?: string;
      reference?: string;
      amount?: number | string;
      currency?: string;
    };

    const rawStatus = (data.status || '').toUpperCase();
    let paymentStatus: PaymentStatus = PaymentStatus.PENDING;

    if (rawStatus === 'SUCCESS' || rawStatus === 'PAID') {
      paymentStatus = PaymentStatus.PAID;
    } else if (rawStatus === 'FAILED' || rawStatus === 'EXPIRED' || rawStatus === 'CANCELLED') {
      paymentStatus = PaymentStatus.FAILED;
    } else if (rawStatus === 'INITIATED' || rawStatus === 'PROCESSING') {
      paymentStatus = PaymentStatus.PROCESSING;
    }

    // Extract orderNumber if embedded in reference (e.g. NAJA-CMD-2026-000001)
    let orderNumber = data.reference || '';
    if (orderNumber.startsWith('NAJA-')) {
      orderNumber = orderNumber.replace('NAJA-', '');
    }

    const amount = data.amount ? parseFloat(String(data.amount)) : undefined;

    return {
      success: true,
      orderId: data.order_id,
      orderNumber: orderNumber || undefined,
      transactionId: data.txnid || data.notif_token,
      paymentStatus,
      amount,
      currency: data.currency || 'XOF',
      metadata: {
        provider: 'ORANGE_MONEY',
        rawStatus,
        notifToken: data.notif_token,
        rawPayload: payload,
      },
      message: `Orange Money notification processed (${paymentStatus})`,
    };
  }

  private async getOAuthToken(): Promise<string> {
    const authHeader = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    const response = await fetch(this.oauthUrl, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Orange Money OAuth token exchange failed: ${err}`);
    }

    const data = (await response.json()) as { access_token: string };
    return data.access_token;
  }
}

export const orangeMoneyProvider = new OrangeMoneyProvider();

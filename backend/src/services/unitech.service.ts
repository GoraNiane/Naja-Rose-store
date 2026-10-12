import crypto from 'crypto';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/apiError.js';
import { prisma } from '../config/prisma.js';
import { PaymentStatus, Prisma } from '@prisma/client';

export interface UnitechRequestParams {
  orderIdOrNumber: string;
  amount?: number;
  phone?: string;
  description?: string;
  method?: 'wave' | 'orange_money' | 'unitech';
  orangeMode?: 'om' | 'maxit' | 'qr';
  successUrl?: string;
  cancelUrl?: string;
  webhookUrl?: string;
}

export interface UnitechApiResponse {
  status?: string | boolean;
  success?: boolean;
  message?: string;
  transaction_id?: string | number;
  payment_url?: string;
  launch_url?: string;
  wave_launch_url?: string;
  qr_code?: string;
  deep_links?: {
    MAXIT?: string;
    OM?: string;
    [key: string]: string | undefined;
  };
  token?: string;
  reference?: string;
  data?: {
    transaction_id?: string | number;
    reference?: string;
    payment_url?: string;
    qr_code?: string;
    deep_links?: {
      MAXIT?: string;
      OM?: string;
      [key: string]: string | undefined;
    };
    token?: string;
    amount?: number | string;
    status?: string;
    [key: string]: unknown;
  };
}

export interface UnitechWebhookPayload {
  event?: string;
  transaction_id?: string | number;
  reference?: string;
  client_reference?: string;
  order_id?: string;
  amount?: number | string;
  status?: string;
  method?: string;
  commission?: number | string;
  net_amount?: number | string;
  timestamp?: number | string;
  signed_at?: number | string;
  signature?: string;
  [key: string]: unknown;
}

export class UnitechService {
  private readonly apiUrl: string;
  private readonly isTestEnv: boolean;

  constructor() {
    this.apiUrl = env.UNITECHPAY_API_URL || env.UNITECH_API_URL || 'https://api.unitech.sn/api.php';
    this.isTestEnv =
      env.UNITECHPAY_ENV === 'test' ||
      env.UNITECH_ENV === 'test' ||
      env.NODE_ENV !== 'production';
  }

  private getApiKey(): string {
    return (
      env.UNITECHPAY_API_KEY ||
      env.UNITECH_API_KEY ||
      env.UNITECHPAY_API_SECRET ||
      env.UNITECH_API_SECRET ||
      ''
    );
  }

  /**
   * Performs constant-time timing-safe string comparison to protect against side-channel leaks
   */
  private safeTimingCompare(a: string, b: string): boolean {
    if (!a || !b) return false;
    const cleanA = a.replace(/^sha256=/i, '').trim().toLowerCase();
    const cleanB = b.replace(/^sha256=/i, '').trim().toLowerCase();
    const bufA = Buffer.from(cleanA, 'utf-8');
    const bufB = Buffer.from(cleanB, 'utf-8');
    if (bufA.length !== bufB.length || bufA.length === 0) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  }

  /**
   * Verifies the HMAC-SHA256 authenticity of an incoming UnitechPay webhook
   * Implements both Method 1 (Header raw body HMAC) and Method 2 (Body canonical fields HMAC)
   */
  public verifyWebhookSignature(
    payload: UnitechWebhookPayload,
    signatureHeader?: string,
    rawBody?: string
  ): boolean {
    const apiKey = this.getApiKey();

    // If sandbox / test mode without secret or with test key
    if (this.isTestEnv && (!apiKey || apiKey.includes('test') || apiKey.includes('unitech_test'))) {
      if (!signatureHeader && !payload.signature) {
        logger.info('[UnitechPay] Sandbox environment: Webhook signature verified without secret.');
        return true;
      }
    }

    if (!apiKey) {
      logger.warn('[UnitechPay] Missing UNITECHPAY_API_KEY in environment.');
      return false;
    }

    const headerSig = (signatureHeader || '').trim();
    const bodySig = (payload.signature || '').trim();

    // Méthode 1 — par l'en-tête (HMAC du body brut exact)
    if (headerSig && rawBody) {
      try {
        const computedHeaderSig = crypto
          .createHmac('sha256', apiKey)
          .update(rawBody)
          .digest('hex');

        if (this.safeTimingCompare(headerSig, computedHeaderSig)) {
          return true;
        }
      } catch (err) {
        logger.error('[UnitechPay] Header signature calculation failed');
      }
    }

    // Méthode 2 — par le body (CDN-proof: event|reference|amount|status|signed_at)
    const event = payload.event || payload.status || '';
    const reference = payload.reference || payload.order_id || payload.client_reference || '';
    const amount = payload.amount !== undefined ? String(payload.amount) : '';
    const status = payload.status || '';
    const signedAt = payload.signed_at || payload.timestamp || '';

    const canonicalData = `${event}|${reference}|${amount}|${status}|${signedAt}`;
    try {
      const computedBodySig = crypto
        .createHmac('sha256', apiKey)
        .update(canonicalData)
        .digest('hex');

      const targetSig = bodySig || headerSig;
      if (targetSig && this.safeTimingCompare(targetSig, computedBodySig)) {
        return true;
      }
    } catch (err) {
      logger.error('[UnitechPay] Body canonical signature calculation failed');
    }

    // Legacy fallback: reference|amount|timestamp
    if (payload.reference && payload.amount) {
      try {
        const fallbackData = `${payload.reference}|${payload.amount}|${payload.timestamp || ''}`;
        const fallbackSig = crypto
          .createHmac('sha256', apiKey)
          .update(fallbackData)
          .digest('hex');

        if (headerSig && this.safeTimingCompare(headerSig, fallbackSig)) return true;
        if (bodySig && this.safeTimingCompare(bodySig, fallbackSig)) return true;
      } catch {
        // ignore
      }
    }

    return false;
  }

  /**
   * Initiates Wave Payment (create_wave_payment)
   */
  public async createWavePayment(params: UnitechRequestParams) {
    return this.createPaymentSession({ ...params, method: 'wave' });
  }

  /**
   * Initiates Orange Money Payment (create_orange_om, create_orange_maxit, or create_orange_qr)
   */
  public async createOrangePayment(
    params: UnitechRequestParams,
    mode: 'om' | 'maxit' | 'qr' = 'maxit'
  ) {
    return this.createPaymentSession({ ...params, method: 'orange_money', orangeMode: mode });
  }

  /**
   * Initiates a payment session on UnitechPay for an order
   */
  public async createPaymentSession(params: UnitechRequestParams) {
    const order = await prisma.order
      .findFirst({
        where: {
          OR: [{ id: params.orderIdOrNumber }, { orderNumber: params.orderIdOrNumber }],
        },
        include: {
          customer: true,
        },
      })
      .catch(() => null);

    const orderNumber = order?.orderNumber || params.orderIdOrNumber;
    const orderId = order?.id || params.orderIdOrNumber;
    const totalAmount = Math.round(params.amount || (order ? Number(order.total) : 0));
    const customerPhone =
      params.phone || order?.phone || order?.customer?.phone || '221773817191';
    const cleanPhone = customerPhone.replace(/[^0-9]/g, '');

    const successUrl =
      params.successUrl ||
      `${env.FRONTEND_URL || env.APP_URL}/checkout/success?orderNumber=${orderNumber}`;
    const cancelUrl =
      params.cancelUrl ||
      `${env.FRONTEND_URL || env.APP_URL}/commande/${orderNumber}/facture?payment=cancelled`;
    const webhookUrl =
      params.webhookUrl ||
      env.UNITECHPAY_WEBHOOK_URL ||
      `${env.BACKEND_URL || env.API_URL}/payments/unitech/webhook`;

    const description = params.description || `Commande Naja Rose Store ${orderNumber}`;
    const paymentMethodType = params.method || 'wave';
    const orangeMode = params.orangeMode || 'maxit';

    const apiKey = this.getApiKey();
    const isSandbox =
      !apiKey ||
      apiKey.includes('unitech_test') ||
      apiKey.includes('your_unitech') ||
      this.isTestEnv;

    // 1. Sandbox / Dev Mode Simulation Session
    if (isSandbox) {
      const mockTxId = `unitech_${paymentMethodType}_${orderNumber}_${Date.now()}`;
      const sandboxMethod = paymentMethodType === 'orange_money' ? 'ORANGE_MONEY' : 'WAVE';
      const sandboxRedirectUrl = `/checkout/payment-redirect?method=${sandboxMethod}&orderId=${orderId}&orderNumber=${orderNumber}&amount=${totalAmount}&phone=${encodeURIComponent(customerPhone)}&txId=${mockTxId}&sandbox=true`;

      logger.info(
        `[UnitechPay Sandbox] Generated payment session for order #${orderNumber} (${totalAmount} XOF, method: ${paymentMethodType})`
      );

      return {
        success: true,
        transactionId: mockTxId,
        reference: `unitech_ref_${mockTxId}`,
        token: mockTxId,
        paymentUrl: sandboxRedirectUrl,
        redirectUrl: sandboxRedirectUrl,
        isSandbox: true,
        orderId,
        orderNumber,
        instructions: `Paiement ${paymentMethodType === 'orange_money' ? 'Orange Money' : 'Wave'} via la passerelle UnitechPay (Simulation)`,
      };
    }

    // 2. Production API Call to https://api.unitech.sn/api.php
    try {
      let action = 'create_wave_payment';
      if (paymentMethodType === 'orange_money') {
        if (orangeMode === 'qr') {
          action = 'create_orange_qr';
        } else if (orangeMode === 'om') {
          action = 'create_orange_om';
        } else {
          action = 'create_orange_maxit';
        }
      }

      const bodyPayload: Record<string, unknown> = {
        amount: totalAmount,
        description,
        callback_success: successUrl,
        callback_cancel: cancelUrl,
      };

      if (action === 'create_orange_qr') {
        bodyPayload.reference = orderNumber;
      } else {
        bodyPayload.customer_number = cleanPhone;
      }

      logger.info(
        `[UnitechPay] Dispatching API request action=${action} for order ${orderNumber} (${totalAmount} XOF)`
      );

      const response = await fetch(`${this.apiUrl}?action=${action}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(bodyPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`[UnitechPay] HTTP Error ${response.status}: ${errorText}`);
        throw ApiError.badRequest(`Échec d'initialisation UnitechPay: ${errorText}`);
      }

      const data = (await response.json()) as UnitechApiResponse;
      const responseData = data.data || {};
      const paymentUrl =
        (responseData.payment_url as string) ||
        data.payment_url ||
        data.launch_url ||
        data.wave_launch_url ||
        (responseData.deep_links?.MAXIT as string) ||
        (responseData.deep_links?.OM as string) ||
        successUrl;

      const transactionId = String(
        responseData.transaction_id ||
          data.transaction_id ||
          responseData.token ||
          data.token ||
          `tx_unitech_${Date.now()}`
      );

      const reference = String(
        responseData.reference ||
          data.reference ||
          orderNumber
      );

      return {
        success: true,
        transactionId,
        reference,
        token: transactionId,
        paymentUrl,
        redirectUrl: paymentUrl,
        qrCode: (responseData.qr_code as string) || data.qr_code,
        deepLinks: responseData.deep_links || data.deep_links,
        isSandbox: false,
        orderId,
        orderNumber,
        instructions: `Redirection vers la passerelle sécurisée UnitechPay (${paymentMethodType.toUpperCase()})`,
      };
    } catch (err) {
      logger.error('[UnitechPay] Error communicating with Unitech API:', err);
      throw err instanceof ApiError
        ? err
        : ApiError.internal('Erreur de communication avec la passerelle UnitechPay');
    }
  }

  /**
   * Processes incoming UnitechPay Webhook notification
   */
  public async handleWebhookNotification(
    payload: unknown,
    signatureHeader?: string,
    rawBody?: string
  ) {
    const data = (payload && typeof payload === 'object' ? payload : {}) as Record<string, any>;
    const nestedData = (data.data && typeof data.data === 'object' ? data.data : {}) as Record<
      string,
      any
    >;

    logger.info('[UnitechPay] Processing incoming Webhook notification:', JSON.stringify(payload));

    const isValid = this.verifyWebhookSignature(data as UnitechWebhookPayload, signatureHeader, rawBody);
    if (!isValid && !this.isTestEnv) {
      logger.error('[UnitechPay] Invalid webhook signature detected');
      throw ApiError.unauthorized('Signature webhook UnitechPay non valide');
    }

    const rawRef = String(
      data.reference ||
        data.client_reference ||
        data.order_id ||
        nestedData.client_reference ||
        nestedData.reference ||
        nestedData.order_id ||
        ''
    );
    const orderReference = rawRef.startsWith('NAJA-') ? rawRef.replace('NAJA-', '') : rawRef;

    const rawStatus = String(
      data.status ||
        data.event ||
        nestedData.payment_status ||
        nestedData.checkout_status ||
        nestedData.status ||
        data.type ||
        ''
    ).toLowerCase();

    const transactionId =
      data.transaction_id !== undefined
        ? String(data.transaction_id)
        : data.txnid !== undefined
        ? String(data.txnid)
        : data.notif_token !== undefined
        ? String(data.notif_token)
        : nestedData.id !== undefined
        ? String(nestedData.id)
        : data.id !== undefined
        ? String(data.id)
        : undefined;

    const receivedAmount =
      data.amount !== undefined
        ? Math.round(Number(data.amount))
        : nestedData.amount !== undefined
        ? Math.round(Number(nestedData.amount))
        : undefined;

    let targetPaymentStatus: PaymentStatus = PaymentStatus.PENDING;

    if (
      rawStatus === 'completed' ||
      rawStatus === 'success' ||
      rawStatus === 'payment_completed' ||
      rawStatus === 'paid' ||
      rawStatus === 'succeeded' ||
      rawStatus === 'checkout.session.completed'
    ) {
      targetPaymentStatus = PaymentStatus.PAID;
    } else if (
      rawStatus === 'failed' ||
      rawStatus === 'expired' ||
      rawStatus === 'cancelled' ||
      rawStatus === 'payment_failed' ||
      rawStatus === 'payment_expired'
    ) {
      targetPaymentStatus = PaymentStatus.FAILED;
    } else if (rawStatus === 'processing' || rawStatus === 'pending') {
      targetPaymentStatus = PaymentStatus.PROCESSING;
    }

    return {
      success: true,
      orderNumber: orderReference,
      transactionId,
      paymentStatus: targetPaymentStatus,
      amount: receivedAmount,
      currency: (data.currency as string) || (nestedData.currency as string) || 'XOF',
      rawStatus,
      metadata: {
        provider: 'UNITECH',
        method: data.method || nestedData.method,
        commission: data.commission,
        netAmount: data.net_amount,
        rawPayload: payload,
      },
      message: `UnitechPay webhook processed (${targetPaymentStatus})`,
    };
  }
}

export const unitechService = new UnitechService();


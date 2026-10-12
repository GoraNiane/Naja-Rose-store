import crypto from 'crypto';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/apiError.js';

export const WAVE_MERCHANT_ID = 'M_sn_UoRxc-HJ7lK-';
export const WAVE_MERCHANT_NAME = 'NAJA ROSE STORE';
export const WAVE_MERCHANT_PAY_BASE_URL = 'https://pay.wave.com/m/M_sn_UoRxc-HJ7lK-/c/sn/';

/**
 * Builds the official direct Wave Merchant payment link with prescribed amount
 * Opens the Wave app directly with NAJA ROSE STORE and pre-fills the transaction amount.
 */
export function buildWaveDirectPaymentUrl(amount: number): string {
  const rounded = Math.round(Number(amount));
  return `${WAVE_MERCHANT_PAY_BASE_URL}?amount=${rounded}`;
}

export interface WaveCheckoutSessionRequest {
  orderId?: string;
  orderNumber: string;
  amount: number;
  currency?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerName?: string;
  successUrl: string;
  errorUrl: string;
}

export interface WaveCheckoutSessionResponse {
  id: string; // e.g. "cos-18qq25rgr100a"
  amount: string; // e.g. "15000"
  currency: string; // "XOF"
  checkout_status: 'open' | 'complete' | 'expired' | 'cancelled';
  client_reference: string | null;
  wave_launch_url: string; // "https://pay.wave.com/c/cos-18qq25rgr100a"
  business_name?: string;
  payment_status?: 'processing' | 'cancelled' | 'succeeded';
  transaction_id?: string;
  error_url?: string;
  success_url?: string;
  restrict_payer_mobile?: string;
  when_created?: string;
  when_expires?: string;
  when_completed?: string;
  last_payment_error?: { code: string; message: string } | null;
}

export interface WaveWebhookPayload {
  id?: string;
  type?: string; // "checkout.session.completed"
  data?: {
    id: string;
    amount: string;
    currency: string;
    checkout_status?: 'open' | 'complete' | 'expired' | 'cancelled';
    payment_status?: 'processing' | 'cancelled' | 'succeeded';
    client_reference?: string | null;
    transaction_id?: string;
    wave_launch_url?: string;
    business_name?: string;
    when_completed?: string;
    when_created?: string;
    when_expires?: string;
    last_payment_error?: { code: string; message: string } | null;
  };
}

export class WaveService {
  private readonly baseUrl: string = 'https://api.wave.com/v1';
  private readonly apiKey: string;
  private readonly webhookSecret: string;
  public readonly isSandbox: boolean;

  // In-memory registry for development / sandbox testing simulation
  private simulatedSessions = new Map<string, WaveCheckoutSessionResponse>();

  constructor() {
    this.apiKey = env.WAVE_API_KEY || '';
    this.webhookSecret = env.WAVE_WEBHOOK_SECRET || '';
    this.isSandbox =
      !this.apiKey ||
      this.apiKey.startsWith('wave_test') ||
      this.apiKey === 'your_wave_live_api_key';

    logger.info(
      `[Wave Direct Checkout] Service initialized (mode: ${
        this.isSandbox ? 'SANDBOX / SIMULATION' : 'LIVE PRODUCTION'
      })`
    );
  }

  /**
   * Creates a Wave Checkout Session via POST https://api.wave.com/v1/checkout/sessions
   * As specified in official documentation: https://docs.wave.com/checkout
   */
  async createCheckoutSession(
    params: WaveCheckoutSessionRequest
  ): Promise<WaveCheckoutSessionResponse> {
    const roundedAmount = Math.round(Number(params.amount));
    if (roundedAmount <= 0) {
      throw ApiError.badRequest('Le montant de la commande doit être supérieur à zéro');
    }

    const amountStr = String(roundedAmount);
    const currency = (params.currency || 'XOF').toUpperCase();

    if (currency !== 'XOF') {
      throw ApiError.badRequest(`Devise Wave non supportée : ${currency}. Seul XOF est accepté.`);
    }

    // Format phone to E.164 if provided
    let formattedPhone: string | undefined = undefined;
    if (params.customerPhone) {
      const cleanPhone = params.customerPhone.replace(/[\s\-\(\)]/g, '');
      if (cleanPhone.startsWith('+')) {
        formattedPhone = cleanPhone;
      } else if (cleanPhone.startsWith('221')) {
        formattedPhone = `+${cleanPhone}`;
      } else if (cleanPhone.length === 9) {
        formattedPhone = `+221${cleanPhone}`;
      }
    }

    const payload: Record<string, unknown> = {
      amount: amountStr,
      currency: 'XOF',
      client_reference: params.orderNumber,
      success_url: params.successUrl,
      error_url: params.errorUrl,
    };

    if (formattedPhone) {
      payload.restrict_payer_mobile = formattedPhone;
    }

    logger.info(
      `[Wave Direct Checkout] Creating checkout session for order ${params.orderNumber} (${amountStr} XOF)`
    );

    // If live API key is configured and not in unit testing offline sandbox:
    if (!this.isSandbox) {
      try {
        const response = await fetch(`${this.baseUrl}/checkout/sessions`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const data = (await response.json()) as any;

        if (!response.ok) {
          logger.error('[Wave Direct Checkout] API error from api.wave.com:', data);
          throw ApiError.badGateway(
            data?.message ||
              data?.error?.message ||
              `Erreur Wave Checkout (${response.status}): Impossible de créer la session`
          );
        }

        if (!data.wave_launch_url) {
          logger.error('[Wave Direct Checkout] Missing wave_launch_url in Wave response:', data);
          throw ApiError.badGateway('La passerelle Wave n\'a pas retourné de lien de paiement');
        }

        logger.info(
          `[Wave Direct Checkout] Official session created: ${data.id} -> ${data.wave_launch_url}`
        );

        return data as WaveCheckoutSessionResponse;
      } catch (error: any) {
        if (error instanceof ApiError) throw error;
        logger.error('[Wave Direct Checkout] Network exception calling api.wave.com:', error);
        throw ApiError.badGateway(
          `Erreur de connexion avec l'API Wave: ${error?.message || 'Hôte inaccessible'}`
        );
      }
    }

    // =========================================================================
    // DEVELOPMENT / SANDBOX SIMULATION
    // Generates an authentic Wave Checkout Session conforming strictly to API schema
    // =========================================================================
    const simulatedSessionId = `cos_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    // Official direct merchant link with pre-filled amount: https://pay.wave.com/m/M_sn_UoRxc-HJ7lK-/c/sn/?amount=...
    const directLaunchUrl = buildWaveDirectPaymentUrl(roundedAmount);

    const simulatedSession: WaveCheckoutSessionResponse = {
      id: simulatedSessionId,
      amount: amountStr,
      currency: 'XOF',
      checkout_status: 'open',
      client_reference: params.orderNumber,
      wave_launch_url: directLaunchUrl,
      business_name: 'NAJA ROSE STORE',
      payment_status: 'processing',
      success_url: params.successUrl,
      error_url: params.errorUrl,
      restrict_payer_mobile: formattedPhone,
      when_created: new Date().toISOString(),
      when_expires: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    };

    this.simulatedSessions.set(simulatedSessionId, simulatedSession);
    this.simulatedSessions.set(params.orderNumber, simulatedSession);

    logger.info(
      `[Wave Direct Checkout] Direct merchant link generated: ${simulatedSession.id} -> ${directLaunchUrl}`
    );

    return simulatedSession;
  }

  /**
   * Generates direct merchant payment link for NAJA ROSE STORE with prescribed order amount
   */
  getDirectMerchantPaymentUrl(amount: number): string {
    return buildWaveDirectPaymentUrl(amount);
  }

  /**
   * Retrieves checkout session status via GET https://api.wave.com/v1/checkout/sessions/:id
   */
  async getCheckoutSession(sessionIdOrOrderRef: string): Promise<WaveCheckoutSessionResponse | null> {
    if (!sessionIdOrOrderRef) return null;

    // Check simulated sessions first
    if (this.simulatedSessions.has(sessionIdOrOrderRef)) {
      return this.simulatedSessions.get(sessionIdOrOrderRef)!;
    }

    if (!this.isSandbox && sessionIdOrOrderRef.startsWith('cos-')) {
      try {
        const response = await fetch(`${this.baseUrl}/checkout/sessions/${sessionIdOrOrderRef}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 404) return null;
          logger.warn(`[Wave Direct Checkout] GET session returned HTTP ${response.status}`);
          return null;
        }

        const data = (await response.json()) as WaveCheckoutSessionResponse;
        return data;
      } catch (err) {
        logger.error('[Wave Direct Checkout] Failed to fetch session from Wave:', err);
        return null;
      }
    }

    return null;
  }

  /**
   * Marks a simulated session as completed (Useful for development & automated tests)
   */
  markSimulatedSessionCompleted(
    sessionIdOrOrderNumber: string,
    txId = `TCN_${Date.now()}`
  ): WaveCheckoutSessionResponse | null {
    const session = this.simulatedSessions.get(sessionIdOrOrderNumber);
    if (session) {
      session.checkout_status = 'complete';
      session.payment_status = 'succeeded';
      session.transaction_id = txId;
      session.when_completed = new Date().toISOString();
      return session;
    }
    return null;
  }

  /**
   * Verifies incoming Webhook signature according to official Wave documentation:
   * Header: Wave-Signature: t={timestamp},v1={hmac_sha256}
   * Signed payload: timestamp + raw_body
   * Key: WAVE_WEBHOOK_SECRET
   */
  verifyWebhookSignature(
    waveSignatureHeader?: string,
    rawBody?: string
  ): { isValid: boolean; timestamp?: string; reason?: string } {
    if (!waveSignatureHeader || !rawBody) {
      // In sandbox/dev mode, allow mock webhook invocation if signature header is not supplied
      if (this.isSandbox && env.NODE_ENV !== 'production') {
        return { isValid: true };
      }
      return {
        isValid: false,
        reason: 'En-tête Wave-Signature ou corps brut de requête absent',
      };
    }

    const secret = this.webhookSecret;
    if (!secret) {
      if (env.NODE_ENV !== 'production') {
        return { isValid: true };
      }
      return { isValid: false, reason: 'WAVE_WEBHOOK_SECRET non configuré' };
    }

    // 1. Extract t= and v1=
    const parts = waveSignatureHeader.split(',');
    const timestampPart = parts.find((p) => p.trim().startsWith('t='));
    const timestamp = timestampPart?.split('=')[1]?.trim();

    if (!timestamp) {
      return {
        isValid: false,
        reason: 'Horodatage t= introuvable dans Wave-Signature',
      };
    }

    // 2. Check replay attack tolerance (5 minutes window = 300s)
    const nowSeconds = Math.floor(Date.now() / 1000);
    const tsSeconds = parseInt(timestamp, 10);
    if (!isNaN(tsSeconds)) {
      const diff = Math.abs(nowSeconds - tsSeconds);
      if (diff > 300 && env.NODE_ENV === 'production') {
        return {
          isValid: false,
          reason: `Horodatage de notification Wave expiré (${diff}s écoulées > limite 300s)`,
        };
      }
    }

    // 3. Extract all v1= signatures (handles key rotation)
    const signatureParts = parts.filter((p) => p.trim().startsWith('v1='));
    const signatures = signatureParts
      .map((p) => p.split('=')[1]?.trim())
      .filter((s): s is string => Boolean(s));

    if (signatures.length === 0) {
      return {
        isValid: false,
        reason: 'Aucune signature v1= trouvée dans Wave-Signature',
      };
    }

    // 4. Compute expected HMAC-SHA256: timestamp + rawBody
    const payloadToSign = timestamp + rawBody;
    const computedHash = crypto
      .createHmac('sha256', secret)
      .update(payloadToSign)
      .digest('hex');

    const computedBuf = Buffer.from(computedHash, 'hex');

    // 5. Compare in constant time against any valid signature in the header
    let matched = false;
    for (const sig of signatures) {
      try {
        const sigBuf = Buffer.from(sig, 'hex');
        if (
          computedBuf.length === sigBuf.length &&
          crypto.timingSafeEqual(computedBuf, sigBuf)
        ) {
          matched = true;
          break;
        }
      } catch {
        // Continue if hex parsing fails on corrupt value
      }
    }

    return {
      isValid: matched,
      timestamp,
      reason: matched ? undefined : 'Échec de validation cryptographique HMAC-SHA256',
    };
  }

  /**
   * Helper to generate a valid Wave-Signature header for testing & simulation
   */
  generateWaveSignature(
    rawBody: string,
    secret = this.webhookSecret,
    timestamp = Math.floor(Date.now() / 1000)
  ): string {
    const payload = `${timestamp}${rawBody}`;
    const hash = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    return `t=${timestamp},v1=${hash}`;
  }
}

export const waveService = new WaveService();

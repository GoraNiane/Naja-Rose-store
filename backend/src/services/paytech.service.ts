import crypto from 'crypto';
import { prisma } from '../config/prisma.js';
import { PaymentMethod, PaymentStatus, OrderStatus, Prisma } from '@prisma/client';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/apiError.js';

export interface PayTechRequestParams {
  orderIdOrNumber: string;
  successUrl?: string;
  cancelUrl?: string;
  ipnUrl?: string;
}

export interface PayTechResponse {
  success: number | boolean;
  token?: string;
  redirect_url?: string;
  redirectUrl?: string;
  errors?: string[];
  message?: string;
  [key: string]: unknown;
}

export interface PayTechIpnPayload {
  type_event?: string;
  ref_command?: string;
  item_name?: string;
  item_price?: string | number;
  devise?: string;
  currency?: string;
  command_name?: string;
  env?: string;
  token?: string;
  api_key_sha256?: string;
  api_secret_sha256?: string;
  my_sort_data?: string;
  custom_field?: string;
  payment_method?: string;
  client_phone?: string;
  [key: string]: unknown;
}

export class PayTechService {
  private readonly apiUrl = 'https://paytech.sn/api/payment/request-payment';
  private readonly isTestEnv: boolean;

  constructor() {
    this.isTestEnv = env.PAYTECH_ENV === 'test' || env.NODE_ENV !== 'production';
  }

  /**
   * Hashes a string using SHA256 (used for PayTech IPN verification)
   */
  public hashSha256(value: string): string {
    return crypto.createHash('sha256').update(value).digest('hex');
  }

  /**
   * Verifies the authenticity of a PayTech IPN notification
   */
  public verifyIpnSignature(payload: PayTechIpnPayload): boolean {
    const apiKey = env.PAYTECH_API_KEY || '';
    const apiSecret = env.PAYTECH_API_SECRET || '';

    // In dev / test when keys are not configured, allow testing with mock keys
    if (!apiKey || !apiSecret) {
      if (this.isTestEnv) {
        logger.warn('[PayTech] Warning: PAYTECH_API_KEY or PAYTECH_API_SECRET missing in environment. Allowing test verification.');
        return true;
      }
      return false;
    }

    const expectedApiKeyHash = this.hashSha256(apiKey);
    const expectedApiSecretHash = this.hashSha256(apiSecret);

    const receivedApiKeyHash = (payload.api_key_sha256 || '').toLowerCase().trim();
    const receivedApiSecretHash = (payload.api_secret_sha256 || '').toLowerCase().trim();

    const isApiKeyValid = receivedApiKeyHash === expectedApiKeyHash.toLowerCase();
    const isApiSecretValid = receivedApiSecretHash === expectedApiSecretHash.toLowerCase();

    return isApiKeyValid && isApiSecretValid;
  }

  /**
   * Initiates a payment session on PayTech for a given order
   */
  public async createPaymentSession(params: PayTechRequestParams) {
    const { orderIdOrNumber, successUrl, cancelUrl, ipnUrl } = params;

    // 1. Fetch Order with latest payment & customer info from database
    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id: orderIdOrNumber }, { orderNumber: orderIdOrNumber }],
      },
      include: {
        customer: true,
        invoice: true,
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!order) {
      throw ApiError.notFound(`Commande non trouvée (${orderIdOrNumber})`);
    }

    if (order.paymentStatus === PaymentStatus.PAID) {
      throw ApiError.badRequest('Cette commande a déjà été réglée avec succès');
    }

    const totalAmount = Number(order.total);
    const currentEnv = env.PAYTECH_ENV || 'test';

    // Construct URLs
    const finalSuccessUrl =
      successUrl ||
      env.PAYTECH_SUCCESS_URL ||
      `${env.APP_URL}/checkout/success?orderNumber=${order.orderNumber}`;
    const finalCancelUrl =
      cancelUrl ||
      env.PAYTECH_CANCEL_URL ||
      `${env.APP_URL}/commande/${order.orderNumber}/facture?payment=cancelled`;

    let configuredIpn =
      ipnUrl ||
      env.PAYTECH_IPN_URL ||
      `${env.API_URL}/payments/paytech/ipn`;

    // PayTech API strictly requires an HTTPS IPN URL. If in local development with http://localhost, use production webhook
    if (configuredIpn.startsWith('http://localhost') || configuredIpn.startsWith('http://127.0.0.1')) {
      configuredIpn = 'https://naja-rose-store.vercel.app/api/v1/payments/paytech/ipn';
    }
    const finalIpnUrl = configuredIpn;

    const customFieldData = JSON.stringify({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: totalAmount,
      currency: 'XOF',
      invoiceNumber: order.invoice?.invoiceNumber || null,
    });

    // 2. Prepare PayTech Official Payload
    const paytechBody = {
      item_name: `Commande #${order.orderNumber} - NAJA ROSE STORE`,
      item_price: totalAmount,
      currency: 'XOF',
      ref_command: order.orderNumber,
      command_name: `Vêtements NAJA ROSE (Facture ${order.invoice?.invoiceNumber || order.orderNumber})`,
      env: currentEnv,
      ipn_url: finalIpnUrl,
      success_url: finalSuccessUrl,
      cancel_url: finalCancelUrl,
      custom_field: customFieldData,
    };

    logger.info(
      `[PayTech Service] Sending payment request for order ${order.orderNumber} (${totalAmount} XOF, env=${currentEnv})`
    );

    let redirectUrl: string | undefined;
    let token: string | undefined;
    let isSandbox = currentEnv === 'test';

    const apiKey = env.PAYTECH_API_KEY;
    const apiSecret = env.PAYTECH_API_SECRET;

    // 3. Make real HTTP POST request to PayTech official API
    const hasValidCredentials =
      apiKey &&
      apiSecret &&
      !apiKey.includes('your_') &&
      !apiKey.includes('test_api_key');

    if (hasValidCredentials || env.NODE_ENV === 'production') {
      try {
        const response = await fetch(this.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            API_KEY: apiKey || '',
            API_SECRET: apiSecret || '',
          },
          body: JSON.stringify(paytechBody),
        });

        const data = (await response.json()) as PayTechResponse;

        if (data.success === 1 || data.success === true) {
          redirectUrl = data.redirect_url || data.redirectUrl;
          token = data.token;
        } else {
          logger.error('[PayTech Service] API returned error:', data);
          const errorMsg =
            data.errors && data.errors.length > 0
              ? data.errors.join(', ')
              : data.message || 'Échec de la communication avec la passerelle PayTech';
          throw ApiError.badRequest(`PayTech: ${errorMsg}`);
        }
      } catch (err: any) {
        if (err instanceof ApiError) throw err;
        logger.error('[PayTech Service] Network/API Error:', err);
        // If in test mode with non-routable host or offline dev, fallback to secure dev redirect
        if (this.isTestEnv) {
          logger.warn('[PayTech Service] Using sandbox fallback for development testing');
          token = `paytech_token_sbx_${order.orderNumber}_${Date.now()}`;
          redirectUrl = `${env.APP_URL}/checkout/payment-redirect?method=PAYTECH&orderId=${order.id}&orderNumber=${order.orderNumber}&amount=${totalAmount}&token=${token}&sandbox=true`;
        } else {
          throw ApiError.internal('Impossible de joindre les serveurs PayTech. Veuillez réessayer dans un instant.');
        }
      }
    } else {
      // In development / test environment with mock keys: Provide standard sandbox session
      logger.info('[PayTech Service] Running in SANDBOX DEVELOPMENT mode (Mock keys configured)');
      token = `paytech_token_sbx_${order.orderNumber}_${Date.now()}`;
      redirectUrl = `${env.APP_URL}/checkout/payment-redirect?method=PAYTECH&orderId=${order.id}&orderNumber=${order.orderNumber}&amount=${totalAmount}&token=${token}&sandbox=true`;
      isSandbox = true;
    }

    // 4. Record or update Payment in Database
    const existingPayment = order.payments[0];

    if (existingPayment) {
      await prisma.payment.update({
        where: { id: existingPayment.id },
        data: {
          provider: PaymentMethod.PAYTECH,
          transactionId: token || existingPayment.transactionId,
          status: PaymentStatus.PENDING,
          amount: new Prisma.Decimal(totalAmount),
          metadata: {
            ...((existingPayment.metadata as Record<string, unknown>) || {}),
            paytechToken: token,
            paytechEnv: currentEnv,
            redirectUrl,
            initiatedAt: new Date().toISOString(),
          } as Prisma.InputJsonValue,
        },
      });
    } else {
      await prisma.payment.create({
        data: {
          orderId: order.id,
          provider: PaymentMethod.PAYTECH,
          amount: new Prisma.Decimal(totalAmount),
          transactionId: token,
          status: PaymentStatus.PENDING,
          metadata: {
            paytechToken: token,
            paytechEnv: currentEnv,
            redirectUrl,
            initiatedAt: new Date().toISOString(),
          } as Prisma.InputJsonValue,
        },
      });
    }

    // Update order payment method to PAYTECH
    if (order.paymentMethod !== PaymentMethod.PAYTECH) {
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentMethod: PaymentMethod.PAYTECH },
      });
    }

    return {
      success: true,
      orderNumber: order.orderNumber,
      orderId: order.id,
      amount: totalAmount,
      currency: 'XOF',
      token,
      paymentUrl: redirectUrl,
      redirectUrl,
      isSandbox,
      method: PaymentMethod.PAYTECH,
      instructions: 'Redirection vers la page de paiement sécurisée PayTech (Wave, Orange Money, Free Money, Carte)',
    };
  }

  /**
   * Processes PayTech IPN (Instant Payment Notification) callback
   */
  public async handleIpnNotification(payload: PayTechIpnPayload) {
    logger.info('[PayTech IPN] Received notification payload:', {
      type_event: payload.type_event,
      ref_command: payload.ref_command,
      item_price: payload.item_price,
      env: payload.env,
      token: payload.token,
      payment_method: payload.payment_method,
    });

    // 1. Verify authenticity of the IPN using SHA256 hash comparison
    const isSignatureValid = this.verifyIpnSignature(payload);
    if (!isSignatureValid) {
      logger.error('[PayTech IPN] Signature validation failed! SHA256 hashes do not match credentials.');
      throw ApiError.unauthorized('Signature de notification PayTech invalide');
    }

    const refCommand = payload.ref_command;
    if (!refCommand) {
      logger.error('[PayTech IPN] Missing ref_command in payload');
      throw ApiError.badRequest('Paramètre ref_command manquant');
    }

    // 2. Fetch the corresponding order
    let order = await prisma.order.findFirst({
      where: {
        OR: [{ orderNumber: refCommand }, { id: refCommand }],
      },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' },
        },
        customer: true,
        invoice: true,
      },
    });

    // Also attempt parsing custom_field if ref_command wasn't directly found
    if (!order && payload.custom_field) {
      try {
        const parsedCustom = typeof payload.custom_field === 'string'
          ? JSON.parse(payload.custom_field)
          : payload.custom_field;
        if (parsedCustom.orderId || parsedCustom.orderNumber) {
          order = await prisma.order.findFirst({
            where: {
              OR: [
                ...(parsedCustom.orderId ? [{ id: parsedCustom.orderId }] : []),
                ...(parsedCustom.orderNumber ? [{ orderNumber: parsedCustom.orderNumber }] : []),
              ],
            },
            include: {
              payments: { orderBy: { createdAt: 'desc' } },
              customer: true,
              invoice: true,
            },
          });
        }
      } catch (e) {
        logger.warn('[PayTech IPN] Failed to parse custom_field JSON:', e);
      }
    }

    if (!order) {
      logger.warn(`[PayTech IPN] Order not found for ref_command: ${refCommand}`);
      return {
        success: false,
        message: `Order reference ${refCommand} not found in database`,
      };
    }

    // 3. Handle 'sale_complete' (Successful Payment)
    if (payload.type_event === 'sale_complete' || !payload.type_event) {
      // Amount verification: Check that item_price matches order.total
      if (payload.item_price !== undefined) {
        const receivedPrice = Number(payload.item_price);
        const expectedPrice = Number(order.total);
        const priceDifference = Math.abs(receivedPrice - expectedPrice);

        // In test mode, PayTech may deduct 100-150 CFA for simulation. In production, exact match required.
        const isExactMatch = priceDifference < 1.0;
        const isTestAmount = this.isTestEnv && (receivedPrice >= 100 && receivedPrice <= 150);

        if (!isExactMatch && !isTestAmount) {
          logger.error(
            `[PayTech IPN] Amount mismatch! Expected: ${expectedPrice} XOF, Received: ${receivedPrice} XOF`
          );
          throw ApiError.badRequest(`Incohérence du montant payé (attendu: ${expectedPrice} XOF, reçu: ${receivedPrice} XOF)`);
        }
      }

      // IDEMPOTENCY CHECK: If order is already PAID, return success without duplicate side-effects
      const latestPayment = order.payments[0];
      if (order.paymentStatus === PaymentStatus.PAID) {
        logger.info(`[PayTech IPN] [IDEMPOTENT] Order ${order.orderNumber} is already confirmed as PAID. Skipping duplicate processing.`);
        return {
          success: true,
          idempotent: true,
          orderNumber: order.orderNumber,
          status: PaymentStatus.PAID,
          message: 'Notification already processed previously',
        };
      }

      // 4. Atomic Transaction: Update Payment, Order, Invoice, and Audit Log
      await prisma.$transaction(async (tx) => {
        const transactionToken = payload.token || latestPayment?.transactionId || `paytech_${Date.now()}`;

        if (latestPayment) {
          await tx.payment.update({
            where: { id: latestPayment.id },
            data: {
              status: PaymentStatus.PAID,
              transactionId: transactionToken,
              metadata: {
                ...((latestPayment.metadata as Record<string, unknown>) || {}),
                paymentMethodName: payload.payment_method || 'PayTech',
                paytechToken: payload.token,
                clientPhone: payload.client_phone,
                ipnReceivedAt: new Date().toISOString(),
                rawIpn: payload,
              } as Prisma.InputJsonValue,
            },
          });
        } else {
          await tx.payment.create({
            data: {
              orderId: order.id,
              provider: PaymentMethod.PAYTECH,
              amount: order.total,
              status: PaymentStatus.PAID,
              transactionId: transactionToken,
              metadata: {
                paymentMethodName: payload.payment_method || 'PayTech',
                paytechToken: payload.token,
                clientPhone: payload.client_phone,
                ipnReceivedAt: new Date().toISOString(),
                rawIpn: payload,
              } as Prisma.InputJsonValue,
            },
          });
        }

        // Update Order Status: from NEW to CONFIRMED
        const newOrderStatus = order.status === OrderStatus.NEW ? OrderStatus.CONFIRMED : order.status;

        await tx.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: PaymentStatus.PAID,
            status: newOrderStatus,
            paymentMethod: PaymentMethod.PAYTECH,
          },
        });

        // Create Audit Log
        await tx.auditLog.create({
          data: {
            action: 'PAYMENT_CONFIRMED',
            entity: 'ORDER',
            entityId: order.id,
            details: {
              orderNumber: order.orderNumber,
              method: 'PAYTECH',
              paytechMethod: payload.payment_method || 'Online Gateway',
              amount: Number(order.total),
              token: payload.token,
              confirmedVia: 'PAYTECH_IPN',
            } as Prisma.InputJsonValue,
          },
        });
      });

      logger.info(`[PayTech IPN] Order ${order.orderNumber} successfully updated to PAID / CONFIRMED`);

      return {
        success: true,
        orderNumber: order.orderNumber,
        orderId: order.id,
        paymentStatus: PaymentStatus.PAID,
        token: payload.token,
      };
    }

    // 5. Handle 'sale_canceled' or payment failure
    if (payload.type_event === 'sale_canceled') {
      logger.info(`[PayTech IPN] Payment was cancelled by user for order ${order.orderNumber}`);

      const latestPayment = order.payments[0];
      if (latestPayment && latestPayment.status !== PaymentStatus.PAID) {
        await prisma.payment.update({
          where: { id: latestPayment.id },
          data: {
            status: PaymentStatus.FAILED,
            metadata: {
              ...((latestPayment.metadata as Record<string, unknown>) || {}),
              cancelledAt: new Date().toISOString(),
              cancellationReason: 'Cancelled on PayTech portal',
            } as Prisma.InputJsonValue,
          },
        });
      }

      return {
        success: true,
        orderNumber: order.orderNumber,
        paymentStatus: PaymentStatus.FAILED,
        message: 'Payment cancelled on PayTech',
      };
    }

    return {
      success: true,
      message: `Received event ${payload.type_event}`,
    };
  }
}

export const paytechService = new PayTechService();

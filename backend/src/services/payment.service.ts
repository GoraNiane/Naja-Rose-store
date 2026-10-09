import { prisma } from '../config/prisma.js';
import { PaymentMethod, PaymentStatus, OrderStatus, Prisma } from '@prisma/client';
import { PaymentFactory } from '../providers/payment/payment.factory.js';
import { ApiError } from '../utils/apiError.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

export class PaymentService {
  /**
   * Initiates payment for a given order using its selected PaymentMethod
   */
  async initiatePayment(
    orderIdOrNumber: string,
    options?: {
      paymentMethod?: PaymentMethod;
      successUrl?: string;
      cancelUrl?: string;
      webhookUrl?: string;
    }
  ) {
    let order = await prisma.order.findFirst({
      where: {
        OR: [{ id: orderIdOrNumber }, { orderNumber: orderIdOrNumber }],
      },
      include: {
        customer: true,
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
      throw ApiError.badRequest('Cette commande a déjà été payée avec succès');
    }

    // If client specified a new payment method, update order
    if (options?.paymentMethod && options.paymentMethod !== order.paymentMethod) {
      order = await prisma.order.update({
        where: { id: order.id },
        data: { paymentMethod: options.paymentMethod },
        include: {
          customer: true,
          payments: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });
    }

    const provider = PaymentFactory.getProvider(order.paymentMethod);

    const successUrl =
      options?.successUrl ||
      `${env.APP_URL}/checkout/success?orderNumber=${order.orderNumber}`;
    const cancelUrl =
      options?.cancelUrl ||
      `${env.APP_URL}/checkout/cancel?orderNumber=${order.orderNumber}`;
    const webhookUrl =
      options?.webhookUrl ||
      (order.paymentMethod === PaymentMethod.PAYTECH
        ? `${env.API_URL}/payments/paytech/ipn`
        : `${env.API_URL}/payments/${order.paymentMethod.toLowerCase().replace('_', '-')}/webhook`);

    const customerName = `${order.customer.firstName} ${order.customer.lastName}`;

    const paymentResult = await provider.createPayment({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: Number(order.total),
      currency: 'XOF',
      customerPhone: order.phone,
      customerEmail: (order.email || order.customer.email) || undefined,
      customerName,
      successUrl,
      cancelUrl,
      webhookUrl,
    });

    // Save or update the Payment record with the newly initiated transactionId & metadata
    const existingPayment = order.payments[0];

    if (existingPayment) {
      await prisma.payment.update({
        where: { id: existingPayment.id },
        data: {
          transactionId: paymentResult.transactionId || existingPayment.transactionId,
          status: paymentResult.status,
          metadata: {
            ...((existingPayment.metadata as Record<string, unknown>) || {}),
            ...paymentResult.metadata,
            isSandbox: paymentResult.isSandbox,
            initiatedAt: new Date().toISOString(),
          } as Prisma.InputJsonValue,
        },
      });
    } else {
      await prisma.payment.create({
        data: {
          orderId: order.id,
          provider: order.paymentMethod,
          amount: order.total,
          transactionId: paymentResult.transactionId,
          status: paymentResult.status,
          metadata: {
            ...paymentResult.metadata,
            isSandbox: paymentResult.isSandbox,
            initiatedAt: new Date().toISOString(),
          } as Prisma.InputJsonValue,
        },
      });
    }

    return {
      orderNumber: order.orderNumber,
      orderId: order.id,
      method: order.paymentMethod,
      amount: Number(order.total),
      currency: 'XOF',
      ...paymentResult,
    };
  }

  /**
   * Processes an incoming payment webhook with strict idempotency and atomic updates
   */
  async processWebhook(
    method: PaymentMethod,
    payload: unknown,
    headers: Record<string, string | string[] | undefined> = {},
    rawBody?: string
  ) {
    const provider = PaymentFactory.getProvider(method);

    // 1. Let the provider verify signatures and parse the payload
    const webhookResult = await provider.handleWebhook(payload, headers, rawBody);

    logger.info(
      `[PaymentService] Handling webhook for ${method}: status=${webhookResult.paymentStatus}, orderNumber=${webhookResult.orderNumber}, tx=${webhookResult.transactionId}`
    );

    // 2. Locate the target order & payment
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          ...(webhookResult.orderNumber ? [{ orderNumber: webhookResult.orderNumber }] : []),
          ...(webhookResult.orderId ? [{ id: webhookResult.orderId }] : []),
          ...(webhookResult.transactionId
            ? [{ payments: { some: { transactionId: webhookResult.transactionId } } }]
            : []),
        ],
      },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' },
        },
        customer: true,
      },
    });

    if (!order) {
      logger.warn(
        `[PaymentService] Received webhook for non-existent order (ref: ${webhookResult.orderNumber || webhookResult.orderId || webhookResult.transactionId})`
      );
      return {
        success: false,
        message: 'Order reference not found in database',
      };
    }

    const latestPayment = order.payments[0];

    // 3. IDEMPOTENCY GUARD:
    // If the payment is already confirmed as PAID, do not re-process or fire duplicate side-effects
    if (latestPayment && latestPayment.status === PaymentStatus.PAID) {
      logger.info(
        `[PaymentService] [IDEMPOTENT] Order ${order.orderNumber} is already marked as PAID. Skipping duplicate webhook execution.`
      );
      return {
        success: true,
        idempotent: true,
        message: 'Payment was already processed as PAID previously',
        orderNumber: order.orderNumber,
        status: PaymentStatus.PAID,
      };
    }

    // 4. Atomic transaction update
    await prisma.$transaction(async (tx) => {
      const isPaid = webhookResult.paymentStatus === PaymentStatus.PAID;

      // Update or create payment record
      if (latestPayment) {
        await tx.payment.update({
          where: { id: latestPayment.id },
          data: {
            status: webhookResult.paymentStatus,
            transactionId: webhookResult.transactionId || latestPayment.transactionId,
            metadata: {
              ...((latestPayment.metadata as Record<string, unknown>) || {}),
              ...webhookResult.metadata,
              webhookProcessedAt: new Date().toISOString(),
            } as Prisma.InputJsonValue,
          },
        });
      } else {
        await tx.payment.create({
          data: {
            orderId: order.id,
            provider: method,
            amount: webhookResult.amount ? new Prisma.Decimal(webhookResult.amount) : order.total,
            status: webhookResult.paymentStatus,
            transactionId: webhookResult.transactionId,
            metadata: {
              ...webhookResult.metadata,
              webhookProcessedAt: new Date().toISOString(),
            } as Prisma.InputJsonValue,
          },
        });
      }

      // Update Order Status
      // When payment is confirmed PAID and order is currently NEW, advance to CONFIRMED
      const newOrderStatus =
        isPaid && order.status === OrderStatus.NEW ? OrderStatus.CONFIRMED : order.status;

      await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: webhookResult.paymentStatus,
          status: newOrderStatus,
        },
      });

      // Log notification / audit trail
      if (isPaid) {
        await tx.auditLog.create({
          data: {
            action: 'PAYMENT_CONFIRMED',
            entity: 'ORDER',
            entityId: order.id,
            details: {
              orderNumber: order.orderNumber,
              method,
              amount: Number(order.total),
              transactionId: webhookResult.transactionId,
              confirmedVia: 'WEBHOOK',
            } as Prisma.InputJsonValue,
          },
        });
      }
    });

    logger.info(
      `[PaymentService] Successfully processed webhook for order ${order.orderNumber} -> ${webhookResult.paymentStatus}`
    );

    return {
      success: true,
      orderNumber: order.orderNumber,
      orderId: order.id,
      paymentStatus: webhookResult.paymentStatus,
      transactionId: webhookResult.transactionId,
    };
  }

  /**
   * Retrieves verified status of a payment for an order
   */
  async getPaymentStatus(orderIdOrNumber: string) {
    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id: orderIdOrNumber }, { orderNumber: orderIdOrNumber }],
      },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' },
        },
        deliveryZone: true,
      },
    });

    if (!order) {
      throw ApiError.notFound('Commande introuvable');
    }

    const latestPayment = order.payments[0];

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      orderStatus: order.status,
      total: Number(order.total),
      subtotal: Number(order.subtotal),
      deliveryFee: Number(order.deliveryFee),
      transactionId: latestPayment?.transactionId,
      updatedAt: latestPayment?.updatedAt || order.updatedAt,
      isPaid: order.paymentStatus === PaymentStatus.PAID,
    };
  }

  /**
   * Simulates a sandbox payment approval (Available in Development/Sandbox mode only)
   */
  async simulateSandboxPayment(orderNumberOrId: string, targetStatus: PaymentStatus = PaymentStatus.PAID) {
    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id: orderNumberOrId }, { orderNumber: orderNumberOrId }],
      },
    });

    if (!order) {
      throw ApiError.notFound('Commande non trouvée pour simulation sandbox');
    }

    const provider = PaymentFactory.getProvider(order.paymentMethod);
    if (!provider.isSandbox && env.NODE_ENV === 'production') {
      throw ApiError.badRequest('La simulation sandbox est désactivée en mode production');
    }

    logger.info(
      `[PaymentService] [SANDBOX SIMULATION] Simulating ${targetStatus} confirmation for order ${order.orderNumber} (${order.paymentMethod})`
    );

    const mockPayload = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: targetStatus === PaymentStatus.PAID ? 'succeeded' : 'failed',
      type: 'checkout.session.completed',
      txnid: `sbx_sim_${Date.now()}`,
      amount: Number(order.total),
      currency: 'XOF',
      data: {
        client_reference: order.orderNumber,
        payment_status: targetStatus === PaymentStatus.PAID ? 'succeeded' : 'failed',
        amount: Number(order.total),
        currency: 'XOF',
      },
    };

    return this.processWebhook(order.paymentMethod, mockPayload, {});
  }
}

export const paymentService = new PaymentService();

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
    const txId = webhookResult.transactionId;
    const alreadyProcessed = txId && order.payments.some((p) => p.transactionId === txId && p.status === PaymentStatus.PAID);
    if (alreadyProcessed) {
      logger.info(
        `[PaymentService] [IDEMPOTENT] Webhook transaction ${txId} for order ${order.orderNumber} is already confirmed. Skipping duplicate.`
      );
      return {
        success: true,
        idempotent: true,
        orderNumber: order.orderNumber,
        orderId: order.id,
        paymentStatus: order.paymentStatus,
        amountPaid: Number(order.amountPaid || order.total),
        remainingBalance: Number(order.remainingBalance || 0),
        message: 'Notification de paiement déjà traitée',
      };
    }

    // 4. Calculate current verified balance from DB confirmed payments
    const confirmedPayments = order.payments.filter((p) => p.status === PaymentStatus.PAID);
    const currentPaidSum = confirmedPayments.reduce((acc, p) => acc + Number(p.amount), 0);
    const orderTotal = Math.round(Number(order.total));
    const currentRemainingBalance = Math.max(0, orderTotal - currentPaidSum);

    const isPaid = webhookResult.paymentStatus === PaymentStatus.PAID;
    const receivedAmount = webhookResult.amount ? Math.round(Number(webhookResult.amount)) : currentRemainingBalance;

    // Check for anomalies if payment is claimed to be paid
    if (isPaid && (receivedAmount <= 0 || receivedAmount > currentRemainingBalance + 1)) {
      logger.error(
        `[PaymentService] [ANOMALY] Webhook amount mismatch for order ${order.orderNumber}: Received ${receivedAmount} XOF, Remaining ${currentRemainingBalance} XOF`
      );

      await prisma.$transaction(async (tx) => {
        await tx.payment.create({
          data: {
            orderId: order.id,
            provider: method,
            amount: new Prisma.Decimal(receivedAmount),
            status: PaymentStatus.REVIEW_REQUIRED,
            transactionId: txId || `review_${Date.now()}`,
            metadata: {
              ...webhookResult.metadata,
              anomaly: 'AMOUNT_EXCEEDS_REMAINING_BALANCE',
              receivedAmount,
              currentRemainingBalance,
              orderTotal,
              webhookProcessedAt: new Date().toISOString(),
            } as Prisma.InputJsonValue,
          },
        });

        await tx.order.update({
          where: { id: order.id },
          data: { paymentStatus: PaymentStatus.REVIEW_REQUIRED },
        });

        await tx.auditLog.create({
          data: {
            action: 'PAYMENT_ANOMALY_REVIEW_REQUIRED',
            entity: 'ORDER',
            entityId: order.id,
            details: {
              orderNumber: order.orderNumber,
              method,
              receivedAmount,
              currentRemainingBalance,
              orderTotal,
            } as Prisma.InputJsonValue,
          },
        });
      });

      return {
        success: false,
        reviewRequired: true,
        orderNumber: order.orderNumber,
        paymentStatus: PaymentStatus.REVIEW_REQUIRED,
        message: 'Montant reçu incohérent avec le solde restant. Vérification requise.',
      };
    }

    // 5. Atomic transaction update
    let finalPaymentStatus = webhookResult.paymentStatus;
    let newPaidAmount = currentPaidSum;
    let newRemainingBalance = currentRemainingBalance;

    if (isPaid) {
      newPaidAmount = currentPaidSum + receivedAmount;
      newRemainingBalance = Math.max(0, orderTotal - newPaidAmount);
      finalPaymentStatus = newRemainingBalance === 0 ? PaymentStatus.PAID : PaymentStatus.PARTIALLY_PAID;
    }

    await prisma.$transaction(async (tx) => {
      // Find matching pending payment or create new record
      const existingPending = order.payments.find(
        (p) => (txId && p.transactionId === txId) || p.status === PaymentStatus.PENDING
      );

      if (existingPending && existingPending.status !== PaymentStatus.PAID) {
        await tx.payment.update({
          where: { id: existingPending.id },
          data: {
            status: webhookResult.paymentStatus,
            transactionId: txId || existingPending.transactionId,
            amount: isPaid ? new Prisma.Decimal(receivedAmount) : existingPending.amount,
            metadata: {
              ...((existingPending.metadata as Record<string, unknown>) || {}),
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
            amount: new Prisma.Decimal(receivedAmount),
            status: webhookResult.paymentStatus,
            transactionId: txId || `tx_${Date.now()}`,
            metadata: {
              ...webhookResult.metadata,
              webhookProcessedAt: new Date().toISOString(),
            } as Prisma.InputJsonValue,
          },
        });
      }

      // Update Order Status and Balances
      const newOrderStatus =
        finalPaymentStatus === PaymentStatus.PAID && order.status === OrderStatus.NEW
          ? OrderStatus.CONFIRMED
          : order.status;

      await tx.order.update({
        where: { id: order.id },
        data: {
          amountPaid: new Prisma.Decimal(newPaidAmount),
          remainingBalance: new Prisma.Decimal(newRemainingBalance),
          paymentStatus: finalPaymentStatus,
          status: newOrderStatus,
        },
      });

      // Audit log
      if (isPaid) {
        await tx.auditLog.create({
          data: {
            action: finalPaymentStatus === PaymentStatus.PAID ? 'PAYMENT_CONFIRMED' : 'PARTIAL_PAYMENT_CONFIRMED',
            entity: 'ORDER',
            entityId: order.id,
            details: {
              orderNumber: order.orderNumber,
              method,
              amountReceived: receivedAmount,
              totalPaid: newPaidAmount,
              remainingBalance: newRemainingBalance,
              transactionId: txId,
              confirmedVia: 'WEBHOOK',
            } as Prisma.InputJsonValue,
          },
        });
      }
    });

    logger.info(
      `[PaymentService] Successfully processed webhook for order ${order.orderNumber} -> ${finalPaymentStatus} (paid: ${newPaidAmount} / ${orderTotal})`
    );

    return {
      success: true,
      orderNumber: order.orderNumber,
      orderId: order.id,
      paymentStatus: finalPaymentStatus,
      amountPaid: newPaidAmount,
      remainingBalance: newRemainingBalance,
      transactionId: txId,
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
    const confirmedPayments = order.payments.filter((p) => p.status === PaymentStatus.PAID);
    const calculatedPaidSum = confirmedPayments.reduce((acc, p) => acc + Number(p.amount), 0);
    const orderTotal = Math.round(Number(order.total));
    const calculatedRemaining = Math.max(0, orderTotal - calculatedPaidSum);

    const isPaid = order.paymentStatus === PaymentStatus.PAID || calculatedRemaining === 0;
    const isPartiallyPaid = order.paymentStatus === PaymentStatus.PARTIALLY_PAID || (calculatedPaidSum > 0 && calculatedRemaining > 0);
    const isReviewRequired = order.paymentStatus === PaymentStatus.REVIEW_REQUIRED;

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      orderStatus: order.status,
      total: orderTotal,
      subtotal: Math.round(Number(order.subtotal)),
      deliveryFee: Math.round(Number(order.deliveryFee)),
      amountPaid: calculatedPaidSum,
      remainingBalance: calculatedRemaining,
      transactionId: latestPayment?.transactionId,
      updatedAt: latestPayment?.updatedAt || order.updatedAt,
      isPaid,
      isPartiallyPaid,
      isReviewRequired,
      payments: order.payments.map((p) => ({
        id: p.id,
        provider: p.provider,
        transactionId: p.transactionId,
        amount: Math.round(Number(p.amount)),
        status: p.status,
        createdAt: p.createdAt,
      })),
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

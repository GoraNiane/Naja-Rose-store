import { Request, Response, NextFunction } from 'express';
import { PaymentMethod, PaymentStatus } from '@prisma/client';
import { paymentService } from '../services/payment.service.js';
import { paytechService } from '../services/paytech.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import { logger } from '../utils/logger.js';

export class PaymentController {
  /**
   * POST /api/payments/initiate
   * Initializes a payment session for an order
   */
  static async initiate(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderId, orderNumber, paymentMethod, successUrl, cancelUrl } = req.body;
      const ref = orderId || orderNumber;
      if (!ref) {
        throw ApiError.badRequest('orderId ou orderNumber requis');
      }

      const result = await paymentService.initiatePayment(ref, {
        paymentMethod,
        successUrl,
        cancelUrl,
      });

      return ApiResponse.success(res, result, 'Session de paiement initialisée avec succès');
    } catch (error) {
      return next(error);
    }
  }

  /**
   * GET /api/payments/:orderId/status
   * Checks verified status of a payment
   */
  static async getStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const orderId = String(req.params.orderId);
      const status = await paymentService.getPaymentStatus(orderId);
      return ApiResponse.success(res, status, 'Statut du paiement récupéré');
    } catch (error) {
      return next(error);
    }
  }

  /**
   * POST /api/payments/wave/webhook
   * Official Wave Senegal Webhook endpoint
   */
  static async handleWaveWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      logger.info('[Wave Webhook Endpoint] Received webhook notification');
      const rawBody = (req as any).rawBody;

      const result = await paymentService.processWebhook(
        PaymentMethod.WAVE,
        req.body,
        req.headers,
        rawBody
      );

      // Providers expect HTTP 200 to acknowledge delivery
      return res.status(200).json({
        success: true,
        message: 'Wave webhook received and processed',
        data: result,
      });
    } catch (error) {
      logger.error('[Wave Webhook Endpoint] Webhook processing failed:', error);
      // In case of signature failure, return 401/400
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message,
        });
      }
      return next(error);
    }
  }

  /**
   * POST /api/payments/orange-money/webhook
   * Official Orange Money WebPay Webhook endpoint
   */
  static async handleOrangeMoneyWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      logger.info('[Orange Money Webhook Endpoint] Received WebPay notification');

      const result = await paymentService.processWebhook(
        PaymentMethod.ORANGE_MONEY,
        req.body,
        req.headers
      );

      return res.status(200).json({
        success: true,
        message: 'Orange Money notification received and processed',
        data: result,
      });
    } catch (error) {
      logger.error('[Orange Money Webhook Endpoint] Webhook processing failed:', error);
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message,
        });
      }
      return next(error);
    }
  }

  /**
   * POST /api/payments/paytech/ipn (and /webhook)
   * Official PayTech Senegal IPN Callback endpoint
   */
  static async handlePayTechIPN(req: Request, res: Response, next: NextFunction) {
    try {
      logger.info('[PayTech IPN Endpoint] Received notification from PayTech gateway');
      const payload = req.body;

      const result = await paytechService.handleIpnNotification(payload);

      return res.status(200).json({
        success: 1,
        message: 'PayTech IPN processed successfully',
        data: result,
      });
    } catch (error) {
      logger.error('[PayTech IPN Endpoint] Failed processing PayTech IPN:', error);
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json({
          success: 0,
          error: error.message,
        });
      }
      return next(error);
    }
  }

  /**
   * POST /api/payments/sandbox/simulate
   * Sandbox simulation trigger for development & automated verification
   */
  static async simulateSandbox(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderNumber, orderId, status } = req.body;
      const ref = orderNumber || orderId;

      if (!ref) {
        throw ApiError.badRequest('orderNumber ou orderId requis pour simulation');
      }

      const targetStatus: PaymentStatus =
        status === 'FAILED' ? PaymentStatus.FAILED : PaymentStatus.PAID;

      const result = await paymentService.simulateSandboxPayment(ref, targetStatus);
      return ApiResponse.success(
        res,
        result,
        `Simulation sandbox exécutée avec succès (${targetStatus})`
      );
    } catch (error) {
      return next(error);
    }
  }
}

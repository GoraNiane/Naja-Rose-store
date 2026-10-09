import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller.js';

const router = Router();

// Payment initiation and status check
router.post('/initiate', PaymentController.initiate);
router.get('/:orderId/status', PaymentController.getStatus);
router.get('/status/:orderId', PaymentController.getStatus);

// Server-to-server Webhook & IPN callbacks (Public endpoints invoked by payment gateways)
router.post('/paytech/ipn', PaymentController.handlePayTechIPN);
router.post('/paytech/webhook', PaymentController.handlePayTechIPN);
router.post('/wave/webhook', PaymentController.handleWaveWebhook);
router.post('/orange-money/webhook', PaymentController.handleOrangeMoneyWebhook);

// Sandbox simulation endpoint (Development/Testing only)
router.post('/sandbox/simulate', PaymentController.simulateSandbox);

export default router;

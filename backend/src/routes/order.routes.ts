import { Router } from 'express';
import { OrderController } from '../controllers/order.controller.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { createOrderSchema } from '../validators/order.validator.js';

const router = Router();

// Public checkout & tracking routes
router.post('/', validateRequest(createOrderSchema), OrderController.create);
router.get('/:id', OrderController.getById);
router.get('/number/:orderNumber', OrderController.getByOrderNumber);
router.get('/:id/invoice', OrderController.downloadInvoice);

export default router;

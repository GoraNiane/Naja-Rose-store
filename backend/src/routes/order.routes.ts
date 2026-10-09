import { Router } from 'express';
import { OrderController } from '../controllers/order.controller.js';
import { InvoiceController } from '../controllers/invoice.controller.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { createOrderSchema } from '../validators/order.validator.js';

const router = Router();

// Public checkout & tracking routes
router.post('/', validateRequest(createOrderSchema), OrderController.create);
router.get('/number/:orderNumber/invoice/pdf', InvoiceController.downloadPdfByOrderNumber);
router.get('/number/:orderNumber/invoice', InvoiceController.getByOrderNumber);
router.get('/number/:orderNumber', OrderController.getByOrderNumber);
router.get('/:id/invoice/pdf', InvoiceController.downloadPdfByOrderNumber);
router.get('/:id/invoice', InvoiceController.getByOrderNumber);
router.get('/:id', OrderController.getById);

export default router;

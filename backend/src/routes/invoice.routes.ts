import { Router } from 'express';
import { InvoiceController } from '../controllers/invoice.controller.js';

const router = Router();

// Public / customer invoice retrieval & PDF download by invoice number
router.get('/:invoiceNumber/pdf', InvoiceController.downloadPdfByInvoiceNumber);
router.get('/:invoiceNumber', InvoiceController.getByInvoiceNumber);

export default router;

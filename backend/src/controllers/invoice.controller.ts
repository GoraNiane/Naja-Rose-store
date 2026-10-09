import { Request, Response, NextFunction } from 'express';
import { invoiceService } from '../services/invoice.service.js';
import { orderService } from '../services/order.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import { PaymentStatus } from '@prisma/client';

export class InvoiceController {
  /**
   * GET /api/invoices/:invoiceNumber
   * Retrieves an invoice and its associated order details by invoice number
   */
  static async getByInvoiceNumber(req: Request, res: Response, next: NextFunction) {
    try {
      const invoiceNumber = String(req.params.invoiceNumber);
      const invoice = await invoiceService.getByInvoiceNumber(invoiceNumber);
      return ApiResponse.success(res, invoice, 'Facture récupérée avec succès');
    } catch (error) {
      return next(error);
    }
  }

  /**
   * GET /api/invoices/:invoiceNumber/pdf
   * Downloads invoice PDF by invoice number
   */
  static async downloadPdfByInvoiceNumber(req: Request, res: Response, next: NextFunction) {
    try {
      const invoiceNumber = String(req.params.invoiceNumber);
      const invoice = await invoiceService.getByInvoiceNumber(invoiceNumber);

      const pdfBuffer = await invoiceService.generatePdfBuffer(invoice.order as any);
      const filename = `facture-${invoice.invoiceNumber}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(pdfBuffer);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * GET /api/orders/:orderNumber/invoice
   * Retrieves the invoice associated with a specific order
   */
  static async getByOrderNumber(req: Request, res: Response, next: NextFunction) {
    try {
      const orderNumber = String(req.params.orderNumber || req.params.id);
      let order = await orderService.getByOrderNumber(orderNumber).catch(() => null);
      if (!order) {
        order = await orderService.getById(orderNumber);
      }

      return ApiResponse.success(
        res,
        {
          invoice: order.invoice,
          order,
        },
        'Facture de commande récupérée avec succès'
      );
    } catch (error) {
      return next(error);
    }
  }

  /**
   * GET /api/orders/:orderNumber/invoice/pdf
   * Downloads invoice PDF by order number
   */
  static async downloadPdfByOrderNumber(req: Request, res: Response, next: NextFunction) {
    try {
      const orderNumber = String(req.params.orderNumber || req.params.id);
      let order = await orderService.getByOrderNumber(orderNumber).catch(() => null);
      if (!order) {
        order = await orderService.getById(orderNumber);
      }

      const pdfBuffer = await invoiceService.generatePdfBuffer(order as any);
      const filename = `facture-${order.invoice?.invoiceNumber || order.orderNumber}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(pdfBuffer);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * GET /api/admin/invoices
   * Admin paginated invoices list with search & filters
   */
  static async adminList(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const search = req.query.search as string | undefined;
      const paymentStatus = req.query.paymentStatus as PaymentStatus | undefined;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const result = await invoiceService.list({
        page,
        limit,
        search,
        paymentStatus,
        startDate,
        endDate,
      });

      return ApiResponse.success(res, result.items, 'Factures récupérées', 200, {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      });
    } catch (error) {
      return next(error);
    }
  }
}

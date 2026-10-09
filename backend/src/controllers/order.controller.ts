import { Request, Response, NextFunction } from 'express';
import { orderService } from '../services/order.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { invoiceService } from '../services/invoice.service.js';

export class OrderController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await orderService.create(req.body);

      // Order & Invoice created in Neon PostgreSQL, pending payment review by client
      return ApiResponse.created(
        res,
        {
          order,
          invoice: order.invoice,
        },
        'Commande enregistrée avec succès. Facture émise en attente de paiement.'
      );
    } catch (error) {
      return next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const order = await orderService.getById(id);
      return ApiResponse.success(res, order);
    } catch (error) {
      return next(error);
    }
  }

  static async getByOrderNumber(req: Request, res: Response, next: NextFunction) {
    try {
      const orderNumber = String(req.params.orderNumber);
      const order = await orderService.getByOrderNumber(orderNumber);
      return ApiResponse.success(res, order);
    } catch (error) {
      return next(error);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const status = req.query.status as any;
      const customerId = req.query.customerId as string;

      const result = await orderService.list({ page, limit, status, customerId });
      return ApiResponse.success(res, result.items, 'Commandes récupérées', 200, {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const order = await orderService.updateStatus(id, req.body);
      return ApiResponse.success(res, order, 'Statut de commande mis à jour');
    } catch (error) {
      return next(error);
    }
  }

  static async downloadInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const idOrNumber = String(req.params.id || req.params.orderNumber);
      let order = await orderService.getById(idOrNumber).catch(() => null);
      if (!order) {
        order = await orderService.getByOrderNumber(idOrNumber);
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
}

import { Request, Response, NextFunction } from 'express';
import { analyticsService, AnalyticsPeriod } from '../services/analytics.service.js';
import { ApiResponse } from '../utils/apiResponse.js';

export class AnalyticsController {
  static async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const period = (req.query.period as AnalyticsPeriod) || '30days';
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;

      const data = await analyticsService.getDashboardData(period, startDate, endDate);
      return ApiResponse.success(res, data, 'Données analytiques récupérées avec succès');
    } catch (error) {
      return next(error);
    }
  }

  static async getSalesLog(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const period = req.query.period as AnalyticsPeriod;
      const paymentMethod = req.query.paymentMethod as string;
      const status = req.query.status as any;
      const search = req.query.search as string;

      const result = await analyticsService.getSalesLog({
        page,
        limit,
        period,
        paymentMethod,
        status,
        search,
      });

      return ApiResponse.success(res, result.items, 'Historique des ventes', 200, {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        summary: result.summary,
      });
    } catch (error) {
      return next(error);
    }
  }

  static async getCustomerInsights(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const search = req.query.search as string;

      const result = await analyticsService.getCustomerInsights({ page, limit, search });
      return ApiResponse.success(res, result.items, 'Statistiques clients', 200, {
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

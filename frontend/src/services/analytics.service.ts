import api from './api';

export interface DashboardKPI {
  caToday: number;
  caThisWeek: number;
  caThisMonth: number;
  periodRevenue: number;
  totalOrdersCount: number;
  pendingCount: number;
  confirmedCount: number;
  deliveredCount: number;
  cancelledCount: number;
  averageOrderValue: number;
  totalUnitsSold: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export interface ChartDailySales {
  date: string;
  revenue: number;
  orders: number;
}

export interface TopProductSales {
  productId: string;
  productName: string;
  slug: string;
  imageUrl: string;
  quantitySold: number;
  revenueGenerated: number;
}

export interface DashboardResponse {
  kpi: DashboardKPI;
  chartDailySales: ChartDailySales[];
  paymentBreakdown: Record<string, { count: number; total: number }>;
  topSellingProducts: TopProductSales[];
  lowSellingProducts: TopProductSales[];
  lowStockVariants: any[];
  outOfStockVariants: any[];
  recentOrders: any[];
  period: string;
  startDate: string;
  endDate: string;
}

export const analyticsService = {
  async getDashboard(period = '30days', startDate?: string, endDate?: string): Promise<DashboardResponse> {
    const res: any = await api.get('/admin/analytics/dashboard', {
      params: { period, startDate, endDate },
    });
    return res.data;
  },

  async getSalesLog(params?: {
    page?: number;
    limit?: number;
    period?: string;
    paymentMethod?: string;
    status?: string;
    search?: string;
  }) {
    const res: any = await api.get('/admin/analytics/sales', { params });
    return res;
  },

  async getCustomerInsights(params?: { page?: number; limit?: number; search?: string }) {
    const res: any = await api.get('/admin/analytics/customers', { params });
    return res;
  },
};

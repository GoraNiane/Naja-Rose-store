import { prisma } from '../config/prisma.js';
import { Prisma, OrderStatus } from '@prisma/client';

export type AnalyticsPeriod = 'today' | '7days' | '30days' | 'this_month' | 'last_month' | 'custom' | 'all';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export function getDateRange(
  period: AnalyticsPeriod = '30days',
  customStart?: string,
  customEnd?: string
): DateRange {
  const now = new Date();
  const endDate = customEnd ? new Date(customEnd) : new Date(now.setHours(23, 59, 59, 999));
  let startDate = new Date();

  switch (period) {
    case 'today':
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      break;
    case '7days':
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      break;
    case '30days':
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'this_month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'last_month':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      startDate.setHours(0, 0, 0, 0);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      lastMonthEnd.setHours(23, 59, 59, 999);
      return { startDate, endDate: lastMonthEnd };
    case 'custom':
      if (customStart) {
        startDate = new Date(customStart);
        startDate.setHours(0, 0, 0, 0);
      } else {
        startDate.setDate(startDate.getDate() - 30);
      }
      break;
    case 'all':
      startDate = new Date(2020, 0, 1);
      break;
    default:
      startDate.setDate(startDate.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
  }

  return { startDate, endDate };
}

export class AnalyticsService {
  async getDashboardData(
    period: AnalyticsPeriod = '30days',
    customStart?: string,
    customEnd?: string
  ) {
    const { startDate, endDate } = getDateRange(period, customStart, customEnd);

    // Period specific filter
    const periodWhere: Prisma.OrderWhereInput = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    // 1. Time-window revenues (Today, This Week, This Month)
    const now = new Date();

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfWeek = new Date();
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [
      ordersToday,
      ordersThisWeek,
      ordersThisMonth,
      periodOrders,
      lowStockVariants,
      outOfStockVariants,
      orderItemsInPeriod,
    ] = await Promise.all([
      // Today orders (excluding cancelled)
      prisma.order.findMany({
        where: {
          createdAt: { gte: startOfToday },
          status: { not: OrderStatus.CANCELLED },
        },
        select: { total: true },
      }),
      // This week orders
      prisma.order.findMany({
        where: {
          createdAt: { gte: startOfWeek },
          status: { not: OrderStatus.CANCELLED },
        },
        select: { total: true },
      }),
      // This month orders
      prisma.order.findMany({
        where: {
          createdAt: { gte: startOfMonth },
          status: { not: OrderStatus.CANCELLED },
        },
        select: { total: true },
      }),
      // Selected period all orders
      prisma.order.findMany({
        where: periodWhere,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: true,
          deliveryZone: true,
          items: true,
          payments: true,
        },
      }),
      // Low stock variants (1 to 5)
      prisma.productVariant.findMany({
        where: {
          stock: { gt: 0, lte: 5 },
          isActive: true,
        },
        include: {
          product: { select: { id: true, name: true, slug: true, price: true } },
          color: true,
          size: true,
        },
      }),
      // Out of stock variants (0)
      prisma.productVariant.findMany({
        where: {
          stock: 0,
          isActive: true,
        },
        include: {
          product: { select: { id: true, name: true, slug: true, price: true } },
          color: true,
          size: true,
        },
      }),
      // Order items in selected period for top products
      prisma.orderItem.findMany({
        where: {
          order: {
            createdAt: { gte: startDate, lte: endDate },
            status: { not: OrderStatus.CANCELLED },
          },
        },
        include: {
          product: {
            select: { id: true, name: true, slug: true, images: { take: 1 } },
          },
        },
      }),
    ]);

    // Financial KPI Sums
    const caToday = ordersToday.reduce((acc, o) => acc + Number(o.total), 0);
    const caThisWeek = ordersThisWeek.reduce((acc, o) => acc + Number(o.total), 0);
    const caThisMonth = ordersThisMonth.reduce((acc, o) => acc + Number(o.total), 0);

    // Period KPI counts
    const validPeriodOrders = periodOrders.filter((o) => o.status !== OrderStatus.CANCELLED);
    const periodRevenue = validPeriodOrders.reduce((acc, o) => acc + Number(o.total), 0);
    const totalOrdersCount = periodOrders.length;
    const pendingCount = periodOrders.filter((o) => o.status === OrderStatus.NEW).length;
    const confirmedCount = periodOrders.filter(
      (o) =>
        o.status === OrderStatus.CONFIRMED ||
        o.status === OrderStatus.PREPARING ||
        o.status === OrderStatus.SHIPPED
    ).length;
    const deliveredCount = periodOrders.filter((o) => o.status === OrderStatus.DELIVERED).length;
    const cancelledCount = periodOrders.filter((o) => o.status === OrderStatus.CANCELLED).length;

    const averageOrderValue =
      validPeriodOrders.length > 0 ? Math.round(periodRevenue / validPeriodOrders.length) : 0;

    const totalUnitsSold = orderItemsInPeriod.reduce((acc, item) => acc + item.quantity, 0);

    // 2. Chart: Daily Sales Aggregation
    const salesByDayMap = new Map<string, { date: string; revenue: number; orders: number }>();

    // Initialize all dates in range with 0
    const cur = new Date(startDate);
    while (cur <= endDate) {
      const dStr = cur.toISOString().slice(0, 10);
      salesByDayMap.set(dStr, { date: dStr, revenue: 0, orders: 0 });
      cur.setDate(cur.getDate() + 1);
    }

    periodOrders.forEach((order) => {
      const dStr = new Date(order.createdAt).toISOString().slice(0, 10);
      const entry = salesByDayMap.get(dStr);
      if (entry) {
        entry.orders += 1;
        if (order.status !== OrderStatus.CANCELLED) {
          entry.revenue += Number(order.total);
        }
      }
    });

    const chartDailySales = Array.from(salesByDayMap.values());

    // 3. Payment Method Breakdown
    const paymentMethodsMap: Record<string, { count: number; total: number }> = {
      WAVE: { count: 0, total: 0 },
      ORANGE_MONEY: { count: 0, total: 0 },
      CASH_ON_DELIVERY: { count: 0, total: 0 },
    };

    validPeriodOrders.forEach((o) => {
      const pm = o.paymentMethod || 'WAVE';
      if (!paymentMethodsMap[pm]) {
        paymentMethodsMap[pm] = { count: 0, total: 0 };
      }
      paymentMethodsMap[pm].count += 1;
      paymentMethodsMap[pm].total += Number(o.total);
    });

    // 4. Top Selling Products vs Low Selling
    const productSalesMap = new Map<
      string,
      {
        productId: string;
        productName: string;
        slug: string;
        imageUrl: string;
        quantitySold: number;
        revenueGenerated: number;
      }
    >();

    orderItemsInPeriod.forEach((item) => {
      const pId = item.productId || item.productName;
      const existing = productSalesMap.get(pId);
      const lineRev = Number(item.total);
      if (existing) {
        existing.quantitySold += item.quantity;
        existing.revenueGenerated += lineRev;
      } else {
        productSalesMap.set(pId, {
          productId: pId,
          productName: item.productName,
          slug: item.product?.slug || '',
          imageUrl: item.product?.images?.[0]?.url || '',
          quantitySold: item.quantity,
          revenueGenerated: lineRev,
        });
      }
    });

    const allProductSales = Array.from(productSalesMap.values());
    const topSellingProducts = [...allProductSales]
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 6);

    const lowSellingProducts = [...allProductSales]
      .sort((a, b) => a.quantitySold - b.quantitySold)
      .slice(0, 6);

    return {
      kpi: {
        caToday,
        caThisWeek,
        caThisMonth,
        periodRevenue,
        totalOrdersCount,
        pendingCount,
        confirmedCount,
        deliveredCount,
        cancelledCount,
        averageOrderValue,
        totalUnitsSold,
        lowStockCount: lowStockVariants.length,
        outOfStockCount: outOfStockVariants.length,
      },
      chartDailySales,
      paymentBreakdown: paymentMethodsMap,
      topSellingProducts,
      lowSellingProducts,
      lowStockVariants: lowStockVariants.slice(0, 8),
      outOfStockVariants: outOfStockVariants.slice(0, 8),
      recentOrders: periodOrders.slice(0, 8),
      period,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };
  }

  async getSalesLog(params: {
    page?: number;
    limit?: number;
    period?: AnalyticsPeriod;
    paymentMethod?: string;
    status?: OrderStatus;
    search?: string;
  }) {
    const { page = 1, limit = 20, period = '30days', paymentMethod, status, search } = params;
    const { startDate, endDate } = getDateRange(period);
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {
      createdAt: { gte: startDate, lte: endDate },
      ...(status ? { status } : {}),
      ...(paymentMethod ? { paymentMethod: paymentMethod as any } : {}),
      ...(search
        ? {
            OR: [
              { orderNumber: { contains: search, mode: 'insensitive' } },
              { customer: { firstName: { contains: search, mode: 'insensitive' } } },
              { customer: { lastName: { contains: search, mode: 'insensitive' } } },
              { phone: { contains: search } },
            ],
          }
        : {}),
    };

    const [orders, total, totalRevenueAgg] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: true,
          deliveryZone: true,
          items: true,
          payments: true,
          invoice: true,
        },
      }),
      prisma.order.count({ where }),
      prisma.order.aggregate({
        where: {
          ...where,
          status: { not: OrderStatus.CANCELLED },
        },
        _sum: {
          total: true,
          subtotal: true,
          deliveryFee: true,
        },
      }),
    ]);

    return {
      items: orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      summary: {
        totalRevenue: Number(totalRevenueAgg._sum.total || 0),
        totalSubtotal: Number(totalRevenueAgg._sum.subtotal || 0),
        totalDeliveryFees: Number(totalRevenueAgg._sum.deliveryFee || 0),
      },
    };
  }

  async getCustomerInsights(params: { page?: number; limit?: number; search?: string }) {
    const { page = 1, limit = 20, search } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.CustomerWhereInput = search
      ? {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search } },
          ],
        }
      : {};

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          orders: {
            where: { status: { not: OrderStatus.CANCELLED } },
            select: { total: true, createdAt: true, status: true },
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
      prisma.customer.count({ where }),
    ]);

    const enrichedCustomers = customers.map((c) => {
      const totalSpent = c.orders.reduce((acc, o) => acc + Number(o.total), 0);
      const ordersCount = c.orders.length;
      const lastOrder = c.orders[0]?.createdAt || null;
      const averageBasket = ordersCount > 0 ? Math.round(totalSpent / ordersCount) : 0;

      return {
        id: c.id,
        firstName: c.firstName,
        lastName: c.lastName,
        fullName: `${c.firstName} ${c.lastName}`,
        email: c.email,
        phone: c.phone,
        address: c.address,
        city: c.city || 'Dakar',
        createdAt: c.createdAt,
        ordersCount,
        totalSpent,
        averageBasket,
        lastOrderDate: lastOrder,
        isVip: totalSpent >= 150000,
      };
    });

    return {
      items: enrichedCustomers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

export const analyticsService = new AnalyticsService();

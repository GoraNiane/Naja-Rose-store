import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/apiResponse.js';
import { prisma } from '../config/prisma.js';

export class HealthController {
  static async check(_req: Request, res: Response, next: NextFunction) {
    try {
      // Test DB connection with a quick query
      await prisma.$queryRaw`SELECT 1`;
      return ApiResponse.success(res, {
        status: 'UP',
        database: 'Connected',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      }, 'Service healthy');
    } catch (error) {
      return ApiResponse.error(res, 'Database connection error', 503, {
        status: 'DEGRADED',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

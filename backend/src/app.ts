import express, { Express, Request } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFound.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { env } from './config/env.js';

export function createApp(): Express {
  const app = express();

  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // CORS configuration
  app.use(
    cors({
      origin: [env.APP_URL, 'http://localhost:5173', 'http://localhost:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'wave-signature', 'Wave-Signature', 'X-API-KEY'],
    })
  );

  // Request body parsing with raw body buffer capture for HMAC Webhook verification
  app.use(
    express.json({
      limit: '10mb',
      verify: (req: Request & { rawBody?: string }, _res, buf) => {
        req.rawBody = buf.toString('utf-8');
      },
    })
  );
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // HTTP Request Logging
  if (env.NODE_ENV !== 'test') {
    app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
  }

  // Root welcome
  app.get('/', (_req, res) => {
    res.json({
      name: 'Naja Store API',
      version: '1.0.0',
      market: 'Senegal (XOF / Wave / Orange Money / COD)',
      status: 'operational',
      documentation: '/api/v1/health',
    });
  });

  // API v1 Routes
  app.use('/api/v1', apiLimiter, routes);
  app.use('/api', apiLimiter, routes); // Alias for convenience

  // 404 & Global Error handlers
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

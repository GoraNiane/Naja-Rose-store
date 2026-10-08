import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDatabase, prisma } from './config/prisma.js';
import { logger } from './utils/logger.js';
import { authService } from './services/auth.service.js';

async function bootstrap() {
  const app = createApp();

  // Test Database Connection
  await connectDatabase();

  // Ensure default Admin user is provisioned
  await authService.ensureDefaultAdmin().catch((err) => {
    logger.warn('Could not auto-provision admin user:', err.message);
  });

  const server = app.listen(env.PORT, () => {
    logger.info(`🚀 Naja Store Backend Server running on http://localhost:${env.PORT}`);
    logger.info(`📡 API Health Check available at http://localhost:${env.PORT}/api/v1/health`);
    logger.info(`🌍 Environment: ${env.NODE_ENV}`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      logger.info('HTTP server closed.');
      await prisma.$disconnect();
      logger.info('Database connection closed.');
      process.exit(0);
    });

    // Force exit after 10s if hanging
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.error('Fatal bootstrap error:', err);
  process.exit(1);
});

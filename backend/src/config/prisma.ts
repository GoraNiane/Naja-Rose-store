import { PrismaClient } from '@prisma/client';
import { env } from './env.js';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

function getPrismaClient(): PrismaClient {
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }
  return global.prisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    const value = (client as any)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});

export async function connectDatabase() {
  try {
    const client = getPrismaClient();
    await client.$connect();
    console.log('✅ Connected to PostgreSQL database successfully via Prisma');
  } catch (error) {
    console.error('❌ Failed to connect to PostgreSQL database:', error);
  }
}

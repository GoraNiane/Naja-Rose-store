import { createApp } from '../backend/src/app.js';
import { connectDatabase } from '../backend/src/config/prisma.js';
import { authService } from '../backend/src/services/auth.service.js';

let isInitialized = false;
const app = createApp();

async function initialize() {
  if (!isInitialized) {
    try {
      await connectDatabase();
      await authService.ensureDefaultAdmin().catch((err) => {
        console.warn('Admin check warning:', err?.message || err);
      });
      isInitialized = true;
    } catch (error) {
      console.error('Database connection error in Vercel function:', error);
    }
  }
}

export default async function handler(req: any, res: any) {
  await initialize();
  return app(req, res);
}

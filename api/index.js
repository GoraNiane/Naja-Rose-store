let appInstance = null;
let isInitialized = false;

async function getApp() {
  if (!appInstance) {
    const { createApp } = require('../backend/dist/app.js');
    appInstance = createApp();
  }
  if (!isInitialized) {
    try {
      const { connectDatabase } = require('../backend/dist/config/prisma.js');
      const { authService } = require('../backend/dist/services/auth.service.js');
      await connectDatabase();
      await authService.ensureDefaultAdmin().catch((err) => {
        console.warn('Admin check warning:', err?.message || err);
      });
      isInitialized = true;
    } catch (error) {
      console.error('Database connection error in Vercel function:', error);
    }
  }
  return appInstance;
}

module.exports = async (req, res) => {
  const app = await getApp();
  return app(req, res);
};

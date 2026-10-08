const { createApp } = require('../backend/dist/app.js');
const { connectDatabase } = require('../backend/dist/config/prisma.js');
const { authService } = require('../backend/dist/services/auth.service.js');

let appInstance = null;
let isInitialized = false;

async function getApp() {
  if (!appInstance) {
    appInstance = createApp();
  }
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
  return appInstance;
}

module.exports = async (req, res) => {
  try {
    const app = await getApp();
    return app(req, res);
  } catch (error) {
    console.error('CRITICAL VERCEL HANDLER ERROR:', error);
    res.status(500).json({
      success: false,
      error: error?.message || String(error),
      details: 'Vercel Serverless Function encountered an error initializing backend',
    });
  }
};

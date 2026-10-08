let appInstance = null;

function getApp() {
  if (!appInstance) {
    const { createApp } = require('../backend/dist/app.js');
    appInstance = createApp();
  }
  return appInstance;
}

module.exports = async (req, res) => {
  try {
    const app = getApp();
    return app(req, res);
  } catch (error) {
    console.error('CRITICAL VERCEL HANDLER ERROR:', error);
    res.status(500).json({
      success: false,
      error: error?.message || String(error),
      details: 'Vercel Serverless Function encountered an error during request processing',
      stack: process.env.NODE_ENV === 'production' ? undefined : error?.stack,
    });
  }
};

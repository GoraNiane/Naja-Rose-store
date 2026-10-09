import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z
    .union([z.string(), z.number()])
    .default(5000)
    .transform((val) => (typeof val === 'string' ? parseInt(val, 10) || 5000 : val)),
  APP_URL: z.string().default('http://localhost:5173'),
  API_URL: z.string().default('/api/v1'),
  
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required'),
  
  JWT_SECRET: z
    .string()
    .min(16, 'JWT_SECRET must be at least 16 characters')
    .default('naja_store_senegal_secure_dev_jwt_secret_key_32_characters_long'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  
  WAVE_API_KEY: z.string().optional(),
  WAVE_SECRET: z.string().optional(),
  WAVE_BUSINESS_ID: z.string().optional(),
  WAVE_WEBHOOK_SECRET: z.string().optional(),
  
  ORANGE_MONEY_CLIENT_ID: z.string().optional(),
  ORANGE_MONEY_CLIENT_SECRET: z.string().optional(),
  ORANGE_MONEY_MERCHANT_KEY: z.string().optional(),
  ORANGE_MONEY_API_KEY: z.string().optional(),
  ORANGE_MONEY_API_URL: z.string().default('https://api.orange.com/orange-money-webpay/dev/v1'),

  // Official PayTech Senegal Gateway
  PAYTECH_API_KEY: z.string().optional(),
  PAYTECH_API_SECRET: z.string().optional(),
  PAYTECH_ENV: z.enum(['test', 'prod']).default('test'),
  PAYTECH_IPN_URL: z.string().optional(),
  PAYTECH_SUCCESS_URL: z.string().optional(),
  PAYTECH_CANCEL_URL: z.string().optional(),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables configuration:', parsedEnv.error.format());
  // In development, do not immediately exit if optional payment keys are missing, but log issues
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

export const env = parsedEnv.success ? parsedEnv.data : (process.env as unknown as z.infer<typeof envSchema>);

const { z } = require('zod');
require('dotenv').config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000'),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  PUSHER_APP_ID: z.string().optional(),
  PUSHER_KEY: z.string().optional(),
  PUSHER_SECRET: z.string().optional(),
  PUSHER_CLUSTER: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
});

const env = envSchema.safeParse(process.env);

if (!env.success) {
  console.error('❌ Invalid environment variables:', JSON.stringify(env.error.format(), null, 2));
  // Critical vars must be valid in every environment — fail fast rather than
  // silently running with a broken/insecure config.
  const criticalMissing = ['DATABASE_URL', 'JWT_SECRET'].some((f) => !process.env[f]);
  if (criticalMissing || process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
  console.warn('⚠️  Continuing in development with defaults applied for non-critical vars.');
}

// On success use the validated/defaulted data; otherwise (dev, non-critical
// issue only) apply sane defaults over the raw env rather than exporting it bare.
module.exports = env.success
  ? env.data
  : {
      NODE_ENV: process.env.NODE_ENV || 'development',
      PORT: process.env.PORT || '5000',
      JWT_ACCESS_EXPIRY: process.env.JWT_ACCESS_EXPIRY || '15m',
      JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || '7d',
      FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
      ...process.env,
    };

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

const CRITICAL_FIELDS = ['DATABASE_URL', 'JWT_SECRET'];

const parsed = envSchema.safeParse(process.env);

const resolve = () => {
  if (parsed.success) return parsed.data;

  console.error('❌ Invalid environment variables:', JSON.stringify(parsed.error.format(), null, 2));

  const brokenCritical = parsed.error.issues
    .map((issue) => issue.path[0])
    .filter((field) => CRITICAL_FIELDS.includes(field));

  if (brokenCritical.length > 0) {
    console.error(
      `❌ Cannot start: ${[...new Set(brokenCritical)].join(', ')} is missing or invalid. ` +
        'Copy .env.example to .env and set a DATABASE_URL and a JWT_SECRET of at least 32 characters.'
    );
    process.exit(1);
  }

  const cleaned = { ...process.env };
  parsed.error.issues.forEach((issue) => delete cleaned[issue.path[0]]);

  const reparsed = envSchema.safeParse(cleaned);
  if (!reparsed.success) process.exit(1);

  console.warn('⚠️  Falling back to schema defaults for the invalid optional variables above.');
  return reparsed.data;
};

module.exports = resolve();

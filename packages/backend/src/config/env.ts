import { z } from 'zod'

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  HOST: z.string().default('0.0.0.0'),

  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(20),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20).optional(),
  SUPABASE_JWT_SECRET: z.string().min(20).optional(),

  REDIS_URL: z.string().url().default('redis://127.0.0.1:6379'),

  CORS_ORIGINS: z
    .string()
    .default('http://localhost:3000')
    .transform((s) => s.split(',').map((x) => x.trim()).filter(Boolean)),

  PAYMENT_PROVIDER: z.enum(['mock', 'billplz']).default('mock'),
  BILLPLZ_API_KEY: z.string().optional(),
  BILLPLZ_COLLECTION_ID: z.string().optional(),
  BILLPLZ_XSIGN_SECRET: z.string().optional(),
  PAYMENT_WEBHOOK_BASE_URL: z.string().url().default('http://localhost:4000'),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
})

export type Env = z.infer<typeof schema>

export const env: Env = (() => {
  const parsed = schema.safeParse(process.env)
  if (!parsed.success) {
    console.error('[env] invalid environment:', parsed.error.flatten().fieldErrors)
    process.exit(1)
  }
  return parsed.data
})()

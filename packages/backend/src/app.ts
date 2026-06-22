import Fastify, { type FastifyInstance } from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import sensible from '@fastify/sensible'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import { jsonSchemaTransform, serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import { env } from './config/env.js'
import supabasePlugin from './plugins/supabase.js'
import redisPlugin from './plugins/redis.js'
import authPlugin from './plugins/auth.js'
import errorHandlerPlugin from './plugins/error-handler.js'
import { storyRoutes } from './modules/stories/routes.js'
import { chapterRoutes } from './modules/chapters/routes.js'
import { walletRoutes } from './modules/wallet/routes.js'
import { followRoutes } from './modules/follows/routes.js'
import { readsRoutes } from './modules/reads/routes.js'
import { subscriptionRoutes } from './modules/subscriptions/routes.js'
import { notificationRoutes } from './modules/notifications/routes.js'
import { reportRoutes } from './modules/reports/routes.js'
import { payoutRoutes } from './modules/payouts/routes.js'
import { adminRoutes } from './modules/admin/routes.js'
import { meRoutes } from './modules/me/routes.js'
import { libraryRoutes } from './modules/library/routes.js'
import { dashboardRoutes } from './modules/dashboard/routes.js'
import { uploadRoutes } from './modules/uploads/routes.js'

export const buildApp = async (): Promise<FastifyInstance> => {
  const isDev = env.NODE_ENV === 'development'

  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      redact: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.token'],
      ...(isDev
        ? {
            transport: {
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: 'HH:MM:ss.l',
                ignore: 'pid,hostname,req_id,reqId,req,res,responseTime',
                singleLine: true,
              },
            },
          }
        : {}),
    },
    requestIdLogLabel: 'req_id',
    disableRequestLogging: true,
  })

  // Single clean line per request: [API 200] [GET] /v1/health 2ms
  app.addHook('onResponse', async (req, reply) => {
    const status = reply.statusCode
    const method = req.method
    const url = req.url
    const ms = Math.round(reply.elapsedTime ?? 0)
    const tag = status >= 500 ? 'ERR' : status >= 400 ? 'WARN' : 'OK '
    const line = `[API ${tag} ${status}] [${method}] ${url} ${ms}ms`
    if (status >= 500) req.log.error(line)
    else if (status >= 400) req.log.warn(line)
    else req.log.info(line)
  })

  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)

  await app.register(sensible)
  await app.register(helmet, { contentSecurityPolicy: false })
  await app.register(cors, { origin: env.CORS_ORIGINS, credentials: true })
  await app.register(rateLimit, { max: 200, timeWindow: '1 minute' })

  await app.register(errorHandlerPlugin)
  await app.register(supabasePlugin)
  await app.register(redisPlugin)
  await app.register(authPlugin)

  await app.register(swagger, {
    openapi: {
      info: { title: 'Auror API', version: '0.0.0' },
      servers: [{ url: `http://localhost:${env.PORT}` }],
    },
    transform: jsonSchemaTransform,
  })
  await app.register(swaggerUi, { routePrefix: '/v1/docs' })

  app.get('/v1/health', { schema: { tags: ['system'] } }, async () => ({
    status: 'ok',
    env: env.NODE_ENV,
    time: new Date().toISOString(),
  }))

  app.get('/v1/ready', { schema: { tags: ['system'] } }, async (req, reply) => {
    const checks: Record<string, 'ok' | string> = {}
    try {
      const pong = await app.redis.ping()
      checks.redis = pong === 'PONG' ? 'ok' : `unexpected: ${pong}`
    } catch (err) {
      checks.redis = (err as Error).message
    }
    try {
      const { error } = await app.supabaseAnon.from('coin_config').select('id').limit(1)
      checks.supabase = error ? error.message : 'ok'
    } catch (err) {
      checks.supabase = (err as Error).message
    }
    const ok = Object.values(checks).every((v) => v === 'ok')
    return reply.code(ok ? 200 : 503).send({ ok, checks })
  })

  await app.register(storyRoutes)
  await app.register(chapterRoutes)
  await app.register(walletRoutes)
  await app.register(followRoutes)
  await app.register(readsRoutes)
  await app.register(subscriptionRoutes)
  await app.register(notificationRoutes)
  await app.register(reportRoutes)
  await app.register(payoutRoutes)
  await app.register(adminRoutes)
  await app.register(meRoutes)
  await app.register(libraryRoutes)
  await app.register(dashboardRoutes)
  await app.register(uploadRoutes)

  return app
}

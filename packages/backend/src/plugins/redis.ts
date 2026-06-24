import fp from 'fastify-plugin'
import Redis from 'ioredis'
import { env } from '../config/env.js'

declare module 'fastify' {
  interface FastifyInstance {
    redis: Redis
    /** Run `fn` under a Redis lock keyed by `key`. Throws if lock can't be acquired in `waitMs`. */
    withLock: <T>(key: string, ttlMs: number, fn: () => Promise<T>, waitMs?: number) => Promise<T>
  }
}

export default fp(async (app) => {
  const redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    lazyConnect: false,
    enableReadyCheck: true,
  })

  redis.on('error', (err) => {
    app.log.error({ err }, 'redis.error')
  })

  app.addHook('onClose', async () => {
    await redis.quit()
  })

  const withLock = async <T>(key: string, ttlMs: number, fn: () => Promise<T>, waitMs = 2000): Promise<T> => {
    const token = `${process.pid}:${Date.now()}:${Math.random()}`
    const start = Date.now()
    while (Date.now() - start < waitMs) {
      const ok = await redis.set(key, token, 'PX', ttlMs, 'NX')
      if (ok === 'OK') {
        try {
          return await fn()
        } finally {
          const lua = `if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end`
          await redis.eval(lua, 1, key, token).catch(() => 0)
        }
      }
      await new Promise((r) => setTimeout(r, 25))
    }
    throw new Error(`redis lock timeout: ${key}`)
  }

  app.decorate('redis', redis)
  app.decorate('withLock', withLock)
})

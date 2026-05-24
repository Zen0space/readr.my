import { buildApp } from './app.js'
import { env } from './config/env.js'
import { scheduleEarningsRefresh, startWorkers } from './jobs/earnings.js'

const main = async (): Promise<void> => {
  const app = await buildApp()

  const workers = startWorkers(app.log, app.supabaseAdmin)
  if (env.NODE_ENV !== 'test') {
    await scheduleEarningsRefresh().catch((err) => app.log.warn({ err }, 'earnings.schedule_failed'))
  }

  const shutdown = async (signal: string): Promise<void> => {
    app.log.info({ signal }, 'shutdown.start')
    await Promise.all(workers.map((w) => w.close()))
    await app.close()
    process.exit(0)
  }
  process.on('SIGINT', () => void shutdown('SIGINT'))
  process.on('SIGTERM', () => void shutdown('SIGTERM'))

  try {
    await app.listen({ port: env.PORT, host: env.HOST })
    app.log.info({ port: env.PORT, env: env.NODE_ENV }, 'server.ready')
  } catch (err) {
    app.log.error({ err }, 'server.listen_failed')
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('[server] fatal:', err)
  process.exit(1)
})

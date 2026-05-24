import { Queue, Worker, type ConnectionOptions } from 'bullmq'
import IORedis from 'ioredis'
import type { FastifyBaseLogger } from 'fastify'
import type { SupabaseClient } from '@supabase/supabase-js'
import { env } from '../config/env.js'

const connection: ConnectionOptions = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null })

export const earningsRefreshQueue = new Queue('earnings-refresh', { connection })

export const startWorkers = (log: FastifyBaseLogger, admin: SupabaseClient | null): Worker[] => {
  const earningsWorker = new Worker(
    'earnings-refresh',
    async () => {
      if (!admin) {
        log.warn('earnings-refresh: skipped (no service role configured)')
        return
      }
      const { error } = await admin.rpc('refresh_author_earnings_daily')
      if (error) {
        log.error({ err: error }, 'earnings-refresh: rpc failed')
        throw error
      }
      log.info('earnings-refresh: refreshed')
    },
    { connection },
  )

  earningsWorker.on('failed', (job, err) => {
    log.error({ jobId: job?.id, err }, 'earnings-refresh.failed')
  })

  return [earningsWorker]
}

// Schedule a repeating refresh every 5 minutes.
export const scheduleEarningsRefresh = async (): Promise<void> => {
  await earningsRefreshQueue.add(
    'refresh',
    {},
    { repeat: { every: 5 * 60 * 1000 }, removeOnComplete: 100, removeOnFail: 100 },
  )
}

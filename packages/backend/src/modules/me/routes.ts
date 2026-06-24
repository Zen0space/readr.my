import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { storyListResponse } from '../stories/schema.js'

export const meRoutes: FastifyPluginAsync = async (app) => {
  app.get('/v1/me', {
    preHandler: app.requireAuth,
    schema: {
      tags: ['me'],
      response: {
        200: z.object({
          id: z.string(),
          email: z.string().nullable(),
          role: z.enum(['reader', 'author', 'admin']),
          status: z.enum(['active', 'suspended']),
        }),
      },
    },
    handler: async (req) => {
      const u = req.user!
      return {
        id: u.id,
        email: u.email ?? null,
        role: u.role,
        status: u.status,
      }
    },
  })

  // Author library — own stories incl. drafts. RLS ensures only the caller's rows return,
  // but we also filter explicitly for clarity.
  app.get('/v1/me/stories', {
    preHandler: app.requireRole(['author', 'admin']),
    schema: {
      tags: ['me', 'stories'],
      querystring: z.object({
        status: z.enum(['draft', 'ongoing', 'completed']).optional(),
        limit: z.coerce.number().int().min(1).max(100).default(50),
      }),
      response: { 200: storyListResponse },
    },
    handler: async (req) => {
      const { status, limit } = req.query as { status?: string; limit: number }
      const db = app.supabaseForUser(req.headers.authorization!.slice(7))
      let query = db
        .from('stories')
        .select('*')
        .eq('author_id', req.user!.id)
        .order('updated_at', { ascending: false })
        .limit(limit)
      if (status) query = query.eq('status', status)
      const { data, error } = await query
      if (error) throw error
      return { items: data ?? [], next_cursor: null }
    },
  })

  // Author earnings — reads the per-author daily rollup MV. Aggregates client-side by period.
  app.get('/v1/me/earnings', {
    preHandler: app.requireRole(['author', 'admin']),
    schema: {
      tags: ['me'],
      querystring: z.object({
        period: z.enum(['day', 'week', 'month']).default('day'),
        days: z.coerce.number().int().min(1).max(365).default(90),
      }),
      response: {
        200: z.object({
          period: z.enum(['day', 'week', 'month']),
          coins_per_rm: z.number(),
          buckets: z.array(
            z.object({
              bucket: z.string(),
              source: z.enum(['coin', 'sub']),
              gross_coins: z.number(),
              author_cut_coins: z.number(),
              author_cut_rm_cents: z.number(),
            }),
          ),
        }),
      },
    },
    handler: async (req) => {
      const { period, days } = req.query as { period: 'day' | 'week' | 'month'; days: number }
      const db = app.supabaseForUser(req.headers.authorization!.slice(7))
      const since = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10)

      const [{ data: rows, error }, { data: cfg }] = await Promise.all([
        db
          .from('author_earnings_daily')
          .select('day, source, gross_coins, author_cut_coins, author_cut_rm_cents')
          .eq('author_id', req.user!.id)
          .gte('day', since)
          .order('day', { ascending: true }),
        db.from('coin_config').select('coins_per_rm').eq('id', 1).maybeSingle(),
      ])
      if (error) throw error
      const coinsPerRm = Number((cfg as { coins_per_rm?: number } | null)?.coins_per_rm ?? 10)

      const truncate = (iso: string): string => {
        if (period === 'day') return iso
        const d = new Date(iso + 'T00:00:00Z')
        if (period === 'month') return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-01`
        const dow = d.getUTCDay() || 7
        d.setUTCDate(d.getUTCDate() - (dow - 1))
        return d.toISOString().slice(0, 10)
      }

      const map = new Map<string, { bucket: string; source: 'coin' | 'sub'; gross_coins: number; author_cut_coins: number; author_cut_rm_cents: number }>()
      for (const r of (rows ?? []) as Array<{ day: string; source: 'coin' | 'sub'; gross_coins: number; author_cut_coins: number; author_cut_rm_cents: number }>) {
        const bucket = truncate(r.day)
        const key = `${bucket}|${r.source}`
        const existing = map.get(key)
        if (existing) {
          existing.gross_coins += Number(r.gross_coins)
          existing.author_cut_coins += Number(r.author_cut_coins)
          existing.author_cut_rm_cents += Number(r.author_cut_rm_cents)
        } else {
          map.set(key, {
            bucket,
            source: r.source,
            gross_coins: Number(r.gross_coins),
            author_cut_coins: Number(r.author_cut_coins),
            author_cut_rm_cents: Number(r.author_cut_rm_cents),
          })
        }
      }
      return {
        period,
        coins_per_rm: coinsPerRm,
        buckets: Array.from(map.values()).sort((a, b) => a.bucket.localeCompare(b.bucket)),
      }
    },
  })

}

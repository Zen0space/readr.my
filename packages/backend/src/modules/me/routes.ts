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
          username: z.string().nullable(),
          display_name: z.string().nullable(),
          avatar_url: z.string().nullable(),
          role: z.enum(['reader', 'author', 'admin']),
          status: z.enum(['active', 'suspended']),
          created_at: z.string().nullable(),
        }),
      },
    },
    handler: async (req) => {
      const u = req.user!
      // Pull profile fields (display_name, created_at) from the `users`
      // table — Supabase's auth schema doesn't expose them on the JWT,
      // but the public `users` row does. We act as the authenticated user
      // via their JWT so RLS applies normally; the
      // `users_select_authenticated` policy permits `select to authenticated`.
      //
      // `avatar_url` is intentionally NOT selected here: it lives in the
      // `avatars` storage bucket (see migration 0010) and isn't a column on
      // `public.users`. A future migration can add the column and a
      // trigger to keep it in sync with the storage object.
      const db = app.supabaseForUser(req.headers.authorization!.slice(7))
      const { data: profile, error } = await db
        .from('users')
        .select('display_name, created_at')
        .eq('id', u.id)
        .maybeSingle()
      if (error) throw error
      const row = profile as { display_name?: string | null; created_at?: string } | null
      const emailLocal = u.email?.split('@')[0] ?? null
      return {
        id: u.id,
        email: u.email ?? null,
        username: row?.display_name ?? emailLocal,
        display_name: row?.display_name ?? null,
        avatar_url: null,
        role: u.role,
        status: u.status,
        created_at: row?.created_at ?? null,
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

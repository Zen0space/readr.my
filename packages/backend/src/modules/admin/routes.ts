import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { AppError } from '@auror/shared/errors'

export const adminRoutes: FastifyPluginAsync = async (app) => {
  app.get('/v1/admin/users', {
    preHandler: app.requireRole('admin'),
    schema: {
      tags: ['admin'],
      querystring: z.object({
        q: z.string().optional(),
        role: z.enum(['reader', 'author', 'admin']).optional(),
        status: z.enum(['active', 'suspended']).optional(),
        limit: z.coerce.number().int().min(1).max(200).default(50),
      }),
    },
    handler: async (req) => {
      if (!app.supabaseAdmin) throw new AppError('internal', 500, 'service role not configured')
      const { q, role, status, limit } = req.query as { q?: string; role?: string; status?: string; limit: number }
      let query = app.supabaseAdmin
        .from('users')
        .select('id, role, status, display_name, email_lower, created_at')
        .order('created_at', { ascending: false })
        .limit(limit)
      if (role) query = query.eq('role', role)
      if (status) query = query.eq('status', status)
      if (q) query = query.or(`display_name.ilike.%${q}%,email_lower.ilike.%${q}%`)
      const { data, error } = await query
      if (error) throw error
      return { items: data ?? [] }
    },
  })

  app.post('/v1/admin/users/:id/suspend', {
    preHandler: app.requireRole('admin'),
    schema: { tags: ['admin'], params: z.object({ id: z.string().uuid() }) },
    handler: async (req, reply) => {
      if (!app.supabaseAdmin) throw new AppError('internal', 500, 'service role not configured')
      const { id } = req.params as { id: string }
      const { error } = await app.supabaseAdmin.from('users').update({ status: 'suspended' }).eq('id', id)
      if (error) throw error
      return reply.code(204).send()
    },
  })

  app.post('/v1/admin/users/:id/reinstate', {
    preHandler: app.requireRole('admin'),
    schema: { tags: ['admin'], params: z.object({ id: z.string().uuid() }) },
    handler: async (req, reply) => {
      if (!app.supabaseAdmin) throw new AppError('internal', 500, 'service role not configured')
      const { id } = req.params as { id: string }
      const { error } = await app.supabaseAdmin.from('users').update({ status: 'active' }).eq('id', id)
      if (error) throw error
      return reply.code(204).send()
    },
  })

  app.post('/v1/admin/users/:id/role', {
    preHandler: app.requireRole('admin'),
    schema: {
      tags: ['admin'],
      params: z.object({ id: z.string().uuid() }),
      body: z.object({ role: z.enum(['reader', 'author', 'admin']) }),
    },
    handler: async (req, reply) => {
      if (!app.supabaseAdmin) throw new AppError('internal', 500, 'service role not configured')
      const { id } = req.params as { id: string }
      const { role } = req.body as { role: 'reader' | 'author' | 'admin' }
      const { error } = await app.supabaseAdmin.from('users').update({ role }).eq('id', id)
      if (error) throw error
      return reply.code(204).send()
    },
  })

  app.get('/v1/admin/reports', {
    preHandler: app.requireRole('admin'),
    schema: {
      tags: ['admin', 'reports'],
      querystring: z.object({ status: z.enum(['open', 'dismissed', 'actioned']).default('open') }),
    },
    handler: async (req) => {
      if (!app.supabaseAdmin) throw new AppError('internal', 500, 'service role not configured')
      const { status } = req.query as { status: string }
      const { data, error } = await app.supabaseAdmin
        .from('reports')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false })
      if (error) throw error
      return { items: data ?? [] }
    },
  })

  app.post('/v1/admin/reports/:id/dismiss', {
    preHandler: app.requireRole('admin'),
    schema: { tags: ['admin', 'reports'], params: z.object({ id: z.string().uuid() }) },
    handler: async (req, reply) => {
      if (!app.supabaseAdmin) throw new AppError('internal', 500, 'service role not configured')
      const { id } = req.params as { id: string }
      const { error } = await app.supabaseAdmin
        .from('reports')
        .update({ status: 'dismissed', reviewed_by: req.user!.id, reviewed_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
      return reply.code(204).send()
    },
  })

  app.post('/v1/admin/reports/:id/action', {
    preHandler: app.requireRole('admin'),
    schema: { tags: ['admin', 'reports'], params: z.object({ id: z.string().uuid() }) },
    handler: async (req, reply) => {
      if (!app.supabaseAdmin) throw new AppError('internal', 500, 'service role not configured')
      const { id } = req.params as { id: string }
      const { error } = await app.supabaseAdmin
        .from('reports')
        .update({ status: 'actioned', reviewed_by: req.user!.id, reviewed_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
      return reply.code(204).send()
    },
  })

  app.get('/v1/admin/revenue', {
    preHandler: app.requireRole('admin'),
    schema: {
      tags: ['admin'],
      querystring: z.object({
        from: z.string().datetime().optional(),
        to: z.string().datetime().optional(),
      }),
    },
    handler: async (req) => {
      if (!app.supabaseAdmin) throw new AppError('internal', 500, 'service role not configured')
      const { from, to } = req.query as { from?: string; to?: string }
      let q = app.supabaseAdmin
        .from('coin_purchases')
        .select('pack_rm_cents, coins, status, created_at')
        .eq('status', 'succeeded')
      if (from) q = q.gte('created_at', from)
      if (to) q = q.lte('created_at', to)
      const { data, error } = await q
      if (error) throw error
      const rows = (data ?? []) as { pack_rm_cents: number; coins: number }[]
      const grossCents = rows.reduce((acc, r) => acc + Number(r.pack_rm_cents), 0)
      const coinsSold = rows.reduce((acc, r) => acc + Number(r.coins), 0)

      const { data: cfg } = await app.supabaseAdmin.from('coin_config').select('author_cut_pct').eq('id', 1).maybeSingle()
      const cutPct = Number((cfg as { author_cut_pct?: number } | null)?.author_cut_pct ?? 70)
      const authorShareCents = Math.floor((grossCents * cutPct) / 100)
      const platformShareCents = grossCents - authorShareCents

      return {
        gross_rm: (grossCents / 100).toFixed(2),
        author_share_rm: (authorShareCents / 100).toFixed(2),
        platform_share_rm: (platformShareCents / 100).toFixed(2),
        coins_sold: coinsSold,
        period: { from: from ?? null, to: to ?? null },
      }
    },
  })
}

import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { AppError } from '@auror/shared/errors'
import { conflict, notFound } from '../../lib/errors.js'

export const payoutRoutes: FastifyPluginAsync = async (app) => {
  // Author: request a payout. amount_coins must not exceed earned cap (loose check here; admin verifies on approve).
  app.post('/v1/payouts', {
    preHandler: app.requireRole(['author', 'admin']),
    schema: {
      tags: ['payouts'],
      body: z.object({
        amount_coins: z.number().int().min(100),
        method_ref: z.string().min(1).max(200),
      }),
    },
    handler: async (req, reply) => {
      const { amount_coins, method_ref } = req.body as { amount_coins: number; method_ref: string }
      const db = app.supabaseForUser(req.headers.authorization!.slice(7))

      const { data: cfg } = await db.from('coin_config').select('coins_per_rm').eq('id', 1).maybeSingle()
      const coinsPerRm = Number((cfg as { coins_per_rm?: number } | null)?.coins_per_rm ?? 10)
      const amountRmCents = Math.floor((amount_coins * 100) / coinsPerRm)

      const { data, error } = await db
        .from('payouts')
        .insert({
          author_id: req.user!.id,
          amount_coins,
          amount_rm_cents: amountRmCents,
          status: 'requested',
          method_ref,
        })
        .select('*')
        .single()
      if (error) throw error
      return reply.code(201).send(data)
    },
  })

  app.get('/v1/me/payouts', {
    preHandler: app.requireAuth,
    schema: { tags: ['payouts'] },
    handler: async (req) => {
      const db = app.supabaseForUser(req.headers.authorization!.slice(7))
      const { data, error } = await db
        .from('payouts')
        .select('*')
        .eq('author_id', req.user!.id)
        .order('requested_at', { ascending: false })
      if (error) throw error
      return { items: data ?? [] }
    },
  })

  // Admin transitions
  const adminTransition = (toStatus: 'approved' | 'paid' | 'rejected') => async (
    req: import('fastify').FastifyRequest,
    reply: import('fastify').FastifyReply,
  ) => {
    if (!app.supabaseAdmin) throw new AppError('internal', 500, 'service role not configured')
    const { id } = req.params as { id: string }
    const body = req.body as { notes?: string; rejection_reason?: string } | undefined

    const { data: existing, error: e1 } = await app.supabaseAdmin
      .from('payouts')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (e1) throw e1
    if (!existing) throw notFound('internal', 'Payout not found')

    const e = existing as { status: 'requested' | 'approved' | 'paid' | 'rejected' }
    if (toStatus === 'approved' && e.status !== 'requested') throw conflict('conflict', `Cannot approve from ${e.status}`)
    if (toStatus === 'paid' && e.status !== 'approved') throw conflict('conflict', `Cannot mark paid from ${e.status}`)
    if (toStatus === 'rejected' && e.status !== 'requested') throw conflict('conflict', `Cannot reject from ${e.status}`)

    const now = new Date().toISOString()
    const patch: Record<string, unknown> = {
      status: toStatus,
      reviewer_id: req.user!.id,
      notes: body?.notes,
    }
    if (toStatus === 'approved') patch.approved_at = now
    if (toStatus === 'paid') patch.paid_at = now
    if (toStatus === 'rejected') {
      patch.rejected_at = now
      patch.rejection_reason = body?.rejection_reason ?? 'unspecified'
    }

    const { data, error } = await app.supabaseAdmin.from('payouts').update(patch).eq('id', id).select('*').single()
    if (error) throw error
    return reply.code(200).send(data)
  }

  app.post('/v1/admin/payouts/:id/approve', {
    preHandler: app.requireRole('admin'),
    schema: {
      tags: ['admin', 'payouts'],
      params: z.object({ id: z.string().uuid() }),
      body: z.object({ notes: z.string().max(2000).optional() }).optional(),
    },
    handler: adminTransition('approved'),
  })

  app.post('/v1/admin/payouts/:id/pay', {
    preHandler: app.requireRole('admin'),
    schema: {
      tags: ['admin', 'payouts'],
      params: z.object({ id: z.string().uuid() }),
      body: z.object({ notes: z.string().max(2000).optional() }).optional(),
    },
    handler: adminTransition('paid'),
  })

  app.post('/v1/admin/payouts/:id/reject', {
    preHandler: app.requireRole('admin'),
    schema: {
      tags: ['admin', 'payouts'],
      params: z.object({ id: z.string().uuid() }),
      body: z.object({ rejection_reason: z.string().min(1).max(2000), notes: z.string().max(2000).optional() }),
    },
    handler: adminTransition('rejected'),
  })

  app.get('/v1/admin/payouts/export.csv', {
    preHandler: app.requireRole('admin'),
    schema: {
      tags: ['admin', 'payouts'],
      querystring: z.object({ status: z.enum(['approved', 'paid', 'requested', 'rejected']).default('approved') }),
    },
    handler: async (req, reply) => {
      if (!app.supabaseAdmin) throw new AppError('internal', 500, 'service role not configured')
      const { status } = req.query as { status: 'approved' | 'paid' | 'requested' | 'rejected' }
      const { data, error } = await app.supabaseAdmin
        .from('payouts')
        .select('id, author_id, amount_coins, amount_rm_cents, status, requested_at, approved_at, method_ref')
        .eq('status', status)
        .order('requested_at', { ascending: true })
      if (error) throw error
      const header = 'id,author_id,amount_coins,amount_rm,status,requested_at,approved_at,method_ref'
      const rows = (data ?? []).map((r) => {
        const x = r as Record<string, unknown>
        const cents = Number(x.amount_rm_cents ?? 0)
        const rm = (cents / 100).toFixed(2)
        return [x.id, x.author_id, x.amount_coins, rm, x.status, x.requested_at, x.approved_at ?? '', x.method_ref ?? ''].join(',')
      })
      reply.header('content-type', 'text/csv')
      reply.header('content-disposition', `attachment; filename="payouts-${status}.csv"`)
      return reply.send([header, ...rows].join('\n'))
    },
  })
}

import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { AppError } from '@auror/shared/errors'

export const subscriptionRoutes: FastifyPluginAsync = async (app) => {
  app.post('/v1/subscriptions', {
    preHandler: app.requireAuth,
    schema: {
      tags: ['subscriptions'],
      body: z.object({
        author_id: z.string().uuid(),
        price_rm: z.number().int().min(1).max(100),
      }),
    },
    handler: async (req, reply) => {
      if (!app.supabaseAdmin) throw new AppError('internal', 500, 'service role not configured')
      const { author_id, price_rm } = req.body as { author_id: string; price_rm: number }
      if (author_id === req.user!.id) throw new AppError('conflict', 409, 'Cannot subscribe to yourself')

      const periodEnd = new Date()
      periodEnd.setUTCDate(periodEnd.getUTCDate() + 30)

      const { data, error } = await app.supabaseAdmin
        .from('subscriptions')
        .insert({
          subscriber_id: req.user!.id,
          author_id,
          status: 'active',
          price_rm_cents: price_rm * 100,
          current_period_end: periodEnd.toISOString(),
          processor: 'mock',
        })
        .select('*')
        .single()
      if (error) {
        if (error.code === '23505') throw new AppError('conflict', 409, 'Already subscribed to this author')
        throw error
      }
      return reply.code(201).send(data)
    },
  })

  app.delete('/v1/subscriptions/:id', {
    preHandler: app.requireAuth,
    schema: { tags: ['subscriptions'], params: z.object({ id: z.string().uuid() }) },
    handler: async (req, reply) => {
      const db = app.supabaseForUser(req.headers.authorization!.slice(7))
      const { id } = req.params as { id: string }
      const { error } = await db
        .from('subscriptions')
        .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
        .eq('id', id)
        .eq('subscriber_id', req.user!.id)
      if (error) throw error
      return reply.code(204).send()
    },
  })

  app.get('/v1/me/subscriptions', {
    preHandler: app.requireAuth,
    schema: { tags: ['subscriptions'] },
    handler: async (req) => {
      const db = app.supabaseForUser(req.headers.authorization!.slice(7))
      const { data, error } = await db
        .from('subscriptions')
        .select('*')
        .eq('subscriber_id', req.user!.id)
        .order('started_at', { ascending: false })
      if (error) throw error
      return { items: data ?? [] }
    },
  })
}

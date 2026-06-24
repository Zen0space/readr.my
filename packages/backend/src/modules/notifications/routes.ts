import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'

export const notificationRoutes: FastifyPluginAsync = async (app) => {
  app.get('/v1/me/notifications', {
    preHandler: app.requireAuth,
    schema: {
      tags: ['notifications'],
      querystring: z.object({
        unread_only: z.coerce.boolean().default(false),
        limit: z.coerce.number().int().min(1).max(100).default(50),
      }),
    },
    handler: async (req) => {
      const { unread_only, limit } = req.query as { unread_only: boolean; limit: number }
      const db = app.supabaseForUser(req.headers.authorization!.slice(7))
      let q = db
        .from('notifications')
        .select('*')
        .eq('user_id', req.user!.id)
        .order('created_at', { ascending: false })
        .limit(limit)
      if (unread_only) q = q.is('read_at', null)
      const { data, error } = await q
      if (error) throw error
      return { items: data ?? [] }
    },
  })

  app.post('/v1/me/notifications/:id/read', {
    preHandler: app.requireAuth,
    schema: { tags: ['notifications'], params: z.object({ id: z.string().uuid() }) },
    handler: async (req, reply) => {
      const { id } = req.params as { id: string }
      const db = app.supabaseForUser(req.headers.authorization!.slice(7))
      const { error } = await db
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', req.user!.id)
      if (error) throw error
      return reply.code(204).send()
    },
  })

  app.post('/v1/me/notifications/read-all', {
    preHandler: app.requireAuth,
    schema: { tags: ['notifications'] },
    handler: async (req, reply) => {
      const db = app.supabaseForUser(req.headers.authorization!.slice(7))
      const { error } = await db
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', req.user!.id)
        .is('read_at', null)
      if (error) throw error
      return reply.code(204).send()
    },
  })
}

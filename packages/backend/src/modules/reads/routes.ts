import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'

export const readsRoutes: FastifyPluginAsync = async (app) => {
  app.put('/v1/chapters/:id/progress', {
    preHandler: app.requireAuth,
    schema: {
      tags: ['reads'],
      params: z.object({ id: z.string().uuid() }),
      body: z.object({ scroll_position: z.number().int().min(0) }),
    },
    handler: async (req, reply) => {
      const { id } = req.params as { id: string }
      const { scroll_position } = req.body as { scroll_position: number }
      const db = app.supabaseForUser(req.headers.authorization!.slice(7))
      const { error } = await db
        .from('reads')
        .upsert({
          user_id: req.user!.id,
          chapter_id: id,
          scroll_position,
          read_at: new Date().toISOString(),
        })
      if (error) throw error
      return reply.code(204).send()
    },
  })

  app.get('/v1/me/reads/recent', {
    preHandler: app.requireAuth,
    schema: {
      tags: ['reads'],
      querystring: z.object({ limit: z.coerce.number().int().min(1).max(50).default(20) }),
    },
    handler: async (req) => {
      const { limit } = req.query as { limit: number }
      const db = app.supabaseForUser(req.headers.authorization!.slice(7))
      const { data, error } = await db
        .from('reads')
        .select('chapter_id, scroll_position, read_at')
        .eq('user_id', req.user!.id)
        .order('read_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return { items: data ?? [] }
    },
  })
}

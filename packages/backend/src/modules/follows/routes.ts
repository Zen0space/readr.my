import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'

export const followRoutes: FastifyPluginAsync = async (app) => {
  app.post('/v1/authors/:authorId/follow', {
    preHandler: app.requireAuth,
    schema: {
      tags: ['follows'],
      params: z.object({ authorId: z.string().uuid() }),
    },
    handler: async (req, reply) => {
      const { authorId } = req.params as { authorId: string }
      const db = app.supabaseForUser(req.headers.authorization!.slice(7))
      const { error } = await db.from('follows').upsert({ follower_id: req.user!.id, author_id: authorId })
      if (error) throw error
      return reply.code(204).send()
    },
  })

  app.delete('/v1/authors/:authorId/follow', {
    preHandler: app.requireAuth,
    schema: {
      tags: ['follows'],
      params: z.object({ authorId: z.string().uuid() }),
    },
    handler: async (req, reply) => {
      const { authorId } = req.params as { authorId: string }
      const db = app.supabaseForUser(req.headers.authorization!.slice(7))
      const { error } = await db
        .from('follows')
        .delete()
        .eq('follower_id', req.user!.id)
        .eq('author_id', authorId)
      if (error) throw error
      return reply.code(204).send()
    },
  })

  app.get('/v1/me/follows', {
    preHandler: app.requireAuth,
    schema: { tags: ['follows'] },
    handler: async (req) => {
      const db = app.supabaseForUser(req.headers.authorization!.slice(7))
      const { data, error } = await db
        .from('follows')
        .select('author_id, created_at')
        .eq('follower_id', req.user!.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return { items: data ?? [] }
    },
  })
}

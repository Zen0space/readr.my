import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { AppError } from '@auror/shared/errors'

export const reportRoutes: FastifyPluginAsync = async (app) => {
  app.post('/v1/reports', {
    preHandler: app.requireAuth,
    schema: {
      tags: ['reports'],
      body: z.object({
        target_kind: z.enum(['story', 'chapter', 'user']),
        target_id: z.string().uuid(),
        reason: z.string().min(1).max(60),
        free_text: z.string().max(2000).optional(),
      }),
    },
    handler: async (req, reply) => {
      const db = app.supabaseForUser(req.headers.authorization!.slice(7))
      const { error } = await db.from('reports').insert({
        reporter_id: req.user!.id,
        ...(req.body as Record<string, unknown>),
      })
      if (error) throw error
      return reply.code(201).send({ ok: true })
    },
  })

  app.get('/v1/me/reports', {
    preHandler: app.requireAuth,
    schema: { tags: ['reports'] },
    handler: async (req) => {
      const db = app.supabaseForUser(req.headers.authorization!.slice(7))
      const { data, error } = await db
        .from('reports')
        .select('*')
        .eq('reporter_id', req.user!.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return { items: data ?? [] }
    },
  })
}

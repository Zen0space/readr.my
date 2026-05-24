import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'

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
}

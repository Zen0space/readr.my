import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import {
  browseQuery,
  storyCreateBody,
  storyListResponse,
  storyResponse,
  storyUpdateBody,
} from './schema.js'
import * as service from './service.js'

export const storyRoutes: FastifyPluginAsync = async (app) => {
  app.get('/v1/stories', {
    preHandler: app.optionalAuth,
    schema: {
      tags: ['stories'],
      querystring: browseQuery,
      response: { 200: storyListResponse },
    },
    handler: async (req) => {
      const q = browseQuery.parse(req.query)
      const db = req.user ? app.supabaseForUser(req.headers.authorization!.slice(7)) : app.supabaseAnon
      return service.browse(db, q)
    },
  })

  app.get('/v1/stories/:id', {
    preHandler: app.optionalAuth,
    schema: {
      tags: ['stories'],
      params: z.object({ id: z.string().uuid() }),
      response: { 200: storyResponse },
    },
    handler: async (req) => {
      const { id } = req.params as { id: string }
      const db = req.user ? app.supabaseForUser(req.headers.authorization!.slice(7)) : app.supabaseAnon
      return service.getById(db, id)
    },
  })

  app.post('/v1/stories', {
    preHandler: app.requireRole(['author', 'admin']),
    schema: {
      tags: ['stories'],
      body: storyCreateBody,
      response: { 201: storyResponse },
    },
    handler: async (req, reply) => {
      const body = storyCreateBody.parse(req.body)
      const db = app.supabaseForUser(req.headers.authorization!.slice(7))
      const story = await service.create(db, req.user!.id, body)
      return reply.code(201).send(story)
    },
  })

  app.patch('/v1/stories/:id', {
    preHandler: app.requireRole(['author', 'admin']),
    schema: {
      tags: ['stories'],
      params: z.object({ id: z.string().uuid() }),
      body: storyUpdateBody,
      response: { 200: storyResponse },
    },
    handler: async (req) => {
      const { id } = req.params as { id: string }
      const body = storyUpdateBody.parse(req.body)
      const db = app.supabaseForUser(req.headers.authorization!.slice(7))
      return service.update(db, req.user!.id, id, body)
    },
  })

  app.delete('/v1/stories/:id', {
    preHandler: app.requireRole(['author', 'admin']),
    schema: {
      tags: ['stories'],
      params: z.object({ id: z.string().uuid() }),
    },
    handler: async (req, reply) => {
      const { id } = req.params as { id: string }
      const db = app.supabaseForUser(req.headers.authorization!.slice(7))
      await service.remove(db, req.user!.id, id)
      return reply.code(204).send()
    },
  })

  app.post('/v1/stories/:id/publish', {
    preHandler: app.requireRole(['author', 'admin']),
    schema: {
      tags: ['stories'],
      params: z.object({ id: z.string().uuid() }),
      body: z.object({ status: z.enum(['ongoing', 'completed']).default('ongoing') }),
      response: { 200: storyResponse },
    },
    handler: async (req) => {
      const { id } = req.params as { id: string }
      const { status } = req.body as { status: 'ongoing' | 'completed' }
      const db = app.supabaseForUser(req.headers.authorization!.slice(7))
      return service.publish(db, req.user!.id, id, status)
    },
  })
}

import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import {
  chapterCreateBody,
  chapterListResponse,
  chapterResponse,
  chapterUpdateBody,
} from '../stories/schema.js'
import * as service from './service.js'
import type { ChapterRow } from './service.js'

const toResponse = (
  row: ChapterRow,
  opts: { reveal: boolean; locked: boolean },
): z.infer<typeof chapterResponse> => ({
  id: row.id,
  story_id: row.story_id,
  ord: row.ord,
  title: row.title,
  gating: row.gating,
  price_coins: row.price_coins,
  has_content: Boolean(row.content_md),
  locked: opts.locked,
  content_md: opts.reveal ? row.content_md : null,
  published_at: row.published_at,
  created_at: row.created_at,
  updated_at: row.updated_at,
})

export const chapterRoutes: FastifyPluginAsync = async (app) => {
  app.get('/v1/stories/:storyId/chapters', {
    preHandler: app.optionalAuth,
    schema: {
      tags: ['chapters'],
      params: z.object({ storyId: z.string().uuid() }),
      response: { 200: chapterListResponse },
    },
    handler: async (req) => {
      const { storyId } = req.params as { storyId: string }
      const db = req.user ? app.supabaseForUser(req.headers.authorization!.slice(7)) : app.supabaseAnon
      const rows = await service.listForStory(db, storyId)
      const items = rows.map((r) =>
        toResponse(r, { reveal: false, locked: r.gating !== 'free' }),
      )
      return { items }
    },
  })

  app.get('/v1/chapters/:id', {
    preHandler: app.optionalAuth,
    schema: {
      tags: ['chapters'],
      params: z.object({ id: z.string().uuid() }),
      response: { 200: chapterResponse },
    },
    handler: async (req) => {
      const { id } = req.params as { id: string }
      if (!app.supabaseAdmin) {
        // Without service role we can still serve free chapters via RLS.
        const db = req.user ? app.supabaseForUser(req.headers.authorization!.slice(7)) : app.supabaseAnon
        const row = await service.getMetadata(db, id)
        if (row.gating !== 'free') {
          return toResponse(row, { reveal: false, locked: true })
        }
        return toResponse(row, { reveal: true, locked: false })
      }
      const row = await service.readGated(app.supabaseAdmin, req.user?.id ?? null, id)
      return toResponse(row, { reveal: true, locked: false })
    },
  })

  app.post('/v1/stories/:storyId/chapters', {
    preHandler: app.requireRole(['author', 'admin']),
    schema: {
      tags: ['chapters'],
      params: z.object({ storyId: z.string().uuid() }),
      body: chapterCreateBody,
      response: { 201: chapterResponse },
    },
    handler: async (req, reply) => {
      const { storyId } = req.params as { storyId: string }
      const body = chapterCreateBody.parse(req.body)
      const db = app.supabaseForUser(req.headers.authorization!.slice(7))
      const row = await service.create(db, req.user!.id, storyId, body)
      return reply.code(201).send(toResponse(row, { reveal: true, locked: false }))
    },
  })

  app.patch('/v1/chapters/:id', {
    preHandler: app.requireRole(['author', 'admin']),
    schema: {
      tags: ['chapters'],
      params: z.object({ id: z.string().uuid() }),
      body: chapterUpdateBody,
      response: { 200: chapterResponse },
    },
    handler: async (req) => {
      const { id } = req.params as { id: string }
      const body = chapterUpdateBody.parse(req.body)
      const db = app.supabaseForUser(req.headers.authorization!.slice(7))
      const row = await service.update(db, req.user!.id, id, body)
      return toResponse(row, { reveal: true, locked: false })
    },
  })

  app.post('/v1/chapters/:id/publish', {
    preHandler: app.requireRole(['author', 'admin']),
    schema: {
      tags: ['chapters'],
      params: z.object({ id: z.string().uuid() }),
      response: { 200: chapterResponse },
    },
    handler: async (req) => {
      const { id } = req.params as { id: string }
      const db = app.supabaseForUser(req.headers.authorization!.slice(7))
      const row = await service.publish(db, req.user!.id, id)
      return toResponse(row, { reveal: true, locked: false })
    },
  })

  app.delete('/v1/chapters/:id', {
    preHandler: app.requireRole(['author', 'admin']),
    schema: {
      tags: ['chapters'],
      params: z.object({ id: z.string().uuid() }),
    },
    handler: async (req, reply) => {
      const { id } = req.params as { id: string }
      const db = app.supabaseForUser(req.headers.authorization!.slice(7))
      await service.remove(db, req.user!.id, id)
      return reply.code(204).send()
    },
  })

  app.post('/v1/chapters/:id/vote', {
    preHandler: app.requireAuth,
    schema: {
      tags: ['chapters'],
      params: z.object({ id: z.string().uuid() }),
    },
    handler: async (req, reply) => {
      const { id } = req.params as { id: string }
      const db = app.supabaseForUser(req.headers.authorization!.slice(7))
      const { error } = await db
        .from('chapter_votes')
        .upsert({ user_id: req.user!.id, chapter_id: id })
      if (error) throw error
      return reply.code(204).send()
    },
  })

  app.delete('/v1/chapters/:id/vote', {
    preHandler: app.requireAuth,
    schema: {
      tags: ['chapters'],
      params: z.object({ id: z.string().uuid() }),
    },
    handler: async (req, reply) => {
      const { id } = req.params as { id: string }
      const db = app.supabaseForUser(req.headers.authorization!.slice(7))
      const { error } = await db
        .from('chapter_votes')
        .delete()
        .eq('user_id', req.user!.id)
        .eq('chapter_id', id)
      if (error) throw error
      return reply.code(204).send()
    },
  })
}

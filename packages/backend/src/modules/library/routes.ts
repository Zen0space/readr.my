import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'

const addBody = z.object({
  story_id: z.string().uuid(),
})

const removeBody = z.object({
  story_id: z.string().uuid(),
})

const libraryItem = z.object({
  story_id: z.string().uuid(),
  added_at: z.string(),
  title: z.string(),
  blurb: z.string().nullable(),
  cover_url: z.string().nullable(),
  status: z.enum(['draft', 'ongoing', 'completed']),
  author_id: z.string().uuid(),
  author_pen_name: z.string().nullable(),
})

const listResponse = z.object({
  items: z.array(libraryItem),
})

const mutationResponse = z.object({
  ok: z.literal(true),
  story_id: z.string().uuid(),
})

type LibraryRow = {
  story_id: string
  added_at: string
}

type StoryRow = {
  id: string
  title: string
  blurb: string | null
  cover_url: string | null
  status: 'draft' | 'ongoing' | 'completed'
  author_id: string
}

type AuthorProfileRow = { user_id: string; pen_name: string }

export const libraryRoutes: FastifyPluginAsync = async (app) => {
  app.get('/v1/me/library', {
    preHandler: app.requireAuth,
    schema: {
      tags: ['library'],
    },
    handler: async (req) => {
      const db = app.supabaseForUser(req.headers.authorization!.slice(7))

      const { data: rows, error } = await db
        .from('library')
        .select('story_id, added_at')
        .eq('user_id', req.user!.id)
        .order('added_at', { ascending: false })
        .limit(200)
      if (error) throw error

      const items = (rows ?? []) as LibraryRow[]
      if (items.length === 0) return { items: [] }

      const storyIds = items.map((r) => r.story_id)
      const [{ data: stories }, { data: profiles }] = await Promise.all([
        db.from('stories').select('id, title, blurb, cover_url, status, author_id').in('id', storyIds),
        db.from('author_profiles').select('user_id, pen_name').in(
          'user_id',
          Array.from(new Set(items.map(() => ''))),
        ),
      ])

      // Look up the author_ids we actually need.
      const storyList = (stories ?? []) as StoryRow[]
      const authorIds = Array.from(new Set(storyList.map((s) => s.author_id)))
      const { data: authorProfiles } = authorIds.length
        ? await db.from('author_profiles').select('user_id, pen_name').in('user_id', authorIds)
        : { data: [] as AuthorProfileRow[] | null }

      const penNames = new Map<string, string>(
        ((authorProfiles ?? []) as AuthorProfileRow[]).map((p) => [p.user_id, p.pen_name]),
      )
      const storyById = new Map<string, StoryRow>(storyList.map((s) => [s.id, s]))

      const out = items.map((row) => {
        const story = storyById.get(row.story_id)
        return {
          story_id: row.story_id,
          added_at: row.added_at,
          title: story?.title ?? '',
          blurb: story?.blurb ?? null,
          cover_url: story?.cover_url ?? null,
          status: story?.status ?? ('draft' as const),
          author_id: story?.author_id ?? '',
          author_pen_name: story ? (penNames.get(story.author_id) ?? null) : null,
        }
      })
      return { items: out }
      void profiles
    },
  })

  app.post('/v1/me/library', {
    preHandler: app.requireAuth,
    schema: {
      tags: ['library'],
      body: addBody,
    },
    handler: async (req, reply) => {
      const { story_id } = req.body as z.infer<typeof addBody>
      const db = app.supabaseForUser(req.headers.authorization!.slice(7))
      const { error } = await db
        .from('library')
        .insert({ user_id: req.user!.id, story_id })
      if (error) {
        // Unique PK violation → already in library. Treat as success.
        if (error.code !== '23505') throw error
      }
      return reply.code(201).send({ ok: true as const, story_id })
    },
  })

  app.delete('/v1/me/library/:storyId', {
    preHandler: app.requireAuth,
    schema: {
      tags: ['library'],
      params: z.object({ storyId: z.string().uuid() }),
    },
    handler: async (req, reply) => {
      const { storyId } = req.params as { storyId: string }
      const db = app.supabaseForUser(req.headers.authorization!.slice(7))
      const { error } = await db
        .from('library')
        .delete()
        .eq('user_id', req.user!.id)
        .eq('story_id', storyId)
      if (error) throw error
      return reply.code(204).send()
    },
  })

  // Backwards-compat: the legacy BFF accepted DELETE /api/library with body
  // { writing_id }. Keep one foot in the door for the split cutover.
  app.delete('/v1/me/library', {
    preHandler: app.requireAuth,
    schema: {
      tags: ['library'],
      body: removeBody,
    },
    handler: async (req, reply) => {
      const { story_id } = req.body as z.infer<typeof removeBody>
      const db = app.supabaseForUser(req.headers.authorization!.slice(7))
      const { error } = await db
        .from('library')
        .delete()
        .eq('user_id', req.user!.id)
        .eq('story_id', story_id)
      if (error) throw error
      return reply.code(204).send()
    },
  })
}
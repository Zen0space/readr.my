import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'

const addBody = z.object({
  story_id: z.string().uuid(),
  notify_on_chapter: z.boolean().optional(),
})

const watchlistItem = z.object({
  story_id: z.string().uuid(),
  added_at: z.string(),
  notify_on_chapter: z.boolean(),
  title: z.string(),
  blurb: z.string().nullable(),
  cover_url: z.string().nullable(),
  status: z.enum(['draft', 'ongoing', 'completed']),
  author_id: z.string().uuid(),
  author_pen_name: z.string().nullable(),
})

const listResponse = z.object({
  items: z.array(watchlistItem),
})

const mutationResponse = z.object({
  ok: z.literal(true),
  story_id: z.string().uuid(),
})

type WatchlistRow = {
  story_id: string
  added_at: string
  notify_on_chapter: boolean
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

export const watchlistRoutes: FastifyPluginAsync = async (app) => {
  app.get('/v1/me/watchlist', {
    preHandler: app.requireAuth,
    schema: {
      tags: ['watchlist'],
    },
    handler: async (req) => {
      const db = app.supabaseForUser(req.headers.authorization!.slice(7))

      const { data: rows, error } = await db
        .from('watchlist')
        .select('story_id, added_at, notify_on_chapter')
        .eq('user_id', req.user!.id)
        .order('added_at', { ascending: false })
        .limit(200)
      if (error) throw error

      const items = (rows ?? []) as WatchlistRow[]
      if (items.length === 0) return { items: [] }

      const storyIds = items.map((r) => r.story_id)
      const { data: stories } = await db
        .from('stories')
        .select('id, title, blurb, cover_url, status, author_id')
        .in('id', storyIds)

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
          notify_on_chapter: row.notify_on_chapter,
          title: story?.title ?? '',
          blurb: story?.blurb ?? null,
          cover_url: story?.cover_url ?? null,
          status: story?.status ?? ('draft' as const),
          author_id: story?.author_id ?? '',
          author_pen_name: story ? (penNames.get(story.author_id) ?? null) : null,
        }
      })
      return { items: out }
    },
  })

  app.post('/v1/me/watchlist', {
    preHandler: app.requireAuth,
    schema: {
      tags: ['watchlist'],
      body: addBody,
    },
    handler: async (req, reply) => {
      const { story_id, notify_on_chapter } = req.body as z.infer<typeof addBody>
      const db = app.supabaseForUser(req.headers.authorization!.slice(7))
      const { error } = await db
        .from('watchlist')
        .upsert(
          {
            user_id: req.user!.id,
            story_id,
            notify_on_chapter: notify_on_chapter ?? true,
          },
          { onConflict: 'user_id,story_id' },
        )
      if (error) throw error
      return reply.code(201).send({ ok: true as const, story_id })
    },
  })

  app.delete('/v1/me/watchlist/:storyId', {
    preHandler: app.requireAuth,
    schema: {
      tags: ['watchlist'],
      params: z.object({ storyId: z.string().uuid() }),
    },
    handler: async (req, reply) => {
      const { storyId } = req.params as { storyId: string }
      const db = app.supabaseForUser(req.headers.authorization!.slice(7))
      const { error } = await db
        .from('watchlist')
        .delete()
        .eq('user_id', req.user!.id)
        .eq('story_id', storyId)
      if (error) throw error
      return reply.code(204).send()
    },
  })

  // Toggle notification opt-in for a single watchlist row. Does NOT
  // remove the row — the reader stays on the list, we just stop
  // generating chapter_published notifications for them.
  app.patch('/v1/me/watchlist/:storyId', {
    preHandler: app.requireAuth,
    schema: {
      tags: ['watchlist'],
      params: z.object({ storyId: z.string().uuid() }),
      body: z.object({ notify_on_chapter: z.boolean() }),
    },
    handler: async (req, reply) => {
      const { storyId } = req.params as { storyId: string }
      const { notify_on_chapter } = req.body as { notify_on_chapter: boolean }
      const db = app.supabaseForUser(req.headers.authorization!.slice(7))
      const { error } = await db
        .from('watchlist')
        .update({ notify_on_chapter })
        .eq('user_id', req.user!.id)
        .eq('story_id', storyId)
      if (error) throw error
      return reply.code(200).send({ ok: true as const, story_id: storyId })
    },
  })
}

import type { SupabaseClient } from '@supabase/supabase-js'
import { conflict, forbidden, notFound } from '../../lib/errors.js'
import type { z } from 'zod'
import type { browseQuery, storyCreateBody, storyUpdateBody } from './schema.js'

type StoryRow = {
  id: string
  author_id: string
  title: string
  blurb: string | null
  genre: string
  tags: string[]
  language: 'ms' | 'en'
  age_rating: 'general' | 'teen' | 'mature'
  status: 'draft' | 'ongoing' | 'completed'
  cover_url: string | null
  published_at: string | null
  created_at: string
  updated_at: string
}

const PAGE_LIMIT = 20

const decodeCursor = (cursor: string | undefined): { published_at: string; id: string } | null => {
  if (!cursor) return null
  try {
    const json = Buffer.from(cursor, 'base64url').toString('utf8')
    const parsed = JSON.parse(json) as { published_at: string; id: string }
    return parsed
  } catch {
    return null
  }
}

const encodeCursor = (row: { published_at: string | null; id: string }): string | null => {
  if (!row.published_at) return null
  return Buffer.from(JSON.stringify({ published_at: row.published_at, id: row.id })).toString('base64url')
}

export const browse = async (
  db: SupabaseClient,
  q: z.infer<typeof browseQuery>,
): Promise<{ items: StoryRow[]; next_cursor: string | null }> => {
  let query = db
    .from('stories')
    .select('*')
    .neq('status', 'draft')
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('id', { ascending: false })
    .limit(q.limit + 1)

  if (q.genre) query = query.eq('genre', q.genre)
  if (q.language) query = query.eq('language', q.language)
  if (q.status) query = query.eq('status', q.status)
  if (q.q) query = query.ilike('title', `%${q.q}%`)

  const cur = decodeCursor(q.cursor)
  if (cur) {
    query = query.or(
      `published_at.lt.${cur.published_at},and(published_at.eq.${cur.published_at},id.lt.${cur.id})`,
    )
  }

  const { data, error } = await query
  if (error) throw error
  const rows = (data ?? []) as StoryRow[]
  const items = rows.slice(0, q.limit)
  const next = rows.length > q.limit && items.length > 0 ? encodeCursor(items[items.length - 1]!) : null
  return { items, next_cursor: next }
}

export const getById = async (db: SupabaseClient, id: string): Promise<StoryRow> => {
  const { data, error } = await db.from('stories').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  if (!data) throw notFound('story_not_found', `Story ${id} not found`)
  return data as StoryRow
}

export const create = async (
  db: SupabaseClient,
  authorId: string,
  input: z.infer<typeof storyCreateBody>,
): Promise<StoryRow> => {
  const { data, error } = await db
    .from('stories')
    .insert({ ...input, author_id: authorId, status: 'draft' })
    .select('*')
    .single()
  if (error) {
    if (error.code === '23505') throw conflict('duplicate_title', 'You already have a story with this title')
    throw error
  }
  return data as StoryRow
}

export const update = async (
  db: SupabaseClient,
  authorId: string,
  id: string,
  input: z.infer<typeof storyUpdateBody>,
): Promise<StoryRow> => {
  const existing = await getById(db, id)
  if (existing.author_id !== authorId) throw forbidden('forbidden', 'Not your story')
  const { data, error } = await db
    .from('stories')
    .update(input)
    .eq('id', id)
    .select('*')
    .single()
  if (error) {
    if (error.code === '23505') throw conflict('duplicate_title', 'You already have a story with this title')
    throw error
  }
  return data as StoryRow
}

export const remove = async (db: SupabaseClient, authorId: string, id: string): Promise<void> => {
  const existing = await getById(db, id)
  if (existing.author_id !== authorId) throw forbidden('forbidden', 'Not your story')
  const { error } = await db.from('stories').delete().eq('id', id)
  if (error) throw error
}

export const publish = async (
  db: SupabaseClient,
  authorId: string,
  id: string,
  status: 'ongoing' | 'completed',
): Promise<StoryRow> => {
  const existing = await getById(db, id)
  if (existing.author_id !== authorId) throw forbidden('forbidden', 'Not your story')
  const { data, error } = await db
    .from('stories')
    .update({
      status,
      published_at: existing.published_at ?? new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return data as StoryRow
}

export { PAGE_LIMIT }
export type { StoryRow }

import type { SupabaseClient } from '@supabase/supabase-js'
import { conflict, forbidden, notFound } from '../../lib/errors.js'
import { AppError } from '@auror/shared/errors'
import type { z } from 'zod'
import { chapterCreateBody, chapterUpdateBody } from '../stories/schema.js'

type ChapterRow = {
  id: string
  story_id: string
  ord: number
  title: string
  content_md: string | null
  draft_content_md: string | null
  gating: 'free' | 'coin' | 'sub'
  price_coins: number
  published_at: string | null
  created_at: string
  updated_at: string
}

type StoryAuthor = { author_id: string }

const ownsStory = async (db: SupabaseClient, userId: string, storyId: string): Promise<void> => {
  const { data, error } = await db.from('stories').select('author_id').eq('id', storyId).maybeSingle()
  if (error) throw error
  if (!data) throw notFound('story_not_found', `Story ${storyId} not found`)
  if ((data as StoryAuthor).author_id !== userId) throw forbidden('forbidden', 'Not your story')
}

export const listForStory = async (db: SupabaseClient, storyId: string): Promise<ChapterRow[]> => {
  const { data, error } = await db
    .from('chapters')
    .select('*')
    .eq('story_id', storyId)
    .order('ord', { ascending: true })
  if (error) throw error
  return (data ?? []) as ChapterRow[]
}

export const getMetadata = async (db: SupabaseClient, id: string): Promise<ChapterRow> => {
  const { data, error } = await db.from('chapters').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  if (!data) throw notFound('chapter_not_found', `Chapter ${id} not found`)
  return data as ChapterRow
}

export const create = async (
  db: SupabaseClient,
  userId: string,
  storyId: string,
  input: z.infer<typeof chapterCreateBody>,
): Promise<ChapterRow> => {
  await ownsStory(db, userId, storyId)
  if (input.gating === 'coin' && input.price_coins <= 0) {
    throw conflict('conflict', 'Coin-gated chapters need price_coins > 0')
  }
  if (input.gating !== 'coin' && input.price_coins !== 0) {
    input = { ...input, price_coins: 0 }
  }
  const { data, error } = await db
    .from('chapters')
    .insert({ ...input, story_id: storyId })
    .select('*')
    .single()
  if (error) {
    if (error.code === '23505') throw conflict('conflict', `Chapter ord ${input.ord} already exists`)
    throw error
  }
  return data as ChapterRow
}

export const update = async (
  db: SupabaseClient,
  userId: string,
  id: string,
  input: z.infer<typeof chapterUpdateBody>,
): Promise<ChapterRow> => {
  const existing = await getMetadata(db, id)
  await ownsStory(db, userId, existing.story_id)
  const merged = { ...existing, ...input }
  if (merged.gating === 'coin' && merged.price_coins <= 0) {
    throw conflict('conflict', 'Coin-gated chapters need price_coins > 0')
  }
  if (merged.gating !== 'coin') input = { ...input, price_coins: 0 }
  const { data, error } = await db.from('chapters').update(input).eq('id', id).select('*').single()
  if (error) {
    if (error.code === '23505') throw conflict('conflict', 'Chapter ord conflict')
    throw error
  }
  return data as ChapterRow
}

export const publish = async (
  db: SupabaseClient,
  userId: string,
  id: string,
): Promise<ChapterRow> => {
  const existing = await getMetadata(db, id)
  await ownsStory(db, userId, existing.story_id)
  const content = existing.draft_content_md ?? existing.content_md
  if (!content) throw conflict('conflict', 'No draft content to publish')
  const { data, error } = await db
    .from('chapters')
    .update({
      content_md: content,
      published_at: existing.published_at ?? new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return data as ChapterRow
}

export const remove = async (db: SupabaseClient, userId: string, id: string): Promise<void> => {
  const existing = await getMetadata(db, id)
  await ownsStory(db, userId, existing.story_id)
  const { error } = await db.from('chapters').delete().eq('id', id)
  if (error) throw error
}

/**
 * Read a chapter, enforcing gating.
 * - free: content returned
 * - coin: content returned only if user has chapter_unlocks row OR is the author
 * - sub:  content returned only if user has active subscription to author OR is the author
 *
 * Throws AppError(chapter_locked) when access denied.
 */
export const readGated = async (
  adminDb: SupabaseClient,
  userId: string | null,
  chapterId: string,
): Promise<ChapterRow> => {
  const { data: ch, error } = await adminDb
    .from('chapters')
    .select('*, stories!inner(author_id, status)')
    .eq('id', chapterId)
    .maybeSingle()
  if (error) throw error
  if (!ch) throw notFound('chapter_not_found', `Chapter ${chapterId} not found`)

  const chapter = ch as ChapterRow & { stories: { author_id: string; status: string } }

  // Unpublished — only author can read.
  if (!chapter.published_at && chapter.stories.author_id !== userId) {
    throw notFound('chapter_not_found', `Chapter ${chapterId} not found`)
  }

  const isAuthor = userId && chapter.stories.author_id === userId

  if (chapter.gating === 'free' || isAuthor) {
    return stripStory(chapter)
  }
  if (!userId) throw new AppError('chapter_locked', 403, 'This chapter is locked')

  if (chapter.gating === 'coin') {
    const { data: unlock } = await adminDb
      .from('chapter_unlocks')
      .select('user_id')
      .eq('user_id', userId)
      .eq('chapter_id', chapterId)
      .maybeSingle()
    if (!unlock) throw new AppError('chapter_locked', 403, 'Unlock with coins to read')
    return stripStory(chapter)
  }

  if (chapter.gating === 'sub') {
    const { data: sub } = await adminDb
      .from('subscriptions')
      .select('id')
      .eq('subscriber_id', userId)
      .eq('author_id', chapter.stories.author_id)
      .eq('status', 'active')
      .maybeSingle()
    if (!sub) throw new AppError('subscription_required', 402, 'Subscription required')
    return stripStory(chapter)
  }

  throw new AppError('chapter_locked', 403, 'This chapter is locked')
}

const stripStory = (row: ChapterRow & { stories?: unknown }): ChapterRow => {
  const { stories: _ignore, ...rest } = row as ChapterRow & { stories?: unknown }
  void _ignore
  return rest as ChapterRow
}

export type { ChapterRow }

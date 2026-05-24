import { z } from 'zod'
import { Language, AgeRating, StoryStatus, ChapterGating } from '@auror/shared/domain'

const enumOf = <T extends Record<string, string>>(e: T) =>
  z.enum(Object.values(e) as [string, ...string[]])

export const cursorQuery = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
})

export const storyCreateBody = z.object({
  title: z.string().min(1).max(200),
  blurb: z.string().max(2000).optional(),
  genre: z.string().min(1).max(40),
  tags: z.array(z.string().min(1).max(40)).max(20).default([]),
  language: enumOf(Language),
  age_rating: enumOf(AgeRating).default(AgeRating.General),
  cover_url: z.string().url().optional(),
})

export const storyUpdateBody = storyCreateBody.partial()

export const storyResponse = z.object({
  id: z.string().uuid(),
  author_id: z.string().uuid(),
  title: z.string(),
  blurb: z.string().nullable(),
  genre: z.string(),
  tags: z.array(z.string()),
  language: enumOf(Language),
  age_rating: enumOf(AgeRating),
  status: enumOf(StoryStatus),
  cover_url: z.string().nullable(),
  published_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

export const storyListResponse = z.object({
  items: z.array(storyResponse),
  next_cursor: z.string().nullable(),
})

export const browseQuery = cursorQuery.extend({
  q: z.string().optional(),
  genre: z.string().optional(),
  language: enumOf(Language).optional(),
  status: enumOf(StoryStatus).optional(),
  sort: z.enum(['recent', 'popular']).default('recent'),
})

export const chapterCreateBody = z.object({
  title: z.string().min(1).max(200),
  ord: z.number().int().min(1),
  gating: enumOf(ChapterGating).default(ChapterGating.Free),
  price_coins: z.number().int().min(0).default(0),
  draft_content_md: z.string().max(500_000).optional(),
})

export const chapterUpdateBody = z.object({
  title: z.string().min(1).max(200).optional(),
  ord: z.number().int().min(1).optional(),
  gating: enumOf(ChapterGating).optional(),
  price_coins: z.number().int().min(0).optional(),
  draft_content_md: z.string().max(500_000).optional(),
})

export const chapterResponse = z.object({
  id: z.string().uuid(),
  story_id: z.string().uuid(),
  ord: z.number(),
  title: z.string(),
  gating: enumOf(ChapterGating),
  price_coins: z.number(),
  has_content: z.boolean(),
  locked: z.boolean(),
  content_md: z.string().nullable(),
  published_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

export const chapterListResponse = z.object({
  items: z.array(chapterResponse),
})

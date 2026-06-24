import { z } from 'zod'
import { createApiClient } from '../api-client'
import {
  ChapterSchema,
  WritingSchema,
  type Chapter,
  type Writing,
} from '../api-client'

const apiClient = createApiClient()

const StoryListResponseSchema = z.object({
  items: z.array(WritingSchema),
  next_cursor: z.string().nullable(),
})

const StoryResponseSchema = WritingSchema

const ChapterListResponseSchema = z.object({
  items: z.array(ChapterSchema),
})

const DeleteResponseSchema = z.object({
  ok: z.literal(true),
})

const UnlockResponseSchema = z.object({
  chapter_id: z.string().uuid(),
  coins_paid: z.number(),
  new_balance: z.number(),
})

export type CreateWritingInput = {
  title: string
  blurb?: string
  genre: string
  tags?: string[]
  language: 'ms' | 'en'
  age_rating?: 'general' | 'teen' | 'mature'
  coverUrl?: string
}

export type UpdateWritingInput = Partial<CreateWritingInput> & {
  status?: 'draft' | 'ongoing' | 'completed'
}

export type CreateChapterInput = {
  title: string
  ord: number
  gating?: 'free' | 'coin' | 'sub'
  priceCoins?: number
  draftContentMd?: string
}

export const writingsApi = {
  list: (
    params: Record<string, string | number | undefined> = {},
  ): Promise<{ items: Writing[]; next_cursor: string | null }> => {
    const search = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        search.append(key, String(value))
      }
    }
    const query = search.toString()
    return apiClient.request(`/v1/stories${query ? `?${query}` : ''}`, StoryListResponseSchema)
  },

  get: (id: string): Promise<Writing> =>
    apiClient.request(`/v1/stories/${id}`, StoryResponseSchema),

  create: (input: CreateWritingInput): Promise<Writing> =>
    apiClient.request('/v1/stories', StoryResponseSchema, {
      method: 'POST',
      body: {
        title: input.title,
        blurb: input.blurb ?? '',
        genre: input.genre,
        tags: input.tags ?? [],
        language: input.language,
        age_rating: input.age_rating ?? 'general',
        cover_url: input.coverUrl,
      },
    }),

  update: (id: string, input: UpdateWritingInput): Promise<Writing> =>
    apiClient.request(`/v1/stories/${id}`, StoryResponseSchema, {
      method: 'PATCH',
      body: input,
    }),

  remove: (id: string): Promise<{ ok: true }> =>
    apiClient.request(`/v1/stories/${id}`, DeleteResponseSchema, {
      method: 'DELETE',
    }),

  publish: (id: string, status: 'ongoing' | 'completed' = 'ongoing'): Promise<Writing> =>
    apiClient.request(`/v1/stories/${id}/publish`, StoryResponseSchema, {
      method: 'POST',
      body: { status },
    }),

  chapters: {
    list: (writingId: string): Promise<{ items: Chapter[] }> =>
      apiClient.request(`/v1/stories/${writingId}/chapters`, ChapterListResponseSchema),

    create: (writingId: string, input: CreateChapterInput): Promise<Chapter> =>
      apiClient.request(`/v1/stories/${writingId}/chapters`, ChapterSchema, {
        method: 'POST',
        body: {
          title: input.title,
          ord: input.ord,
          gating: input.gating ?? 'free',
          price_coins: input.priceCoins ?? 0,
          draft_content_md: input.draftContentMd,
        },
      }),

    get: (chapterId: string): Promise<Chapter> =>
      apiClient.request(`/v1/chapters/${chapterId}`, ChapterSchema),

    update: (chapterId: string, input: Partial<CreateChapterInput>): Promise<Chapter> =>
      apiClient.request(`/v1/chapters/${chapterId}`, ChapterSchema, {
        method: 'PATCH',
        body: {
          title: input.title,
          ord: input.ord,
          gating: input.gating,
          price_coins: input.priceCoins,
          draft_content_md: input.draftContentMd,
        },
      }),

    remove: (chapterId: string): Promise<{ ok: true }> =>
      apiClient.request(`/v1/chapters/${chapterId}`, DeleteResponseSchema, {
        method: 'DELETE',
      }),

    publish: (chapterId: string): Promise<Chapter> =>
      apiClient.request(`/v1/chapters/${chapterId}/publish`, ChapterSchema, {
        method: 'POST',
      }),

    unlock: (chapterId: string): Promise<z.infer<typeof UnlockResponseSchema>> =>
      apiClient.request(`/v1/chapters/${chapterId}/unlock`, UnlockResponseSchema, {
        method: 'POST',
      }),
  },
}
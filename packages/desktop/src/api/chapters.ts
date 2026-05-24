import { api } from './client'

export type ChapterGating = 'free' | 'coin' | 'sub'

export type Chapter = {
  id: string
  story_id: string
  ord: number
  title: string
  gating: ChapterGating
  price_coins: number
  draft_content_md: string | null
  content_md: string | null
  published_at: string | null
  created_at: string
  updated_at: string
}

export type CreateChapterInput = {
  title: string
  ord: number
  gating: ChapterGating
  price_coins?: number
  draft_content_md?: string
}

export type UpdateChapterInput = {
  title?: string
  gating?: ChapterGating
  price_coins?: number
  draft_content_md?: string
}

export const listChapters = (storyId: string): Promise<{ items: Chapter[] }> =>
  api.get<{ items: Chapter[] }>(`/v1/stories/${storyId}/chapters`)

export const createChapter = (storyId: string, input: CreateChapterInput): Promise<Chapter> =>
  api.post<Chapter>(`/v1/stories/${storyId}/chapters`, input)

export const getChapter = (id: string): Promise<Chapter> =>
  api.get<Chapter>(`/v1/chapters/${id}`)

export const updateChapter = (id: string, input: UpdateChapterInput): Promise<Chapter> =>
  api.patch<Chapter>(`/v1/chapters/${id}`, input)

export const publishChapter = (id: string): Promise<Chapter> =>
  api.post<Chapter>(`/v1/chapters/${id}/publish`)

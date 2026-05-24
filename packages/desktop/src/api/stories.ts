import { api } from './client'

export type Story = {
  id: string
  title: string
  blurb: string | null
  genre: string | null
  tags: string[]
  language: string
  status: string
  cover_url: string | null
  created_at: string
  updated_at: string
}

export type StoryListResponse = {
  items: Story[]
  nextCursor: string | null
}

export type CreateStoryInput = {
  title: string
  blurb?: string
  genre?: string
  tags?: string[]
  language?: string
}

export const listStories = (cursor?: string): Promise<StoryListResponse> =>
  api.get<StoryListResponse>(`/v1/stories${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`)

export const createStory = (input: CreateStoryInput): Promise<Story> =>
  api.post<Story>('/v1/stories', input)

export const getStory = (id: string): Promise<Story> =>
  api.get<Story>(`/v1/stories/${id}`)

export const publishStory = (id: string, status: 'ongoing' | 'completed'): Promise<Story> =>
  api.post<Story>(`/v1/stories/${id}/publish`, { status })

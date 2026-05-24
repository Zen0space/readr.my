import { api } from './client'

export type StoryStatus = 'draft' | 'ongoing' | 'completed'
export type StoryLanguage = 'ms' | 'en'
export type StoryAgeRating = 'general' | 'teen' | 'mature'

export type Story = {
  id: string
  author_id: string
  title: string
  blurb: string | null
  genre: string
  tags: string[]
  language: StoryLanguage
  age_rating: StoryAgeRating
  status: StoryStatus
  cover_url: string | null
  published_at: string | null
  created_at: string
  updated_at: string
}

export type StoryListResponse = {
  items: Story[]
  next_cursor: string | null
}

export type CreateStoryInput = {
  title: string
  blurb?: string
  genre: string
  tags?: string[]
  language: StoryLanguage
  age_rating?: StoryAgeRating
  cover_url?: string
}

export type UpdateStoryInput = Partial<CreateStoryInput>

export const listMyStories = (status?: StoryStatus): Promise<StoryListResponse> => {
  const qs = status ? `?status=${status}` : ''
  return api.get<StoryListResponse>(`/v1/me/stories${qs}`)
}

export const createStory = (input: CreateStoryInput): Promise<Story> =>
  api.post<Story>('/v1/stories', input)

export const getStory = (id: string): Promise<Story> => api.get<Story>(`/v1/stories/${id}`)

export const updateStory = (id: string, input: UpdateStoryInput): Promise<Story> =>
  api.patch<Story>(`/v1/stories/${id}`, input)

export const publishStory = (id: string, status: 'ongoing' | 'completed'): Promise<Story> =>
  api.post<Story>(`/v1/stories/${id}/publish`, { status })

export type CoverUploadIntent = {
  path: string
  token: string
  public_url: string
}

export const requestCoverUpload = (
  story_id: string,
  ext: 'jpg' | 'jpeg' | 'png' | 'webp',
): Promise<CoverUploadIntent> =>
  api.post<CoverUploadIntent>('/v1/me/cover-upload-url', { story_id, ext })

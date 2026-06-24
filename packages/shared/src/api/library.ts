import { z } from 'zod'
import { createApiClient } from '../api-client'
import { LibraryResponseSchema, type LibraryResponse } from '../api-client'

const apiClient = createApiClient()

const LibraryItem = z.object({
  story_id: z.string().uuid(),
  added_at: z.string(),
  title: z.string(),
  blurb: z.string().nullable(),
  cover_url: z.string().nullable(),
  status: z.enum(['draft', 'ongoing', 'completed']),
  author_id: z.string().uuid(),
  author_pen_name: z.string().nullable(),
})

const ListResponseSchema = z.object({
  items: z.array(LibraryItem),
})

const MutationResponseSchema = z.object({
  ok: z.literal(true),
  story_id: z.string().uuid(),
})

export const libraryApi = {
  list: (): Promise<z.infer<typeof ListResponseSchema>> =>
    apiClient.request('/v1/me/library', ListResponseSchema),

  add: (storyId: string): Promise<z.infer<typeof MutationResponseSchema>> =>
    apiClient.request('/v1/me/library', MutationResponseSchema, {
      method: 'POST',
      body: { story_id: storyId },
    }),

  remove: (storyId: string): Promise<null> =>
    apiClient.request(`/v1/me/library/${storyId}`, z.null(), {
      method: 'DELETE',
    }),
}

export { LibraryResponseSchema as legacyLibraryResponseSchema }
export type { LibraryResponse }
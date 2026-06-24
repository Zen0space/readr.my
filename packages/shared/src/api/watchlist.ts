import { z } from 'zod'
import { createApiClient } from '../api-client'
import { WatchlistResponseSchema, type WatchlistResponse } from '../api-client'

const apiClient = createApiClient()

const MutationResponseSchema = z.object({
  ok: z.literal(true),
  story_id: z.string().uuid(),
})

export const watchlistApi = {
  list: (): Promise<WatchlistResponse> =>
    apiClient.request('/v1/me/watchlist', WatchlistResponseSchema),

  add: (storyId: string, notifyOnChapter = true): Promise<z.infer<typeof MutationResponseSchema>> =>
    apiClient.request('/v1/me/watchlist', MutationResponseSchema, {
      method: 'POST',
      body: { story_id: storyId, notify_on_chapter: notifyOnChapter },
    }),

  remove: (storyId: string): Promise<null> =>
    apiClient.request(`/v1/me/watchlist/${storyId}`, z.null(), {
      method: 'DELETE',
    }),

  setNotify: (storyId: string, notifyOnChapter: boolean): Promise<z.infer<typeof MutationResponseSchema>> =>
    apiClient.request(`/v1/me/watchlist/${storyId}`, MutationResponseSchema, {
      method: 'PATCH',
      body: { notify_on_chapter: notifyOnChapter },
    }),
}

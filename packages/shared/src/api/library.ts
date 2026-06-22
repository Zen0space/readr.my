import { z } from 'zod'
import { createApiClient } from '../api-client'
import { LibraryResponseSchema, type LibraryResponse } from '../api-client'

const apiClient = createApiClient()

const LibraryMutationSchema = z.object({ success: z.literal(true) })

export const libraryApi = {
  list: (): Promise<LibraryResponse> =>
    apiClient.request('/api/library', LibraryResponseSchema),

  add: (writingId: string): Promise<{ success: true }> =>
    apiClient.request('/api/library', LibraryMutationSchema, {
      method: 'POST',
      body: { writing_id: writingId },
    }),

  remove: (writingId: string): Promise<{ success: true }> =>
    apiClient.request('/api/library', LibraryMutationSchema, {
      method: 'DELETE',
      body: { writing_id: writingId },
    }),
}
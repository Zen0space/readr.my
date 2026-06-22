import { z } from 'zod'
import { createApiClient } from '../api-client'

const apiClient = createApiClient()

const UploadResponseSchema = z.object({
  path: z.string(),
  token: z.string(),
  public_url: z.string().url(),
})

export const uploadApi = {
  /**
   * Mint a signed upload URL for the user's avatar bucket. The frontend then
   * PUTs the file directly to Supabase storage using the returned `token`,
   * then writes the `public_url` into the user's profile.
   */
  avatarUploadUrl: (ext: 'jpg' | 'jpeg' | 'png' | 'webp'): Promise<z.infer<typeof UploadResponseSchema>> =>
    apiClient.request('/api/v1/me/avatar-upload-url', UploadResponseSchema, {
      method: 'POST',
      body: { ext },
    }),

  /**
   * Mint a signed upload URL for a story cover. Author/admin only — backend
   * verifies story ownership via the user-scoped client before issuing the URL.
   */
  storyCoverUploadUrl: (
    storyId: string,
    ext: 'jpg' | 'jpeg' | 'png' | 'webp',
  ): Promise<z.infer<typeof UploadResponseSchema>> =>
    apiClient.request('/api/v1/me/cover-upload-url', UploadResponseSchema, {
      method: 'POST',
      body: { story_id: storyId, ext },
    }),
}
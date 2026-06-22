import { z } from 'zod'
import { createApiClient } from '../api-client'

const apiClient = createApiClient()

const UploadResponseSchema = z.object({
  success: z.literal(true),
  url: z.string(),
  path: z.string().optional(),
})

export const uploadApi = {
  file: (file: File, bucket = 'avatars'): Promise<z.infer<typeof UploadResponseSchema>> => {
    const form = new FormData()
    form.append('file', file)
    form.append('bucket', bucket)
    return apiClient.request('/api/upload', UploadResponseSchema, {
      method: 'POST',
      body: form,
    })
  },
}
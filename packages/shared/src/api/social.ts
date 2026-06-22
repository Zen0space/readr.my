import { z } from 'zod'
import { createApiClient } from '../api-client'

const apiClient = createApiClient()

const CommentSchema = z.object({
  id: z.string(),
  writing_id: z.string(),
  chapter_id: z.string().nullable().optional(),
  user_id: z.string(),
  content: z.string(),
  created_at: z.string(),
})
export type Comment = z.infer<typeof CommentSchema>

const CommentsResponseSchema = z.object({
  success: z.literal(true),
  comments: z.array(CommentSchema),
})
const LikeResponseSchema = z.object({
  success: z.literal(true),
  liked: z.boolean(),
  like_count: z.number(),
})

export const socialApi = {
  toggleLike: (writingId: string): Promise<z.infer<typeof LikeResponseSchema>> =>
    apiClient.request('/api/social/like', LikeResponseSchema, {
      method: 'POST',
      body: { writing_id: writingId },
    }),

  comments: {
    list: (
      writingId: string,
      chapterId?: string,
    ): Promise<z.infer<typeof CommentsResponseSchema>> => {
      const search = new URLSearchParams({ writing_id: writingId })
      if (chapterId) {
        search.append('chapter_id', chapterId)
      }
      return apiClient.request(
        `/api/social/comment?${search.toString()}`,
        CommentsResponseSchema,
      )
    },

    create: (input: {
      writingId: string
      content: string
      chapterId?: string
    }): Promise<z.infer<typeof CommentsResponseSchema>> =>
      apiClient.request('/api/social/comment', CommentsResponseSchema, {
        method: 'POST',
        body: {
          writing_id: input.writingId,
          content: input.content,
          chapter_id: input.chapterId,
        },
      }),

    remove: (commentId: string): Promise<{ success: true }> =>
      apiClient.request(
        `/api/social/comment?id=${commentId}`,
        z.object({ success: z.literal(true) }),
        { method: 'DELETE' },
      ),
  },
}
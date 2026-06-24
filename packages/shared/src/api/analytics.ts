import { z } from 'zod'
import { createApiClient } from '../api-client'

const apiClient = createApiClient()

const DashboardResponseSchema = z.object({
  role: z.enum(['reader', 'author', 'admin']),
  metrics: z.object({
    total_writings: z.number(),
    total_chapters: z.number(),
    total_followers: z.number(),
    total_reads_30d: z.number(),
    total_chapter_votes: z.number(),
    pending_rm_cents: z.number(),
    total_users: z.number(),
    total_active_users_30d: z.number(),
    total_authors: z.number(),
    total_stories_published: z.number(),
    revenue_gross_rm: z.string(),
  }),
  stories: z.array(
    z.object({
      id: z.string().uuid(),
      title: z.string(),
      status: z.enum(['draft', 'ongoing', 'completed']),
      reads_30d: z.number(),
      followers: z.number(),
      votes: z.number(),
    }),
  ),
})

export type DashboardMetrics = z.infer<typeof DashboardResponseSchema>['metrics']

export const analyticsApi = {
  dashboard: (): Promise<z.infer<typeof DashboardResponseSchema>> =>
    apiClient.request('/v1/me/dashboard', DashboardResponseSchema),
}
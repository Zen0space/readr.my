import { z } from 'zod'
import { createApiClient } from '../api-client'

const apiClient = createApiClient()

const DashboardResponseSchema = z.object({
  success: z.literal(true),
  metrics: z.object({
    total_writings: z.number(),
    total_reads: z.number(),
    total_followers: z.number(),
    total_earnings: z.number(),
    reads_by_day: z.array(z.object({ date: z.string(), count: z.number() })),
  }),
})

export type DashboardMetrics = z.infer<typeof DashboardResponseSchema>['metrics']

export const analyticsApi = {
  dashboard: (): Promise<z.infer<typeof DashboardResponseSchema>> =>
    apiClient.request('/api/analytics/dashboard', DashboardResponseSchema),

  track: (input: {
    eventType: string
    writingId?: string
    chapterId?: string
    metadata?: Record<string, unknown>
  }): Promise<{ success: true }> =>
    apiClient.request(
      '/api/analytics/track',
      z.object({ success: z.literal(true) }),
      {
        method: 'POST',
        body: {
          event_type: input.eventType,
          writing_id: input.writingId,
          chapter_id: input.chapterId,
          metadata: input.metadata ?? {},
        },
      },
    ),
}
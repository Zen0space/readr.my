import { z } from 'zod'
import { createApiClient } from '../api-client'
import { RoleSchema } from '../api-client'

const apiClient = createApiClient()

const AdminUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  username: z.string(),
  role: RoleSchema,
  avatar_url: z.string().url().nullable().optional(),
  status: z.enum(['active', 'suspended']),
  created_at: z.string(),
})
export type AdminUser = z.infer<typeof AdminUserSchema>

const AdminUsersResponseSchema = z.object({
  success: z.literal(true),
  users: z.array(AdminUserSchema),
})

const AdminReportSchema = z.object({
  id: z.string(),
  reporter_id: z.string(),
  target_id: z.string(),
  reason: z.string(),
  status: z.enum(['open', 'in_review', 'resolved', 'dismissed']),
  created_at: z.string(),
})
export type AdminReport = z.infer<typeof AdminReportSchema>

const AdminReportsResponseSchema = z.object({
  success: z.literal(true),
  reports: z.array(AdminReportSchema),
})

export const adminApi = {
  users: {
    list: (): Promise<z.infer<typeof AdminUsersResponseSchema>> =>
      apiClient.request('/api/admin/users', AdminUsersResponseSchema),

    update: (
      userId: string,
      input: { role?: 'reader' | 'author' | 'admin'; status?: 'active' | 'suspended' },
    ): Promise<{ success: true; user: AdminUser }> =>
      apiClient.request(
        '/api/admin/users',
        z.object({ success: z.literal(true), user: AdminUserSchema }),
        {
          method: 'PUT',
          body: { userId, ...input },
        },
      ),
  },

  reports: {
    list: (): Promise<z.infer<typeof AdminReportsResponseSchema>> =>
      apiClient.request('/api/admin/reports', AdminReportsResponseSchema),

    update: (
      reportId: string,
      input: { status: AdminReport['status']; resolutionAction?: string },
    ): Promise<{ success: true; report: AdminReport }> =>
      apiClient.request(
        '/api/admin/reports',
        z.object({ success: z.literal(true), report: AdminReportSchema }),
        {
          method: 'PUT',
          body: { reportId, ...input },
        },
      ),
  },
}
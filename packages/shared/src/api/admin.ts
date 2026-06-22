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
  items: z.array(AdminUserSchema),
})

const AdminReportSchema = z.object({
  id: z.string().uuid(),
  reporter_id: z.string().uuid().nullable(),
  target_kind: z.enum(['story', 'chapter', 'user']),
  target_id: z.string().uuid(),
  reason: z.string(),
  free_text: z.string().nullable().optional(),
  status: z.enum(['open', 'dismissed', 'actioned']),
  created_at: z.string(),
})
export type AdminReport = z.infer<typeof AdminReportSchema>

const AdminReportsResponseSchema = z.object({
  items: z.array(AdminReportSchema),
})

export const adminApi = {
  users: {
    list: (params: { q?: string; role?: string; status?: string } = {}): Promise<z.infer<typeof AdminUsersResponseSchema>> => {
      const search = new URLSearchParams()
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && v !== '') search.append(k, v)
      }
      const query = search.toString()
      return apiClient.request(
        `/api/v1/admin/users${query ? `?${query}` : ''}`,
        AdminUsersResponseSchema,
      )
    },

    suspend: (userId: string): Promise<null> =>
      apiClient.request(`/api/v1/admin/users/${userId}/suspend`, z.null(), {
        method: 'POST',
      }),

    reinstate: (userId: string): Promise<null> =>
      apiClient.request(`/api/v1/admin/users/${userId}/reinstate`, z.null(), {
        method: 'POST',
      }),

    setRole: (userId: string, role: 'reader' | 'author' | 'admin'): Promise<null> =>
      apiClient.request(`/api/v1/admin/users/${userId}/role`, z.null(), {
        method: 'POST',
        body: { role },
      }),
  },

  reports: {
    list: (status: 'open' | 'dismissed' | 'actioned' = 'open'): Promise<z.infer<typeof AdminReportsResponseSchema>> =>
      apiClient.request(
        `/api/v1/admin/reports?status=${status}`,
        AdminReportsResponseSchema,
      ),

    dismiss: (reportId: string): Promise<null> =>
      apiClient.request(`/api/v1/admin/reports/${reportId}/dismiss`, z.null(), {
        method: 'POST',
      }),

    action: (reportId: string): Promise<null> =>
      apiClient.request(`/api/v1/admin/reports/${reportId}/action`, z.null(), {
        method: 'POST',
      }),
  },

  revenue: (params: { from?: string; to?: string } = {}): Promise<{
    gross_rm: string
    author_share_rm: string
    platform_share_rm: string
    coins_sold: number
    period: { from: string | null; to: string | null }
  }> => {
    const search = new URLSearchParams()
    if (params.from) search.append('from', params.from)
    if (params.to) search.append('to', params.to)
    const query = search.toString()
    return apiClient.request(
      `/api/v1/admin/revenue${query ? `?${query}` : ''}`,
      z.object({
        gross_rm: z.string(),
        author_share_rm: z.string(),
        platform_share_rm: z.string(),
        coins_sold: z.number(),
        period: z.object({ from: z.string().nullable(), to: z.string().nullable() }),
      }),
    )
  },
}
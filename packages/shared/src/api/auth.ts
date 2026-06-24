import { z } from 'zod'
import { createApiClient } from '../api-client'
import {
  LoginResponseSchema,
  RegisterResponseSchema,
  SessionResponseSchema,
  type LoginResponse,
  type RegisterResponse,
  type SessionResponse,
} from '../api-client'

const apiClient = createApiClient()

/**
 * Auth endpoints live in each frontend package as BFF route handlers.
 * They need to set the Supabase session cookie on the same origin so the
 * browser carries it to subsequent requests. Paths use the leading
 * /api/auth/ prefix so they hit reader's own route handlers under
 * app/api/auth/...route.ts (not the backend).
 */
export const authApi = {
  checkSession: (): Promise<SessionResponse> =>
    apiClient.request('/api/auth/session', SessionResponseSchema),

  login: (input: { email: string; password: string }): Promise<LoginResponse> =>
    apiClient.request('/api/auth/login', LoginResponseSchema, {
      method: 'POST',
      body: input,
    }),

  register: (input: {
    email: string
    password: string
    username: string
    role: 'reader' | 'author'
    avatarUrl?: string
  }): Promise<RegisterResponse> =>
    apiClient.request('/api/auth/register', RegisterResponseSchema, {
      method: 'POST',
      body: input,
    }),

  logout: (): Promise<{ success: true }> =>
    apiClient.request(
      '/api/auth/logout',
      z.object({ success: z.literal(true) }),
      { method: 'POST' },
    ),
}
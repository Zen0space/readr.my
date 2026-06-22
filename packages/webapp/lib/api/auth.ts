import { z } from 'zod';
import { apiClient } from './client';
import {
  LoginResponseSchema,
  RegisterResponseSchema,
  SessionResponseSchema,
  type LoginResponse,
  type RegisterResponse,
  type SessionResponse,
} from './types';

export const authApi = {
  checkSession: (): Promise<SessionResponse> =>
    apiClient.request('/api/auth/session', SessionResponseSchema),

  login: (input: { email: string; password: string }): Promise<LoginResponse> =>
    apiClient.request('/api/auth/login', LoginResponseSchema, {
      method: 'POST',
      body: input,
    }),

  register: (input: {
    email: string;
    password: string;
    username: string;
    role: 'reader' | 'author';
    avatarUrl?: string;
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
};

/**
 * Server-side API helpers for Next.js server components.
 *
 * The shared `apiClient` (`@auror/shared/api`) is designed for the
 * browser: it injects `Authorization: Bearer <token>` from a
 * client-side cache. Server components don't have access to that
 * cache, so we resolve the bearer token ourselves from the Supabase
 * session cookie via `createServerComponentClient` and forward it.
 *
 * Callers pass `accessToken` (typically the value of
 * `session.access_token` from the Supabase auth call in the same
 * server component). Failures throw the same `NetworkError` /
 * `ApiError` classes the browser-side client uses, so a single
 * `parseFetchError` helper can normalize them in either context.
 */
import {
  ApiError,
  NetworkError,
} from '@auror/shared/errors'
import { z } from 'zod'
import {
  LibraryResponseSchema,
  WalletSchema,
  WatchlistResponseSchema,
  WritingsListResponseSchema,
  type LibraryResponse,
  type Wallet,
  type WatchlistResponse,
  type WritingsListResponse,
} from '@auror/shared/api-client'

type FetchOptions = {
  accessToken?: string | null
  init?: RequestInit
}

const authHeader = (token: string | null | undefined): Record<string, string> =>
  token ? { Authorization: `Bearer ${token}` } : {}

const fetchJson = async <T,>(
  url: string,
  schema: { parse: (x: unknown) => T },
  options: FetchOptions = {},
): Promise<T> => {
  let res: Response
  try {
    res = await fetch(url, {
      ...options.init,
      headers: {
        Accept: 'application/json',
        ...authHeader(options.accessToken),
        ...(options.init?.headers ?? {}),
      },
      cache: 'no-store',
    })
  } catch (cause) {
    // Native fetch() rejects with a TypeError when the backend is
    // unreachable (DNS, connection refused, etc.) — wrap it in the
    // shared `NetworkError` so `parseFetchError` can detect it.
    throw new NetworkError(cause)
  }

  if (!res.ok) {
    // Try to parse the backend's `{ error: { code, message } }`
    // envelope so the error message we surface is helpful.
    let code = 'internal'
    let message = `HTTP ${res.status}`
    try {
      const text = await res.text()
      if (text) {
        const body = JSON.parse(text) as { error?: { code?: string; message?: string } }
        code = body.error?.code ?? code
        message = body.error?.message ?? message
      }
    } catch {
      // body wasn't JSON — keep the defaults
    }
    throw new ApiError(res.status, code as never, message)
  }

  const data = (await res.json()) as unknown
  return schema.parse(data)
}

const url = (baseUrl: string, path: string): string =>
  `${baseUrl.replace(/\/$/, '')}/v1${path}`

export const libraryApiClient = {
  list: (baseUrl: string, options: FetchOptions = {}): Promise<LibraryResponse> =>
    fetchJson(url(baseUrl, '/me/library'), LibraryResponseSchema, options),
}

export const watchlistApiClient = {
  list: (baseUrl: string, options: FetchOptions = {}): Promise<WatchlistResponse> =>
    fetchJson(url(baseUrl, '/me/watchlist'), WatchlistResponseSchema, options),
}

export const writingsApiClient = {
  list: (
    baseUrl: string,
    listOptions: {
      q?: string
      limit?: number
      genre?: string
      status?: 'ongoing' | 'completed' | 'draft'
      sort?: 'recent' | 'popular'
    } = {},
    options: FetchOptions = {},
  ): Promise<WritingsListResponse> => {
    const qs = new URLSearchParams()
    if (listOptions.q) qs.set('q', listOptions.q)
    if (listOptions.limit) qs.set('limit', String(listOptions.limit))
    if (listOptions.genre) qs.set('genre', listOptions.genre)
    if (listOptions.status) qs.set('status', listOptions.status)
    if (listOptions.sort) qs.set('sort', listOptions.sort)
    const tail = qs.toString() ? `?${qs.toString()}` : ''
    return fetchJson(
      url(baseUrl, `/stories${tail}`),
      WritingsListResponseSchema,
      options,
    )
  },
}

export const walletApiClient = {
  get: (baseUrl: string, options: FetchOptions = {}): Promise<Wallet> =>
    fetchJson(url(baseUrl, '/wallet'), WalletSchema, options),
}

// `GET /v1/me` returns the authenticated user's profile row — id,
// email, username, display_name, avatar_url, role, status, and the
// `created_at` join date from the public `users` table.
export const MeSchema = z.object({
  id: z.string(),
  email: z.string().nullable(),
  username: z.string().nullable(),
  display_name: z.string().nullable(),
  avatar_url: z.string().nullable(),
  role: z.enum(['reader', 'author', 'admin']),
  status: z.enum(['active', 'suspended']),
  created_at: z.string().nullable(),
})
export type Me = z.infer<typeof MeSchema>

export const meApiClient = {
  get: (baseUrl: string, options: FetchOptions = {}): Promise<Me> =>
    fetchJson(url(baseUrl, '/me'), MeSchema, options),
}
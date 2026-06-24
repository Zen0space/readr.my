import { setAccessTokenProvider } from '@auror/shared/api-client';

/**
 * Client-side access token cache. The Supabase access token is a JWT
 * with an `expires_at` (epoch seconds) — we cache it in memory and
 * re-fetch via `/api/auth/token` only when it's about to expire.
 *
 * The cache is module-scoped so every `apiClient` in the shared
 * package shares the same token (no per-request /api/auth/token
 * round-trips on a typical app session).
 */
type CachedToken = {
  access_token: string
  expires_at: number
}

let cached: CachedToken | null = null
let inflight: Promise<string | null> | null = null

const EXPIRY_SKEW_MS = 30_000 // refresh 30s early to avoid races

const isExpired = (token: CachedToken): boolean =>
  Date.now() >= token.expires_at * 1000 - EXPIRY_SKEW_MS

const fetchFromBff = async (): Promise<string | null> => {
  try {
    const res = await fetch('/api/auth/token', {
      method: 'GET',
      credentials: 'include',
    })
    if (!res.ok) return null
    const data = (await res.json()) as {
      access_token?: string
      expires_at?: number
    }
    if (!data.access_token || !data.expires_at) return null
    return data.access_token
  } catch {
    return null
  }
}

const getAccessToken = async (): Promise<string | null> => {
  if (cached && !isExpired(cached)) return cached.access_token
  if (inflight) return inflight
  inflight = (async () => {
    const access_token = await fetchFromBff()
    if (access_token && cached) {
      cached = { access_token, expires_at: cached.expires_at }
    }
    inflight = null
    return access_token
  })()
  return inflight
}

/**
 * Wire the reader's BFF token round-trip into the shared `apiClient`
 * instances. Called once at boot from the SessionProvider so every
 * `authApi` / `writingsApi` / `walletApi` call automatically attaches
 * `Authorization: Bearer …` once the user is signed in.
 *
 * Idempotent — safe to call more than once.
 */
export const registerAccessTokenProvider = (): void => {
  setAccessTokenProvider(getAccessToken)
}

/**
 * Invalidate the cached token (e.g. on sign-out). The next request
 * will re-fetch from the BFF, which will 401, returning null — the
 * client falls through to the cookie-only path.
 */
export const clearAccessToken = (): void => {
  cached = null
}

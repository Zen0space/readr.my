import { cookies } from 'next/headers';
import { createServerClient as createSsrServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { NextRequest, NextResponse } from 'next/server';

const url = (): string => process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const anonKey = (): string => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const serviceKey = (): string => process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const isConfigured = (): boolean => url().length > 0 && anonKey().length > 0;

class SupabaseNotConfiguredError extends Error {
  constructor() {
    super('Supabase env vars are not configured');
    this.name = 'SupabaseNotConfiguredError';
  }
}

/**
 * Cookie options applied to every cookie set by Supabase SSR. The
 * `Domain=.auror.my` is what makes the single-login-across-subdomains
 * trick work — the cookie set by reader.auror.my's login is visible
 * to author.auror.my and admin.auror.my.
 *
 * `path: '/'` is critical in BOTH environments: without it, the cookie
 * is scoped to the path of the response that set it (e.g.
 * /api/auth/login) and the browser won't send it back to sibling
 * paths (e.g. /api/auth/session).
 *
 * `NEXT_PUBLIC_COOKIE_DOMAIN` overrides the default; set it to e.g.
 * `localhost` (no leading dot) for local dev to avoid browsers
 * rejecting unknown domains.
 */
const apexCookieOptions = (): Partial<CookieOptions> => {
  const isProd = process.env.NODE_ENV === 'production'
  if (!isProd) {
    return {
      path: '/',
      secure: false,
      sameSite: 'lax',
      httpOnly: true,
    }
  }
  const domain = process.env.NEXT_PUBLIC_COOKIE_DOMAIN ?? '.auror.my'
  return {
    domain,
    path: '/',
    secure: true,
    sameSite: 'lax',
    httpOnly: true,
  }
}

/**
 * @supabase/ssr@0.3.0 uses a `cookies` config shaped like:
 *   { get(name), set(name, value, options), remove(name, options) }
 * (NOT the old `getAll`/`setAll` pair from 0.1.x). The library routes
 * its `storage` interface through these three methods, chunking large
 * tokens automatically. We need to provide all three or the library
 * logs warnings and the session never persists.
 */
type SsrCookieAdapter = {
  get: (name: string) => string | undefined
  set: (name: string, value: string, options: Partial<CookieOptions>) => void
  remove: (name: string, options: Partial<CookieOptions>) => void
}

/**
 * Build a Supabase SSR client that reads incoming cookies from
 * `request` and writes refreshed/cleared cookies onto `response`.
 *
 * Both are required:
 *   - `request.cookies` is what the browser sent (the session the
 *     client wants to validate or refresh).
 *   - `response.cookies` is what gets sent back to the browser (the
 *     refreshed session after `signInWithPassword` / `getUser` etc).
 */
const buildRouteHandlerClient = (
  request: NextRequest,
  response: NextResponse,
): SupabaseClient => {
  const cookieOpts = apexCookieOptions()
  const adapter: SsrCookieAdapter = {
    get: (name) => request.cookies.get(name)?.value,
    set: (name, value, options) => {
      response.cookies.set({ name, value, ...cookieOpts, ...options })
    },
    remove: (name, options) => {
      response.cookies.set({
        name,
        value: '',
        ...cookieOpts,
        ...options,
        maxAge: 0,
      })
    },
  }
  return createSsrServerClient(url(), anonKey(), { cookies: adapter })
}

/**
 * Copy every cookie set on `from` onto `to`. Used when the response
 * that received the Supabase cookies isn't the one we're returning
 * (e.g. we built the body of `to` from a Supabase profile fetch and
 * only know its shape after the call).
 */
export const copyCookies = (from: NextResponse, to: NextResponse): void => {
  for (const cookie of from.cookies.getAll()) {
    to.cookies.set(cookie)
  }
}

/**
 * Route-handler entry point. Pass the incoming `NextRequest` and the
 * `NextResponse` you intend to return. The Supabase session cookie
 * (read from the request, refreshed by Supabase, written to the
 * response) flows through automatically.
 *
 * Use `copyCookies(from, to)` if you build a different response
 * than the one you passed in (e.g. you defer building the body until
 * after the Supabase call).
 */
export const createServerClient = async (
  request: NextRequest,
  response: NextResponse,
): Promise<SupabaseClient> => {
  if (!isConfigured()) {
    throw new SupabaseNotConfiguredError()
  }
  return buildRouteHandlerClient(request, response)
}

/**
 * Server-component / server-action entry point. Uses `cookies()` from
 * `next/headers` for both read and write — supported in Server
 * Components and Server Actions in Next.js 16 (just not in Route
 * Handlers).
 */
export const createServerComponentClient = async (): Promise<SupabaseClient> => {
  if (!isConfigured()) {
    throw new SupabaseNotConfiguredError()
  }
  const cookieOpts = apexCookieOptions()
  const cookieStore = await cookies()
  const adapter: SsrCookieAdapter = {
    get: (name) => cookieStore.get(name)?.value,
    set: (name, value, options) => {
      cookieStore.set({ name, value, ...cookieOpts, ...options })
    },
    remove: (name, options) => {
      cookieStore.set({ name, value: '', ...cookieOpts, ...options, maxAge: 0 })
    },
  }
  return createSsrServerClient(url(), anonKey(), { cookies: adapter })
}

export const createAdminClient = (): SupabaseClient => {
  if (!isConfigured() || serviceKey().length === 0) {
    throw new SupabaseNotConfiguredError();
  }
  return createClient(url(), serviceKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
};

export const isSupabaseConfigured = isConfigured;

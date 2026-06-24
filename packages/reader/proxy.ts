import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const SUPABASE_CONFIGURED = SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;

const COOKIE_OPTIONS = {
  path: '/',
  sameSite: 'lax' as const,
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
};

/**
 * Reader-only proxy (formerly `middleware` — renamed in Next.js 16).
 *
 * Responsibilities:
 *   1. Refresh the Supabase session cookie on every request so server
 *      components and route handlers below see a valid session.
 *   2. Forward `x-pathname` and `x-search` request headers so layouts
 *      (notably `app/(protected)/layout.tsx`) can build the
 *      `/login?redirect=<path>` URL when the auth gate fires.
 *
 * Auth gating is the protected layout's job — this proxy never issues
 * redirects to `/login`.
 */
export async function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', request.nextUrl.pathname);
  requestHeaders.set('x-search', request.nextUrl.search);

  // Build the response up front and hand it to the Supabase client so
  // the refreshed session cookies land on it. We rebuild it once more
  // after `set` fires so the response carries the request-header mutations
  // we made above (Next.js requires the response to be built with the
  // mutated headers so downstream handlers see them).
  let response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  if (!SUPABASE_CONFIGURED) {
    return response;
  }

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get: (name: string) => request.cookies.get(name)?.value,
      set: (name: string, value: string) => {
        // Rebuild `response` from scratch each time `set` fires so the
        // new cookies are attached to the final NextResponse we return.
        response = NextResponse.next({
          request: { headers: requestHeaders },
        });
        response.cookies.set({ name, value, ...COOKIE_OPTIONS });
      },
      remove: (name: string) => {
        response = NextResponse.next({
          request: { headers: requestHeaders },
        });
        response.cookies.set({ name, value: '', ...COOKIE_OPTIONS, maxAge: 0 });
      },
    },
  });

  // Touch the session so the cookie gets refreshed if it's near expiry.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  // Run on everything except Next.js internals + static assets.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

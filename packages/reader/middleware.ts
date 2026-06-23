import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const SUPABASE_CONFIGURED = SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;

/**
 * Reader-only middleware. The auth flow's BFF route handlers at
 * `/api/auth/*` set the apex cookie via Supabase SSR; this middleware just
 * refreshes the session so server components below see a valid cookie, and
 * gates reader-protected paths (`/library`, `/read`, `/wallet`,
 * `/subscription`) on a valid session.
 *
 * Author + admin paths don't exist in this package — they live on their own
 * subdomains (`author.auror.my`, `admin.auror.my`) once those packages ship.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  if (!SUPABASE_CONFIGURED) {
    return response;
  }

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: any[]) {
        cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, {
            ...options,
            secure: process.env.NODE_ENV === 'production',
          })
        );
      },
    },
    cookieOptions: {
      secure: process.env.NODE_ENV === 'production',
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  const isProtectedPath =
    path === '/library' ||
    path === '/wallet' ||
    path === '/subscription' ||
    path.startsWith('/read/');

  if (isProtectedPath && !user) {
    const next = encodeURIComponent(`${path}${request.nextUrl.search}`);
    return NextResponse.redirect(new URL(`/login?redirect=${next}`, request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/library',
    '/wallet',
    '/subscription',
    '/read/:path*',
    '/api/auth/session',
  ],
};
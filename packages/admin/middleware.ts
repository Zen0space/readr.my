import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const SUPABASE_CONFIGURED = SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;

/**
 * Admin-only middleware. Every protected path on this subdomain requires
 * role === 'admin'. Reader + author accounts get bounced to /login with
 * an Admin-privileges-required error (the login page itself short-circuits
 * non-admins to avoid the redirect ping-pong).
 *
 * Only /login + /register + the auth BFF routes are public — everything else
 * is admin-only. /api/auth/* stays public so people can actually sign in.
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

  if (!user) {
    const next = encodeURIComponent(`${path}${request.nextUrl.search}`);
    return NextResponse.redirect(new URL(`/login?redirect=${next}`, request.url));
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    const error = encodeURIComponent('Admin privileges required');
    return NextResponse.redirect(new URL(`/login?error=${error}`, request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/v1/admin/:path*',
    '/api/auth/session',
  ],
}
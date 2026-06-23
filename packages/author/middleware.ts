import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const SUPABASE_CONFIGURED = SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;

/**
 * Author-only middleware.
 *
 * - /author/:path*        requires role in ('author', 'admin'); non-authors get
 *                         bounced to /login?error=Author+privileges+required.
 *                         (If they're logged in as a reader, this surfaces a
 *                         clean error instead of silently 200ing.)
 * - /api/writings/*       author/admin-only — these are write paths.
 * - /api/upload           author/admin-only.
 * - /api/analytics/*      author/admin-only (admin dashboard lives elsewhere).
 * - /api/wallet/payout    author/admin-only.
 *
 * /login, /register, /api/auth/* stay public so users can sign in / sign up
 * on the author subdomain and have their role flipped to 'author'.
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

  const isAuthorSurface =
    path.startsWith('/author/') ||
    path.startsWith('/api/writings/') ||
    path.startsWith('/api/writings') ||
    path === '/api/upload' ||
    path.startsWith('/api/analytics/') ||
    path === '/api/wallet/payout';

  if (isAuthorSurface && !user) {
    const next = encodeURIComponent(`${path}${request.nextUrl.search}`);
    return NextResponse.redirect(new URL(`/login?redirect=${next}`, request.url));
  }

  if (path.startsWith('/author/') && user) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    const role = profile?.role ?? 'reader';
    if (role !== 'author' && role !== 'admin') {
      const error = encodeURIComponent('Author privileges required');
      return NextResponse.redirect(new URL(`/login?error=${error}`, request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/author/:path*',
    '/api/writings/:path*',
    '/api/writings',
    '/api/upload',
    '/api/analytics/:path*',
    '/api/wallet/payout',
    '/api/auth/session',
  ],
};
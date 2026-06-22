import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const SUPABASE_CONFIGURED = SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;

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
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  const isAdminPath = path.startsWith('/admin') || path.startsWith('/api/admin');
  const isAuthorPath = path.startsWith('/author') || path.startsWith('/api/author');
  const isProtectedPath = path === '/library' || path === '/reading' || path === '/wallet' || path === '/subscription';

  // 1. Check Auth Required
  if (isAdminPath || isAuthorPath || isProtectedPath) {
    if (!user) {
      if (path.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/login?error=Please+sign+in+to+access+this+page', request.url));
    }

    // 2. Query Role (RBAC)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = profile?.role || 'reader';

    if (isAdminPath && role !== 'admin') {
      if (path.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      return NextResponse.redirect(new URL('/login?error=Admin+privileges+required', request.url));
    }

    if (isAuthorPath && role !== 'author' && role !== 'admin') {
      if (path.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      return NextResponse.redirect(new URL('/login?error=Author+privileges+required', request.url));
    }
  }

  // 3. Redirect away from auth forms if already logged in
  if (user && (path === '/login' || path === '/register')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/author/:path*',
    '/library',
    '/reading',
    '/wallet',
    '/subscription',
    '/login',
    '/register',
    '/api/auth/session', // session check needs to run
    '/api/writings/create', // writing create needs auth check
    '/api/chapters/:path*/unlock', // unlock needs auth check
    '/api/wallet/:path*', // wallet endpoints need auth check
    '/api/library/:path*', // library needs auth check
    '/api/upload', // upload needs auth check
  ],
};

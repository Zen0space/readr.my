import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerComponentClient, isSupabaseConfigured } from '@/lib/supabase';
import { SessionProvider, type SessionState } from '@/lib/session';
import { Sidebar } from '@/components/chrome/Sidebar';
import { ErrorToast } from '@/components/ui';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? ''

/**
 * Resolve the access_token from the Supabase session cookie.
 *
 * The Supabase SSR cookie value is a JSON-stringified object:
 *   { access_token, refresh_token, expires_at, expires_in, token_type, user }
 * We only need `access_token` to forward to the backend as Bearer auth.
 */
const resolveAccessToken = async (): Promise<string | null> => {
  if (!isSupabaseConfigured()) return null
  try {
    const supabase = await createServerComponentClient()
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ?? null
  } catch {
    return null
  }
}

type MeResponse = {
  id: string
  email: string | null
  display_name: string | null
  avatar_url: string | null
  role: 'reader' | 'author' | 'admin'
}

const resolveSession = async (): Promise<{
  session: SessionState
  coinBalance: number | null
}> => {
  if (!isSupabaseConfigured()) {
    return { session: { status: 'anonymous' }, coinBalance: null }
  }

  // Supabase is used here ONLY to validate the auth session and extract
  // the access_token. No DB queries (`supabase.from(...)`) anywhere —
  // every profile / wallet / library / stories fetch goes directly to
  // the Fastify backend using the Bearer token.
  const accessToken = await resolveAccessToken()
  if (!accessToken) {
    return { session: { status: 'anonymous' }, coinBalance: null }
  }

  // Fetch the user's profile row from the backend.
  let me: MeResponse | null = null
  try {
    const meRes = await fetch(`${BACKEND_URL}/v1/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    })
    if (meRes.ok) {
      me = (await meRes.json()) as MeResponse
    }
  } catch {
    me = null
  }
  if (!me) {
    return { session: { status: 'anonymous' }, coinBalance: null }
  }

  const session: SessionState = {
    status: 'authenticated',
    user: {
      id: me.id,
      email: me.email ?? '',
      username: me.display_name ?? (me.email?.split('@')[0] ?? ''),
      role: me.role,
      avatar_url: me.avatar_url ?? null,
    },
  }

  // Fetch the wallet balance from the backend. Failure here is non-fatal
  // — the sidebar just shows "—" until the user navigates to /wallet.
  let coinBalance: number | null = null
  try {
    const walletRes = await fetch(`${BACKEND_URL}/v1/wallet`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    })
    if (walletRes.ok) {
      const wallet = (await walletRes.json()) as { coin_balance?: number }
      coinBalance = wallet.coin_balance ?? 0
    }
  } catch {
    coinBalance = null
  }

  return { session, coinBalance }
}

/**
 * Layout for every route that requires a reader account.
 *
 * Auth gate: the layout validates the Supabase session cookie (login
 * + signup themselves are handled by the BFF `/api/auth/*` routes),
 * then resolves the user's profile and wallet balance from the Fastify
 * backend using a Bearer token. If the session is anonymous, redirect
 * to `/login?redirect=<currentPath>` so the user lands back where they
 * tried to go after signing in.
 *
 * Public marketing/legal/auth routes live under `(public)` instead.
 */
export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.ReactElement> {
  const { session, coinBalance } = await resolveSession();

  if (session.status !== 'authenticated') {
    const headerStore = await headers();
    const pathname = headerStore.get('x-pathname') ?? '';
    const search = headerStore.get('x-search') ?? '';
    const target = pathname ? `/login?redirect=${encodeURIComponent(`${pathname}${search}`)}` : '/login';
    redirect(target);
  }

  const { user } = session;
  const role = user.role;
  const username = user.username;
  const avatarUrl = user.avatar_url ?? null;

  return (
    <SessionProvider initialSession={session}>
      <div className="flex min-h-screen">
        <Sidebar
          role={role}
          username={username}
          avatarUrl={avatarUrl}
          coinBalance={coinBalance}
        />
        <div className="flex min-h-screen w-full flex-1 flex-col md:ml-[280px]">
          <main className="flex-1 px-4 pb-24 pt-8 md:px-10 md:pt-10">{children}</main>
        </div>
      </div>
      <ErrorToast />
    </SessionProvider>
  );
}
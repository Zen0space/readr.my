import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { SessionProvider, type SessionState } from '@/lib/session';
import { Sidebar } from '@/components/chrome/Sidebar';
import { TopBar } from '@/components/chrome/TopBar';

const resolveSession = async (): Promise<{ session: SessionState; coinBalance: number | null }> => {
  if (!isSupabaseConfigured()) {
    return { session: { status: 'anonymous' }, coinBalance: null };
  }
  try {
    const supabase = await createServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return { session: { status: 'anonymous' }, coinBalance: null };
    }
    const { data: profile } = await supabase
      .from('users')
      .select('role, display_name, avatar_url')
      .eq('id', user.id)
      .single();

    const session: SessionState = {
      status: 'authenticated',
      user: {
        id: user.id,
        email: user.email ?? '',
        username: profile?.display_name ?? user.email?.split('@')[0] ?? '',
        role: ((profile?.role as 'reader' | 'author' | 'admin' | undefined) ?? 'reader'),
        avatar_url: profile?.avatar_url ?? null,
      },
    };

    let coinBalance: number | null = null;
    try {
      const { data: wallet } = await supabase
        .from('wallets')
        .select('coin_balance')
        .eq('user_id', user.id)
        .maybeSingle();
      coinBalance = wallet?.coin_balance ?? 0;
    } catch {
      coinBalance = null;
    }

    return { session, coinBalance };
  } catch {
    return { session: { status: 'anonymous' }, coinBalance: null };
  }
};

/**
 * Layout for every route that requires a reader account.
 *
 * Auth gate: the layout calls `supabase.auth.getUser()` on the server.
 * If no user is present it calls `redirect('/login?redirect=<currentPath>')`
 * so the user lands on the page they wanted after signing in. The redirect
 * query param is honored by the login page.
 *
 * After the gate, this layout renders the full in-app chrome (left
 * Sidebar + TopBar with avatar / coins / sign-out).
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
    // Preserve the user's intended destination so they bounce back after
    // signing in. `x-pathname` is set by `proxy.ts` for every request.
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
          <TopBar username={username} role={role} coinBalance={coinBalance} />
          <main className="flex-1 px-4 pb-24 pt-8 md:px-10 md:pt-10">{children}</main>
        </div>
      </div>
    </SessionProvider>
  );
}

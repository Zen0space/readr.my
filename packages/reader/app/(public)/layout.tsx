import { createServerComponentClient, isSupabaseConfigured } from '@/lib/supabase';
import { SessionProvider, type SessionState } from '@/lib/session';
import { meApiClient } from '@/lib/api/serverClient';
import { PublicChrome } from './_chrome';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? ''

const resolveSession = async (): Promise<SessionState> => {
  if (!isSupabaseConfigured()) {
    return { status: 'anonymous' };
  }
  try {
    // Supabase is used only for session validation — the access_token is
    // forwarded to the backend. No `supabase.from(...)` calls here; the
    // user's profile row comes from `/v1/me` on the Fastify backend.
    const supabase = await createServerComponentClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return { status: 'anonymous' };

    const meRes = await fetch(`${BACKEND_URL}/v1/me`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
      cache: 'no-store',
    });
    if (!meRes.ok) return { status: 'anonymous' };
    const me = (await meRes.json()) as {
      id: string
      email: string | null
      display_name: string | null
      avatar_url: string | null
      role: 'reader' | 'author' | 'admin'
    };

    return {
      status: 'authenticated',
      user: {
        id: me.id,
        email: me.email ?? '',
        username: me.display_name ?? (me.email?.split('@')[0] ?? ''),
        role: me.role,
        avatar_url: me.avatar_url ?? null,
      },
    };
  } catch {
    return { status: 'anonymous' };
  }
};

/**
 * Server layout for every public route (marketing, legal, auth pages).
 *
 * Resolves the session once and mounts `SessionProvider` so client
 * components below — `ReaderNav`, in particular — see real auth state.
 * Chrome selection (centered card vs `ReaderNav`) happens in
 * `_chrome.tsx`, a small client child that reads `usePathname()`.
 */
export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.ReactElement> {
  const session = await resolveSession();
  return (
    <SessionProvider initialSession={session}>
      <PublicChrome>{children}</PublicChrome>
    </SessionProvider>
  );
}
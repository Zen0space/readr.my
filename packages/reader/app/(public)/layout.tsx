import { createServerComponentClient, isSupabaseConfigured } from '@/lib/supabase';
import { SessionProvider, type SessionState } from '@/lib/session';
import { PublicChrome } from './_chrome';

const resolveSession = async (): Promise<SessionState> => {
  if (!isSupabaseConfigured()) {
    return { status: 'anonymous' };
  }
  try {
    const supabase = await createServerComponentClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return { status: 'anonymous' };
    const { data: profile } = await supabase
      .from('users')
      .select('role, display_name, avatar_url')
      .eq('id', user.id)
      .single();
    return {
      status: 'authenticated',
      user: {
        id: user.id,
        email: user.email ?? '',
        username: profile?.display_name ?? user.email?.split('@')[0] ?? '',
        role: ((profile?.role as 'reader' | 'author' | 'admin' | undefined) ?? 'reader'),
        avatar_url: profile?.avatar_url ?? null,
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

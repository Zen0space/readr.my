import { createServerClient } from '@/lib/supabase';
import { SessionProvider, type SessionState } from '@/lib/session';
import { ReaderNav } from '@/components/chrome/ReaderNav';

const resolveSession = async (): Promise<SessionState> => {
  try {
    const supabase = createServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return { status: 'anonymous' };
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, username, avatar_url')
      .eq('id', user.id)
      .single();

    return {
      status: 'authenticated',
      user: {
        id: user.id,
        email: user.email ?? '',
        username: profile?.username ?? user.email?.split('@')[0] ?? '',
        role: (profile?.role as 'reader' | 'author' | 'admin' | undefined) ?? 'reader',
        avatar_url: profile?.avatar_url ?? null,
      },
    };
  } catch {
    return { status: 'anonymous' };
  }
};

export default async function ReaderLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.ReactElement> {
  const session = await resolveSession();
  return (
    <SessionProvider initialSession={session}>
      <div className="flex min-h-screen flex-col">
        <ReaderNav />
        <main className="flex-1">{children}</main>
      </div>
    </SessionProvider>
  );
}

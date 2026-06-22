import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase';
import { SessionProvider, type SessionState } from '@/lib/session';

const resolveSession = async (): Promise<SessionState> => {
  try {
    const supabase = createServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return { status: 'anonymous' };
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

export default async function AuthorLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.ReactElement> {
  const session = await resolveSession();
  if (session.status === 'anonymous') {
    redirect('/login?redirect=/author/studio');
  }
  if (session.status === 'authenticated' && session.user.role === 'reader') {
    redirect('/?error=author_only');
  }
  return (
    <SessionProvider initialSession={session}>
      <div className="flex min-h-screen flex-col">{children}</div>
    </SessionProvider>
  );
}

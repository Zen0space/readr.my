import { createServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { SessionProvider, type SessionState } from '@/lib/session';
import { Sidebar } from '@/components/chrome/Sidebar';
import { TopBar } from '@/components/chrome/TopBar';

const resolveSession = async (): Promise<{ session: SessionState }> => {
  if (!isSupabaseConfigured()) {
    return { session: { status: 'anonymous' } };
  }
  try {
    const supabase = await createServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return { session: { status: 'anonymous' } };
    }
    const { data: profile } = await supabase
      .from('users')
      .select('role, display_name, avatar_url')
      .eq('id', user.id)
      .single();
    return {
      session: {
        status: 'authenticated',
        user: {
          id: user.id,
          email: user.email ?? '',
          username: profile?.display_name ?? user.email?.split('@')[0] ?? '',
          role: ((profile?.role as 'reader' | 'author' | 'admin' | undefined) ?? 'reader'),
          avatar_url: profile?.avatar_url ?? null,
        },
      },
    };
  } catch {
    return { session: { status: 'anonymous' } };
  }
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.ReactElement> {
  const { session } = await resolveSession();
  const isAuthed = session.status === 'authenticated';
  const role = isAuthed ? session.user.role : 'reader';
  const username = isAuthed ? session.user.username : 'Guest';

  return (
    <SessionProvider initialSession={session}>
      <div className="flex min-h-screen">
        <Sidebar
          role={role}
          username={username}
          avatarUrl={null}
          coinBalance={null}
        />
        <div className="flex min-h-screen w-full flex-1 flex-col md:ml-[280px]">
          <TopBar username={username} role={role} coinBalance={null} />
          <main className="flex-1 px-4 pb-24 pt-8 md:px-10 md:pt-10">{children}</main>
        </div>
      </div>
    </SessionProvider>
  );
}
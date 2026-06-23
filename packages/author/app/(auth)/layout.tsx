import { createServerClient } from '@/lib/supabase';
import { SessionProvider, type SessionState } from '@/lib/session';

const resolveSession = async (): Promise<SessionState> => {
  try {
    const supabase = await createServerClient();
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

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.ReactElement> {
  const session = await resolveSession();
  return (
    <SessionProvider initialSession={session}>
      <div className="relative flex min-h-screen items-center justify-center p-4">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(70,72,212,0.10),transparent_45%),radial-gradient(circle_at_80%_70%,rgba(107,56,212,0.10),transparent_45%)]"
        />
        <div className="relative z-10 w-full max-w-md">{children}</div>
      </div>
    </SessionProvider>
  );
}
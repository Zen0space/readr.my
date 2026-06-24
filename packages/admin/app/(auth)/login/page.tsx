import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { LoginForm } from '@/components/auth/LoginForm';

export const metadata: Metadata = {
  title: 'Admin Sign In',
  description: 'Sign in to your Auror admin account.',
};

type PageProps = {
  searchParams: { error?: string; redirect?: string };
};

/**
 * Admin login is narrower than reader/author's:
 *  - logged-out users see the form (handled here)
 *  - signed-in admins go straight to /admin
 *  - signed-in non-admins see an error message instead of bouncing them
 *    to /admin only to be redirected by middleware — short-circuit the
 *    useless redirect per the split plan (§D.2)
 */
export default async function LoginPage({ searchParams }: PageProps): Promise<React.ReactElement> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();
        if (profile?.role === 'admin') {
          redirect(searchParams.redirect ?? '/admin');
        }
        return (
          <div className="space-y-4 text-center">
            <h1 className="font-display text-2xl font-bold text-error">
              Admin access denied
            </h1>
            <p className="text-sm text-on-surface-variant">
              You are signed in as <code>{profile?.role ?? 'reader'}</code> — this subdomain
              requires an admin account. Sign out, then sign in with an admin email,
              or visit <a href="https://auror.my" className="text-primary hover:underline">auror.my</a>.
            </p>
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
              >
                Sign out
              </button>
            </form>
          </div>
        );
      }
    } catch {
      // fall through to render the form
    }
  }

  return <LoginForm initialError={searchParams.error} redirectTo={searchParams.redirect} />;
}
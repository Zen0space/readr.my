import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { LoginForm } from '@/components/auth/LoginForm';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your Auror author account.',
};

type PageProps = {
  searchParams: { error?: string; redirect?: string; registered?: string };
};

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
        const role = profile?.role ?? 'reader';
        const target = searchParams.redirect ?? (role === 'author' || role === 'admin' ? '/author/studio' : '/');
        redirect(target);
      }
    } catch {
      // fall through to render the form
    }
  }

  const banner = searchParams.registered
    ? `Account created for ${searchParams.registered}. Please sign in.`
    : searchParams.error
      ? searchParams.error
      : undefined;

  return <LoginForm initialError={banner} redirectTo={searchParams.redirect} />;
}
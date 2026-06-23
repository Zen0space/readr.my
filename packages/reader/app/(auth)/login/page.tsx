import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { LoginForm } from '@/components/auth/LoginForm';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your Auror account to read, write, and connect.',
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
        redirect(searchParams.redirect ?? '/');
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

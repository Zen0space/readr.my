import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createServerComponentClient, isSupabaseConfigured } from '@/lib/supabase';
import { LoginForm } from '@/components/auth/LoginForm';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your Auror account to read, write, and connect.',
};

type PageProps = {
  searchParams: Promise<{ error?: string; redirect?: string; registered?: string }>;
};

export default async function LoginPage({ searchParams }: PageProps): Promise<React.ReactElement> {
  const params = await searchParams;
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerComponentClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        redirect(params.redirect ?? '/');
      }
    } catch {
      // fall through to render the form
    }
  }

  const notice = params.registered
    ? `Account created for ${params.registered}. Please sign in.`
    : undefined;
  const error = params.error;

  return (
    <LoginForm
      initialError={error}
      initialNotice={notice}
      redirectTo={params.redirect}
    />
  );
}

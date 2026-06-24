import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { RegisterForm } from '@/components/auth/RegisterForm';

export const metadata: Metadata = {
  title: 'Create Account',
  description: 'Join Auror to read and publish stories.',
};

type PageProps = {
  searchParams: { error?: string };
};

export default async function RegisterPage({ searchParams }: PageProps): Promise<React.ReactElement> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        redirect('/');
      }
    } catch {
      // fall through to render the form
    }
  }

  return <RegisterForm initialError={searchParams.error} />;
}

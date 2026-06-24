import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { RegisterForm } from '@/components/auth/RegisterForm';

export const metadata: Metadata = {
  title: 'Admin Registration',
  description: 'Admin accounts are provisioned by the platform owner. Contact your team lead.',
};

/**
 * Admin registration is locked down — only the platform owner should bootstrap
 * admin accounts (via the Supabase dashboard or a SQL seed). Anyone hitting
 * /register on admin.auror.my gets the login form with an explanatory note.
 */
export default async function RegisterPage(): Promise<React.ReactElement> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) redirect('/');
    } catch {
      // fall through
    }
  }
  return (
    <RegisterForm
      initialError="Admin accounts are provisioned by the platform owner. Visit auror.my to register as a reader or author."
    />
  );
}
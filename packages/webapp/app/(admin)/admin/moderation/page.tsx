import type { Metadata } from 'next';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { ModerationView } from '@/components/admin/ModerationView';
import type { AdminReport } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Moderation',
  description: 'Review and resolve flagged reports.',
};

const fetchReports = async (): Promise<{ reports: AdminReport[]; isAdmin: boolean }> => {
  if (!isSupabaseConfigured()) return { reports: [], isAdmin: false };
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { reports: [], isAdmin: false };
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    if (profile?.role !== 'admin') return { reports: [], isAdmin: false };
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return { reports: [], isAdmin: true };
    return { reports: (data ?? []) as AdminReport[], isAdmin: true };
  } catch {
    return { reports: [], isAdmin: false };
  }
};

export default async function ModerationPage(): Promise<React.ReactElement> {
  const { reports, isAdmin } = await fetchReports();
  return <ModerationView initialReports={reports} isAdmin={isAdmin} />;
}

import type { Metadata } from 'next';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { AnalyticsView } from '@/components/author/AnalyticsView';
import type { DashboardMetrics } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Analytics',
  description: 'Your writing performance metrics.',
};

const fetchMetrics = async (): Promise<{ metrics: DashboardMetrics | null; isAuthed: boolean }> => {
  if (!isSupabaseConfigured()) return { metrics: null, isAuthed: false };
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { metrics: null, isAuthed: false };
    const [{ count: totalWritings }, { count: totalFollowers }] = await Promise.all([
      supabase.from('writings').select('id', { count: 'exact', head: true }).eq('author_id', user.id),
      supabase.from('follows').select('id', { count: 'exact', head: true }).eq('author_id', user.id),
    ]);
    return {
      metrics: {
        total_writings: totalWritings ?? 0,
        total_reads: 0,
        total_followers: totalFollowers ?? 0,
        total_earnings: 0,
        reads_by_day: [],
      },
      isAuthed: true,
    };
  } catch {
    return { metrics: null, isAuthed: false };
  }
};

export default async function AnalyticsPage(): Promise<React.ReactElement> {
  const { metrics, isAuthed } = await fetchMetrics();
  return <AnalyticsView initialMetrics={metrics} isAuthed={isAuthed} />;
}

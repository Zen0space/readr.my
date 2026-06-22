import type { Metadata } from 'next';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { CommandCenterView } from '@/components/admin/CommandCenterView';

export const metadata: Metadata = {
  title: 'Command Center',
  description: 'Platform-wide overview for admins.',
};

const fetchKpis = async (): Promise<{ metrics: { totalUsers: number; totalStories: number; totalReports: number; totalCoins: number } | null; isAdmin: boolean }> => {
  if (!isSupabaseConfigured()) return { metrics: null, isAdmin: false };
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { metrics: null, isAdmin: false };
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    if (profile?.role !== 'admin') return { metrics: null, isAdmin: false };
    const [
      { count: totalUsers },
      { count: totalStories },
      { count: totalReports },
      { data: wallets },
    ] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('writings').select('id', { count: 'exact', head: true }),
      supabase.from('reports').select('id', { count: 'exact', head: true }).neq('status', 'resolved'),
      supabase.from('wallets').select('coin_balance'),
    ]);
    const totalCoins = (wallets ?? []).reduce(
      (sum: number, w: { coin_balance: number | null }) => sum + (w.coin_balance ?? 0),
      0,
    );
    return {
      metrics: {
        totalUsers: totalUsers ?? 0,
        totalStories: totalStories ?? 0,
        totalReports: totalReports ?? 0,
        totalCoins,
      },
      isAdmin: true,
    };
  } catch {
    return { metrics: null, isAdmin: false };
  }
};

export default async function AdminHomePage(): Promise<React.ReactElement> {
  const { metrics, isAdmin } = await fetchKpis();
  return <CommandCenterView initialMetrics={metrics} isAdmin={isAdmin} />;
}

import type { Metadata } from 'next';
import { AnalyticsView } from '@/components/author/AnalyticsView';
import type { DashboardMetrics } from '@auror/shared/api';

export const metadata: Metadata = {
  title: 'Analytics',
  description: 'Your writing performance metrics.',
};

const fetchDashboard = async (
  baseUrl: string,
): Promise<{ metrics: DashboardMetrics | null; isAuthed: boolean }> => {
  try {
    const sessionRes = await fetch(`${baseUrl}/api/auth/session`, { cache: 'no-store' });
    if (!sessionRes.ok) return { metrics: null, isAuthed: false };
    const session = (await sessionRes.json()) as { authenticated?: boolean };
    if (!session.authenticated) return { metrics: null, isAuthed: false };

    const dashRes = await fetch(`${baseUrl}/api/v1/me/dashboard`, { cache: 'no-store' });
    if (!dashRes.ok) return { metrics: null, isAuthed: true };
    const body = (await dashRes.json()) as { metrics: DashboardMetrics };
    return { metrics: body.metrics, isAuthed: true };
  } catch {
    return { metrics: null, isAuthed: false };
  }
};

export default async function AnalyticsPage(): Promise<React.ReactElement> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  const { metrics, isAuthed } = await fetchDashboard(baseUrl);
  return <AnalyticsView initialMetrics={metrics} isAuthed={isAuthed} />;
}
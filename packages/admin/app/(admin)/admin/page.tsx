import type { Metadata } from 'next';
import { CommandCenterView } from '@/components/admin/CommandCenterView';
import type { DashboardMetrics } from '@auror/shared/api';

export const metadata: Metadata = {
  title: 'Admin Command Center',
  description: 'Platform health and revenue overview.',
};

const fetchDashboard = async (
  baseUrl: string,
): Promise<{ metrics: DashboardMetrics | null }> => {
  try {
    const res = await fetch(`${baseUrl}/api/v1/admin/dashboard`, { cache: 'no-store' });
    if (!res.ok) return { metrics: null };
    const body = (await res.json()) as { metrics: DashboardMetrics };
    return { metrics: body.metrics };
  } catch {
    return { metrics: null };
  }
};

export default async function CommandCenterPage(): Promise<React.ReactElement> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  const { metrics } = await fetchDashboard(baseUrl);
  return <CommandCenterView initialMetrics={metrics} />;
}
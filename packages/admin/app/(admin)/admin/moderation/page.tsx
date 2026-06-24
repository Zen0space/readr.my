import type { Metadata } from 'next';
import { ModerationView } from '@/components/admin/ModerationView';
import type { AdminReport } from '@auror/shared/api';

export const metadata: Metadata = {
  title: 'Moderation',
  description: 'Review and resolve user reports.',
};

const fetchReports = async (
  baseUrl: string,
): Promise<{ reports: AdminReport[] }> => {
  try {
    const res = await fetch(`${baseUrl}/api/v1/admin/reports?status=open`, { cache: 'no-store' });
    if (!res.ok) return { reports: [] };
    const body = (await res.json()) as { items: AdminReport[] };
    return { reports: body.items ?? [] };
  } catch {
    return { reports: [] };
  }
};

export default async function ModerationPage(): Promise<React.ReactElement> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  const { reports } = await fetchReports(baseUrl);
  return <ModerationView initialReports={reports} />;
}
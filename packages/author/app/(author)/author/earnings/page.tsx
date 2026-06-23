import type { Metadata } from 'next';
import { EarningsView } from '@/components/author/EarningsView';

export const metadata: Metadata = {
  title: 'Earnings & Payout',
  description: 'Your earnings and payout history.',
};

type EarningsBucket = {
  bucket: string;
  source: 'coin' | 'sub';
  gross_coins: number;
  author_cut_coins: number;
  author_cut_rm_cents: number;
};

const fetchEarnings = async (baseUrl: string): Promise<{
  buckets: EarningsBucket[];
  coinsPerRm: number;
  isAuthed: boolean;
}> => {
  try {
    const sessionRes = await fetch(`${baseUrl}/api/auth/session`, { cache: 'no-store' });
    if (!sessionRes.ok) return { buckets: [], coinsPerRm: 10, isAuthed: false };
    const session = (await sessionRes.json()) as { authenticated?: boolean };
    if (!session.authenticated) return { buckets: [], coinsPerRm: 10, isAuthed: false };

    const res = await fetch(`${baseUrl}/api/v1/me/earnings?days=90&period=day`, {
      cache: 'no-store',
    });
    if (!res.ok) return { buckets: [], coinsPerRm: 10, isAuthed: true };
    const body = (await res.json()) as { buckets: EarningsBucket[]; coins_per_rm: number };
    return { buckets: body.buckets, coinsPerRm: body.coins_per_rm, isAuthed: true };
  } catch {
    return { buckets: [], coinsPerRm: 10, isAuthed: false };
  }
};

export default async function EarningsPage(): Promise<React.ReactElement> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  const { buckets, coinsPerRm, isAuthed } = await fetchEarnings(baseUrl);
  return (
    <EarningsView
      initialBuckets={buckets}
      coinsPerRm={coinsPerRm}
      isAuthed={isAuthed}
    />
  );
}
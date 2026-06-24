import type { Metadata } from 'next';
import { SubscriptionView } from '@/components/reader/SubscriptionView';
import type { Subscription } from '@auror/shared/api';

export const metadata: Metadata = {
  title: 'Subscription',
  description: 'Manage your Auror subscription plan.',
};

const fetchSubscription = async (baseUrl: string): Promise<{
  sub: Subscription;
  isAuthed: boolean;
}> => {
  try {
    const sessionRes = await fetch(`${baseUrl}/api/auth/session`, { cache: 'no-store' })
    if (!sessionRes.ok) return { sub: null, isAuthed: false }
    const session = (await sessionRes.json()) as { authenticated?: boolean }
    if (!session.authenticated) return { sub: null, isAuthed: false }
    return { sub: null, isAuthed: true }
  } catch {
    return { sub: null, isAuthed: false }
  }
}

export default async function SubscriptionPage(): Promise<React.ReactElement> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? ''
  const { sub, isAuthed } = await fetchSubscription(baseUrl)
  return <SubscriptionView initialSubscription={sub} isAuthed={isAuthed} />
}
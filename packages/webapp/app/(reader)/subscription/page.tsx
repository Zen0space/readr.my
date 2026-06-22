import type { Metadata } from 'next';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { SubscriptionView } from '@/components/reader/SubscriptionView';
import type { Subscription } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Subscription',
  description: 'Manage your Auror subscription plan.',
};

const fetchSubscription = async (): Promise<{ sub: Subscription; isAuthed: boolean }> => {
  if (!isSupabaseConfigured()) return { sub: null, isAuthed: false };
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { sub: null, isAuthed: false };
    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('ends_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    return { sub: data as Subscription, isAuthed: true };
  } catch {
    return { sub: null, isAuthed: false };
  }
};

export default async function SubscriptionPage(): Promise<React.ReactElement> {
  const { sub, isAuthed } = await fetchSubscription();
  return <SubscriptionView initialSubscription={sub} isAuthed={isAuthed} />;
}

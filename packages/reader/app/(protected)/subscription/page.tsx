import type { Metadata } from 'next';
import { SubscriptionView } from '@/components/reader/SubscriptionView';
import { ErrorBanner } from '@/components/ui';
import { meApiClient } from '@/lib/api/serverClient';
import { createServerComponentClient, isSupabaseConfigured } from '@/lib/supabase';
import { parseFetchError } from '@/lib/errors';

export const metadata: Metadata = {
  title: 'Subscription',
  description: 'Manage your Auror subscription plan.',
};

const resolveAccessToken = async (): Promise<string | null> => {
  if (!isSupabaseConfigured()) return null
  try {
    const supabase = await createServerComponentClient()
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ?? null
  } catch {
    return null
  }
}

export default async function SubscriptionPage(): Promise<React.ReactElement> {
  // The (protected) layout has already verified auth. We pull the user's
  // join date (`created_at`) from `/v1/me` server-side so the "Member
  // since" stat can show real data on first paint — the BFF subscription
  // fetch stays client-side because it carries mutable state (renewal).
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? ''
  const accessToken = await resolveAccessToken()

  let memberSince: string | null = null
  let backendError: ReturnType<typeof parseFetchError> = null
  try {
    const me = await meApiClient.get(baseUrl, { accessToken })
    memberSince = me.created_at
  } catch (err) {
    backendError = parseFetchError(err)
  }

  return (
    <div className="space-y-8">
      {backendError ? (
        <ErrorBanner error={backendError} retryHref="/subscription" />
      ) : null}
      <SubscriptionView
        initialSubscription={null}
        memberSince={memberSince}
        isAuthed={true}
      />
    </div>
  );
}
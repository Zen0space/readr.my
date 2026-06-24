import type { Metadata } from 'next';
import { WalletView } from '@/components/reader/WalletView';
import { walletApiClient } from '@/lib/api/serverClient';
import { ErrorBanner } from '@/components/ui';
import { parseFetchError } from '@/lib/errors';
import { createServerComponentClient, isSupabaseConfigured } from '@/lib/supabase';

export const metadata: Metadata = {
  title: 'Wallet',
  description: 'Top up coins and manage your earnings.',
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

export default async function WalletPage(): Promise<React.ReactElement> {
  // We're inside the (protected) layout — auth has already been verified.
  // We still need to resolve the access_token ourselves to forward it as a
  // Bearer header to the backend (server-side fetches can't piggy-back on
  // the browser's session cookie).
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? ''
  const accessToken = await resolveAccessToken()

  let balance: number | null = null
  let earnings: number | null = 0
  let backendError: ReturnType<typeof parseFetchError> = null
  try {
    const wallet = await walletApiClient.get(baseUrl, { accessToken })
    balance = wallet.coin_balance
  } catch (err) {
    backendError = parseFetchError(err)
  }

  return (
    <div className="space-y-8">
      {backendError ? (
        <ErrorBanner error={backendError} retryHref="/wallet" />
      ) : null}
      <WalletView
        initialBalance={balance}
        initialEarnings={earnings}
        isAuthed={true}
      />
    </div>
  );
}
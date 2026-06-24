import type { Metadata } from 'next';
import { WalletView } from '@/components/reader/WalletView';

export const metadata: Metadata = {
  title: 'Wallet',
  description: 'Top up coins and manage your earnings.',
};

const fetchWallet = async (baseUrl: string): Promise<{
  balance: number | null;
  earnings: number | null;
  isAuthed: boolean;
}> => {
  try {
    const sessionRes = await fetch(`${baseUrl}/api/auth/session`, { cache: 'no-store' })
    if (!sessionRes.ok) return { balance: null, earnings: null, isAuthed: false }
    const session = (await sessionRes.json()) as { authenticated?: boolean }
    if (!session.authenticated) return { balance: null, earnings: null, isAuthed: false }

    const walletRes = await fetch(`${baseUrl}/api/v1/wallet`, { cache: 'no-store' })
    if (!walletRes.ok) return { balance: 0, earnings: 0, isAuthed: true }
    const wallet = (await walletRes.json()) as { coin_balance: number }
    return { balance: wallet.coin_balance, earnings: 0, isAuthed: true }
  } catch {
    return { balance: null, earnings: null, isAuthed: false }
  }
}

export default async function WalletPage(): Promise<React.ReactElement> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? ''
  const { balance, earnings, isAuthed } = await fetchWallet(baseUrl)
  return (
    <WalletView
      initialBalance={balance}
      initialEarnings={earnings}
      isAuthed={isAuthed}
    />
  );
}
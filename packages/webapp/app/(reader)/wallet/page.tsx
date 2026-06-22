import type { Metadata } from 'next';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { WalletView } from '@/components/reader/WalletView';

export const metadata: Metadata = {
  title: 'Wallet',
  description: 'Top up coins and manage your earnings.',
};

const fetchWallet = async (): Promise<{
  balance: number | null;
  earnings: number | null;
  isAuthed: boolean;
}> => {
  if (!isSupabaseConfigured()) return { balance: null, earnings: null, isAuthed: false };
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { balance: null, earnings: null, isAuthed: false };
    const { data } = await supabase
      .from('wallets')
      .select('coin_balance, earnings_balance')
      .eq('user_id', user.id)
      .maybeSingle();
    return {
      balance: data?.coin_balance ?? 0,
      earnings: data?.earnings_balance ?? 0,
      isAuthed: true,
    };
  } catch {
    return { balance: null, earnings: null, isAuthed: false };
  }
};

export default async function WalletPage(): Promise<React.ReactElement> {
  const { balance, earnings, isAuthed } = await fetchWallet();
  return (
    <WalletView
      initialBalance={balance}
      initialEarnings={earnings}
      isAuthed={isAuthed}
    />
  );
}

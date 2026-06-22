import type { Metadata } from 'next';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { EarningsView } from '@/components/author/EarningsView';
import type { Transaction } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Earnings & Payout',
  description: 'Track your royalties and request payouts.',
};

const TransactionRowSchema = {
  id: '',
  amount: 0,
  kind: '',
  created_at: '',
} satisfies Transaction;

const fetchEarnings = async (): Promise<{
  balance: number | null;
  earnings: number | null;
  transactions: Transaction[];
  isAuthed: boolean;
}> => {
  if (!isSupabaseConfigured()) return { balance: null, earnings: null, transactions: [], isAuthed: false };
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { balance: null, earnings: null, transactions: [], isAuthed: false };
    const [{ data: wallet }, { data: tx }] = await Promise.all([
      supabase
        .from('wallets')
        .select('coin_balance, earnings_balance')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('coin_purchases')
        .select('id, amount, created_at, kind:status')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20),
    ]);
    const txs: Transaction[] = (tx ?? []).map((row: { id: string; amount: number; created_at: string; kind: string | null }) => ({
      id: row.id,
      amount: row.amount,
      kind: row.kind ?? 'transaction',
      created_at: row.created_at,
    }));
    return {
      balance: wallet?.coin_balance ?? 0,
      earnings: wallet?.earnings_balance ?? 0,
      transactions: txs.length > 0 ? txs : [TransactionRowSchema],
      isAuthed: true,
    };
  } catch {
    return { balance: null, earnings: null, transactions: [], isAuthed: false };
  }
};

export default async function EarningsPage(): Promise<React.ReactElement> {
  const { balance, earnings, transactions, isAuthed } = await fetchEarnings();
  return (
    <EarningsView
      initialBalance={balance}
      initialEarnings={earnings}
      initialTransactions={transactions}
      isAuthed={isAuthed}
    />
  );
}

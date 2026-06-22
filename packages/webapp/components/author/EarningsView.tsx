'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { Button, Card, Icon, Sheet, useSheet } from '@/components/ui';
import { useApiCall } from '@/lib/session';
import { walletApi, type Transaction } from '@/lib/api';
import { useSetAtom } from 'jotai';
import { lastApiErrorAtom } from '@/lib/session';

type Props = {
  initialBalance: number | null;
  initialEarnings: number | null;
  initialTransactions: Transaction[];
  isAuthed: boolean;
};

const formatRM = (n: number): string => `RM ${(n / 20).toFixed(2)}`;

export const EarningsView = ({
  initialBalance,
  initialEarnings,
  initialTransactions,
  isAuthed,
}: Props): React.ReactElement => {
  const [earnings, setEarnings] = useState<number | null>(initialEarnings);
  const [coinBalance, setCoinBalance] = useState<number | null>(initialBalance);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const setError = useSetAtom(lastApiErrorAtom);
  const callBalance = useApiCall(walletApi.balance);
  const callTransactions = useApiCall(walletApi.transactions);
  const callPayout = useApiCall(walletApi.requestPayout);
  const payoutSheet = useSheet('earnings-payout');

  const refresh = useCallback(async () => {
    const [b, t] = await Promise.all([callBalance(), callTransactions()]);
    if (b) {
      setCoinBalance(b.wallet.coin_balance);
      setEarnings(b.wallet.earnings_balance);
    }
    if (t) setTransactions(t.transactions);
  }, [callBalance, callTransactions]);

  const onRequestPayout = useCallback(async () => {
    const amount = Number(payoutAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setFeedback('Enter a valid amount in coins.');
      return;
    }
    setBusy(true);
    setFeedback(null);
    try {
      await callPayout(amount);
      setFeedback(`Payout request for ${amount} coins submitted.`);
      setPayoutAmount('');
      payoutSheet.close();
      await refresh();
    } catch (e) {
      setError(e);
      setFeedback(e instanceof Error ? e.message : 'Payout request failed.');
    } finally {
      setBusy(false);
    }
  }, [callPayout, payoutAmount, payoutSheet, refresh, setError]);

  if (!isAuthed) {
    return (
      <Card className="mx-auto max-w-md p-8 text-center">
        <Icon name="monetization-on" size={32} />
        <h2 className="mt-4 font-display text-xl font-bold">Sign in as an author</h2>
        <Link
          href="/login?redirect=/author/earnings"
          className="mt-4 inline-block rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
        >
          Sign in
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-on-surface">Earnings & Payout</h1>
        <p className="mt-1 text-sm text-on-surface-variant">Track your royalties and request payouts.</p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card elevated className="p-6">
          <p className="text-xs uppercase tracking-wider text-on-surface-variant">Available earnings</p>
          <p className="mt-2 font-display text-3xl font-bold text-on-surface">{earnings ?? '—'}</p>
          <p className="mt-1 text-xs text-on-surface-variant">coins</p>
          <Button onClick={payoutSheet.open} className="mt-4" fullWidth>
            <Icon name="download" size={16} />
            Request payout
          </Button>
        </Card>
        <Card className="p-6">
          <p className="text-xs uppercase tracking-wider text-on-surface-variant">Lifetime earnings</p>
          <p className="mt-2 font-display text-2xl font-bold text-on-surface">
            {formatRM(earnings ?? 0)}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-xs uppercase tracking-wider text-on-surface-variant">Coin balance</p>
          <p className="mt-2 font-display text-2xl font-bold text-on-surface">{coinBalance ?? '—'}</p>
        </Card>
      </div>

      {feedback ? (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm text-primary">
          {feedback}
        </div>
      ) : null}

      <Card className="p-6">
        <h2 className="font-display text-lg font-semibold text-on-surface">Recent transactions</h2>
        {transactions.length === 0 ? (
          <p className="mt-4 text-sm text-on-surface-variant">No transactions yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-outline-variant/30 text-xs uppercase tracking-wider text-on-surface-variant">
                <tr>
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">Type</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-outline-variant/20">
                    <td className="px-3 py-2 text-on-surface-variant">
                      {new Date(tx.created_at).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-on-surface">{tx.kind}</td>
                    <td className="px-3 py-2 text-right font-semibold text-on-surface">
                      {tx.amount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Sheet id="earnings-payout" title="Request payout">
        <div className="space-y-4">
          <p className="text-sm text-on-surface-variant">
            Available: <span className="font-semibold text-on-surface">{earnings ?? '—'}</span> coins
          </p>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Amount (coins)
            </span>
            <input
              type="number"
              min={1}
              value={payoutAmount}
              onChange={(e) => setPayoutAmount(e.currentTarget.value)}
              className="w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-4 py-2.5 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </label>
          <Button onClick={() => { void onRequestPayout(); }} isLoading={busy} fullWidth>
            Submit request
          </Button>
        </div>
      </Sheet>
    </div>
  );
};

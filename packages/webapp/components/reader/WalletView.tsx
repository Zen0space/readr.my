'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, Icon } from '@/components/ui';
import { useApiCall } from '@/lib/session';
import { walletApi } from '@/lib/api';
import { useSetAtom } from 'jotai';
import { lastApiErrorAtom } from '@/lib/session';
import { Sheet, useSheet } from '@/components/ui';

type Pack = { coins: number; price: number; popular?: boolean };

const PACKS: Pack[] = [
  { coins: 100, price: 5 },
  { coins: 500, price: 25, popular: true },
  { coins: 1000, price: 50 },
  { coins: 5000, price: 200 },
];

const formatRM = (n: number): string => `RM ${n.toFixed(2)}`;

export const WalletView = ({
  initialBalance,
  initialEarnings,
  isAuthed,
}: {
  initialBalance: number | null;
  initialEarnings: number | null;
  isAuthed: boolean;
}): React.ReactElement => {
  const [coinBalance, setCoinBalance] = useState<number | null>(initialBalance);
  const [earnings, setEarnings] = useState<number | null>(initialEarnings);
  const [busyPack, setBusyPack] = useState<number | null>(null);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const router = useRouter();
  const setError = useSetAtom(lastApiErrorAtom);
  const callBalance = useApiCall(walletApi.balance);
  const callPurchase = useApiCall(walletApi.purchase);
  const callPayout = useApiCall(walletApi.requestPayout);
  const topUpSheet = useSheet('wallet-top-up');
  const payoutSheet = useSheet('wallet-payout');

  const refresh = useCallback(async () => {
    const result = await callBalance();
    if (result) {
      setCoinBalance(result.wallet.coin_balance);
      setEarnings(result.wallet.earnings_balance);
    }
  }, [callBalance]);

  const onBuy = useCallback(
    async (coins: number, price: number) => {
      setBusyPack(coins);
      setFeedback(null);
      try {
        await callPurchase({ coins, price });
        setFeedback(`Top-up of ${coins} coins queued. Balance will refresh shortly.`);
        await refresh();
      } catch (e) {
        setError(e);
        const msg = e instanceof Error ? e.message : 'Top-up failed.';
        setFeedback(msg);
      } finally {
        setBusyPack(null);
      }
    },
    [callPurchase, refresh, setError],
  );

  const onRequestPayout = useCallback(async () => {
    const amount = Number(payoutAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setFeedback('Enter a valid amount in coins.');
      return;
    }
    try {
      await callPayout(amount);
      setFeedback(`Payout request for ${amount} coins submitted.`);
      setPayoutAmount('');
      payoutSheet.close();
    } catch (e) {
      setError(e);
      setFeedback(e instanceof Error ? e.message : 'Payout request failed.');
    }
  }, [callPayout, payoutAmount, payoutSheet, setError]);

  if (!isAuthed) {
    return (
      <Card className="mx-auto max-w-md p-8 text-center">
        <Icon name="account-balance-wallet" size={32} />
        <h2 className="mt-4 font-display text-xl font-bold">Sign in to view your wallet</h2>
        <Link
          href="/login?redirect=/wallet"
          className="mt-4 inline-block rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
        >
          Sign in
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-bold text-on-surface">Wallet</h1>
        <p className="mt-1 text-sm text-on-surface-variant">Top up coins and request payouts.</p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card elevated className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-on-surface-variant">Coin balance</p>
              <p className="mt-2 font-display text-3xl font-bold text-on-surface">
                {coinBalance ?? '—'}
              </p>
            </div>
            <Icon name="toll" size={32} className="text-primary" />
          </div>
          <button
            type="button"
            onClick={topUpSheet.open}
            className="mt-4 w-full rounded-xl bg-primary py-2 text-sm font-semibold text-white"
          >
            Top up coins
          </button>
        </Card>

        <Card elevated className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-on-surface-variant">Earnings</p>
              <p className="mt-2 font-display text-3xl font-bold text-on-surface">
                {earnings ?? '—'}
              </p>
            </div>
            <Icon name="monetization-on" size={32} className="text-primary" />
          </div>
          <button
            type="button"
            onClick={payoutSheet.open}
            className="mt-4 w-full rounded-xl border border-primary/30 bg-primary/5 py-2 text-sm font-semibold text-primary hover:bg-primary/10"
          >
            Request payout
          </button>
        </Card>
      </div>

      {feedback ? (
        <div className="rounded-xl border border-outline-variant/30 bg-surface-container p-4 text-sm text-on-surface">
          {feedback}
        </div>
      ) : null}

      <Sheet id="wallet-top-up" title="Top up coins">
        <div className="space-y-3">
          {PACKS.map((pack) => (
            <button
              key={pack.coins}
              type="button"
              onClick={() => onBuy(pack.coins, pack.price)}
              disabled={busyPack !== null}
              className="flex w-full items-center justify-between rounded-2xl border border-outline-variant/40 p-4 text-left transition-colors hover:border-primary hover:bg-primary/5 disabled:opacity-50"
            >
              <div>
                <p className="font-display text-lg font-bold text-on-surface">
                  {pack.coins.toLocaleString()} coins
                </p>
                <p className="text-xs text-on-surface-variant">{formatRM(pack.price)}</p>
              </div>
              {pack.popular ? (
                <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase text-primary">
                  Popular
                </span>
              ) : null}
            </button>
          ))}
          <p className="text-xs text-on-surface-variant">
            Payments are processed by the configured provider (Billplz / iPay88 / Stripe).
          </p>
        </div>
      </Sheet>

      <Sheet id="wallet-payout" title="Request payout">
        <div className="space-y-4">
          <p className="text-sm text-on-surface-variant">
            Available earnings: <span className="font-semibold text-on-surface">{earnings ?? '—'}</span> coins
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
          <button
            type="button"
            onClick={() => {
              void onRequestPayout();
            }}
            className="w-full rounded-xl bg-primary py-2 text-sm font-semibold text-white"
          >
            Submit request
          </button>
        </div>
      </Sheet>

      <p className="text-center text-xs text-on-surface-variant">
        <button
          type="button"
          onClick={() => {
            void refresh();
            router.refresh();
          }}
          className="hover:underline"
        >
          Refresh balance
        </button>
      </p>
    </div>
  );
};

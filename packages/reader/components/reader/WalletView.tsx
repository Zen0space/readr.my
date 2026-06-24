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
  const router = useRouter();
  const [balance, setBalance] = useState<number | null>(initialBalance);
  const [busyPack, setBusyPack] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const sheet = useSheet('wallet-topup');
  const setError = useSetAtom(lastApiErrorAtom);
  const callBalance = useApiCall(walletApi.balance);
  const callTopup = useApiCall(walletApi.topup);

  const refresh = useCallback(async () => {
    const result = await callBalance();
    if (result) setBalance(result.coin_balance);
  }, [callBalance]);

  const onTopup = useCallback(
    async (pack: Pack) => {
      setBusyPack(pack.coins);
      setFeedback(null);
      try {
        await callTopup(pack.price as 5 | 10 | 20 | 50);
        setFeedback(`Topped up ${pack.coins} coins. Complete checkout to confirm.`);
        sheet.open();
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Top-up failed.';
        setError(e);
        setFeedback(msg);
      } finally {
        setBusyPack(null);
      }
    },
    [callTopup, setError, sheet],
  );

  if (!isAuthed) {
    return (
      <Card className="mx-auto max-w-md p-8 text-center">
        <Icon name="credit-card" size={32} />
        <h2 className="mt-4 font-display text-xl font-bold">Sign in to manage your wallet</h2>
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
        <p className="mt-1 text-sm text-on-surface-variant">
          Top up coins to unlock premium chapters.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="p-6">
          <p className="text-xs uppercase tracking-wider text-on-surface-variant">Coin balance</p>
          <p className="mt-2 font-display text-3xl font-bold text-on-surface">
            {balance ?? '—'}
          </p>
          <button
            type="button"
            onClick={() => void refresh()}
            className="mt-3 text-xs font-semibold text-primary hover:underline"
          >
            Refresh
          </button>
        </Card>
        <Card className="p-6">
          <p className="text-xs uppercase tracking-wider text-on-surface-variant">Earnings (author)</p>
          <p className="mt-2 font-display text-3xl font-bold text-on-surface">
            {initialEarnings !== null ? formatRM(Number(initialEarnings)) : '—'}
          </p>
          <Link href="/author/studio" className="mt-3 inline-block text-xs font-semibold text-primary hover:underline">
            Manage earnings →
          </Link>
        </Card>
        <Card className="p-6">
          <p className="text-xs uppercase tracking-wider text-on-surface-variant">Recent activity</p>
          <p className="mt-2 text-sm text-on-surface-variant">No recent transactions.</p>
        </Card>
      </div>

      <section aria-labelledby="topup-heading">
        <h2 id="topup-heading" className="font-display text-xl font-bold text-on-surface">
          Top up coins
        </h2>
        <p className="mt-1 text-sm text-on-surface-variant">Pick a pack — checkout opens in a new tab.</p>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PACKS.map((pack) => (
            <Card
              key={pack.coins}
              className={`p-5 ${pack.popular ? 'border-primary/50 shadow-primary-glow' : ''}`}
            >
              {pack.popular ? (
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-primary">Popular</p>
              ) : null}
              <p className="font-display text-2xl font-bold text-on-surface">{pack.coins}</p>
              <p className="text-xs text-on-surface-variant">coins</p>
              <p className="mt-3 font-display text-lg font-semibold text-primary">{formatRM(pack.price)}</p>
              <button
                type="button"
                onClick={() => void onTopup(pack)}
                disabled={busyPack !== null}
                className="mt-4 w-full rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {busyPack === pack.coins ? 'Opening…' : 'Buy'}
              </button>
            </Card>
          ))}
        </div>
        {feedback ? (
          <p className="mt-4 rounded-xl border border-outline-variant/30 bg-surface-container p-3 text-sm">
            {feedback}
          </p>
        ) : null}
      </section>

      <Sheet id={sheet.open.length === 0 ? '' : 'wallet-topup'} {...sheet} title="Top-up in progress">
        <p className="text-sm">
          Your checkout was created. Pay via the Billplz link sent to your email, then come
          back here — your balance refreshes once the webhook fires.
        </p>
      </Sheet>
    </div>
  );
};
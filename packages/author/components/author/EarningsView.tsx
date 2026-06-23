'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { Card, Icon } from '@/components/ui';
import { useApiCall } from '@/lib/session';
import { walletApi } from '@/lib/api';
import { useSetAtom } from 'jotai';
import { lastApiErrorAtom } from '@/lib/session';

type Bucket = {
  bucket: string;
  source: 'coin' | 'sub';
  gross_coins: number;
  author_cut_coins: number;
  author_cut_rm_cents: number;
};

type Props = {
  initialBuckets: Bucket[];
  coinsPerRm: number;
  isAuthed: boolean;
};

const formatRM = (cents: number): string => `RM ${(cents / 100).toFixed(2)}`;

export const EarningsView = ({
  initialBuckets,
  coinsPerRm,
  isAuthed,
}: Props): React.ReactElement => {
  const [buckets, setBuckets] = useState<Bucket[]>(initialBuckets);
  const [busyAmount, setBusyAmount] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const setError = useSetAtom(lastApiErrorAtom);
  const callPayout = useApiCall(walletApi.requestPayout);

  const totalRmCents = buckets.reduce((acc, b) => acc + b.author_cut_rm_cents, 0);

  const onRequestPayout = useCallback(
    async () => {
      // Minimum payout: 100 coins → ~ RM 10 at the default 10 coins/RM rate.
      const minCoins = 100
      if (!window.confirm(`Request payout for ${minCoins} coins (~ ${formatRM(Math.floor((minCoins / coinsPerRm) * 100))})?`)) return
      setBusyAmount(minCoins)
      setFeedback(null)
      try {
        await callPayout(minCoins, 'bank-transfer-pending-setup')
        setFeedback(`Payout request submitted for ${minCoins} coins.`)
      } catch (e) {
        setError(e)
        const msg = e instanceof Error ? e.message : 'Payout request failed.'
        setFeedback(msg)
      } finally {
        setBusyAmount(null)
      }
    },
    [callPayout, coinsPerRm, setError],
  )

  if (!isAuthed) {
    return (
      <Card className="mx-auto max-w-md p-8 text-center">
        <Icon name="monetization-on" size={32} />
        <h2 className="mt-4 font-display text-xl font-bold">Sign in to see your earnings</h2>
        <Link
          href="/login?redirect=/author/earnings"
          className="mt-4 inline-block rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
        >
          Sign in
        </Link>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-on-surface">Earnings &amp; Payout</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Daily breakdown of coin unlocks + author subscriptions over the last 90 days.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-6">
          <p className="text-xs uppercase tracking-wider text-on-surface-variant">Available to cash out</p>
          <p className="mt-2 font-display text-3xl font-bold text-on-surface">
            {formatRM(totalRmCents)}
          </p>
          <button
            type="button"
            onClick={() => void onRequestPayout()}
            disabled={busyAmount !== null || totalRmCents < 1000}
            className="mt-4 w-full rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busyAmount !== null ? 'Submitting…' : 'Request payout'}
          </button>
        </Card>
        <Card className="p-6">
          <p className="text-xs uppercase tracking-wider text-on-surface-variant">Coins earned (90d)</p>
          <p className="mt-2 font-display text-3xl font-bold text-on-surface">
            {buckets.reduce((acc, b) => acc + b.author_cut_coins, 0).toLocaleString('en-US')}
          </p>
          <p className="mt-1 text-xs text-on-surface-variant">Your 70% cut.</p>
        </Card>
        <Card className="p-6">
          <p className="text-xs uppercase tracking-wider text-on-surface-variant">Payout method</p>
          <p className="mt-2 text-sm text-on-surface">
            Configure in <Link href="/author/settings" className="text-primary hover:underline">Settings</Link>.
          </p>
        </Card>
      </div>

      {feedback ? (
        <div className="rounded-xl border border-outline-variant/30 bg-surface-container p-4 text-sm">
          {feedback}
        </div>
      ) : null}

      <section>
        <h2 className="font-display text-lg font-semibold text-on-surface">Daily earnings</h2>
        {buckets.length === 0 ? (
          <Card className="mt-3 p-8 text-center text-sm text-on-surface-variant">
            No earnings yet. Publish a story to start earning.
          </Card>
        ) : (
          <Card className="mt-3 p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface-container">
                <tr className="text-left text-xs uppercase tracking-wider text-on-surface-variant">
                  <th className="px-4 py-2">Day</th>
                  <th className="px-4 py-2">Source</th>
                  <th className="px-4 py-2 text-right">Gross coins</th>
                  <th className="px-4 py-2 text-right">Your cut (coins)</th>
                  <th className="px-4 py-2 text-right">Your cut (RM)</th>
                </tr>
              </thead>
              <tbody>
                {buckets.slice(-30).map((b, i) => (
                  <tr key={`${b.bucket}-${b.source}-${i}`} className="border-t border-outline-variant/20">
                    <td className="px-4 py-2">{b.bucket}</td>
                    <td className="px-4 py-2 capitalize">{b.source}</td>
                    <td className="px-4 py-2 text-right">{b.gross_coins.toLocaleString('en-US')}</td>
                    <td className="px-4 py-2 text-right">{b.author_cut_coins.toLocaleString('en-US')}</td>
                    <td className="px-4 py-2 text-right">{formatRM(b.author_cut_rm_cents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </section>
    </div>
  );
};
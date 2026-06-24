'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Card, Icon, Sheet, useSheet, type IconName } from '@/components/ui';
import { useApiCall, lastApiErrorAtom } from '@/lib/session';
import { walletApi } from '@/lib/api';
import { useSetAtom } from 'jotai';

type Pack = { coins: number; price: number; popular?: boolean };

const PACKS: Pack[] = [
  { coins: 100, price: 5 },
  { coins: 500, price: 25, popular: true },
  { coins: 1000, price: 50 },
  { coins: 5000, price: 200 },
];

const formatRM = (n: number): string => `RM ${n.toFixed(2)}`;

type Palette = {
  bg: string;
  iconBg: string;
  iconText: string;
  ring: string;
  bar: string;
};

const PALETTES: Record<string, Palette> = {
  amber: {
    bg: 'from-amber-400 to-orange-500',
    iconBg: 'bg-amber-100 dark:bg-amber-950/60',
    iconText: 'text-amber-600 dark:text-amber-300',
    ring: 'ring-amber-200 dark:ring-amber-900/60',
    bar: 'from-amber-400 to-orange-500',
  },
  emerald: {
    bg: 'from-emerald-400 to-teal-600',
    iconBg: 'bg-emerald-100 dark:bg-emerald-950/60',
    iconText: 'text-emerald-600 dark:text-emerald-300',
    ring: 'ring-emerald-200 dark:ring-emerald-900/60',
    bar: 'from-emerald-400 to-teal-500',
  },
  rose: {
    bg: 'from-rose-400 to-pink-600',
    iconBg: 'bg-rose-100 dark:bg-rose-950/60',
    iconText: 'text-rose-600 dark:text-rose-300',
    ring: 'ring-rose-200 dark:ring-rose-900/60',
    bar: 'from-rose-400 to-pink-500',
  },
  violet: {
    bg: 'from-violet-500 to-indigo-600',
    iconBg: 'bg-violet-100 dark:bg-violet-950/60',
    iconText: 'text-violet-600 dark:text-violet-300',
    ring: 'ring-violet-200 dark:ring-violet-900/60',
    bar: 'from-violet-500 to-indigo-500',
  },
};

const StatTile = ({
  icon,
  label,
  value,
  hint,
  palette,
  action,
}: {
  icon: IconName;
  label: string;
  value: string | number;
  hint?: string;
  palette: Palette;
  action?: { label: string; onClick?: () => void; href?: string };
}): React.ReactElement => {
  const actionClass =
    'mt-3 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-on-surface-variant transition-colors hover:text-primary';
  const inner = (
    <Card className="group relative h-full overflow-hidden p-5 transition-all hover:-translate-y-1 hover:shadow-card-elevated">
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br opacity-20 blur-2xl transition-opacity group-hover:opacity-40 ${palette.bg}`}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
            {label}
          </p>
          <p className="mt-1.5 font-display text-3xl font-bold leading-none tracking-tight text-on-surface">
            {value}
          </p>
          {hint ? (
            <p className="mt-2 text-xs text-on-surface-variant">{hint}</p>
          ) : null}
          {action ? (
            action.href ? (
              <Link href={action.href} className={actionClass}>
                {action.label}
                <Icon name="arrow-right" size={12} />
              </Link>
            ) : (
              <button type="button" onClick={action.onClick} className={actionClass}>
                {action.label}
                <Icon name="arrow-right" size={12} />
              </button>
            )
          ) : null}
        </div>
        <span
          className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ${palette.iconBg} ${palette.iconText} ${palette.ring}`}
        >
          <Icon name={icon} size={20} />
        </span>
      </div>
      <div className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-surface-container-high">
        <div className={`h-full w-3/4 rounded-full bg-gradient-to-r ${palette.bar}`} />
      </div>
    </Card>
  );
  return inner;
};

const PackCard = ({
  pack,
  busy,
  onTopup,
}: {
  pack: Pack;
  busy: boolean;
  onTopup: (pack: Pack) => void;
}): React.ReactElement => (
  <Card
    className={
      pack.popular
        ? 'group relative overflow-hidden p-6 ring-2 ring-violet-400/60 transition-all hover:-translate-y-1 hover:shadow-card-elevated'
        : 'group relative overflow-hidden p-6 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-card-elevated'
    }
  >
    {pack.popular ? (
      <>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-500/5 via-fuchsia-500/5 to-orange-400/5"
        />
        <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm shadow-violet-500/30">
          <Icon name="star" size={10} />
          Popular
        </span>
      </>
    ) : null}

    <div className="relative">
      <span
        className={
          pack.popular
            ? 'inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md ring-1 ring-white/20'
            : 'inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-md ring-1 ring-white/20'
        }
      >
        <Icon name="circle" size={22} />
      </span>
      <div className="mt-5">
        <p className="font-display text-3xl font-bold leading-none tracking-tight text-on-surface">
          {pack.coins.toLocaleString()}
        </p>
        <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
          coins
        </p>
      </div>
      <div className="mt-5 flex items-end justify-between gap-3 border-t border-outline-variant/20 pt-4">
        <p className="font-display text-xl font-bold text-on-surface">
          {formatRM(pack.price)}
        </p>
        <button
          type="button"
          onClick={() => onTopup(pack)}
          disabled={busy}
          className={
            pack.popular
              ? 'inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-violet-500/30 transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-violet-500/40 disabled:opacity-50'
              : 'inline-flex items-center gap-1.5 rounded-full border border-outline-variant/40 bg-surface-container-lowest px-4 py-2 text-xs font-semibold text-on-surface transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary disabled:opacity-50'
          }
        >
          {busy ? 'Opening…' : 'Buy'}
          <Icon name="arrow-right" size={12} />
        </button>
      </div>
    </div>
  </Card>
);

export const WalletView = ({
  initialBalance,
  initialEarnings,
  isAuthed,
}: {
  initialBalance: number | null;
  initialEarnings: number | null;
  isAuthed: boolean;
}): React.ReactElement => {
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
        <Icon name="credit-card" size={32} className="mx-auto text-primary" />
        <h2 className="mt-4 font-display text-xl font-bold text-on-surface">
          Sign in to manage your wallet
        </h2>
        <Link
          href="/login?redirect=/wallet"
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-500/20 transition-all hover:-translate-y-0.5"
        >
          Sign in
          <Icon name="arrow-right" size={14} />
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-12">
      {/* Stats row — color-coded tiles, one palette per metric */}
      <section aria-label="Wallet snapshot">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            icon="circle"
            label="Coin balance"
            value={balance ?? '—'}
            hint={
              balance === null
                ? 'Loading…'
                : balance === 0
                  ? 'Top up to unlock chapters'
                  : 'Ready to spend'
            }
            palette={PALETTES.amber}
            action={{ label: 'Refresh', onClick: () => void refresh() }}
          />
          <StatTile
            icon="bar-chart"
            label="Earnings"
            value={initialEarnings !== null ? formatRM(Number(initialEarnings)) : '—'}
            hint="From your published chapters"
            palette={PALETTES.emerald}
            action={{ label: 'Manage', href: '/author/studio' }}
          />
          <StatTile
            icon="credit-card"
            label="Top-ups"
            value={PACKS.length}
            hint="Pick a pack below"
            palette={PALETTES.violet}
          />
          <StatTile
            icon="zap"
            label="Spent this month"
            value="RM 0.00"
            hint="No transactions yet"
            palette={PALETTES.rose}
          />
        </div>
      </section>

      {/* Top-up section */}
      <section aria-labelledby="topup-heading" className="space-y-6">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">
            Top up
          </p>
          <h2
            id="topup-heading"
            className="font-display text-2xl font-bold text-on-surface md:text-3xl"
          >
            Pick a coin pack
          </h2>
          <p className="mt-2 max-w-xl text-sm text-on-surface-variant">
            Pick a pack and checkout opens in a new tab. Your balance refreshes once the
            payment confirms.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PACKS.map((pack) => (
            <PackCard
              key={pack.coins}
              pack={pack}
              busy={busyPack === pack.coins}
              onTopup={(p) => void onTopup(p)}
            />
          ))}
        </div>
        {feedback ? (
          <Card className="p-4">
            <p className="text-sm text-on-surface">{feedback}</p>
          </Card>
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
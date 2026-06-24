'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { Card, Icon, Skeleton, type IconName } from '@/components/ui';
import { useApiCall, lastApiErrorAtom } from '@/lib/session';
import { subscriptionApi, type SubscriptionTier } from '@/lib/api';
import { useSetAtom } from 'jotai';
import type { Subscription } from '@auror/shared/api';

type Plan = {
  id: SubscriptionTier;
  name: string;
  tagline: string;
  price: string;
  period: string;
  features: string[];
  highlight?: boolean;
  icon: IconName;
};

const PLANS: Plan[] = [
  {
    id: 'premium_reader',
    name: 'Premium Reader',
    tagline: 'For readers who finish a chapter a night.',
    price: 'RM 19.90',
    period: 'per month',
    icon: 'book-open',
    highlight: true,
    features: [
      'Unlock all premium chapters',
      'Ad-free reading',
      'Early access to new releases',
      'Sync across devices',
    ],
  },
  {
    id: 'vip_reader',
    name: 'VIP Reader',
    tagline: 'For the readers who keep an author in business.',
    price: 'RM 39.90',
    period: 'per month',
    icon: 'award',
    features: [
      'Everything in Premium',
      'Monthly coin allowance (1 000)',
      'Priority support',
      'Beta access to new features',
    ],
  },
];

type Palette = {
  bg: string;
  iconBg: string;
  iconText: string;
  ring: string;
  bar: string;
  halo: string;
};

const PALETTES: Record<string, Palette> = {
  violet: {
    bg: 'from-violet-500 to-indigo-600',
    iconBg: 'bg-violet-100 dark:bg-violet-950/60',
    iconText: 'text-violet-600 dark:text-violet-300',
    ring: 'ring-violet-200 dark:ring-violet-900/60',
    bar: 'from-violet-500 to-indigo-500',
    halo: 'bg-violet-500/10',
  },
  emerald: {
    bg: 'from-emerald-400 to-teal-600',
    iconBg: 'bg-emerald-100 dark:bg-emerald-950/60',
    iconText: 'text-emerald-600 dark:text-emerald-300',
    ring: 'ring-emerald-200 dark:ring-emerald-900/60',
    bar: 'from-emerald-400 to-teal-500',
    halo: 'bg-emerald-500/10',
  },
  amber: {
    bg: 'from-amber-400 to-orange-500',
    iconBg: 'bg-amber-100 dark:bg-amber-950/60',
    iconText: 'text-amber-600 dark:text-amber-300',
    ring: 'ring-amber-200 dark:ring-amber-900/60',
    bar: 'from-amber-400 to-orange-500',
    halo: 'bg-amber-500/10',
  },
  rose: {
    bg: 'from-rose-400 to-pink-600',
    iconBg: 'bg-rose-100 dark:bg-rose-950/60',
    iconText: 'text-rose-600 dark:text-rose-300',
    ring: 'ring-rose-200 dark:ring-rose-900/60',
    bar: 'from-rose-400 to-pink-500',
    halo: 'bg-rose-500/10',
  },
};

const PlanCard = ({
  plan,
  isCurrent,
  busy,
  onSubscribe,
}: {
  plan: Plan;
  isCurrent: boolean;
  busy: boolean;
  onSubscribe: (tier: SubscriptionTier) => void;
}): React.ReactElement => {
  const palette = plan.highlight ? PALETTES.violet : PALETTES.emerald

  return (
    <Card
      className={
        plan.highlight
          ? 'group relative h-full overflow-hidden p-6 ring-2 ring-violet-400/60 transition-all hover:-translate-y-1 hover:shadow-card-elevated'
          : 'group relative h-full overflow-hidden p-6 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-card-elevated'
      }
    >
      {plan.highlight ? (
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
          className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-md ring-1 ring-white/20 transition-transform group-hover:scale-110 ${palette.bg}`}
        >
          <Icon name={plan.icon} size={22} />
        </span>

        <h3 className="mt-5 font-display text-xl font-bold text-on-surface">{plan.name}</h3>
        <p className="mt-1 text-xs text-on-surface-variant">{plan.tagline}</p>

        <div className="mt-5 flex items-baseline gap-1.5">
          <span className="font-display text-3xl font-bold leading-none tracking-tight text-on-surface">
            {plan.price}
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            {plan.period}
          </span>
        </div>

        <ul className="mt-6 space-y-2.5">
          {plan.features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm text-on-surface">
              <span
                className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${palette.bg} text-white shadow-sm`}
              >
                <Icon name="check" size={12} />
              </span>
              <span>{f}</span>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => onSubscribe(plan.id)}
          disabled={busy}
          className={
            plan.highlight
              ? 'mt-6 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 py-3 text-sm font-semibold text-white shadow-sm shadow-violet-500/30 transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-violet-500/40 disabled:opacity-50'
              : isCurrent
                ? 'mt-6 inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-outline-variant/40 bg-surface-container-lowest py-3 text-sm font-semibold text-on-surface transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:text-emerald-600 disabled:opacity-50'
                : 'mt-6 inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-outline-variant/40 bg-surface-container-lowest py-3 text-sm font-semibold text-on-surface transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:text-emerald-600 disabled:opacity-50'
          }
        >
          {busy ? (
            <>
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Subscribing…
            </>
          ) : isCurrent ? (
            <>
              <Icon name="check-circle" size={14} />
              Current plan
            </>
          ) : (
            <>
              Subscribe
              <Icon name="arrow-right" size={14} />
            </>
          )}
        </button>
      </div>
    </Card>
  );
};

const StatTile = ({
  icon,
  label,
  value,
  hint,
  palette,
}: {
  icon: IconName;
  label: string;
  value: string;
  hint?: string;
  palette: Palette;
}): React.ReactElement => (
  <Card className="group relative overflow-hidden p-5 transition-all hover:-translate-y-1 hover:shadow-card-elevated">
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br opacity-20 blur-2xl transition-opacity group-hover:opacity-40 ${palette.bg}`}
    />
    <div className="relative flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
          {label}
        </p>
        <p className="mt-1.5 font-display text-2xl font-bold leading-tight tracking-tight text-on-surface">
          {value}
        </p>
        {hint ? (
          <p className="mt-2 text-xs text-on-surface-variant">{hint}</p>
        ) : null}
      </div>
      <span
        className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ${palette.iconBg} ${palette.iconText} ${palette.ring}`}
      >
        <Icon name={icon} size={20} />
      </span>
    </div>
    <div className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-surface-container-high">
      <div className={`h-full w-2/3 rounded-full bg-gradient-to-r ${palette.bar}`} />
    </div>
  </Card>
);

type Props = {
  initialSubscription: Subscription | null;
  /**
   * ISO string from `/v1/me`. Supabase is the source of truth for the
   * user's join date — the subscription record only knows when the
   * current tier started, which isn't the same thing.
   */
  memberSince: string | null;
  isAuthed: boolean;
};

export const SubscriptionView = ({
  initialSubscription,
  memberSince,
  isAuthed,
}: Props): React.ReactElement => {
  const [sub, setSub] = useState<Subscription | null>(initialSubscription);
  const [busyTier, setBusyTier] = useState<SubscriptionTier | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const setError = useSetAtom(lastApiErrorAtom);
  const callCurrent = useApiCall(subscriptionApi.current);
  const callSubscribe = useApiCall(subscriptionApi.subscribe);

  const onSubscribe = useCallback(
    async (tier: SubscriptionTier) => {
      setBusyTier(tier);
      setFeedback(null);
      try {
        await callSubscribe(tier);
        const refreshed = await callCurrent();
        if (refreshed) setSub(refreshed.subscription);
        setFeedback(`Subscribed to ${tier.replace('_', ' ')}.`);
      } catch (e) {
        // useApiCall already pushed to lastApiErrorAtom for the global toast;
        // we keep an inline message here so the user gets feedback in-place.
        setFeedback(e instanceof Error ? e.message : 'Subscription failed.');
      } finally {
        setBusyTier(null);
      }
    },
    [callSubscribe, callCurrent, setError],
  );

  if (!isAuthed) {
    return (
      <Card className="mx-auto max-w-md p-8 text-center">
        <Icon name="award" size={32} className="mx-auto text-primary" />
        <h2 className="mt-4 font-display text-xl font-bold text-on-surface">
          Sign in to manage your subscription
        </h2>
        <Link
          href="/login?redirect=/subscription"
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-500/20 transition-all hover:-translate-y-0.5"
        >
          Sign in
          <Icon name="arrow-right" size={14} />
        </Link>
      </Card>
    );
  }

  const isActive = sub !== null && sub.status === 'active';
  const currentTier = sub?.tier ?? null;

  return (
    <div className="space-y-12">
      {/* Stats row — same color-coded tiles as the wallet/dashboard */}
      <section aria-label="Subscription snapshot">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            icon="award"
            label="Current plan"
            value={isActive && sub ? sub.tier.replace('_', ' ') : 'Free'}
            hint={isActive ? 'Subscription active' : 'No active subscription'}
            palette={PALETTES.violet}
          />
          <StatTile
            icon="check-circle"
            label="Status"
            value={isActive ? 'Active' : 'Inactive'}
            hint={
              isActive && sub?.ends_at
                ? `Renews ${new Date(sub.ends_at).toLocaleDateString()}`
                : 'Pick a plan to upgrade'
            }
            palette={isActive ? PALETTES.emerald : PALETTES.amber}
          />
          <StatTile
            icon="book-open"
            label="Available plans"
            value={String(PLANS.length)}
            hint="Premium & VIP tiers"
            palette={PALETTES.amber}
          />
          <StatTile
            icon="zap"
            label="Member since"
            value={
              memberSince
                ? new Date(memberSince).toLocaleDateString(undefined, {
                    month: 'short',
                    year: 'numeric',
                  })
                : '—'
            }
            hint={memberSince ? 'Welcome aboard' : 'Subscribe to begin'}
            palette={PALETTES.rose}
          />
        </div>
      </section>

      {/* Current plan highlight */}
      {isActive && sub ? (
        <section aria-labelledby="current-plan-heading">
          <div className="mb-6">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">
              Your plan
            </p>
            <h2
              id="current-plan-heading"
              className="font-display text-2xl font-bold text-on-surface md:text-3xl"
            >
              You’re on {sub.tier.replace('_', ' ')}
            </h2>
          </div>
          <Card className="group relative overflow-hidden p-0">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-500/5 via-fuchsia-500/5 to-orange-400/5"
            />
            <div className="relative flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between md:p-8">
              <div className="flex items-start gap-4">
                <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400 text-white shadow-lg shadow-violet-500/30">
                  <Icon name="award" size={26} />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Active subscription
                  </p>
                  <p className="mt-1 font-display text-2xl font-bold text-on-surface">
                    {sub.tier.replace('_', ' ')}
                  </p>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    {sub.ends_at
                      ? `Renews on ${new Date(sub.ends_at).toLocaleDateString()}`
                      : 'Cancels at the end of the current cycle'}
                  </p>
                </div>
              </div>
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-900/60">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Active
              </span>
            </div>
          </Card>
        </section>
      ) : null}

      {/* Plan grid */}
      <section aria-labelledby="plans-heading" className="space-y-6">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">
            Choose a plan
          </p>
          <h2
            id="plans-heading"
            className="font-display text-2xl font-bold text-on-surface md:text-3xl"
          >
            Pick what fits how you read
          </h2>
          <p className="mt-2 max-w-xl text-sm text-on-surface-variant">
            Unlock premium chapters, sync across devices, and support the writers you love.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {PLANS.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isCurrent={currentTier === plan.id && isActive}
              busy={busyTier === plan.id}
              onSubscribe={(tier) => void onSubscribe(tier)}
            />
          ))}
        </div>
        {feedback ? (
          <Card className="p-4">
            <p className="text-sm text-on-surface">{feedback}</p>
          </Card>
        ) : null}
        {!sub ? <Skeleton className="h-32 w-full" /> : null}
      </section>
    </div>
  );
};
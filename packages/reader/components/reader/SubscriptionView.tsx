'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { Card, Icon, Skeleton } from '@/components/ui';
import { useApiCall } from '@/lib/session';
import { subscriptionApi, type SubscriptionTier } from '@/lib/api';
import { useSetAtom } from 'jotai';
import { lastApiErrorAtom } from '@/lib/session';
import type { Subscription } from '@auror/shared/api';

type Plan = {
  id: SubscriptionTier;
  name: string;
  price: string;
  features: string[];
  highlight?: boolean;
};

const PLANS: Plan[] = [
  {
    id: 'premium_reader',
    name: 'Premium Reader',
    price: 'RM 19.90/mo',
    features: [
      'Unlock all premium chapters',
      'Ad-free reading',
      'Early access to new releases',
    ],
    highlight: true,
  },
  {
    id: 'vip_reader',
    name: 'VIP Reader',
    price: 'RM 39.90/mo',
    features: [
      'Everything in Premium',
      'Monthly coin allowance (1 000)',
      'Priority support',
    ],
  },
];

type Props = {
  initialSubscription: Subscription;
  isAuthed: boolean;
};

export const SubscriptionView = ({ initialSubscription, isAuthed }: Props): React.ReactElement => {
  const [sub, setSub] = useState<Subscription>(initialSubscription);
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
        setError(e);
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
        <Icon name="award" size={32} />
        <h2 className="mt-4 font-display text-xl font-bold">Sign in to manage your subscription</h2>
        <Link
          href="/login?redirect=/subscription"
          className="mt-4 inline-block rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
        >
          Sign in
        </Link>
      </Card>
    );
  }

  const isActive = sub !== null && sub.status === 'active';
  const currentTier = sub?.tier ?? null;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-bold text-on-surface">Subscription</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Choose a plan that fits how you read.
        </p>
      </header>

      {isActive && sub ? (
        <Card elevated className="border-primary/30 p-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-on-surface-variant">Current plan</p>
              <p className="mt-1 font-display text-2xl font-bold text-on-surface">
                {sub.tier.replace('_', ' ')}
              </p>
              <p className="mt-1 text-xs text-on-surface-variant">
                Ends {sub.ends_at ? new Date(sub.ends_at).toLocaleDateString() : 'when cancelled'}
              </p>
            </div>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              Active
            </span>
          </div>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {PLANS.map((plan) => {
          const isCurrent = currentTier === plan.id && isActive;
          return (
            <Card
              key={plan.id}
              elevated={plan.highlight}
              className={plan.highlight ? 'border-primary/40 p-6' : 'p-6'}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display text-xl font-bold text-on-surface">{plan.name}</h3>
                  <p className="mt-1 text-2xl font-semibold text-primary">{plan.price}</p>
                </div>
                {plan.highlight ? (
                  <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase text-primary">
                    Popular
                  </span>
                ) : null}
              </div>
              <ul className="mt-6 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-on-surface">
                    <Icon name="check" size={16} className="text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => onSubscribe(plan.id)}
                disabled={busyTier !== null}
                className="mt-6 w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-container disabled:opacity-50"
              >
                {busyTier === plan.id ? (
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : isCurrent ? (
                  'Renew'
                ) : (
                  'Subscribe'
                )}
              </button>
            </Card>
          )
        })}
      </div>

      {feedback ? (
        <div className="rounded-xl border border-outline-variant/30 bg-surface-container p-4 text-sm">
          {feedback}
        </div>
      ) : null}

      {!sub ? <Skeleton className="h-32 w-full" /> : null}
    </div>
  );
};
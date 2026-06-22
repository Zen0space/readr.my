'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useSetAtom } from 'jotai';
import { Badge, Card, Icon, Skeleton } from '@/components/ui';
import { useApiCall } from '@/lib/session';
import { analyticsApi } from '@/lib/api';
import { lastApiErrorAtom } from '@/lib/session';

type Metrics = {
  totalUsers: number;
  totalStories: number;
  totalReports: number;
  totalCoins: number;
};

type Props = {
  initialMetrics: Metrics | null;
  isAdmin: boolean;
};

const formatNumber = (n: number): string => n.toLocaleString('en-US');

export const CommandCenterView = ({ initialMetrics, isAdmin }: Props): React.ReactElement => {
  const [metrics, setMetrics] = useState<Metrics | null>(initialMetrics);
  const [isLoading, setIsLoading] = useState(false);
  const setError = useSetAtom(lastApiErrorAtom);
  const callDashboard = useApiCall(analyticsApi.dashboard);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      await callDashboard();
    } catch (e) {
      setError(e);
    } finally {
      setIsLoading(false);
    }
  }, [callDashboard, setError]);

  if (!isAdmin) {
    return (
      <Card className="mx-auto max-w-md p-8 text-center">
        <Icon name="admin-panel-settings" size={32} />
        <h2 className="mt-4 font-display text-xl font-bold">Admin access required</h2>
        <p className="mt-2 text-sm text-on-surface-variant">
          You need an admin account to view the command center.
        </p>
        <Link
          href="/login?redirect=/admin"
          className="mt-4 inline-block rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
        >
          Sign in
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-on-surface">Command Center</h1>
          <p className="mt-1 text-sm text-on-surface-variant">Platform-wide overview.</p>
        </div>
        <button
          type="button"
          onClick={() => { void refresh(); }}
          className="text-sm font-semibold text-primary hover:underline"
        >
          Refresh
        </button>
      </header>

      {!metrics && isLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard
            label="Users"
            value={formatNumber(metrics?.totalUsers ?? 0)}
            icon="person"
            tone="primary"
          />
          <KpiCard
            label="Stories"
            value={formatNumber(metrics?.totalStories ?? 0)}
            icon="menu-book"
            tone="success"
          />
          <KpiCard
            label="Open reports"
            value={formatNumber(metrics?.totalReports ?? 0)}
            icon="flag"
            tone={(metrics?.totalReports ?? 0) > 0 ? 'warning' : 'neutral'}
          />
          <KpiCard
            label="Coin supply"
            value={formatNumber(metrics?.totalCoins ?? 0)}
            icon="toll"
            tone="neutral"
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="p-6">
          <h2 className="font-display text-lg font-semibold text-on-surface">Quick actions</h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link
                href="/admin/moderation"
                className="flex items-center justify-between rounded-xl border border-outline-variant/40 p-3 transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                <span className="flex items-center gap-2 font-semibold text-on-surface">
                  <Icon name="gavel" size={16} className="text-primary" />
                  Review flagged reports
                </span>
                <Icon name="arrow-right" size={16} className="text-on-surface-variant" />
              </Link>
            </li>
            <li>
              <Link
                href="/admin/users"
                className="flex items-center justify-between rounded-xl border border-outline-variant/40 p-3 transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                <span className="flex items-center gap-2 font-semibold text-on-surface">
                  <Icon name="manage-accounts" size={16} className="text-primary" />
                  Manage users & roles
                </span>
                <Icon name="arrow-right" size={16} className="text-on-surface-variant" />
              </Link>
            </li>
          </ul>
        </Card>

        <Card className="p-6">
          <h2 className="font-display text-lg font-semibold text-on-surface">System notes</h2>
          <ul className="mt-4 space-y-3 text-sm text-on-surface-variant">
            <li className="flex gap-2">
              <Badge tone="primary" size="sm">P1</Badge>
              Author verification queue (D1.5) — pending backend route.
            </li>
            <li className="flex gap-2">
              <Badge tone="warning" size="sm">P2</Badge>
              DMCA takedown case management (B3.7) — backend pending.
            </li>
            <li className="flex gap-2">
              <Badge tone="neutral" size="sm">P3</Badge>
              Heatmap export (F3.K6) — manual export only.
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

const KpiCard = ({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: 'person' | 'menu-book' | 'flag' | 'toll';
  tone: 'primary' | 'success' | 'warning' | 'neutral';
}): React.ReactElement => {
  const toneClass = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300',
    warning: 'bg-amber-500/15 text-amber-600 dark:text-amber-300',
    neutral: 'bg-surface-container text-on-surface-variant',
  }[tone];
  return (
    <Card className="flex items-center justify-between p-5">
      <div>
        <p className="text-xs uppercase tracking-wider text-on-surface-variant">{label}</p>
        <p className="mt-2 font-display text-2xl font-bold text-on-surface">{value}</p>
      </div>
      <div className={`rounded-xl p-2 ${toneClass}`}>
        <Icon name={icon} size={24} />
      </div>
    </Card>
  );
};

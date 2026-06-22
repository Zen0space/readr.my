'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { Card, Icon, Skeleton } from '@/components/ui';
import { useApiCall } from '@/lib/session';
import { analyticsApi, type DashboardMetrics } from '@/lib/api';
import { useSetAtom } from 'jotai';
import { lastApiErrorAtom } from '@/lib/session';

type Props = {
  initialMetrics: DashboardMetrics | null;
  isAuthed: boolean;
};

const formatNumber = (n: number): string => n.toLocaleString('en-US');
const formatRM = (coins: number): string => `RM ${(coins / 20).toFixed(2)}`;

export const AnalyticsView = ({ initialMetrics, isAuthed }: Props): React.ReactElement => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(initialMetrics);
  const [isLoading, setIsLoading] = useState(false);
  const setError = useSetAtom(lastApiErrorAtom);
  const callDashboard = useApiCall(analyticsApi.dashboard);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await callDashboard();
      if (result) setMetrics(result.metrics);
    } catch (e) {
      setError(e);
    } finally {
      setIsLoading(false);
    }
  }, [callDashboard, setError]);

  if (!isAuthed) {
    return (
      <Card className="mx-auto max-w-md p-8 text-center">
        <Icon name="insights" size={32} />
        <h2 className="mt-4 font-display text-xl font-bold">Sign in as an author</h2>
        <Link
          href="/login?redirect=/author/analytics"
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
          <h1 className="font-display text-3xl font-bold text-on-surface">Analytics</h1>
          <p className="mt-1 text-sm text-on-surface-variant">Your writing performance at a glance.</p>
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : metrics ? (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <MetricTile
              label="Total stories"
              value={formatNumber(metrics.total_writings)}
              icon="menu-book"
            />
            <MetricTile
              label="Total reads"
              value={formatNumber(metrics.total_reads)}
              icon="eye"
            />
            <MetricTile
              label="Followers"
              value={formatNumber(metrics.total_followers)}
              icon="person"
            />
            <MetricTile
              label="Earnings"
              value={formatRM(metrics.total_earnings)}
              icon="monetization-on"
            />
          </div>

          <Card className="p-6">
            <h2 className="font-display text-lg font-semibold text-on-surface">Reads by day (last 30)</h2>
            <p className="mt-1 text-xs text-on-surface-variant">
              Daily read count for the last 30 days.
            </p>
            <ReadsChart data={metrics.reads_by_day} />
          </Card>
        </>
      ) : (
        <Card className="p-8 text-center text-sm text-on-surface-variant">
          No analytics data yet. Publish a story to start tracking.
        </Card>
      )}
    </div>
  );
};

const MetricTile = ({ label, value, icon }: { label: string; value: string; icon: 'menu-book' | 'eye' | 'person' | 'monetization-on' }): React.ReactElement => (
  <Card className="flex items-center justify-between p-5">
    <div>
      <p className="text-xs uppercase tracking-wider text-on-surface-variant">{label}</p>
      <p className="mt-2 font-display text-2xl font-bold text-on-surface">{value}</p>
    </div>
    <div className="rounded-xl bg-primary/10 p-2 text-primary">
      <Icon name={icon} size={24} />
    </div>
  </Card>
);

const ReadsChart = ({ data }: { data: { date: string; count: number }[] }): React.ReactElement => {
  if (data.length === 0) {
    return <p className="mt-4 text-sm text-on-surface-variant">No data points yet.</p>;
  }
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="mt-6 flex h-40 items-end gap-1">
      {data.map((d) => {
        const h = Math.max(2, (d.count / max) * 100);
        return (
          <div
            key={d.date}
            className="flex-1 rounded-t bg-gradient-to-t from-primary to-secondary"
            style={{ height: `${h}%` }}
            title={`${d.date}: ${d.count} reads`}
            aria-label={`${d.date}: ${d.count} reads`}
          />
        );
      })}
    </div>
  );
};

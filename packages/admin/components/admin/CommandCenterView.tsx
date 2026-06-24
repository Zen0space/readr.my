'use client';

import { useCallback, useState } from 'react';
import { Card, Icon, Skeleton } from '@/components/ui';
import { useApiCall } from '@/lib/session';
import { analyticsApi, type DashboardMetrics } from '@/lib/api';
import { useSetAtom } from 'jotai';
import { lastApiErrorAtom } from '@/lib/session';

type Props = {
  initialMetrics: DashboardMetrics | null;
};

const formatNumber = (n: number): string => n.toLocaleString('en-US');

export const CommandCenterView = ({ initialMetrics }: Props): React.ReactElement => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(initialMetrics);
  const [busy, setBusy] = useState(false);
  const setError = useSetAtom(lastApiErrorAtom);
  const callDashboard = useApiCall(analyticsApi.dashboard);

  const refresh = useCallback(async () => {
    setBusy(true);
    try {
      const result = await callDashboard();
      if (result) setMetrics(result.metrics);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }, [callDashboard, setError]);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-on-surface">Command Center</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Platform health, revenue, and growth.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          className="text-sm font-semibold text-primary hover:underline"
        >
          Refresh
        </button>
      </header>

      {!metrics && busy ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : metrics ? (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <MetricTile
              label="Total users"
              value={formatNumber(metrics.total_users ?? 0)}
              icon="person"
            />
            <MetricTile
              label="Active (30d)"
              value={formatNumber(metrics.total_active_users_30d ?? 0)}
              icon="trending-up"
            />
            <MetricTile
              label="Stories published"
              value={formatNumber(metrics.total_stories_published ?? 0)}
              icon="menu-book"
            />
            <MetricTile
              label="Authors"
              value={formatNumber(metrics.total_authors ?? 0)}
              icon="stylus-note"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card className="p-6">
              <p className="text-xs uppercase tracking-wider text-on-surface-variant">
                Gross revenue (all time)
              </p>
              <p className="mt-2 font-display text-3xl font-bold text-on-surface">
                RM {metrics.revenue_gross_rm ?? '0.00'}
              </p>
              <p className="mt-1 text-xs text-on-surface-variant">
                Coin purchases (succeeded).
              </p>
            </Card>
            <Card className="p-6">
              <p className="text-xs uppercase tracking-wider text-on-surface-variant">
                Reads (30d)
              </p>
              <p className="mt-2 font-display text-3xl font-bold text-on-surface">
                {formatNumber(metrics.total_reads_30d ?? 0)}
              </p>
            </Card>
            <Card className="p-6">
              <p className="text-xs uppercase tracking-wider text-on-surface-variant">
                Pending payouts
              </p>
              <p className="mt-2 font-display text-3xl font-bold text-on-surface">
                RM {((metrics.pending_rm_cents ?? 0) / 100).toFixed(2)}
              </p>
            </Card>
          </div>
        </>
      ) : (
        <Card className="p-8 text-center text-sm text-on-surface-variant">
          <Icon name="admin-panel-settings" size={40} />
          <p className="mt-4">No metrics yet — refresh to load.</p>
        </Card>
      )}
    </div>
  );
};

const MetricTile = ({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: 'person' | 'trending-up' | 'menu-book' | 'stylus-note';
}): React.ReactElement => (
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
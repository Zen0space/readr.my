'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useSetAtom } from 'jotai';
import { Badge, Button, Card, Icon, Skeleton } from '@/components/ui';
import { useApiCall } from '@/lib/session';
import { adminApi, type AdminReport } from '@/lib/api';
import { lastApiErrorAtom } from '@/lib/session';
import { cn } from '@/lib/cn';

type Props = {
  initialReports: AdminReport[];
  isAdmin: boolean;
};

const statusTone: Record<AdminReport['status'], 'neutral' | 'primary' | 'warning' | 'success'> = {
  open: 'warning',
  in_review: 'primary',
  resolved: 'success',
  dismissed: 'neutral',
};

const formatDate = (iso: string): string => new Date(iso).toLocaleString();

export const ModerationView = ({ initialReports, isAdmin }: Props): React.ReactElement => {
  const [reports, setReports] = useState<AdminReport[]>(initialReports);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<AdminReport['status'] | 'all'>('open');
  const setError = useSetAtom(lastApiErrorAtom);
  const callUpdate = useApiCall(adminApi.reports.update);

  const onUpdate = useCallback(
    async (report: AdminReport, status: AdminReport['status']) => {
      setBusyId(report.id);
      try {
        await callUpdate(report.id, { status });
        setReports((prev) =>
          prev.map((r) => (r.id === report.id ? { ...r, status } : r)),
        );
      } catch (e) {
        setError(e);
      } finally {
        setBusyId(null);
      }
    },
    [callUpdate, setError],
  );

  if (!isAdmin) {
    return (
      <Card className="mx-auto max-w-md p-8 text-center">
        <Icon name="gavel" size={32} />
        <h2 className="mt-4 font-display text-xl font-bold">Admin access required</h2>
        <Link
          href="/login?redirect=/admin/moderation"
          className="mt-4 inline-block rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
        >
          Sign in
        </Link>
      </Card>
    );
  }

  const filtered = filter === 'all' ? reports : reports.filter((r) => r.status === filter);
  const filters: { value: AdminReport['status'] | 'all'; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'open', label: 'Open' },
    { value: 'in_review', label: 'In review' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'dismissed', label: 'Dismissed' },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-on-surface">Moderation</h1>
        <p className="mt-1 text-sm text-on-surface-variant">Triage flagged reports.</p>
      </header>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
              filter === f.value
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'border-outline-variant/40 text-on-surface-variant hover:border-primary/40 hover:text-primary',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {reports.length === 0 ? (
        <Card className="p-8 text-center text-sm text-on-surface-variant">
          No reports in the queue.
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center text-sm text-on-surface-variant">
          No reports with status <Badge tone="primary" size="sm">{filter}</Badge>.
        </Card>
      ) : (
        <ul className="space-y-3">
          {filtered.map((r) => (
            <li key={r.id}>
              <Card className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={statusTone[r.status]} size="sm">
                        {r.status}
                      </Badge>
                      <span className="text-xs text-on-surface-variant">
                        {formatDate(r.created_at)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-on-surface">{r.reason}</p>
                    <p className="mt-1 text-xs text-on-surface-variant">
                      Reporter: <span className="font-mono">{r.reporter_id.slice(0, 8)}</span> ·
                      Target: <span className="font-mono">{r.target_id.slice(0, 8)}</span>
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {r.status !== 'in_review' ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={busyId === r.id}
                        onClick={() => {
                          void onUpdate(r, 'in_review');
                        }}
                      >
                        <Icon name="eye" size={14} />
                        Review
                      </Button>
                    ) : null}
                    {r.status !== 'resolved' ? (
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={busyId === r.id}
                        onClick={() => {
                          void onUpdate(r, 'resolved');
                        }}
                      >
                        <Icon name="check" size={14} />
                        Resolve
                      </Button>
                    ) : null}
                    {r.status !== 'dismissed' ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busyId === r.id}
                        onClick={() => {
                          void onUpdate(r, 'dismissed');
                        }}
                      >
                        <Icon name="x" size={14} />
                        Dismiss
                      </Button>
                    ) : null}
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {reports.length === 0 ? (
        <Skeleton className="h-20 w-full" />
      ) : null}
    </div>
  );
};

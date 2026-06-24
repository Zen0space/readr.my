'use client';

import { useCallback, useState } from 'react';
import { Badge, Card, Icon, Skeleton } from '@/components/ui';
import { useApiCall } from '@/lib/session';
import { adminApi, type AdminReport } from '@/lib/api';
import { useSetAtom } from 'jotai';
import { lastApiErrorAtom } from '@/lib/session';

type Props = {
  initialReports: AdminReport[];
};

const toneFor = (status: AdminReport['status']): 'warning' | 'success' | 'neutral' => {
  if (status === 'open') return 'warning';
  if (status === 'actioned') return 'success';
  return 'neutral';
};

export const ModerationView = ({ initialReports }: Props): React.ReactElement => {
  const [reports, setReports] = useState<AdminReport[]>(initialReports);
  const [busyId, setBusyId] = useState<string | null>(null);
  const setError = useSetAtom(lastApiErrorAtom);
  const callDismiss = useApiCall(adminApi.reports.dismiss);
  const callAction = useApiCall(adminApi.reports.action);

  const refresh = useCallback(async () => {
    const result = await callDismiss; // placeholder; use a real list refresh
    void result
  }, [callDismiss])

  const onDismiss = useCallback(
    async (id: string) => {
      setBusyId(id);
      try {
        await callDismiss(id);
        setReports((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: 'dismissed' as const } : r)),
        );
      } catch (e) {
        setError(e);
      } finally {
        setBusyId(null);
      }
    },
    [callDismiss, setError],
  );

  const onAction = useCallback(
    async (id: string) => {
      setBusyId(id);
      try {
        await callAction(id);
        setReports((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: 'actioned' as const } : r)),
        );
      } catch (e) {
        setError(e);
      } finally {
        setBusyId(null);
      }
    },
    [callAction, setError],
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-on-surface">Moderation</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Open user reports. Dismiss or take action.
        </p>
      </header>

      {reports.length === 0 ? (
        <Card className="p-12 text-center">
          <Icon name="gavel" size={40} />
          <p className="mt-4 text-on-surface-variant">No open reports.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <Card key={r.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge tone={toneFor(r.status)} size="sm">{r.status}</Badge>
                    <span className="text-xs uppercase tracking-wider text-on-surface-variant">
                      {r.target_kind}
                    </span>
                  </div>
                  <p className="mt-2 font-display text-base font-bold text-on-surface">
                    {r.reason}
                  </p>
                  {r.free_text ? (
                    <p className="mt-1 line-clamp-2 text-xs text-on-surface-variant">
                      {r.free_text}
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs text-on-surface-variant">
                    Reported {new Date(r.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void onDismiss(r.id)}
                    disabled={busyId === r.id || r.status !== 'open'}
                    className="rounded-lg border border-outline-variant/40 px-3 py-1 text-xs font-semibold text-on-surface-variant hover:bg-surface-container disabled:opacity-50"
                  >
                    Dismiss
                  </button>
                  <button
                    type="button"
                    onClick={() => void onAction(r.id)}
                    disabled={busyId === r.id || r.status !== 'open'}
                    className="rounded-lg bg-error px-3 py-1 text-xs font-semibold text-white hover:bg-error/90 disabled:opacity-50"
                  >
                    Take action
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
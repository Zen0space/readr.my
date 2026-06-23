'use client';

import { useCallback, useState } from 'react';
import { Card, Icon, Skeleton } from '@/components/ui';
import { useApiCall } from '@/lib/session';
import { adminApi, type AdminUser } from '@/lib/api';
import { useSetAtom } from 'jotai';
import { lastApiErrorAtom } from '@/lib/session';

type Props = {
  initialUsers: AdminUser[];
};

export const UsersView = ({ initialUsers }: Props): React.ReactElement => {
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const setError = useSetAtom(lastApiErrorAtom);
  const callList = useApiCall(adminApi.users.list);
  const callSuspend = useApiCall(adminApi.users.suspend);
  const callReinstate = useApiCall(adminApi.users.reinstate);

  const refresh = useCallback(async () => {
    const result = await callList({ q: filter || undefined });
    if (result) setUsers(result.items);
  }, [callList, filter]);

  const onSuspend = useCallback(
    async (id: string) => {
      if (!window.confirm('Suspend this user? They will lose access until reinstated.')) return;
      setBusyId(id);
      try {
        await callSuspend(id);
        setUsers((prev) =>
          prev.map((u) => (u.id === id ? { ...u, status: 'suspended' as const } : u)),
        );
      } catch (e) {
        setError(e);
      } finally {
        setBusyId(null);
      }
    },
    [callSuspend, setError],
  );

  const onReinstate = useCallback(
    async (id: string) => {
      setBusyId(id);
      try {
        await callReinstate(id);
        setUsers((prev) =>
          prev.map((u) => (u.id === id ? { ...u, status: 'active' as const } : u)),
        );
      } catch (e) {
        setError(e);
      } finally {
        setBusyId(null);
      }
    },
    [callReinstate, setError],
  );

  const filtered = filter
    ? users.filter(
        (u) =>
          u.email.toLowerCase().includes(filter.toLowerCase()) ||
          u.username.toLowerCase().includes(filter.toLowerCase()),
      )
    : users

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-on-surface">Users</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Search, suspend, reinstate.
          </p>
        </div>
        <div className="relative w-full max-w-sm">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
            <Icon name="search" size={18} />
          </span>
          <input
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.currentTarget.value)}
            onBlur={() => void refresh()}
            placeholder="Search email or username"
            className="w-full rounded-full border border-outline-variant/50 bg-surface-container-lowest py-2 pl-10 pr-4 text-sm focus:border-primary focus:outline-none"
          />
        </div>
      </header>

      {filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <Skeleton className="mx-auto h-12 w-12 rounded-full" />
          <p className="mt-4 text-on-surface-variant">No users matching your criteria.</p>
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-container text-xs uppercase tracking-wider text-on-surface-variant">
              <tr className="text-left">
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-t border-outline-variant/20">
                  <td className="px-4 py-3">{u.username}</td>
                  <td className="px-4 py-3 text-on-surface-variant">{u.email}</td>
                  <td className="px-4 py-3 capitalize">{u.role}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        u.status === 'suspended'
                          ? 'rounded-full bg-error/15 px-2 py-0.5 text-xs font-semibold text-error'
                          : 'rounded-full bg-success/15 px-2 py-0.5 text-xs font-semibold text-success'
                      }
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {u.status === 'active' ? (
                      <button
                        type="button"
                        onClick={() => void onSuspend(u.id)}
                        disabled={busyId === u.id}
                        className="rounded-lg border border-outline-variant/40 px-3 py-1 text-xs font-semibold text-error hover:bg-error/10 disabled:opacity-50"
                      >
                        Suspend
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void onReinstate(u.id)}
                        disabled={busyId === u.id}
                        className="rounded-lg border border-outline-variant/40 px-3 py-1 text-xs font-semibold text-success hover:bg-success/10 disabled:opacity-50"
                      >
                        Reinstate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
};
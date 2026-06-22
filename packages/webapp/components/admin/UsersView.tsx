'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useSetAtom } from 'jotai';
import { Avatar, Badge, Button, Card, Icon } from '@/components/ui';
import { useApiCall } from '@/lib/session';
import { adminApi, type AdminUser, type Role } from '@/lib/api';
import { lastApiErrorAtom } from '@/lib/session';
import { cn } from '@/lib/cn';

type Props = {
  initialUsers: AdminUser[];
  isAdmin: boolean;
};

const roleTone: Record<Role, 'neutral' | 'primary' | 'success'> = {
  reader: 'neutral',
  author: 'primary',
  admin: 'success',
};

const formatDate = (iso: string): string => new Date(iso).toLocaleDateString();

export const UsersView = ({ initialUsers, isAdmin }: Props): React.ReactElement => {
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const setError = useSetAtom(lastApiErrorAtom);
  const callUpdate = useApiCall(adminApi.users.update);

  const onUpdate = useCallback(
    async (user: AdminUser, patch: { role?: Role; status?: 'active' | 'suspended' }) => {
      setBusyId(user.id);
      try {
        const result = await callUpdate(user.id, patch);
        if (result) {
          setUsers((prev) => prev.map((u) => (u.id === user.id ? result.user : u)));
        }
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
        <Icon name="manage-accounts" size={32} />
        <h2 className="mt-4 font-display text-xl font-bold">Admin access required</h2>
        <Link
          href="/login?redirect=/admin/users"
          className="mt-4 inline-block rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
        >
          Sign in
        </Link>
      </Card>
    );
  }

  const q = search.trim().toLowerCase();
  const filtered = q
    ? users.filter(
        (u) =>
          u.username.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.role.toLowerCase().includes(q),
      )
    : users;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-on-surface">Users</h1>
        <p className="mt-1 text-sm text-on-surface-variant">Manage roles and suspensions.</p>
      </header>

      <div className="relative max-w-md">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
          <Icon name="search" size={18} />
        </span>
        <input
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          placeholder="Search by username, email, or role…"
          aria-label="Search users"
          className="h-11 w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest pl-10 pr-4 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="p-8 text-center text-sm text-on-surface-variant">
          {q ? 'No users match your search.' : 'No users found.'}
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-outline-variant/30 bg-surface-container text-xs uppercase tracking-wider text-on-surface-variant">
                <tr>
                  <th className="px-4 py-3 text-left">User</th>
                  <th className="px-4 py-3 text-left">Role</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Joined</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr
                    key={u.id}
                    className={cn(
                      'border-b border-outline-variant/20 last:border-0',
                      u.status === 'suspended' && 'bg-error/5',
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar src={u.avatar_url ?? null} alt={u.username} size="sm" fallback={u.username} />
                        <div className="min-w-0">
                          <p className="font-display text-sm font-semibold text-on-surface">{u.username}</p>
                          <p className="text-xs text-on-surface-variant">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={roleTone[u.role]} size="sm">{u.role}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={u.status === 'active' ? 'success' : 'danger'} size="sm">
                        {u.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-on-surface-variant">
                      {formatDate(u.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <select
                          value={u.role}
                          onChange={(e) => {
                            void onUpdate(u, { role: e.currentTarget.value as Role });
                          }}
                          disabled={busyId === u.id}
                          className="rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-2 py-1 text-xs text-on-surface focus:border-primary focus:outline-none disabled:opacity-50"
                        >
                          <option value="reader">reader</option>
                          <option value="author">author</option>
                          <option value="admin">admin</option>
                        </select>
                        {u.status === 'active' ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={busyId === u.id}
                            onClick={() => { void onUpdate(u, { status: 'suspended' }); }}
                            className="!text-error hover:!bg-error/10"
                          >
                            Suspend
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={busyId === u.id}
                            onClick={() => { void onUpdate(u, { status: 'active' }); }}
                          >
                            Reinstate
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

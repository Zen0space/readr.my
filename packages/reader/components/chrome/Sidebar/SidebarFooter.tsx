'use client';

import Link from 'next/link';
import { Icon } from '@/components/ui';
import type { Role } from './types';

type Props = {
  role: Role
  username: string
  avatarUrl: string | null
  coinBalance: number | null
}

/**
 * Bottom-of-sidebar user card:
 *   Avatar + name/role + settings gear on the right.
 *   Coin balance pill below when present.
 */
export const SidebarFooter = ({
  role,
  username,
  avatarUrl,
  coinBalance,
}: Props): React.ReactElement => {
  const initials = username.slice(0, 2).toUpperCase();

  return (
    <div className="mt-auto pt-3">
      <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-3">
        <div className="flex items-center gap-3">
          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-primary to-secondary ring-2 ring-outline-variant/30">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={username}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-display text-[11px] font-bold text-on-primary">
                {initials}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-on-surface">
              {username}
            </p>
            <p className="truncate text-[11px] font-medium capitalize text-on-surface-variant/60">
              {role}
            </p>
          </div>
          <Link
            href="/author/settings"
            aria-label="Settings"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-on-surface-variant/50 transition-all duration-200 hover:bg-primary/[0.08] hover:text-primary active:scale-95"
          >
            <Icon name="settings" size={16} />
          </Link>
        </div>
        {coinBalance !== null ? (
          <Link
            href="/wallet"
            className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary transition-all duration-200 hover:bg-primary hover:text-on-primary"
            aria-label={`${coinBalance} coins — open wallet`}
          >
            <Icon name="circle" size={10} strokeWidth={3} />
            {coinBalance} coins
          </Link>
        ) : null}
      </div>
    </div>
  );
};

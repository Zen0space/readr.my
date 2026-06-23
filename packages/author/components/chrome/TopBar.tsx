'use client';

import Link from 'next/link';
import { useCallback, useRef, useState, type FormEvent } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSetAtom } from 'jotai';
import { authApi } from '@/lib/api';
import { sessionAtom } from '@/lib/session';
import { Button, Icon } from '@/components/ui';

type TopBarProps = {
  username: string;
  role: 'reader' | 'author' | 'admin';
  coinBalance: number | null;
};

const titleForPath = (path: string): string => {
  if (path === '/') return 'Browse';
  if (path.startsWith('/library')) return 'Library';
  if (path.startsWith('/reading') || path.startsWith('/read')) return 'Reading';
  if (path.startsWith('/wallet')) return 'Wallet';
  if (path.startsWith('/subscription')) return 'Subscription';
  if (path.startsWith('/author/studio')) return 'Writing Studio';
  if (path.startsWith('/author/analytics')) return 'Analytics';
  if (path.startsWith('/author/earnings')) return 'Earnings & Payout';
  if (path.startsWith('/author/settings')) return 'Settings';
  if (path === '/admin' || path === '/admin/') return 'Admin';
  if (path.startsWith('/admin/moderation')) return 'Moderation';
  if (path.startsWith('/admin/users')) return 'Users';
  return 'Auror';
};

export const TopBar = ({ username, role, coinBalance }: TopBarProps): React.ReactElement => {
  const pathname = usePathname();
  const router = useRouter();
  const setSession = useSetAtom(sessionAtom);
  const [search, setSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const onSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const url = value ? `/?q=${encodeURIComponent(value)}` : '/';
        router.push(url);
      }, 300);
    },
    [router],
  );

  const onSearchSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const url = search ? `/?q=${encodeURIComponent(search)}` : '/';
    router.push(url);
  };

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setSession({ status: 'anonymous' });
      router.push('/login');
      router.refresh();
    }
  }, [router, setSession]);

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-outline-variant/30 bg-surface/80 px-4 shadow-sm backdrop-blur-md md:px-10">
      <div className="flex items-center gap-4 md:hidden">
        <Link href="/" className="font-display text-xl font-bold text-on-surface">
          Auror
        </Link>
        <span className="text-sm text-on-surface-variant">{titleForPath(pathname)}</span>
      </div>

      <form
        role="search"
        onSubmit={onSearchSubmit}
        className="hidden max-w-xl flex-1 md:flex"
      >
        <div className="relative w-full">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
            <Icon name="search" size={18} />
          </span>
          <input
            ref={inputRef}
            value={search}
            onChange={(e) => onSearchChange(e.currentTarget.value)}
            type="text"
            placeholder="Search stories, authors..."
            aria-label="Search"
            className="w-full rounded-full border border-outline-variant/50 bg-surface-container/50 py-2 pl-10 pr-4 text-sm text-on-surface transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </form>

      <div className="flex items-center gap-3">
        <Link
          href="/wallet"
          className="flex items-center gap-2 rounded-full border border-primary-container/20 bg-primary-container/10 px-3.5 py-1.5 text-sm font-semibold text-primary transition-all hover:bg-primary-container/20"
        >
          <Icon name="toll" size={18} />
          <span>{coinBalance ?? '—'}</span>
          <span className="text-xs font-normal opacity-80">Coins</span>
        </Link>

        <div className="hidden items-center gap-3 border-l border-outline-variant/30 pl-3 sm:flex">
          <div className="text-right">
            <p className="text-xs font-semibold text-on-surface">{username}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-outline">
              {role}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              void logout();
            }}
            aria-label="Sign out"
            className="!h-9 !rounded-full !px-3"
          >
            <Icon name="logout" size={16} />
          </Button>
        </div>
      </div>
    </header>
  );
};

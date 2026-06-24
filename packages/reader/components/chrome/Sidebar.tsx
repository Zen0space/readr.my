'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { useSetAtom } from 'jotai';
import { Button, Icon, type IconName } from '@/components/ui';
import { authApi } from '@/lib/api';
import { sessionAtom } from '@/lib/session';
import { cn } from '@/lib/cn';

type Role = 'reader' | 'author' | 'admin';

type SidebarProps = {
  role: Role;
  username: string;
  avatarUrl?: string | null;
  coinBalance: number | null;
};

type Section = {
  heading?: string;
  items: NavItem[];
};

type NavItem = {
  href: string;
  label: string;
  icon: IconName;
  match?: (path: string) => boolean;
};

const READER_ITEMS: NavItem[] = [
  { href: '/', label: 'Explore', icon: 'compass', match: (p) => p === '/' },
  { href: '/library', label: 'Library', icon: 'book-open' },
  { href: '/wallet', label: 'Wallet', icon: 'credit-card' },
  { href: '/subscription', label: 'Subscription', icon: 'award' },
];

const AUTHOR_ITEMS: NavItem[] = [
  { href: '/author/studio', label: 'Writing Studio', icon: 'edit' },
  { href: '/author/analytics', label: 'Analytics', icon: 'bar-chart' },
  { href: '/author/earnings', label: 'Earnings & Payout', icon: 'dollar-sign' },
];

const ADMIN_ITEMS: NavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: 'shield' },
  { href: '/admin/moderation', label: 'Moderation', icon: 'briefcase' },
  { href: '/admin/users', label: 'Users', icon: 'users' },
];

const renderItems = (
  items: NavItem[],
  pathname: string,
  isActive: (item: NavItem) => boolean,
): React.ReactElement => (
  <>
    {items.map((item) => (
      <li key={item.href}>
        <Link
          href={item.href}
          className={cn(
            'flex items-center gap-4 rounded-xl px-4 py-3 font-label-md text-sm transition-all duration-200',
            isActive(item)
              ? 'bg-primary-container/15 font-bold text-primary'
              : 'text-on-surface-variant hover:bg-primary-container/10 hover:text-primary',
          )}
        >
          <Icon name={item.icon} size={20} />
          <span>{item.label}</span>
        </Link>
      </li>
    ))}
  </>
);

export const Sidebar = ({ role, username, avatarUrl, coinBalance }: SidebarProps): React.ReactElement => {
  const pathname = usePathname();
  const router = useRouter();
  const setSession = useSetAtom(sessionAtom);
  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setSession({ status: 'anonymous' });
      router.push('/login');
      router.refresh();
    }
  }, [router, setSession]);

  const isActive = (item: NavItem): boolean =>
    item.match ? item.match(pathname) : pathname.startsWith(item.href);

  const sections: Section[] = [
    { items: READER_ITEMS },
    ...(role === 'author' || role === 'admin'
      ? [{ heading: 'Author Hub', items: AUTHOR_ITEMS } satisfies Section]
      : []),
    ...(role === 'admin' ? [{ heading: 'Admin Command', items: ADMIN_ITEMS } satisfies Section] : []),
  ];

  return (
    <nav
      aria-label="Primary"
      className="fixed left-0 top-0 z-50 hidden h-screen w-[280px] flex-col border-r border-outline-variant/30 bg-surface/80 px-6 py-8 shadow-card backdrop-blur-xl md:flex"
    >
      <div className="mb-10">
        <Link
          href="/"
          className="bg-gradient-to-br from-primary to-secondary bg-clip-text font-display text-4xl font-bold text-transparent"
        >
          Auror
        </Link>
        <p className="mt-1 text-xs font-medium tracking-wide text-on-surface-variant">
          Enter the Realm of Deep Flow
        </p>
      </div>

      <ul className="flex-1 space-y-2">
        {sections.map((section, idx) => (
          <div key={idx}>
            {section.heading ? (
              <div className="space-y-2 border-t border-outline-variant/20 pt-4">
                <p className="mb-2 px-4 text-[10px] font-semibold uppercase tracking-wider text-outline">
                  {section.heading}
                </p>
                {renderItems(section.items, pathname, isActive)}
              </div>
            ) : (
              renderItems(section.items, pathname, isActive)
            )}
          </div>
        ))}
      </ul>

      <div className="space-y-2 border-t border-outline-variant/30 pt-6">
        <Link
          href="/author/settings"
          className="flex items-center gap-4 rounded-xl px-4 py-2 font-label-md text-sm text-on-surface-variant transition-colors hover:bg-primary-container/10"
        >
          <Icon name="settings" size={20} />
          <span>Settings</span>
        </Link>
        <Button
          variant="ghost"
          size="default"
          onClick={() => {
            void logout();
          }}
          className="!h-auto w-full !justify-start gap-4 !rounded-xl !px-4 !py-2 !text-sm !font-normal !text-on-surface-variant hover:!bg-primary-container/10"
        >
          <Icon name="log-out" size={20} />
          <span>Sign Out</span>
        </Button>
        <div className="flex items-center gap-3 px-4 pt-3">
          <div className="h-9 w-9 overflow-hidden rounded-full border border-outline-variant/30 bg-surface-variant">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt={username} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-display text-xs font-semibold text-primary">
                {username.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-on-surface">{username}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-outline">
              {role}
            </p>
          </div>
          {coinBalance !== null ? (
            <Link
              href="/wallet"
              className="flex items-center gap-1 rounded-full border border-primary-container/20 bg-primary-container/10 px-2.5 py-1 text-xs font-semibold text-primary"
            >
              <Icon name="circle" size={14} />
              {coinBalance}
            </Link>
          ) : null}
        </div>
      </div>
    </nav>
  );
};

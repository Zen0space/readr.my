'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';
import { useCurrentUser } from '@/lib/session';
import { Avatar } from '@/components/ui';

type NavItem = {
  href: string;
  label: string;
  match?: (path: string) => boolean;
};

const items: NavItem[] = [
  { href: '/', label: 'Browse', match: (p) => p === '/' },
  { href: '/library', label: 'Library' },
  { href: '/wallet', label: 'Wallet' },
  { href: '/subscription', label: 'Subscription' },
];

/**
 * Marketing-style top navbar used on the main `/` route. The `(reader)`
 * layout swaps between this and the full Sidebar + TopBar combo depending
 * on the route.
 */
export const ReaderNav = (): React.ReactElement => {
  const pathname = usePathname();
  const user = useCurrentUser();

  return (
    <nav className="sticky top-0 z-30 border-b border-outline-variant/30 bg-surface/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-canvas items-center justify-between px-4 sm:px-6 lg:px-10">
        <Link
          href="/"
          className="flex items-center gap-2 font-display text-xl font-bold tracking-tight text-primary"
        >
          <span aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary text-on-primary shadow-card">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 19V5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 0-2 2Z" />
              <path d="M4 19a2 2 0 0 1 2-2h12" />
            </svg>
          </span>
          Auror
        </Link>
        <ul className="hidden gap-1 md:flex">
          {items.map((item) => {
            const isActive = item.match ? item.match(pathname) : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'inline-flex h-9 items-center rounded-full px-4 text-sm font-semibold transition-all',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface',
                  )}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="flex items-center gap-3">
          {user ? (
            <Link
              href="/library"
              className="flex items-center gap-2 rounded-full border border-outline-variant/40 bg-surface-container/50 py-1 pl-1 pr-3 transition-colors hover:border-primary/40"
            >
              <Avatar src={user.avatar_url ?? null} alt={user.username} size="sm" />
              <span className="hidden text-sm font-semibold text-on-surface sm:inline">
                {user.username}
              </span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="inline-flex h-9 items-center rounded-full bg-primary px-4 text-sm font-semibold text-on-primary shadow-card transition-all hover:bg-primary/90"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

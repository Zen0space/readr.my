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

export const ReaderNav = (): React.ReactElement => {
  const pathname = usePathname();
  const user = useCurrentUser();

  return (
    <nav className="sticky top-0 z-30 glass border-b border-outline-variant/30">
      <div className="mx-auto flex h-16 max-w-canvas items-center justify-between px-4 sm:px-6 lg:px-10">
        <Link
          href="/"
          className="font-display text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
        >
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
                    'inline-flex h-9 items-center rounded-xl px-4 text-sm font-display font-semibold transition-colors',
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
            <Link href="/library" className="flex items-center gap-2">
              <Avatar src={user.avatar_url ?? null} alt={user.username} size="sm" />
              <span className="hidden text-sm font-semibold text-on-surface sm:inline">
                {user.username}
              </span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="text-sm font-display font-semibold text-primary hover:underline"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

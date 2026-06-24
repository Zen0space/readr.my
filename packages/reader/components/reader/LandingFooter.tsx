import Link from 'next/link';
import { Icon } from '@/components/ui';

const linkClass =
  'text-sm text-on-surface-variant transition-colors hover:text-primary';

/**
 * Minimal footer shown only on the landing `/` route. Inner routes under
 * `(reader)` keep their Sidebar/TopBar chrome without a footer.
 */
export const LandingFooter = (): React.ReactElement => (
  <footer className="border-t border-outline-variant/30 bg-surface-container/30">
    <div className="mx-auto grid max-w-canvas gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:py-14 lg:px-10">
      <div>
        <Link
          href="/"
          className="flex items-center gap-2 font-display text-xl font-bold text-primary"
        >
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary text-on-primary"
          >
            <Icon name="book" size={18} />
          </span>
          Auror
        </Link>
        <p className="mt-3 max-w-xs text-sm leading-relaxed text-on-surface-variant">
          A Malaysia-first home for chapter-by-chapter stories from local
          authors. Self-hosted, transparent, reader-supported.
        </p>
      </div>

      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-on-surface">
          Read
        </p>
        <ul className="space-y-2">
          <li>
            <Link href="/" className={linkClass}>
              Browse
            </Link>
          </li>
          <li>
            <Link href="/library" className={linkClass}>
              Library
            </Link>
          </li>
          <li>
            <Link href="/subscription" className={linkClass}>
              Subscription
            </Link>
          </li>
        </ul>
      </div>

      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-on-surface">
          Account
        </p>
        <ul className="space-y-2">
          <li>
            <Link href="/login" className={linkClass}>
              Sign in
            </Link>
          </li>
          <li>
            <Link href="/register" className={linkClass}>
              Create account
            </Link>
          </li>
          <li>
            <Link href="/wallet" className={linkClass}>
              Wallet
            </Link>
          </li>
        </ul>
      </div>

      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-on-surface">
          Legal
        </p>
        <ul className="space-y-2">
          <li>
            <Link href="/terms" className={linkClass}>
              Terms of Service
            </Link>
          </li>
          <li>
            <Link href="/privacy" className={linkClass}>
              Privacy Policy
            </Link>
          </li>
          <li>
            <Link href="/policy" className={linkClass}>
              Content Policy
            </Link>
          </li>
          <li>
            <Link href="/cookies" className={linkClass}>
              Cookie Policy
            </Link>
          </li>
        </ul>
      </div>
    </div>

    <div className="border-t border-outline-variant/30">
      <div className="mx-auto flex max-w-canvas flex-col items-start justify-between gap-2 px-4 py-5 text-xs text-on-surface-variant sm:flex-row sm:items-center sm:px-6 lg:px-10">
        <p>© {new Date().getFullYear()} Auror. All rights reserved.</p>
        <p className="font-medium tracking-wide">
          Enter the realm of deep flow reading.
        </p>
      </div>
    </div>
  </footer>
);

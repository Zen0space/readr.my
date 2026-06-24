'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { Icon } from '@/components/ui';

/**
 * Route-level error boundary for the `(protected)` segment. Catches
 * render-time errors thrown by any server component or hook below the
 * layout and shows a recoverable fallback rather than a blank page.
 *
 * Network/API failures during initial data fetches are already
 * handled by the per-page `ErrorBanner` (which renders inline) and
 * the global `ErrorToast` (for client-side mutations). This file is
 * the last-resort fallback for the cases those don't cover.
 */
export default function ProtectedError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.ReactElement {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('[ProtectedError]', error);
  }, [error]);

  const isNetwork =
    error.name === 'NetworkError' ||
    (error instanceof TypeError && /fetch|network|connect/i.test(error.message));

  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <div className="relative overflow-hidden rounded-3xl border border-rose-200/60 bg-gradient-to-br from-rose-50 via-white to-rose-50/50 p-8 shadow-card md:p-10 dark:border-rose-900/40 dark:from-rose-950/30 dark:via-surface-container-lowest dark:to-rose-950/20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-rose-500/10 blur-3xl"
        />
        <div className="relative space-y-5">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-sm shadow-rose-500/30">
            <Icon name={isNetwork ? 'alert-circle' : 'alert-triangle'} size={22} />
          </span>
          <div className="space-y-1.5">
            <h2 className="font-display text-2xl font-bold text-rose-900 dark:text-rose-100">
              {isNetwork ? "Can't reach the server" : 'Something went wrong'}
            </h2>
            <p className="text-sm leading-relaxed text-rose-700/90 dark:text-rose-200/80">
              {isNetwork
                ? 'We couldn’t connect to the backend. Make sure it’s running and try again.'
                : 'An unexpected error stopped this page from loading. You can try again or head back to your dashboard.'}
            </p>
            {error.digest ? (
              <p className="pt-1 text-[11px] font-semibold uppercase tracking-wider text-rose-700/60 dark:text-rose-200/60">
                Reference: {error.digest}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => reset()}
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-rose-600 to-pink-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-rose-500/30 transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-rose-500/40"
            >
              <Icon name="arrow-right" size={14} />
              Try again
            </button>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-full border border-rose-200/60 bg-white/80 px-5 py-2.5 text-sm font-semibold text-rose-700 transition-all hover:-translate-y-0.5 hover:bg-white dark:border-rose-900/60 dark:bg-surface-container-lowest dark:text-rose-200"
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
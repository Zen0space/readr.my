'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { Icon } from '@/components/ui';

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.ReactElement {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('[PublicError]', error);
  }, [error]);

  const isNetwork =
    error.name === 'NetworkError' ||
    (error instanceof TypeError && /fetch|network|connect/i.test(error.message));

  return (
    <div className="mx-auto max-w-xl px-4 py-20">
      <div className="relative overflow-hidden rounded-3xl border border-outline-variant/40 bg-gradient-to-br from-surface-container-low via-white to-surface-container-lowest p-8 shadow-card md:p-10 dark:border-outline-variant/30">
        <div className="relative space-y-5">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400 text-white shadow-sm shadow-violet-500/30">
            <Icon name={isNetwork ? 'alert-circle' : 'alert-triangle'} size={22} />
          </span>
          <div className="space-y-1.5">
            <h2 className="font-display text-2xl font-bold text-on-surface">
              {isNetwork ? "Can't reach the server" : 'Something went wrong'}
            </h2>
            <p className="text-sm leading-relaxed text-on-surface-variant">
              {isNetwork
                ? 'We couldn’t connect to the backend. Make sure it’s running and try again.'
                : 'An unexpected error stopped this page from loading.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => reset()}
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-violet-500/30 transition-all hover:-translate-y-0.5"
            >
              Try again
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant/40 bg-white px-5 py-2.5 text-sm font-semibold text-on-surface transition-all hover:-translate-y-0.5"
            >
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
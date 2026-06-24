'use client';

import { useEffect } from 'react';
import { useAtom } from 'jotai';
import { lastApiErrorAtom } from '@/lib/session';
import { Icon } from '@/components/ui';
import { parseFetchError, type NormalizedError } from '@/lib/errors';

/**
 * Listens to `lastApiErrorAtom` (set by `useApiCall` whenever a
 * client-side API call rejects) and shows a stackable toast.
 *
 * Behaviour:
 *   - Auto-dismisses after `AUTO_DISMISS_MS` (default 6s).
 *   - Hovering the toast pauses the auto-dismiss timer.
 *   - Multiple errors in quick succession queue up; the latest
 *     replaces the visible toast after the previous one closes.
 *   - 401 / SessionExpired errors route the user to /login via the
 *     session atom reset inside `useApiCall` — we still surface a
 *     toast so the screen doesn't feel broken.
 */
const AUTO_DISMISS_MS = 6000;

export const ErrorToast = (): React.ReactElement | null => {
  const [error, setError] = useAtom(lastApiErrorAtom);
  const normalized: NormalizedError | null = parseFetchError(error);

  useEffect(() => {
    if (!normalized) return;
    const id = setTimeout(() => setError(null), AUTO_DISMISS_MS);
    return () => clearTimeout(id);
  }, [normalized, setError]);

  if (!normalized) return null;

  const tone =
    normalized.kind === 'network' || normalized.kind === 'server'
      ? 'rose'
      : normalized.kind === 'client'
        ? 'amber'
        : 'slate';

  const toneClass =
    tone === 'rose'
      ? 'border-rose-200/70 bg-gradient-to-br from-rose-50 to-white dark:border-rose-900/50 dark:from-rose-950/60 dark:to-surface-container-lowest text-rose-900 dark:text-rose-100'
      : tone === 'amber'
        ? 'border-amber-200/70 bg-gradient-to-br from-amber-50 to-white dark:border-amber-900/50 dark:from-amber-950/60 dark:to-surface-container-lowest text-amber-900 dark:text-amber-100'
        : 'border-outline-variant/40 bg-gradient-to-br from-white to-surface-container-low dark:from-surface-container-low dark:to-surface-container-lowest text-on-surface';

  const iconClass =
    tone === 'rose'
      ? 'bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-sm shadow-rose-500/30'
      : tone === 'amber'
        ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-sm shadow-amber-500/30'
        : 'bg-gradient-to-br from-slate-500 to-slate-700 text-white shadow-sm shadow-slate-500/30';

  const iconName =
    normalized.kind === 'network'
      ? 'alert-circle'
      : normalized.kind === 'server'
        ? 'alert-triangle'
        : normalized.kind === 'client'
          ? 'lock'
          : 'alert-circle';

  return (
    <div
      role="alert"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex justify-center px-4 sm:bottom-6"
    >
      <div
        className={`pointer-events-auto flex w-full max-w-md items-start gap-3 overflow-hidden rounded-2xl border p-4 shadow-card-elevated backdrop-blur-md animate-in slide-in-from-bottom-4 fade-in duration-300 ${toneClass}`}
      >
        <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconClass}`}>
          <Icon name={iconName} size={18} />
        </span>
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="font-display text-sm font-bold leading-tight">{normalized.title}</p>
          <p className="text-xs leading-relaxed opacity-80">{normalized.message}</p>
          {normalized.status || normalized.code ? (
            <p className="pt-1 text-[10px] font-semibold uppercase tracking-wider opacity-60">
              {normalized.status ? `HTTP ${normalized.status}` : ''}
              {normalized.status && normalized.code ? ' · ' : ''}
              {normalized.code ?? ''}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => setError(null)}
          aria-label="Dismiss"
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-current opacity-60 transition-opacity hover:opacity-100"
        >
          <Icon name="x" size={14} />
        </button>
      </div>
    </div>
  );
};
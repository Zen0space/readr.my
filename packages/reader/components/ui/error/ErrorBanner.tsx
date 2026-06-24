import Link from 'next/link'
import { Icon, type IconName } from '@/components/ui'
import type { NormalizedError } from '@/lib/errors'

type Variant = 'rose' | 'amber' | 'slate'

const VARIANT_STYLES: Record<
  Variant,
  { wrapper: string; icon: string; title: string; message: string; cta: string }
> = {
  rose: {
    wrapper:
      'border-rose-200/60 bg-gradient-to-br from-rose-50 via-white to-rose-50/50 dark:border-rose-900/40 dark:from-rose-950/30 dark:via-surface-container-lowest dark:to-rose-950/20',
    icon: 'bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-sm shadow-rose-500/30',
    title: 'text-rose-900 dark:text-rose-100',
    message: 'text-rose-700/90 dark:text-rose-200/80',
    cta: 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-sm shadow-rose-500/30 hover:shadow-md hover:shadow-rose-500/40',
  },
  amber: {
    wrapper:
      'border-amber-200/60 bg-gradient-to-br from-amber-50 via-white to-amber-50/50 dark:border-amber-900/40 dark:from-amber-950/30 dark:via-surface-container-lowest dark:to-amber-950/20',
    icon: 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-sm shadow-amber-500/30',
    title: 'text-amber-900 dark:text-amber-100',
    message: 'text-amber-700/90 dark:text-amber-200/80',
    cta: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm shadow-amber-500/30 hover:shadow-md hover:shadow-amber-500/40',
  },
  slate: {
    wrapper:
      'border-outline-variant/40 bg-gradient-to-br from-surface-container-low via-white to-surface-container-lowest dark:from-surface-container-low dark:via-surface-container-lowest dark:to-surface-container-low',
    icon: 'bg-gradient-to-br from-slate-500 to-slate-700 text-white shadow-sm shadow-slate-500/30',
    title: 'text-on-surface',
    message: 'text-on-surface-variant',
    cta: 'bg-gradient-to-r from-slate-700 to-slate-900 text-white shadow-sm shadow-slate-500/30 hover:shadow-md hover:shadow-slate-500/40',
  },
}

const VARIANT_BY_KIND: Record<NormalizedError['kind'], Variant> = {
  network: 'rose',
  server: 'rose',
  client: 'amber',
  unknown: 'slate',
}

const ICON_BY_KIND: Record<NormalizedError['kind'], IconName> = {
  network: 'alert-circle',
  server: 'alert-triangle',
  client: 'lock',
  unknown: 'alert-circle',
}

type Props = {
  error: NormalizedError
  /**
   * Optional retry link. If provided, renders a primary CTA next to
   * the message; if absent, renders only the explanatory text.
   */
  retryHref?: string
  /**
   * Override the auto-derived palette/colour scheme. Useful when a
   * non-network error should still be styled as rose, etc.
   */
  variant?: Variant
}

/**
 * Inline banner for server-rendered pages. Use when a server
 * component's data fetch throws and we want to surface the failure
 * without blowing up the whole route.
 *
 * Pair with a page-level `error.tsx` for catastrophic failures that
 * should replace the page entirely.
 */
export const ErrorBanner = ({ error, retryHref, variant }: Props): React.ReactElement => {
  const v = VARIANT_STYLES[variant ?? VARIANT_BY_KIND[error.kind]]
  const icon = ICON_BY_KIND[error.kind]

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`relative overflow-hidden rounded-2xl border p-5 md:p-6 ${v.wrapper}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-current opacity-[0.04] blur-3xl"
      />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start">
        <span
          className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${v.icon}`}
        >
          <Icon name={icon} size={20} />
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <p className={`font-display text-base font-bold ${v.title}`}>{error.title}</p>
          <p className={`text-sm leading-relaxed ${v.message}`}>{error.message}</p>
          {error.code || error.status ? (
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant/60">
              {error.status ? `HTTP ${error.status}` : ''}
              {error.status && error.code ? ' · ' : ''}
              {error.code ?? ''}
            </p>
          ) : null}
        </div>
        {retryHref ? (
          <Link
            href={retryHref}
            className={`inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all hover:-translate-y-0.5 ${v.cta}`}
          >
            <Icon name="arrow-right" size={14} />
            Try again
          </Link>
        ) : null}
      </div>
    </div>
  )
}
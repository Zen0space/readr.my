'use client';

import { useCallback, useMemo, useState, useTransition, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, Icon, Skeleton, type IconName } from '@/components/ui';
import { libraryApi, writingsApi } from '@/lib/api';
import { useApiCall, lastApiErrorAtom } from '@/lib/session';
import { useSetAtom } from 'jotai';
import type { Writing } from '@auror/shared/api';
import { cn } from '@/lib/cn';

type StatusFilter = 'all' | 'ongoing' | 'completed';
type SortMode = 'recent' | 'popular';

type Props = {
  initialWritings: Writing[];
  initialQuery: string;
  initialGenre: string;
  initialStatus: StatusFilter;
  initialSort: SortMode;
};

const STATUS_LABEL: Record<Writing['status'], string> = {
  ongoing: 'Ongoing',
  completed: 'Complete',
  draft: 'Draft',
};

const STATUS_TONE: Record<Writing['status'], string> = {
  ongoing:
    'bg-amber-100 text-amber-700 ring-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:ring-amber-900/60',
  completed:
    'bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-900/60',
  draft:
    'bg-surface-container text-on-surface-variant ring-outline-variant/30',
};

type Palette = {
  bg: string;
  iconBg: string;
  iconText: string;
  ring: string;
  bar: string;
};

const PALETTES: Record<string, Palette> = {
  violet: {
    bg: 'from-violet-500 to-indigo-600',
    iconBg: 'bg-violet-100 dark:bg-violet-950/60',
    iconText: 'text-violet-600 dark:text-violet-300',
    ring: 'ring-violet-200 dark:ring-violet-900/60',
    bar: 'from-violet-500 to-indigo-500',
  },
  amber: {
    bg: 'from-amber-400 to-orange-500',
    iconBg: 'bg-amber-100 dark:bg-amber-950/60',
    iconText: 'text-amber-600 dark:text-amber-300',
    ring: 'ring-amber-200 dark:ring-amber-900/60',
    bar: 'from-amber-400 to-orange-500',
  },
  emerald: {
    bg: 'from-emerald-400 to-teal-600',
    iconBg: 'bg-emerald-100 dark:bg-emerald-950/60',
    iconText: 'text-emerald-600 dark:text-emerald-300',
    ring: 'ring-emerald-200 dark:ring-emerald-900/60',
    bar: 'from-emerald-400 to-teal-500',
  },
  rose: {
    bg: 'from-rose-400 to-pink-600',
    iconBg: 'bg-rose-100 dark:bg-rose-950/60',
    iconText: 'text-rose-600 dark:text-rose-300',
    ring: 'ring-rose-200 dark:ring-rose-900/60',
    bar: 'from-rose-400 to-pink-500',
  },
  sky: {
    bg: 'from-sky-400 to-blue-600',
    iconBg: 'bg-sky-100 dark:bg-sky-950/60',
    iconText: 'text-sky-600 dark:text-sky-300',
    ring: 'ring-sky-200 dark:ring-sky-900/60',
    bar: 'from-sky-400 to-blue-500',
  },
};

const StatTile = ({
  icon,
  label,
  value,
  hint,
  palette,
}: {
  icon: IconName;
  label: string;
  value: string | number;
  hint?: string;
  palette: Palette;
}): React.ReactElement => (
  <Card className="group relative overflow-hidden p-5 transition-all hover:-translate-y-1 hover:shadow-card-elevated">
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br opacity-20 blur-2xl transition-opacity group-hover:opacity-40 ${palette.bg}`}
    />
    <div className="relative flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
          {label}
        </p>
        <p className="mt-1.5 font-display text-2xl font-bold leading-tight tracking-tight text-on-surface">
          {value}
        </p>
        {hint ? (
          <p className="mt-2 text-xs text-on-surface-variant">{hint}</p>
        ) : null}
      </div>
      <span
        className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ${palette.iconBg} ${palette.iconText} ${palette.ring}`}
      >
        <Icon name={icon} size={20} />
      </span>
    </div>
    <div className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-surface-container-high">
      <div className={`h-full w-2/3 rounded-full bg-gradient-to-r ${palette.bar}`} />
    </div>
  </Card>
);

const FilterPill = ({
  active,
  count,
  onClick,
  children,
  palette,
}: {
  active: boolean;
  count?: number;
  onClick: () => void;
  children: React.ReactNode;
  palette: Palette;
}): React.ReactElement => (
  <button
    type="button"
    onClick={onClick}
    className={
      active
        ? `group inline-flex items-center gap-2 rounded-full bg-gradient-to-r ${palette.bg} px-4 py-2 text-sm font-semibold text-white shadow-md ring-1 ring-white/20 transition-all hover:-translate-y-0.5`
        : 'inline-flex items-center gap-2 rounded-full border border-outline-variant/40 bg-surface-container-lowest px-4 py-2 text-sm font-semibold text-on-surface transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary'
    }
  >
    {children}
    {typeof count === 'number' ? (
      <span
        className={
          active
            ? 'inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white/25 px-1.5 text-[10px] font-bold text-white'
            : 'inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-surface-container px-1.5 text-[10px] font-bold text-on-surface-variant'
        }
      >
        {count}
      </span>
    ) : null}
  </button>
);

const StatusPill = ({ status }: { status: Writing['status'] }): React.ReactElement => (
  <span
    className={cn(
      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1',
      STATUS_TONE[status],
    )}
  >
    <span
      className={cn(
        'h-1.5 w-1.5 rounded-full',
        status === 'ongoing' && 'bg-amber-500',
        status === 'completed' && 'bg-emerald-500',
        status === 'draft' && 'bg-on-surface-variant',
      )}
    />
    {STATUS_LABEL[status]}
  </span>
);

const StoryCard = ({
  writing,
  isAuthed,
  inLibrary,
  busy,
  onToggleLibrary,
}: {
  writing: Writing;
  isAuthed: boolean;
  inLibrary: boolean;
  busy: boolean;
  onToggleLibrary: (id: string) => void;
}): React.ReactElement => (
  <Card className="group h-full overflow-hidden p-0 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-card-elevated">
    <Link href={`/read/${writing.id}`} className="relative block">
      <div className="relative aspect-[3/4] overflow-hidden bg-surface-container-high">
        {writing.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={writing.cover_url}
            alt={writing.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400">
            <Icon name="book-open" size={48} className="text-white" />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute right-3 top-3">
          <StatusPill status={writing.status} />
        </div>
        <div className="absolute inset-x-0 bottom-0 space-y-1 p-4">
          <h3 className="line-clamp-2 font-display text-base font-bold leading-tight text-white">
            {writing.title}
          </h3>
          {writing.genre ? (
            <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">
              {writing.genre.replace(/[_-]+/g, ' ')}
            </p>
          ) : null}
        </div>
      </div>
    </Link>
    <div className="flex items-center justify-between gap-3 border-t border-outline-variant/20 p-3">
      <p className="line-clamp-1 text-xs text-on-surface-variant">
        {writing.blurb?.trim() || 'Open to start reading.'}
      </p>
      {isAuthed ? (
        <button
          type="button"
          onClick={() => onToggleLibrary(writing.id)}
          disabled={busy}
          aria-label={inLibrary ? 'Remove from library' : 'Save to library'}
          className={cn(
            'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all hover:-translate-y-0.5 disabled:opacity-50',
            inLibrary
              ? 'bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-sm shadow-violet-500/30'
              : 'border border-outline-variant/40 bg-surface-container-lowest text-on-surface-variant hover:border-primary/40 hover:text-primary',
          )}
        >
          <Icon name="bookmark" size={14} />
        </button>
      ) : null}
    </div>
  </Card>
);

const SkeletonCard = (): React.ReactElement => (
  <Card className="overflow-hidden p-0">
    <Skeleton className="aspect-[3/4] w-full" />
    <div className="space-y-2 p-3">
      <Skeleton className="h-3 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  </Card>
);

export const BrowseView = ({
  initialWritings,
  initialQuery,
  initialGenre,
  initialStatus,
  initialSort,
}: Props): React.ReactElement => {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [writings, setWritings] = useState<Writing[]>(initialWritings)
  const [libraryIds, setLibraryIds] = useState<Set<string>>(new Set())
  const [busyId, setBusyId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [search, setSearch] = useState(initialQuery)
  const setError = useSetAtom(lastApiErrorAtom)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const callList = useApiCall(writingsApi.list)
  const callAdd = useApiCall(libraryApi.add)
  const callRemove = useApiCall(libraryApi.remove)

  // Keep the input synced if the URL changes (browser back/forward).
  useEffect(() => {
    setSearch(initialQuery)
  }, [initialQuery])

  const pushUrl = useCallback(
    (next: { q?: string; genre?: string; status?: StatusFilter; sort?: SortMode }) => {
      const qs = new URLSearchParams()
      if (next.q) qs.set('q', next.q)
      if (next.genre) qs.set('genre', next.genre)
      if (next.status && next.status !== 'all') qs.set('status', next.status)
      if (next.sort && next.sort !== 'recent') qs.set('sort', next.sort)
      const tail = qs.toString()
      startTransition(() => {
        router.replace(tail ? `/browse?${tail}` : '/browse', { scroll: false })
      })
    },
    [router],
  )

  const load = useCallback(
    async (opts: { q?: string; genre?: string; status?: StatusFilter; sort?: SortMode }) => {
      setIsLoading(true)
      try {
        const result = await callList({
          q: opts.q || undefined,
          genre: opts.genre || undefined,
          status: opts.status && opts.status !== 'all' ? opts.status : undefined,
          sort: opts.sort,
          limit: 48,
        })
        if (result) setWritings(result.items)
      } catch (e) {
        setError(e)
      } finally {
        setIsLoading(false)
      }
    },
    [callList, setError],
  )

  const onSearchChange = useCallback(
    (value: string) => {
      setSearch(value)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        pushUrl({ q: value, genre: initialGenre, status: initialStatus, sort: initialSort })
        void load({ q: value, genre: initialGenre, status: initialStatus, sort: initialSort })
      }, 300)
    },
    [pushUrl, load, initialGenre, initialStatus, initialSort],
  )

  const onStatusChange = useCallback(
    (status: StatusFilter) => {
      pushUrl({ q: initialQuery, genre: initialGenre, status, sort: initialSort })
      void load({ q: initialQuery, genre: initialGenre, status, sort: initialSort })
    },
    [pushUrl, load, initialQuery, initialGenre, initialSort],
  )

  const onSortChange = useCallback(
    (sort: SortMode) => {
      pushUrl({ q: initialQuery, genre: initialGenre, status: initialStatus, sort })
      void load({ q: initialQuery, genre: initialGenre, status: initialStatus, sort })
    },
    [pushUrl, load, initialQuery, initialGenre, initialStatus],
  )

  const onClearFilters = useCallback(() => {
    setSearch('')
    pushUrl({})
    void load({})
  }, [pushUrl, load])

  const onToggleLibrary = useCallback(
    async (id: string) => {
      const isIn = libraryIds.has(id)
      setBusyId(id)
      try {
        if (isIn) {
          await callRemove(id)
          setLibraryIds((prev) => {
            const next = new Set(prev)
            next.delete(id)
            return next
          })
        } else {
          await callAdd(id)
          setLibraryIds((prev) => new Set(prev).add(id))
        }
      } catch (e) {
        setError(e)
      } finally {
        setBusyId(null)
      }
    },
    [libraryIds, callAdd, callRemove, setError],
  )

  // Derive genre chips from the current result set so the row stays in sync
  // with whatever the backend returned for the active query.
  const genres = useMemo(() => {
    const set = new Map<string, number>()
    for (const w of writings) {
      if (!w.genre) continue
      const key = w.genre.toLowerCase()
      set.set(key, (set.get(key) ?? 0) + 1)
    }
    return Array.from(set.entries())
      .map(([key, count]) => ({
        key,
        label: key.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
  }, [writings])

  const counts = useMemo(() => {
    const ongoing = writings.filter((w) => w.status === 'ongoing').length
    const completed = writings.filter((w) => w.status === 'completed').length
    const authors = new Set(writings.map((w) => w.author_id)).size
    return { all: writings.length, ongoing, completed, authors }
  }, [writings])

  return (
    <div className="space-y-12">
      {/* Stats row — same palette as the dashboard */}
      <section aria-label="Browse snapshot">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            icon="book-open"
            label="E-novels"
            value={counts.all}
            hint={counts.all === 0 ? 'No stories yet' : 'Across every author'}
            palette={PALETTES.violet}
          />
          <StatTile
            icon="play"
            label="Ongoing"
            value={counts.ongoing}
            hint="Still being written"
            palette={PALETTES.amber}
          />
          <StatTile
            icon="check-circle"
            label="Completed"
            value={counts.completed}
            hint="Ready to binge"
            palette={PALETTES.emerald}
          />
          <StatTile
            icon="users"
            label="Authors"
            value={counts.authors}
            hint="On Auror so far"
            palette={PALETTES.rose}
          />
        </div>
      </section>

      {/* Search + filter bar */}
      <section aria-label="Filters" className="space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
              <Icon name="search" size={18} />
            </span>
            <input
              type="search"
              value={search}
              onChange={(e) => onSearchChange(e.currentTarget.value)}
              placeholder="Search titles, authors, or genres…"
              aria-label="Search"
              className="w-full rounded-full border border-outline-variant/40 bg-surface-container-lowest py-3 pl-11 pr-4 text-sm text-on-surface shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
              <Icon name="zap" size={12} />
              Sort
            </span>
            <FilterPill
              active={initialSort === 'recent'}
              onClick={() => onSortChange('recent')}
              palette={PALETTES.sky}
            >
              Recent
            </FilterPill>
            <FilterPill
              active={initialSort === 'popular'}
              onClick={() => onSortChange('popular')}
              palette={PALETTES.rose}
            >
              Popular
            </FilterPill>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
            <Icon name="play" size={12} />
            Status
          </span>
          <FilterPill
            active={initialStatus === 'all'}
            count={counts.all}
            onClick={() => onStatusChange('all')}
            palette={PALETTES.violet}
          >
            All
          </FilterPill>
          <FilterPill
            active={initialStatus === 'ongoing'}
            count={counts.ongoing}
            onClick={() => onStatusChange('ongoing')}
            palette={PALETTES.amber}
          >
            Ongoing
          </FilterPill>
          <FilterPill
            active={initialStatus === 'completed'}
            count={counts.completed}
            onClick={() => onStatusChange('completed')}
            palette={PALETTES.emerald}
          >
            Completed
          </FilterPill>
        </div>

        {genres.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
              <Icon name="grid" size={12} />
              Genres
            </span>
            <FilterPill
              active={initialGenre === ''}
              onClick={() => {
                pushUrl({ q: initialQuery, status: initialStatus, sort: initialSort })
                void load({ q: initialQuery, status: initialStatus, sort: initialSort })
              }}
              palette={PALETTES.sky}
            >
              All
            </FilterPill>
            {genres.map((g) => (
              <FilterPill
                key={g.key}
                active={initialGenre.toLowerCase() === g.key}
                count={g.count}
                onClick={() => {
                  pushUrl({ q: initialQuery, genre: g.key, status: initialStatus, sort: initialSort })
                  void load({ q: initialQuery, genre: g.key, status: initialStatus, sort: initialSort })
                }}
                palette={PALETTES.violet}
              >
                {g.label}
              </FilterPill>
            ))}
            {(initialQuery || initialGenre || initialStatus !== 'all' || initialSort !== 'recent') ? (
              <button
                type="button"
                onClick={onClearFilters}
                className="ml-1 inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-on-surface-variant transition-colors hover:text-rose-600"
              >
                <Icon name="x" size={12} />
                Clear all
              </button>
            ) : null}
          </div>
        ) : null}
      </section>

      {/* Story grid */}
      <section aria-labelledby="browse-heading" className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">
              Catalogue
            </p>
            <h2
              id="browse-heading"
              className="font-display text-2xl font-bold text-on-surface md:text-3xl"
            >
              {initialQuery
                ? `Results for “${initialQuery}”`
                : initialGenre
                  ? `${initialGenre.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())} stories`
                  : 'Every e-novel on Auror'}
            </h2>
          </div>
        </div>

        {isLoading && writings.length === 0 ? (
          <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : writings.length === 0 ? (
          <Card className="group relative overflow-hidden p-0">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-500/5 via-fuchsia-500/5 to-orange-400/5" />
            <div className="relative flex flex-col items-center gap-4 px-8 py-16 text-center">
              <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400 text-white shadow-lg shadow-violet-500/30">
                <Icon name="compass" size={28} />
              </span>
              <div className="space-y-1.5">
                <h3 className="font-display text-xl font-bold text-on-surface">
                  No stories match your filters
                </h3>
                <p className="text-sm text-on-surface-variant">
                  Try a broader search, change status, or clear the genre filter.
                </p>
              </div>
              <button
                type="button"
                onClick={onClearFilters}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-violet-500/30 transition-all hover:-translate-y-0.5"
              >
                <Icon name="x" size={14} />
                Clear all filters
              </button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {writings.map((w) => (
              <StoryCard
                key={w.id}
                writing={w}
                isAuthed
                inLibrary={libraryIds.has(w.id)}
                busy={busyId === w.id}
                onToggleLibrary={(id) => void onToggleLibrary(id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
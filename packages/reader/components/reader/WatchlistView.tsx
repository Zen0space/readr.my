'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, Icon, type IconName } from '@/components/ui';
import { useApiCall, lastApiErrorAtom } from '@/lib/session';
import { watchlistApi } from '@/lib/api';
import type { WatchlistItem } from '@auror/shared/api';
import { useSetAtom } from 'jotai';

type Props = {
  initialWatchlist: WatchlistItem[];
  isAuthed: boolean;
};

type Palette = {
  bg: string;
  iconBg: string;
  iconText: string;
  ring: string;
  bar: string;
};

const PALETTES: Record<string, Palette> = {
  sky: {
    bg: 'from-sky-400 to-blue-600',
    iconBg: 'bg-sky-100 dark:bg-sky-950/60',
    iconText: 'text-sky-600 dark:text-sky-300',
    ring: 'ring-sky-200 dark:ring-sky-900/60',
    bar: 'from-sky-400 to-blue-500',
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
        <p className="mt-1.5 font-display text-3xl font-bold leading-none tracking-tight text-on-surface">
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

type StatusFilter = 'all' | 'ongoing' | 'completed';

const FilterPill = ({
  active,
  count,
  onClick,
  children,
  palette,
}: {
  active: boolean;
  count: number;
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
    <span
      className={
        active
          ? 'inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white/25 px-1.5 text-[10px] font-bold text-white'
          : 'inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-surface-container px-1.5 text-[10px] font-bold text-on-surface-variant'
      }
    >
      {count}
    </span>
  </button>
);

const StoryRow = ({
  item,
  onRemove,
  onToggleNotify,
  busy,
}: {
  item: WatchlistItem;
  onRemove: (id: string) => void;
  onToggleNotify: (id: string, next: boolean) => void;
  busy: boolean;
}): React.ReactElement => {
  const isOngoing = item.status === 'ongoing';
  const isCompleted = item.status === 'completed';
  const statusTone = isOngoing
    ? 'bg-amber-100 text-amber-700 ring-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:ring-amber-900/60'
    : isCompleted
      ? 'bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:ring-emerald-900/60'
      : 'bg-surface-container text-on-surface-variant ring-outline-variant/30';

  return (
    <Card className="group relative overflow-hidden p-0 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card-elevated">
      <div className="relative flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-5">
        <Link
          href={`/read/${item.story_id}`}
          className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-surface-container-high shadow-sm ring-1 ring-outline-variant/20 transition-transform duration-500 group-hover:scale-[1.02]"
        >
          {item.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.cover_url}
              alt={item.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sky-500 via-indigo-500 to-violet-500">
              <Icon name="star" size={28} className="text-white" />
            </div>
          )}
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${statusTone}`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${isOngoing ? 'bg-amber-500' : isCompleted ? 'bg-emerald-500' : 'bg-on-surface-variant'}`}
              />
              {isOngoing ? 'Ongoing' : isCompleted ? 'Complete' : 'Draft'}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
              Added {new Date(item.added_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          </div>
          <Link
            href={`/read/${item.story_id}`}
            className="mt-1.5 block font-display text-lg font-bold leading-tight text-on-surface transition-colors group-hover:text-primary"
          >
            {item.title}
          </Link>
          <p className="mt-1 line-clamp-1 text-sm text-on-surface-variant">
            {item.author_pen_name ?? 'Author'}
          </p>
          {item.blurb ? (
            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-on-surface-variant">
              {item.blurb}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-stretch">
          <button
            type="button"
            onClick={() => onToggleNotify(item.story_id, !item.notify_on_chapter)}
            disabled={busy}
            aria-pressed={item.notify_on_chapter}
            className={
              item.notify_on_chapter
                ? 'inline-flex items-center justify-center gap-1.5 rounded-full border border-sky-300/60 bg-sky-50 px-4 py-2 text-xs font-semibold text-sky-700 transition-all hover:-translate-y-0.5 disabled:opacity-50 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-200'
                : 'inline-flex items-center justify-center gap-1.5 rounded-full border border-outline-variant/40 bg-surface-container-lowest px-4 py-2 text-xs font-semibold text-on-surface-variant transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary disabled:opacity-50'
            }
          >
            <Icon name={item.notify_on_chapter ? 'check' : 'x'} size={14} />
            {item.notify_on_chapter ? 'Notify on' : 'Notify off'}
          </button>
          <Link
            href={`/read/${item.story_id}`}
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-sky-500/20 transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-sky-500/30"
          >
            <Icon name="book-open" size={14} />
            Read
          </Link>
          <button
            type="button"
            onClick={() => onRemove(item.story_id)}
            disabled={busy}
            className="inline-flex items-center justify-center gap-1.5 rounded-full border border-outline-variant/40 bg-surface-container-lowest px-4 py-2 text-xs font-semibold text-on-surface-variant transition-all hover:-translate-y-0.5 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 dark:hover:bg-rose-950/30"
            aria-label="Remove from watchlist"
          >
            <Icon name="x" size={14} />
            Remove
          </button>
        </div>
      </div>
    </Card>
  );
};

const EmptyWatchlistState = (): React.ReactElement => (
  <Card className="group relative overflow-hidden p-0 transition-all hover:shadow-card-elevated">
    <div className="relative flex flex-col items-center gap-6 px-8 py-16 text-center sm:py-20">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-500/5 via-indigo-500/5 to-violet-500/5"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-sky-500/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl"
      />
      <div className="relative inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-sky-500 via-indigo-500 to-violet-500 text-white shadow-xl shadow-sky-500/30">
        <Icon name="star" size={36} />
      </div>
      <div className="relative space-y-2">
        <h2 className="font-display text-2xl font-bold text-on-surface">
          Nothing on your watchlist yet
        </h2>
        <p className="mx-auto max-w-md text-sm leading-relaxed text-on-surface-variant">
          Add a story to your watchlist to get notified the moment a new chapter drops. Your watchlist is private to you.
        </p>
      </div>
      <Link
        href="/"
        className="relative inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/30 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-sky-500/40"
      >
        <Icon name="compass" size={16} />
        Browse stories
      </Link>
    </div>
  </Card>
);

const UnauthState = (): React.ReactElement => (
  <Card className="mx-auto max-w-md p-8 text-center">
    <Icon name="star" size={32} className="mx-auto text-primary" />
    <h2 className="mt-4 font-display text-xl font-bold text-on-surface">
      Sign in to see your watchlist
    </h2>
    <Link
      href="/login?redirect=/watchlist"
      className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-sky-500/20 transition-all hover:-translate-y-0.5"
    >
      Sign in
      <Icon name="arrow-right" size={14} />
    </Link>
  </Card>
);

export const WatchlistView = ({ initialWatchlist, isAuthed }: Props): React.ReactElement => {
  const [items, setItems] = useState<WatchlistItem[]>(initialWatchlist);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const setError = useSetAtom(lastApiErrorAtom);
  const callRemove = useApiCall(watchlistApi.remove);
  const callSetNotify = useApiCall(watchlistApi.setNotify);

  const onRemove = useCallback(
    async (storyId: string) => {
      setBusyId(storyId);
      try {
        await callRemove(storyId);
        setItems((prev) => prev.filter((i) => i.story_id !== storyId));
      } catch (e) {
        setError(e);
      } finally {
        setBusyId(null);
      }
    },
    [callRemove, setError],
  );

  const onToggleNotify = useCallback(
    async (storyId: string, next: boolean) => {
      setBusyId(storyId);
      try {
        await callSetNotify(storyId, next);
        setItems((prev) =>
          prev.map((i) => (i.story_id === storyId ? { ...i, notify_on_chapter: next } : i)),
        );
      } catch (e) {
        setError(e);
      } finally {
        setBusyId(null);
      }
    },
    [callSetNotify, setError],
  );

  const counts = useMemo(() => {
    const ongoing = items.filter((i) => i.status === 'ongoing').length;
    const completed = items.filter((i) => i.status === 'completed').length;
    const notifyOn = items.filter((i) => i.notify_on_chapter).length;
    const authors = new Set(items.map((i) => i.author_pen_name ?? i.author_id)).size;
    return { all: items.length, ongoing, completed, notifyOn, authors };
  }, [items]);

  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter((i) => i.status === filter);
  }, [items, filter]);

  if (!isAuthed) return <UnauthState />;

  return (
    <div className="space-y-12">
      {/* Stats row — same color-coded tiles as the dashboard */}
      <section aria-label="Watchlist snapshot">
        <div className="mb-6">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">
            At a glance
          </p>
          <h2 className="font-display text-2xl font-bold text-on-surface md:text-3xl">
            Your watchlist snapshot
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            icon="star"
            label="Watching"
            value={counts.all}
            hint={counts.all === 0 ? 'Add a story to begin' : 'Across your watchlist'}
            palette={PALETTES.sky}
          />
          <StatTile
            icon="play"
            label="Ongoing"
            value={counts.ongoing}
            hint={counts.ongoing === 0 ? 'No ongoing stories' : 'Still being written'}
            palette={PALETTES.amber}
          />
          <StatTile
            icon="check-circle"
            label="Completed"
            value={counts.completed}
            hint={counts.completed === 0 ? 'No finished stories' : 'Binge ready'}
            palette={PALETTES.emerald}
          />
          <StatTile
            icon="zap"
            label="Notify on"
            value={counts.notifyOn}
            hint={counts.notifyOn === 0 ? 'Notifications off' : 'Will alert you on new chapters'}
            palette={PALETTES.rose}
          />
        </div>
      </section>

      {/* Watchlist — filter pills + list */}
      <section aria-labelledby="watchlist-heading">
        <div className="mb-6 flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">
              Your watchlist
            </p>
            <h2
              id="watchlist-heading"
              className="font-display text-2xl font-bold text-on-surface md:text-3xl"
            >
              Stories you're following
            </h2>
            <p className="mt-2 text-sm text-on-surface-variant">
              Toggle per-story notifications, or jump straight back in.
            </p>
          </div>
        </div>

        {items.length > 0 ? (
          <>
            <div className="mb-5 flex flex-wrap gap-2">
              <FilterPill
                active={filter === 'all'}
                count={counts.all}
                onClick={() => setFilter('all')}
                palette={PALETTES.sky}
              >
                All
              </FilterPill>
              <FilterPill
                active={filter === 'ongoing'}
                count={counts.ongoing}
                onClick={() => setFilter('ongoing')}
                palette={PALETTES.amber}
              >
                Ongoing
              </FilterPill>
              <FilterPill
                active={filter === 'completed'}
                count={counts.completed}
                onClick={() => setFilter('completed')}
                palette={PALETTES.emerald}
              >
                Completed
              </FilterPill>
            </div>

            {filtered.length === 0 ? (
              <Card className="p-10 text-center">
                <Icon name="search" size={28} className="mx-auto text-on-surface-variant" />
                <p className="mt-3 text-sm text-on-surface-variant">
                  No stories match this filter.
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {filtered.map((item) => (
                  <StoryRow
                    key={item.story_id}
                    item={item}
                    onRemove={onRemove}
                    onToggleNotify={onToggleNotify}
                    busy={busyId === item.story_id}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <EmptyWatchlistState />
        )}
      </section>
    </div>
  );
};

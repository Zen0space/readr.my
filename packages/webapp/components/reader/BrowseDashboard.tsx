'use client';

import { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import { useSetAtom } from 'jotai';
import { Badge, Card, Icon, Skeleton } from '@/components/ui';
import { useApiCall } from '@/lib/session';
import { libraryApi, writingsApi } from '@/lib/api';
import type { Writing } from '@/lib/api';
import { lastApiErrorAtom } from '@/lib/session';
import { cn } from '@/lib/cn';

type Props = {
  initialWritings: Writing[];
  initialSearch: string;
  isAuthed: boolean;
};

const formatAuthor = (w: Writing): string =>
  w.profiles?.username?.trim() ? w.profiles.username : 'Author';

const StatusBadge = ({ status }: { status: Writing['status'] }): React.ReactElement => (
  <Badge tone={status === 'published' ? 'primary' : 'neutral'} size="sm">
    {status}
  </Badge>
);

const StoryCard = ({ writing, isAuthed, onAdd, onRemove, inLibrary, busy }: {
  writing: Writing;
  isAuthed: boolean;
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
  inLibrary: boolean;
  busy: boolean;
}): React.ReactElement => {
  return (
    <Card className="flex h-full flex-col justify-between p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card-elevated">
      <Link href={`/read/writing/${writing.id}`} className="block">
        <div className="relative mb-4 aspect-[4/5] overflow-hidden rounded-xl bg-surface-container-high shadow-sm">
          {writing.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={writing.cover_url}
              alt={writing.title}
              className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-container/30 to-secondary-container/30">
              <Icon name="menu-book" size={48} />
            </div>
          )}
          <div className="absolute right-3 top-3">
            <StatusBadge status={writing.status} />
          </div>
        </div>
        <h4 className="line-clamp-1 font-display text-base font-bold text-on-surface transition-colors group-hover:text-primary">
          {writing.title}
        </h4>
        <p className="mt-1.5 line-clamp-2 text-xs text-on-surface-variant">
          {writing.description?.trim() || 'No description provided.'}
        </p>
      </Link>
      <div className="mt-5 flex items-center justify-between border-t border-outline-variant/20 pt-3">
        <span className="flex items-center gap-1 text-xs font-medium text-on-surface-variant">
          <Icon name="person" size={14} />
          {formatAuthor(writing)}
        </span>
        {isAuthed ? (
          <button
            type="button"
            onClick={() => (inLibrary ? onRemove(writing.id) : onAdd(writing.id))}
            disabled={busy}
            aria-label={inLibrary ? 'Remove from library' : 'Add to library'}
            className={cn(
              'rounded-lg p-1.5 transition-colors',
              inLibrary
                ? 'bg-primary-container/15 text-primary'
                : 'text-on-surface-variant hover:bg-surface-container hover:text-primary',
            )}
          >
            <Icon name={inLibrary ? 'bookmark-filled' : 'bookmark-add'} size={16} />
          </button>
        ) : (
          <span className="text-[10px] font-semibold uppercase tracking-wider text-outline">
            Read Now
          </span>
        )}
      </div>
    </Card>
  );
};

const HeroFeature = ({ writing }: { writing: Writing | null }): React.ReactElement => {
  if (!writing) {
    return (
      <section
        aria-label="Featured story"
        className="flex h-[320px] items-center justify-center rounded-3xl border border-outline-variant/30 bg-surface-container shadow-card md:h-[400px]"
      >
        <div className="text-center text-on-surface-variant">
          <Icon name="menu-book" size={48} />
          <p className="mt-2 text-sm">No published stories yet — be the first to publish.</p>
        </div>
      </section>
    );
  }
  return (
    <section
      aria-label="Featured story"
      className="relative h-[320px] overflow-hidden rounded-3xl border border-outline-variant/30 shadow-card md:h-[400px]"
    >
      {writing.cover_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={writing.cover_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary" />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-on-background/90 via-on-background/50 to-transparent" />
      <div className="absolute inset-0 flex max-w-2xl flex-col justify-end p-8 md:p-12">
        <Badge tone="primary" size="sm" className="mb-4 w-fit">
          Featured Release
        </Badge>
        <h2 className="mb-4 font-display text-3xl font-bold leading-tight text-white md:text-5xl">
          {writing.title}
        </h2>
        <p className="mb-8 line-clamp-2 text-sm text-slate-200 md:text-base">
          {writing.description?.trim() || 'Enter the realm of deep flow reading.'}
        </p>
        <Link
          href={`/read/writing/${writing.id}`}
          className="inline-flex w-fit items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-primary-glow transition-colors hover:bg-primary-container"
        >
          <Icon name="menu-book" size={20} />
          Start Reading
        </Link>
      </div>
    </section>
  );
};

export const BrowseDashboard = ({ initialWritings, initialSearch, isAuthed }: Props): React.ReactElement => {
  const [writings, setWritings] = useState<Writing[]>(initialWritings);
  const [search, setSearch] = useState(initialSearch);
  const [isLoading, setIsLoading] = useState(false);
  const [libraryIds, setLibraryIds] = useState<Set<string>>(new Set());
  const [busyId, setBusyId] = useState<string | null>(null);
  const setError = useSetAtom(lastApiErrorAtom);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callList = useApiCall(writingsApi.list);
  const callAdd = useApiCall(libraryApi.add);
  const callRemove = useApiCall(libraryApi.remove);

  const load = useCallback(
    async (query: string) => {
      setIsLoading(true);
      try {
        const result = await callList(query ? { search: query } : {});
        if (result) {
          setWritings(result.writings);
        }
      } catch (e) {
        setError(e);
      } finally {
        setIsLoading(false);
      }
    },
    [callList, setError],
  );

  const onSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        void load(value);
      }, 300);
    },
    [load],
  );

  const onAdd = useCallback(
    async (id: string) => {
      setBusyId(id);
      try {
        await callAdd(id);
        setLibraryIds((prev) => new Set(prev).add(id));
      } finally {
        setBusyId(null);
      }
    },
    [callAdd],
  );

  const onRemove = useCallback(
    async (id: string) => {
      setBusyId(id);
      try {
        await callRemove(id);
        setLibraryIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      } finally {
        setBusyId(null);
      }
    },
    [callRemove],
  );

  return (
    <div className="space-y-12">
      <HeroFeature writing={writings[0] ?? null} />

      <section aria-labelledby="explore-heading">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 id="explore-heading" className="font-display text-2xl font-bold text-on-surface md:text-3xl">
              Explore Writings
            </h3>
            <p className="mt-1 text-sm text-on-surface-variant">
              Discover the latest works from our author collective.
            </p>
          </div>
          <div className="relative w-full sm:max-w-sm">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
              <Icon name="search" size={18} />
            </span>
            <input
              type="search"
              value={search}
              onChange={(e) => onSearchChange(e.currentTarget.value)}
              placeholder="Search stories, authors…"
              className="w-full rounded-full border border-outline-variant/50 bg-surface-container-lowest py-2 pl-10 pr-4 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {isLoading && writings.length === 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="overflow-hidden p-4">
                <Skeleton className="mb-4 aspect-[4/5] w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="mt-2 h-3 w-full" />
              </Card>
            ))}
          </div>
        ) : writings.length === 0 ? (
          <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest py-16 text-center">
            <Icon name="menu-book" size={40} />
            <p className="mt-3 text-on-surface-variant">
              No stories found matching your criteria.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {writings.map((w) => (
              <StoryCard
                key={w.id}
                writing={w}
                isAuthed={isAuthed}
                onAdd={onAdd}
                onRemove={onRemove}
                inLibrary={libraryIds.has(w.id)}
                busy={busyId === w.id}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

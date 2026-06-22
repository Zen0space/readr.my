'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { Card, Icon, Tabs } from '@/components/ui';
import { useApiCall } from '@/lib/session';
import { libraryApi, writingsApi } from '@/lib/api';
import type { LibraryItem, Writing } from '@/lib/api';
import { lastApiErrorAtom } from '@/lib/session';
import { useSetAtom } from 'jotai';
import { Skeleton } from '@/components/ui';

type Props = {
  initialLibrary: LibraryItem[];
  isAuthed: boolean;
};

const StoryRow = ({ item, onRemove, busy }: {
  item: LibraryItem;
  onRemove: (id: string) => void;
  busy: boolean;
}): React.ReactElement => (
  <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
    <div className="h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-surface-container-high">
      {item.cover_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.cover_url} alt={item.title} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-primary-container/30">
          <Icon name="menu-book" size={20} />
        </div>
      )}
    </div>
    <div className="min-w-0 flex-1">
      <Link href={`/read/writing/${item.id}`} className="font-display text-base font-bold text-on-surface hover:text-primary">
        {item.title}
      </Link>
      <p className="mt-1 line-clamp-2 text-xs text-on-surface-variant">
        {item.description?.trim() || 'No description.'}
      </p>
      <p className="mt-1 text-[10px] uppercase tracking-wider text-outline">
        Added {new Date(item.added_at).toLocaleDateString()}
      </p>
    </div>
    <div className="flex items-center gap-2">
      <Link
        href={`/read/writing/${item.id}`}
        className="rounded-xl bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/15"
      >
        Continue
      </Link>
      <button
        type="button"
        onClick={() => onRemove(item.id)}
        disabled={busy}
        className="rounded-xl p-2 text-on-surface-variant hover:bg-error/10 hover:text-error disabled:opacity-50"
        aria-label="Remove from library"
      >
        <Icon name="trending-up" size={16} className="rotate-45" />
      </button>
    </div>
  </Card>
);

export const LibraryView = ({ initialLibrary, isAuthed }: Props): React.ReactElement => {
  const [items, setItems] = useState<LibraryItem[]>(initialLibrary);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const setError = useSetAtom(lastApiErrorAtom);
  const callRemove = useApiCall(libraryApi.remove);
  const callList = useApiCall(libraryApi.list);
  const callWritings = useApiCall(writingsApi.list);

  const onRemove = useCallback(
    async (id: string) => {
      setBusyId(id);
      try {
        await callRemove(id);
        setItems((prev) => prev.filter((it) => it.id !== id));
      } catch (e) {
        setError(e);
      } finally {
        setBusyId(null);
      }
    },
    [callRemove, setError],
  );

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await callList();
      if (result) setItems(result.library);
    } catch (e) {
      setError(e);
    } finally {
      setIsLoading(false);
    }
  }, [callList, setError]);

  const loadDiscover = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await callWritings({ status: 'published' });
      if (result) {
        const mapped: LibraryItem[] = result.writings.map((w: Writing) => ({
          ...w,
          added_at: new Date().toISOString(),
        }));
        setItems(mapped);
      }
    } catch (e) {
      setError(e);
    } finally {
      setIsLoading(false);
    }
  }, [callWritings, setError]);

  if (!isAuthed) {
    return (
      <Card className="mx-auto max-w-md p-8 text-center">
        <Icon name="bookmark" size={32} />
        <h2 className="mt-4 font-display text-xl font-bold">Sign in to use your library</h2>
        <p className="mt-2 text-sm text-on-surface-variant">
          Your saved stories and reading progress will live here once you sign in.
        </p>
        <Link
          href="/login?redirect=/library"
          className="mt-4 inline-block rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
        >
          Sign in
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-on-surface">My Library</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Stories you've saved for later.
        </p>
      </header>

      <Tabs
        id="library"
        defaultValue="continue"
        items={[
          { value: 'continue', label: 'Saved' },
          { value: 'history', label: 'History' },
          { value: 'discover', label: 'Discover' },
        ]}
      >
        {(active) => {
          if (active === 'continue') {
            return isLoading && items.length === 0 ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <EmptyState message="No saved stories yet. Browse the catalog and tap the bookmark to add one." />
            ) : (
              <div className="space-y-3">
                {items.map((it) => (
                  <StoryRow key={it.id} item={it} onRemove={onRemove} busy={busyId === it.id} />
                ))}
              </div>
            );
          }
          if (active === 'history') {
            return <EmptyState message="Reading history will appear here once you start reading." />;
          }
          return (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => {
                  void loadDiscover();
                  void refresh();
                }}
                className="text-sm font-semibold text-primary hover:underline"
              >
                Load latest published stories →
              </button>
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : null}
            </div>
          );
        }}
      </Tabs>
    </div>
  );
};

const EmptyState = ({ message }: { message: string }): React.ReactElement => (
  <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest py-16 text-center">
    <Icon name="bookmark" size={32} />
    <p className="mt-3 text-sm text-on-surface-variant">{message}</p>
  </div>
);

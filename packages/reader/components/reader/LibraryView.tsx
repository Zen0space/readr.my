'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { Card, Icon } from '@/components/ui';
import { useApiCall } from '@/lib/session';
import { libraryApi } from '@/lib/api';
import type { LibraryItem } from '@auror/shared/api';
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
          <Icon name="book" size={20} />
        </div>
      )}
    </div>
    <div className="flex-1 min-w-0">
      <Link
        href={`/read/${item.story_id}`}
        className="line-clamp-1 font-display text-base font-bold text-on-surface hover:text-primary"
      >
        {item.title}
      </Link>
      <p className="mt-1 line-clamp-1 text-xs text-on-surface-variant">
        {item.author_pen_name ?? 'Author'}
      </p>
    </div>
    <div className="flex shrink-0 items-center gap-2">
      <Link
        href={`/read/${item.story_id}`}
        className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary-container"
      >
        Read
      </Link>
      <button
        type="button"
        onClick={() => onRemove(item.story_id)}
        disabled={busy}
        className="rounded-lg border border-outline-variant/40 p-2 text-on-surface-variant hover:bg-surface-container disabled:opacity-50"
        aria-label="Remove from library"
      >
        <Icon name="x" size={14} />
      </button>
    </div>
  </Card>
);

export const LibraryView = ({ initialLibrary, isAuthed }: Props): React.ReactElement => {
  const [items, setItems] = useState<LibraryItem[]>(initialLibrary);
  const [busyId, setBusyId] = useState<string | null>(null);
  const setError = useSetAtom(lastApiErrorAtom);
  const callRemove = useApiCall(libraryApi.remove);

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

  if (!isAuthed) {
    return (
      <Card className="mx-auto max-w-md p-8 text-center">
        <Icon name="book-open" size={32} />
        <h2 className="mt-4 font-display text-xl font-bold">Sign in to see your library</h2>
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
        <h1 className="font-display text-3xl font-bold text-on-surface">Library</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Stories you've saved to read later.
        </p>
      </header>

      {items.length === 0 ? (
        <Card className="p-12 text-center">
          <Skeleton className="mx-auto h-24 w-24 rounded-full" />
          <p className="mt-4 text-on-surface-variant">
            Your library is empty. Browse stories and tap the bookmark to save them here.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
          >
            Browse stories
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <StoryRow
              key={item.story_id}
              item={item}
              onRemove={onRemove}
              busy={busyId === item.story_id}
            />
          ))}
        </div>
      )}
    </div>
  );
};
'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useSetAtom } from 'jotai';
import { Badge, Card, Icon, Skeleton } from '@/components/ui';
import { useApiCall, lastApiErrorAtom } from '@/lib/session';
import { writingsApi, type CreateWritingInput } from '@/lib/api';
import type { Writing } from '@auror/shared/api';
import { cn } from '@/lib/cn';

type Props = {
  initialWritings: Writing[];
  isAuthed: boolean;
};

const StatusBadge = ({ status }: { status: Writing['status'] }): React.ReactElement => (
  <Badge tone={status === 'ongoing' ? 'primary' : status === 'completed' ? 'success' : 'neutral'} size="sm">
    {status}
  </Badge>
);

const StoryRow = ({
  story,
  onPublish,
  onDelete,
  busy,
}: {
  story: Writing;
  onPublish: (id: string) => void;
  onDelete: (id: string) => void;
  busy: boolean;
}): React.ReactElement => (
  <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
    <div className="h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-surface-container-high">
      {story.cover_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={story.cover_url} alt={story.title} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-primary-container/30">
          <Icon name="menu-book" size={20} />
        </div>
      )}
    </div>
    <div className="flex-1 min-w-0">
      <Link
        href={`/author/studio?story=${story.id}`}
        className="line-clamp-1 font-display text-base font-bold text-on-surface hover:text-primary"
      >
        {story.title}
      </Link>
      <p className="mt-1 line-clamp-1 text-xs text-on-surface-variant">
        {story.blurb?.slice(0, 80) || 'No blurb yet.'}
      </p>
      <div className="mt-1 flex items-center gap-2 text-xs text-on-surface-variant">
        <StatusBadge status={story.status} />
        <span>{story.tags.join(', ') || 'no tags'}</span>
      </div>
    </div>
    <div className="flex shrink-0 items-center gap-2">
      {story.status === 'draft' ? (
        <button
          type="button"
          onClick={() => onPublish(story.id)}
          disabled={busy}
          className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary-container disabled:opacity-50"
        >
          Publish
        </button>
      ) : (
        <Link
          href={`/author/studio?story=${story.id}`}
          className="rounded-lg border border-outline-variant/40 px-3 py-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-container"
        >
          Edit
        </Link>
      )}
      <button
        type="button"
        onClick={() => onDelete(story.id)}
        disabled={busy}
        className="rounded-lg border border-outline-variant/40 p-2 text-on-surface-variant hover:bg-surface-container disabled:opacity-50"
        aria-label="Delete"
      >
        <Icon name="x" size={14} />
      </button>
    </div>
  </Card>
);

const NewStoryForm = ({ onCreate }: { onCreate: (input: CreateWritingInput) => Promise<void> }) => {
  const [title, setTitle] = useState('');
  const [blurb, setBlurb] = useState('');
  const [genre, setGenre] = useState('fiction');
  const [language, setLanguage] = useState<'ms' | 'en'>('en');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    try {
      await onCreate({ title: title.trim(), blurb, genre, language });
      setTitle('');
      setBlurb('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="p-5">
      <h3 className="font-display text-base font-semibold text-on-surface">Start a new story</h3>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.currentTarget.value)}
          placeholder="Title"
          className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-2 text-sm focus:border-primary focus:outline-none"
        />
        <textarea
          value={blurb}
          onChange={(e) => setBlurb(e.currentTarget.value)}
          placeholder="Short blurb (max 2000 chars)"
          rows={3}
          className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-2 text-sm focus:border-primary focus:outline-none"
        />
        <div className="grid grid-cols-2 gap-3">
          <select
            value={genre}
            onChange={(e) => setGenre(e.currentTarget.value)}
            className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 text-sm"
          >
            <option value="fiction">Fiction</option>
            <option value="romance">Romance</option>
            <option value="fantasy">Fantasy</option>
            <option value="scifi">Sci-fi</option>
            <option value="mystery">Mystery</option>
            <option value="horror">Horror</option>
            <option value="other">Other</option>
          </select>
          <select
            value={language}
            onChange={(e) => setLanguage(e.currentTarget.value as 'ms' | 'en')}
            className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 text-sm"
          >
            <option value="en">English</option>
            <option value="ms">Bahasa Melayu</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={busy || !title.trim()}
          className="w-full rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? 'Creating…' : 'Create draft'}
        </button>
      </form>
    </Card>
  );
};

export const StudioView = ({ initialWritings, isAuthed }: Props): React.ReactElement => {
  const [writings, setWritings] = useState<Writing[]>(initialWritings);
  const [busyId, setBusyId] = useState<string | null>(null);
  const setError = useSetAtom(lastApiErrorAtom);
  const callCreate = useApiCall(writingsApi.create);
  const callPublish = useApiCall(writingsApi.publish);
  const callRemove = useApiCall(writingsApi.remove);

  const onCreate = useCallback(
    async (input: CreateWritingInput) => {
      try {
        const created = await callCreate(input);
        if (created) setWritings((prev) => [created, ...prev]);
      } catch (e) {
        setError(e);
      }
    },
    [callCreate, setError],
  );

  const onPublish = useCallback(
    async (id: string) => {
      setBusyId(id);
      try {
        const published = await callPublish(id, 'ongoing');
        if (published) {
          setWritings((prev) =>
            prev.map((w) => (w.id === id ? published : w)),
          );
        }
      } catch (e) {
        setError(e);
      } finally {
        setBusyId(null);
      }
    },
    [callPublish, setError],
  );

  const onDelete = useCallback(
    async (id: string) => {
      if (!window.confirm('Delete this story permanently? This cannot be undone.')) return;
      setBusyId(id);
      try {
        await callRemove(id);
        setWritings((prev) => prev.filter((w) => w.id !== id));
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
        <Icon name="stylus-note" size={32} />
        <h2 className="mt-4 font-display text-xl font-bold">Sign in to manage your stories</h2>
        <Link
          href="/login?redirect=/author/studio"
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
        <h1 className="font-display text-3xl font-bold text-on-surface">Writing Studio</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Drafts, ongoing serials, and completed works.
        </p>
      </header>

      <NewStoryForm onCreate={onCreate} />

      {writings.length === 0 ? (
        <Card className="p-12 text-center">
          <Icon name="menu-book" size={40} />
          <p className="mt-4 text-on-surface-variant">
            No stories yet. Use the form above to start your first draft.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {writings.map((w) => (
            <StoryRow
              key={w.id}
              story={w}
              onPublish={onPublish}
              onDelete={onDelete}
              busy={busyId === w.id}
            />
          ))}
        </div>
      )}
    </div>
  );
};
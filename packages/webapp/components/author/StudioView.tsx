'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge, Button, Card, Icon, Input, Textarea } from '@/components/ui';
import { useApiCall, useSetSession } from '@/lib/session';
import { authApi, uploadApi, writingsApi } from '@/lib/api';
import type { Chapter, Writing, CreateChapterInput } from '@/lib/api';
import { useSetAtom } from 'jotai';
import { lastApiErrorAtom } from '@/lib/session';
import { cn } from '@/lib/cn';

type Props = {
  initialWritings: Writing[];
  isAuthed: boolean;
};

type SelectedChapter = Chapter | null;

export const StudioView = ({ initialWritings, isAuthed }: Props): React.ReactElement => {
  const router = useRouter();
  const [writings, setWritings] = useState<Writing[]>(initialWritings);
  const [activeWritingId, setActiveWritingId] = useState<string | null>(initialWritings[0]?.id ?? null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [activeChapter, setActiveChapter] = useState<SelectedChapter>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const setError = useSetAtom(lastApiErrorAtom);
  const callWritings = useApiCall(writingsApi.list);
  const callChapters = useApiCall(writingsApi.chapters.list);
  const callCreateChapter = useApiCall(writingsApi.chapters.create);
  const callUpdateChapter = useApiCall(writingsApi.chapters.update);
  const callDeleteChapter = useApiCall(writingsApi.chapters.remove);
  const callUpload = useApiCall(uploadApi.file);

  const loadChapters = useCallback(
    async (writingId: string) => {
      try {
        const result = await callChapters(writingId);
        if (result) setChapters(result.chapters);
      } catch (e) {
        setError(e);
      }
    },
    [callChapters, setError],
  );

  const onSelectWriting = useCallback(
    (id: string) => {
      setActiveWritingId(id);
      setActiveChapter(null);
      void loadChapters(id);
    },
    [loadChapters],
  );

  const onSelectChapter = (chapter: Chapter) => setActiveChapter(chapter);

  const onCreateChapter = useCallback(async () => {
    if (!activeWritingId) return;
    setBusy(true);
    try {
      const newOrder = chapters.length + 1;
      const input: CreateChapterInput = {
        title: `Chapter ${newOrder}`,
        content: '',
        chapterOrder: newOrder,
      };
      const result = await callCreateChapter(activeWritingId, input);
      if (result) {
        setChapters((prev) => [...prev, result.chapter]);
        setActiveChapter(result.chapter);
      }
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }, [activeWritingId, callCreateChapter, chapters.length, setError]);

  const onSaveChapter = useCallback(
    async (chapter: Chapter, patch: Partial<Chapter>) => {
      setBusy(true);
      setFeedback(null);
      try {
        const input: CreateChapterInput = {
          title: patch.title ?? chapter.title,
          content: patch.content ?? chapter.content ?? '',
          chapterOrder: patch.chapter_order ?? chapter.chapter_order,
          isPremium: patch.is_premium ?? chapter.is_premium,
          coinPrice: patch.coin_price ?? chapter.coin_price,
          status: patch.status ?? chapter.status,
        };
        const result = await callUpdateChapter(chapter.id, input);
        if (result) {
          setChapters((prev) => prev.map((c) => (c.id === chapter.id ? result.chapter : c)));
          setActiveChapter(result.chapter);
          setFeedback('Saved');
        }
      } catch (e) {
        setError(e);
        setFeedback(e instanceof Error ? e.message : 'Save failed');
      } finally {
        setBusy(false);
      }
    },
    [callUpdateChapter, setError],
  );

  const onDeleteChapter = useCallback(
    async (chapter: Chapter) => {
      if (!confirm(`Delete "${chapter.title}"?`)) return;
      setBusy(true);
      try {
        await callDeleteChapter(chapter.id);
        setChapters((prev) => prev.filter((c) => c.id !== chapter.id));
        if (activeChapter?.id === chapter.id) setActiveChapter(null);
      } catch (e) {
        setError(e);
      } finally {
        setBusy(false);
      }
    },
    [callDeleteChapter, activeChapter, setError],
  );

  const onCoverUpload = useCallback(
    async (file: File) => {
      if (!activeWritingId) return;
      setBusy(true);
      try {
        const result = await callUpload(file, 'writing-covers');
        if (result) {
          setWritings((prev) =>
            prev.map((w) => (w.id === activeWritingId ? { ...w, cover_url: result.url } : w)),
          );
          setFeedback('Cover uploaded');
        }
      } catch (e) {
        setError(e);
      } finally {
        setBusy(false);
      }
    },
    [activeWritingId, callUpload, setError],
  );

  const onCreateWriting = useCallback(async () => {
    const title = prompt('Title for the new story?', 'Untitled');
    if (!title) return;
    setBusy(true);
    try {
      const result = await writingsApi.create({ title, status: 'draft' });
      setWritings((prev) => [result.writing, ...prev]);
      setActiveWritingId(result.writing.id);
      setActiveChapter(null);
      setChapters([]);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }, [setError]);

  if (!isAuthed) {
    return (
      <Card className="mx-auto max-w-md p-8 text-center">
        <Icon name="stylus-note" size={32} />
        <h2 className="mt-4 font-display text-xl font-bold">Sign in as an author</h2>
        <p className="mt-2 text-sm text-on-surface-variant">
          The Writing Studio is for authors. Sign in with an author account to manage your stories.
        </p>
        <Button onClick={() => router.push('/login?redirect=/author/studio')} className="mt-4">
          Sign in
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-on-surface">Writing Studio</h1>
          <p className="mt-1 text-sm text-on-surface-variant">Manage your stories and chapters.</p>
        </div>
        <Button onClick={() => { void onCreateWriting(); }} variant="primary" size="md">
          <Icon name="plus" size={16} />
          New story
        </Button>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-2">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-on-surface-variant">
            Your stories
          </h2>
          {writings.length === 0 ? (
            <Card className="p-4 text-sm text-on-surface-variant">
              No stories yet. Click "New story" to start.
            </Card>
          ) : (
            <ul className="space-y-2">
              {writings.map((w) => (
                <li key={w.id}>
                  <button
                    type="button"
                    onClick={() => onSelectWriting(w.id)}
                    className={cn(
                      'w-full rounded-xl border p-3 text-left transition-colors',
                      activeWritingId === w.id
                        ? 'border-primary/40 bg-primary/5'
                        : 'border-outline-variant/40 hover:border-primary/40',
                    )}
                  >
                    <p className="font-display text-sm font-semibold text-on-surface">{w.title}</p>
                    <p className="mt-1 text-xs text-on-surface-variant">
                      {w.status} · {new Date(w.created_at).toLocaleDateString()}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section className="space-y-4">
          {activeWritingId ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-xl font-bold text-on-surface">Chapters</h2>
                <Button onClick={() => { void onCreateChapter(); }} size="sm" variant="secondary">
                  <Icon name="plus" size={14} />
                  New chapter
                </Button>
              </div>
              {chapters.length === 0 ? (
                <Card className="p-6 text-sm text-on-surface-variant">
                  No chapters yet. Click "New chapter" to add the first one.
                </Card>
              ) : (
                <ul className="space-y-2">
                  {chapters.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => onSelectChapter(c)}
                        className={cn(
                          'flex w-full items-center justify-between rounded-xl border p-3 text-left transition-colors',
                          activeChapter?.id === c.id
                            ? 'border-primary/40 bg-primary/5'
                            : 'border-outline-variant/40 hover:border-primary/40',
                        )}
                      >
                        <div>
                          <p className="font-display text-sm font-semibold text-on-surface">
                            {c.chapter_order}. {c.title}
                          </p>
                          <p className="mt-0.5 text-xs text-on-surface-variant">
                            {c.status} · {c.is_premium ? `${c.coin_price} coins` : 'free'}
                          </p>
                        </div>
                        {c.is_premium ? <Badge tone="primary" size="sm">Premium</Badge> : null}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <Card className="p-6 text-sm text-on-surface-variant">
              Select a story on the left, or create a new one.
            </Card>
          )}

          {activeChapter ? (
            <ChapterEditor
              key={activeChapter.id}
              chapter={activeChapter}
              busy={busy}
              feedback={feedback}
              onSave={onSaveChapter}
              onDelete={onDeleteChapter}
              onCoverUpload={onCoverUpload}
            />
          ) : null}
        </section>
      </div>
    </div>
  );
};

const ChapterEditor = ({
  chapter,
  busy,
  feedback,
  onSave,
  onDelete,
  onCoverUpload,
}: {
  chapter: Chapter;
  busy: boolean;
  feedback: string | null;
  onSave: (chapter: Chapter, patch: Partial<Chapter>) => Promise<void>;
  onDelete: (chapter: Chapter) => Promise<void>;
  onCoverUpload: (file: File) => Promise<void>;
}): React.ReactElement => {
  const [title, setTitle] = useState(chapter.title);
  const [content, setContent] = useState(chapter.content ?? '');
  const [isPremium, setIsPremium] = useState(chapter.is_premium);
  const [coinPrice, setCoinPrice] = useState(chapter.coin_price);
  const [status, setStatus] = useState<'draft' | 'published'>(chapter.status);

  return (
    <Card elevated className="space-y-4 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/30 pb-3">
        <h3 className="font-display text-lg font-bold text-on-surface">Edit chapter</h3>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              void onDelete(chapter);
            }}
            disabled={busy}
            className="!text-error hover:!bg-error/10"
          >
            <Icon name="x" size={14} />
            Delete
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              void onSave(chapter, {
                title,
                content,
                is_premium: isPremium,
                coin_price: coinPrice,
                status,
              });
            }}
            disabled={busy}
            isLoading={busy}
          >
            <Icon name="check" size={14} />
            Save
          </Button>
        </div>
      </header>

      <Input
        label="Title"
        value={title}
        onChange={(e) => setTitle(e.currentTarget.value)}
      />

      <Textarea
        label="Content (markdown)"
        value={content}
        onChange={(e) => setContent(e.currentTarget.value)}
        rows={14}
        className="font-body"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <label className="flex items-center gap-2 text-sm font-semibold text-on-surface">
          <input
            type="checkbox"
            checked={isPremium}
            onChange={(e) => setIsPremium(e.currentTarget.checked)}
            className="h-4 w-4 rounded border-outline-variant"
          />
          Premium chapter
        </label>
        <Input
          type="number"
          min={0}
          label="Coin price"
          value={coinPrice}
          onChange={(e) => setCoinPrice(Number(e.currentTarget.value))}
          disabled={!isPremium}
        />
        <label className="block">
          <span className="mb-1.5 block font-display text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            Status
          </span>
          <select
            value={status}
            onChange={(e) => setStatus(e.currentTarget.value as 'draft' | 'published')}
            className="h-11 w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-4 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </label>
      </div>

      <div className="flex items-center gap-3">
        <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-outline-variant/40 px-4 py-2 text-sm font-semibold text-on-surface-variant hover:border-primary/40 hover:text-primary">
          <Icon name="image" size={16} />
          Upload cover
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.currentTarget.files?.[0];
              if (file) void onCoverUpload(file);
            }}
          />
        </label>
        {feedback ? <span className="text-sm text-primary">{feedback}</span> : null}
      </div>
    </Card>
  );
};

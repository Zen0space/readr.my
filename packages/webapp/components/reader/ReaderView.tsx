'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSetAtom } from 'jotai';
import { Badge, Card, Icon, Skeleton } from '@/components/ui';
import { useApiCall, lastApiErrorAtom } from '@/lib/session';
import { libraryApi, writingsApi, walletApi } from '@/lib/api';
import type { Chapter, Writing } from '@/lib/api';
import { cn } from '@/lib/cn';

type Props = {
  writing: Writing;
  chapter: Chapter;
  chapters: Chapter[];
  coinBalance: number | null;
  isAuthed: boolean;
  isUnlocked: boolean;
};

export const ReaderView = ({
  writing,
  chapter,
  chapters,
  coinBalance,
  isAuthed,
  isUnlocked,
}: Props): React.ReactElement => {
  const router = useRouter();
  const setError = useSetAtom(lastApiErrorAtom);
  const [unlocked, setUnlocked] = useState(isUnlocked);
  const [balance, setBalance] = useState<number | null>(coinBalance);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [inLibrary, setInLibrary] = useState(false);

  const callUnlock = useApiCall(writingsApi.chapters.unlock);
  const callBalance = useApiCall(walletApi.balance);
  const callAddLib = useApiCall(libraryApi.add);
  const callRemoveLib = useApiCall(libraryApi.remove);

  const isPaid = chapter.is_premium;
  const canRead = !isPaid || unlocked;

  const onUnlock = useCallback(async () => {
    if (!isAuthed) {
      router.push(`/login?redirect=/read/${chapter.id}`);
      return;
    }
    setBusy(true);
    setFeedback(null);
    try {
      await callUnlock(chapter.id);
      setUnlocked(true);
      const refreshed = await callBalance();
      if (refreshed) setBalance(refreshed.wallet.coin_balance);
      setFeedback('Chapter unlocked. Enjoy.');
    } catch (e) {
      setError(e);
      setFeedback(e instanceof Error ? e.message : 'Unlock failed.');
    } finally {
      setBusy(false);
    }
  }, [callUnlock, callBalance, chapter.id, isAuthed, router, setError]);

  const onToggleLibrary = useCallback(async () => {
    if (!isAuthed) {
      router.push(`/login?redirect=/read/${chapter.id}`);
      return;
    }
    setBusy(true);
    try {
      if (inLibrary) {
        await callRemoveLib(writing.id);
        setInLibrary(false);
      } else {
        await callAddLib(writing.id);
        setInLibrary(true);
      }
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }, [callAddLib, callRemoveLib, chapter.id, inLibrary, isAuthed, router, setError, writing.id]);

  const currentIndex = chapters.findIndex((c) => c.id === chapter.id);
  const prev = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const next = currentIndex >= 0 && currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;

  return (
    <div className="mx-auto max-w-reading space-y-6">
      <header className="flex flex-col gap-2 border-b border-outline-variant/30 pb-4">
        <Link
          href={`/?focus=${writing.id}`}
          className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant hover:text-primary"
        >
          ← {writing.title}
        </Link>
        <h1 className="font-display text-2xl font-bold text-on-surface md:text-3xl">
          {chapter.title}
        </h1>
        <div className="flex flex-wrap items-center gap-2 text-xs text-on-surface-variant">
          <Badge tone={isPaid ? 'primary' : 'success'} size="sm">
            {isPaid ? 'Premium' : 'Free'}
          </Badge>
          <span>·</span>
          <span>Chapter {chapter.chapter_order}</span>
          {isPaid && !unlocked ? (
            <>
              <span>·</span>
              <span className="font-semibold text-primary">{chapter.coin_price} coins</span>
            </>
          ) : null}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              void onToggleLibrary();
            }}
            disabled={busy}
            className={cn(
              'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
              inLibrary
                ? 'border-primary/30 bg-primary/10 text-primary'
                : 'border-outline-variant/40 text-on-surface-variant hover:border-primary/40 hover:text-primary',
            )}
          >
            <Icon name={inLibrary ? 'bookmark-filled' : 'bookmark-add'} size={14} />
            {inLibrary ? 'Saved' : 'Save to library'}
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-full border border-outline-variant/40 px-3 py-1.5 text-xs font-semibold text-on-surface-variant hover:border-primary/40 hover:text-primary"
          >
            <Icon name="share" size={14} />
            Share
          </button>
        </div>
      </header>

      {!canRead ? (
        <Card elevated className="p-8 text-center">
          <Icon name="lock" size={36} className="mx-auto text-primary" />
          <h2 className="mt-3 font-display text-xl font-bold text-on-surface">Premium chapter</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Unlock with {chapter.coin_price} coins. Your balance:{' '}
            <span className="font-semibold text-on-surface">{balance ?? '—'}</span> coins.
          </p>
          {feedback ? (
            <p className="mt-3 text-sm text-error">{feedback}</p>
          ) : null}
          <button
            type="button"
            onClick={() => {
              void onUnlock();
            }}
            disabled={busy}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-primary-glow disabled:opacity-50"
          >
            {busy ? (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Icon name="toll" size={16} />
            )}
            Unlock for {chapter.coin_price} coins
          </button>
        </Card>
      ) : (
        <article className="prose-reading space-y-4 text-on-surface">
          {chapter.content
            ? chapter.content.split(/\n{2,}/).map((para, i) => (
                <p key={i}>{para}</p>
              ))
            : <Skeleton className="h-32 w-full" />}
        </article>
      )}

      {feedback && canRead ? (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm text-primary">
          {feedback}
        </div>
      ) : null}

      <nav className="flex items-center justify-between border-t border-outline-variant/30 pt-4">
        {prev ? (
          <Link
            href={`/read/${prev.id}`}
            className="flex items-center gap-2 text-sm font-semibold text-on-surface-variant hover:text-primary"
          >
            <Icon name="arrow-left" size={16} />
            {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/read/${next.id}`}
            className="flex items-center gap-2 text-sm font-semibold text-primary"
          >
            {next.title}
            <Icon name="arrow-right" size={16} />
          </Link>
        ) : (
          <span className="text-xs text-on-surface-variant">End of story</span>
        )}
      </nav>
    </div>
  );
};

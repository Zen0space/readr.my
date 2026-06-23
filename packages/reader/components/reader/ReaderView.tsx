'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSetAtom } from 'jotai';
import { Badge, Card, Icon } from '@/components/ui';
import { useApiCall, lastApiErrorAtom } from '@/lib/session';
import { libraryApi, writingsApi, walletApi } from '@/lib/api';
import type { Chapter, Writing } from '@auror/shared/api';
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
  const callUnlock = useApiCall(writingsApi.chapters.unlock);
  const callAddLibrary = useApiCall(libraryApi.add);

  const onUnlock = useCallback(async () => {
    try {
      const result = await callUnlock(chapter.id);
      if (result) router.refresh();
    } catch (e) {
      setError(e);
    }
  }, [callUnlock, chapter.id, router, setError]);

  const onAddLibrary = useCallback(async () => {
    try {
      await callAddLibrary(writing.id);
    } catch (e) {
      setError(e);
    }
  }, [callAddLibrary, writing.id, setError]);

  const content = chapter.content_md
  const locked = !isUnlocked && chapter.gating !== 'free'

  return (
    <div className="mx-auto max-w-reading space-y-6">
      <header>
        <div className="text-xs uppercase tracking-wider text-on-surface-variant">
          <Link href="/" className="hover:text-primary">Browse</Link>
          {' · '}
          <span>{writing.title}</span>
        </div>
        <h1 className="mt-2 font-display text-3xl font-bold text-on-surface">
          Chapter {chapter.ord}: {chapter.title}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge tone="primary" size="sm">{writing.title}</Badge>
          {chapter.gating === 'free' ? (
            <Badge tone="success" size="sm">Free</Badge>
          ) : (
            <Badge tone="warning" size="sm">{chapter.gating === 'coin' ? `${chapter.price_coins} coins` : 'Subscription'}</Badge>
          )}
        </div>
      </header>

      {locked ? (
        <Card className="p-12 text-center">
          <Icon name="lock" size={48} />
          <h2 className="mt-4 font-display text-2xl font-bold">This chapter is locked</h2>
          <p className="mt-2 text-sm text-on-surface-variant">
            Unlock with {chapter.price_coins} coins to keep reading.
          </p>
          {isAuthed ? (
            <button
              type="button"
              onClick={() => void onUnlock()}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-primary-glow transition-colors hover:bg-primary-container"
            >
              <Icon name="toll" size={18} />
              Unlock for {chapter.price_coins} coins
              {coinBalance !== null ? ` (you have ${coinBalance})` : ''}
            </button>
          ) : (
            <Link
              href={`/login?redirect=/read/${chapter.id}`}
              className="mt-6 inline-block rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white"
            >
              Sign in to unlock
            </Link>
          )}
        </Card>
      ) : (
        <article className="prose prose-lg max-w-reading font-body leading-relaxed text-on-surface">
          {content ? (
            <MarkdownLite source={content} />
          ) : (
            <p className="italic text-on-surface-variant">This chapter has no content yet.</p>
          )}
        </article>
      )}

      <div className="border-t border-outline-variant/30 pt-6">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-on-surface-variant">
          Other chapters
        </h3>
        <ul className="mt-3 space-y-2">
          {chapters.map((c) => (
            <li key={c.id}>
              <Link
                href={`/read/${c.id}`}
                className={cn(
                  'flex items-center justify-between rounded-xl border border-outline-variant/30 px-4 py-3 text-sm hover:border-primary/40',
                  c.id === chapter.id ? 'border-primary bg-primary/5 font-semibold' : '',
                )}
              >
                <span>Chapter {c.ord}: {c.title}</span>
                <span className="text-xs text-on-surface-variant">
                  {c.gating === 'free' ? 'Free' : c.gating === 'coin' ? `${c.price_coins} coins` : 'Sub'}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {isAuthed ? (
        <button
          type="button"
          onClick={() => void onAddLibrary()}
          className="rounded-lg border border-outline-variant/40 px-3 py-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-container"
        >
          + Save to library
        </button>
      ) : null}
    </div>
  );
};

// Minimal markdown renderer for chapter content. We don't want a heavy editor
// dep on the reader side; chapters are authored as markdown in the studio and
// rendered here as plain text with paragraph breaks.
const MarkdownLite = ({ source }: { source: string }): React.ReactElement => {
  const paragraphs = source.split(/\n\s*\n/)
  return (
    <>
      {paragraphs.map((p, i) => (
        <p key={i} className="mb-4">{p}</p>
      ))}
    </>
  )
}
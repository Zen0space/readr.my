import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ReaderView } from '@/components/reader/ReaderView';
import type { Chapter, Writing } from '@auror/shared/api';

export const metadata: Metadata = {
  title: 'Reading',
  description: 'Read on Auror.',
};

type Resolved = {
  writing: Writing;
  chapter: Chapter;
  chapters: Chapter[];
  coinBalance: number | null;
  isAuthed: boolean;
  isUnlocked: boolean;
};

const fetchStoryAndChapter = async (
  baseUrl: string,
  chapterId: string,
): Promise<{ writing: Writing; chapter: Chapter; chapters: Chapter[] } | null> => {
  try {
    const chapterRes = await fetch(`${baseUrl}/v1/chapters/${chapterId}`, {
      cache: 'no-store',
    })
    if (!chapterRes.ok) return null
    const chapter = (await chapterRes.json()) as Chapter

    const storyRes = await fetch(`${baseUrl}/v1/stories/${chapter.story_id}`, {
      cache: 'no-store',
    })
    if (!storyRes.ok) return null
    const writing = (await storyRes.json()) as Writing

    const chaptersRes = await fetch(
      `${baseUrl}/v1/stories/${chapter.story_id}/chapters`,
      { cache: 'no-store' },
    )
    const chapters = chaptersRes.ok
      ? ((await chaptersRes.json()) as { items: Chapter[] }).items
      : []

    return { writing, chapter, chapters }
  } catch {
    return null
  }
}

const fetchSessionFlag = async (baseUrl: string): Promise<boolean> => {
  try {
    const res = await fetch(`${baseUrl}/api/auth/session`, { cache: 'no-store' })
    if (!res.ok) return false
    const body = (await res.json()) as { authenticated?: boolean }
    return Boolean(body.authenticated)
  } catch {
    return false
  }
}

type PageProps = {
  params: Promise<{ chapterId: string }>;
};

export default async function ReaderPage({ params }: PageProps): Promise<React.ReactElement> {
  const { chapterId } = await params
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? ''
  const [data, isAuthed] = await Promise.all([
    fetchStoryAndChapter(baseUrl, chapterId),
    fetchSessionFlag(baseUrl),
  ])
  if (!data) {
    notFound()
  }
  // Coin balance + unlock flag would be fetched from /v1/wallet + chapter
  // gate state. Reader-side initial render uses 0/null defaults; the
  // client-side ReaderView component refreshes these via walletApi on mount.
  const coinBalance = 0
  const isUnlocked = data.chapter.gating === 'free'
  return (
    <ReaderView
      writing={data.writing}
      chapter={data.chapter}
      chapters={data.chapters}
      coinBalance={coinBalance}
      isAuthed={isAuthed}
      isUnlocked={isUnlocked}
    />
  )
}
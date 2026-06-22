import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { ReaderView } from '@/components/reader/ReaderView';
import type { Chapter, Writing } from '@/lib/api';

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

const fetchReader = async (chapterId: string): Promise<Resolved | null> => {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: chapter, error: chapterError } = await supabase
      .from('chapters')
      .select('*, writings(*)')
      .eq('id', chapterId)
      .maybeSingle();
    if (chapterError || !chapter) return null;

    const writing = (chapter as { writings: Writing }).writings;
    if (!writing) return null;

    const { data: chapters } = await supabase
      .from('chapters')
      .select('*')
      .eq('writing_id', writing.id)
      .order('chapter_order', { ascending: true });

    let coinBalance: number | null = null;
    let isUnlocked = false;
    if (user) {
      const { data: wallet } = await supabase
        .from('wallets')
        .select('coin_balance')
        .eq('user_id', user.id)
        .maybeSingle();
      coinBalance = wallet?.coin_balance ?? 0;

      const { data: unlock } = await supabase
        .from('chapter_unlocks')
        .select('id')
        .eq('chapter_id', chapterId)
        .eq('user_id', user.id)
        .maybeSingle();
      isUnlocked = Boolean(unlock);
    }

    return {
      writing,
      chapter: chapter as Chapter,
      chapters: (chapters ?? []) as Chapter[],
      coinBalance,
      isAuthed: Boolean(user),
      isUnlocked,
    };
  } catch {
    return null;
  }
};

type PageProps = {
  params: Promise<{ chapterId: string }>;
};

export default async function ReaderPage({ params }: PageProps): Promise<React.ReactElement> {
  const { chapterId } = await params;
  const data = await fetchReader(chapterId);
  if (!data) {
    notFound();
  }
  return <ReaderView {...data} />;
}

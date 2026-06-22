import type { Metadata } from 'next';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { LibraryView } from '@/components/reader/LibraryView';
import type { LibraryItem } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Library',
  description: 'Your saved stories and reading history.',
};

const fetchLibrary = async (): Promise<{ items: LibraryItem[]; isAuthed: boolean }> => {
  if (!isSupabaseConfigured()) return { items: [], isAuthed: false };
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { items: [], isAuthed: false };
    const { data, error } = await supabase
      .from('library')
      .select('created_at, writings(*, profiles(username))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) return { items: [], isAuthed: true };
    const items: LibraryItem[] = (data ?? []).map((row: { created_at: string; writings: LibraryItem | LibraryItem[] | null }) => {
      const writing = Array.isArray(row.writings) ? row.writings[0] : row.writings;
      if (!writing) return null;
      return { ...writing, added_at: row.created_at };
    }).filter((x): x is LibraryItem => x !== null);
    return { items, isAuthed: true };
  } catch {
    return { items: [], isAuthed: false };
  }
};

export default async function LibraryPage(): Promise<React.ReactElement> {
  const { items, isAuthed } = await fetchLibrary();
  return <LibraryView initialLibrary={items} isAuthed={isAuthed} />;
}

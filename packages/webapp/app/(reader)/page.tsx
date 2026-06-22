import type { Metadata } from 'next';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { BrowseDashboard } from '@/components/reader/BrowseDashboard';
import type { Writing } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Browse',
  description: 'Discover stories on Auror.',
};

const fetchInitialWritings = async (search: string): Promise<Writing[]> => {
  if (!isSupabaseConfigured()) {
    return [];
  }
  try {
    const supabase = await createServerClient();
    let query = supabase
      .from('writings')
      .select('*, profiles(username)')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(24);
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }
    const { data, error } = await query;
    if (error) {
      return [];
    }
    return (data ?? []) as Writing[];
  } catch {
    return [];
  }
};

type PageProps = {
  searchParams: { q?: string };
};

export default async function BrowsePage({ searchParams }: PageProps): Promise<React.ReactElement> {
  const search = searchParams.q ?? '';
  const [writings, session] = await Promise.all([
    fetchInitialWritings(search),
    (async () => {
      if (!isSupabaseConfigured()) return { isAuthed: false as const };
      try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();
        return { isAuthed: Boolean(user) };
      } catch {
        return { isAuthed: false as const };
      }
    })(),
  ]);
  return (
    <BrowseDashboard
      initialWritings={writings}
      initialSearch={search}
      isAuthed={session.isAuthed}
    />
  );
}

import type { Metadata } from 'next';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { StudioView } from '@/components/author/StudioView';
import type { Writing } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Writing Studio',
  description: 'Manage your stories and chapters.',
};

const fetchAuthorWritings = async (): Promise<{ writings: Writing[]; isAuthed: boolean }> => {
  if (!isSupabaseConfigured()) return { writings: [], isAuthed: false };
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { writings: [], isAuthed: false };
    const { data } = await supabase
      .from('writings')
      .select('*, profiles(username)')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false });
    return { writings: (data ?? []) as Writing[], isAuthed: true };
  } catch {
    return { writings: [], isAuthed: false };
  }
};

export default async function StudioPage(): Promise<React.ReactElement> {
  const { writings, isAuthed } = await fetchAuthorWritings();
  return <StudioView initialWritings={writings} isAuthed={isAuthed} />;
}

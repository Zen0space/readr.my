import type { Metadata } from 'next';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { SettingsView } from '@/components/author/SettingsView';

export const metadata: Metadata = {
  title: 'Author Settings',
  description: 'Edit your author profile.',
};

const fetchProfile = async (): Promise<{
  username: string;
  email: string;
  avatar: string | null;
  isAuthed: boolean;
}> => {
  if (!isSupabaseConfigured()) return { username: '', email: '', avatar: null, isAuthed: false };
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { username: '', email: '', avatar: null, isAuthed: false };
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', user.id)
      .maybeSingle();
    return {
      username: profile?.username ?? user.email?.split('@')[0] ?? '',
      email: user.email ?? '',
      avatar: profile?.avatar_url ?? null,
      isAuthed: true,
    };
  } catch {
    return { username: '', email: '', avatar: null, isAuthed: false };
  }
};

export default async function AuthorSettingsPage(): Promise<React.ReactElement> {
  const { username, email, avatar, isAuthed } = await fetchProfile();
  return (
    <SettingsView
      initialUsername={username}
      initialEmail={email}
      initialAvatar={avatar}
      isAuthed={isAuthed}
    />
  );
}

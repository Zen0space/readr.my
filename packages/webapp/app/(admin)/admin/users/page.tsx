import type { Metadata } from 'next';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase';
import { UsersView } from '@/components/admin/UsersView';
import type { AdminUser } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Users',
  description: 'Manage user roles and account status.',
};

const fetchUsers = async (): Promise<{ users: AdminUser[]; isAdmin: boolean }> => {
  if (!isSupabaseConfigured()) return { users: [], isAdmin: false };
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { users: [], isAdmin: false };
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    if (profile?.role !== 'admin') return { users: [], isAdmin: false };
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, role, avatar_url, created_at')
      .order('created_at', { ascending: false });
    if (error) return { users: [], isAdmin: true };
    const rows = (data ?? []) as Array<{
      id: string;
      username: string;
      role: string | null;
      avatar_url: string | null;
      created_at: string;
    }>;
    const users: AdminUser[] = rows.map((row) => ({
      id: row.id,
      email: '',
      username: row.username,
      role: (row.role as 'reader' | 'author' | 'admin' | null) ?? 'reader',
      avatar_url: row.avatar_url,
      status: 'active',
      created_at: row.created_at,
    }));
    return { users, isAdmin: true };
  } catch {
    return { users: [], isAdmin: false };
  }
};

export default async function AdminUsersPage(): Promise<React.ReactElement> {
  const { users, isAdmin } = await fetchUsers();
  return <UsersView initialUsers={users} isAdmin={isAdmin} />;
}

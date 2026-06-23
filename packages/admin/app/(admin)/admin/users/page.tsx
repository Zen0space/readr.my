import type { Metadata } from 'next';
import { UsersView } from '@/components/admin/UsersView';
import type { AdminUser } from '@auror/shared/api';

export const metadata: Metadata = {
  title: 'Users',
  description: 'Manage platform users.',
};

const fetchUsers = async (
  baseUrl: string,
): Promise<{ users: AdminUser[] }> => {
  try {
    const res = await fetch(`${baseUrl}/api/v1/admin/users`, { cache: 'no-store' });
    if (!res.ok) return { users: [] };
    const body = (await res.json()) as { items: AdminUser[] };
    return { users: body.items ?? [] };
  } catch {
    return { users: [] };
  }
};

export default async function UsersPage(): Promise<React.ReactElement> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  const { users } = await fetchUsers(baseUrl);
  return <UsersView initialUsers={users} />;
}
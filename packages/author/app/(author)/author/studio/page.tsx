import type { Metadata } from 'next';
import { StudioView } from '@/components/author/StudioView';
import type { Writing } from '@auror/shared/api';

export const metadata: Metadata = {
  title: 'Writing Studio',
  description: 'Manage your stories and chapters.',
};

const fetchMyStories = async (baseUrl: string): Promise<Writing[]> => {
  try {
    const res = await fetch(`${baseUrl}/api/v1/me/stories`, { cache: 'no-store' });
    if (!res.ok) return [];
    const body = (await res.json()) as { items?: Writing[] };
    return body.items ?? [];
  } catch {
    return [];
  }
};

const fetchIsAuthed = async (baseUrl: string): Promise<boolean> => {
  try {
    const res = await fetch(`${baseUrl}/api/auth/session`, { cache: 'no-store' });
    if (!res.ok) return false;
    const body = (await res.json()) as { authenticated?: boolean };
    return Boolean(body.authenticated);
  } catch {
    return false;
  }
};

export default async function StudioPage(): Promise<React.ReactElement> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  const [writings, isAuthed] = await Promise.all([
    fetchMyStories(baseUrl),
    fetchIsAuthed(baseUrl),
  ]);
  return <StudioView initialWritings={writings} isAuthed={isAuthed} />;
}
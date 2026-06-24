import type { Metadata } from 'next';
import { LibraryView } from '@/components/reader/LibraryView';
import type { LibraryItem } from '@auror/shared/api';

export const metadata: Metadata = {
  title: 'Library',
  description: 'Your saved stories.',
};

const fetchLibrary = async (baseUrl: string): Promise<LibraryItem[]> => {
  try {
    const res = await fetch(`${baseUrl}/api/v1/me/library`, { cache: 'no-store' })
    if (!res.ok) return []
    const body = (await res.json()) as { items?: LibraryItem[] }
    return body.items ?? []
  } catch {
    return []
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

export default async function LibraryPage(): Promise<React.ReactElement> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? ''
  const [items, isAuthed] = await Promise.all([
    fetchLibrary(baseUrl),
    fetchSessionFlag(baseUrl),
  ])
  return <LibraryView initialLibrary={items} isAuthed={isAuthed} />
}
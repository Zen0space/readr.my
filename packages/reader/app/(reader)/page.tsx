import type { Metadata } from 'next';
import { BrowseDashboard } from '@/components/reader/BrowseDashboard';
import type { Writing } from '@auror/shared/api';

export const metadata: Metadata = {
  title: 'Browse',
  description: 'Discover stories on Auror.',
};

/**
 * Fetch the browse feed from the backend. The URL goes through Next.js's
 * /api/v1 → backend rewrite so the request looks same-origin to the browser
 * and Caddy doesn't have to proxy.
 */
const fetchStories = async (
  baseUrl: string,
  search: string,
): Promise<Writing[]> => {
  try {
    const qs = search ? `?q=${encodeURIComponent(search)}` : ''
    const res = await fetch(`${baseUrl}/api/v1/stories${qs}`, {
      cache: 'no-store',
    })
    if (!res.ok) return []
    const body = (await res.json()) as { items?: Writing[] }
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

type PageProps = {
  searchParams: { q?: string };
};

export default async function BrowsePage({ searchParams }: PageProps): Promise<React.ReactElement> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? ''
  const search = searchParams.q ?? ''
  const [writings, isAuthed] = await Promise.all([
    fetchStories(baseUrl, search),
    fetchSessionFlag(baseUrl),
  ])
  return (
    <BrowseDashboard
      initialWritings={writings}
      initialSearch={search}
      isAuthed={isAuthed}
    />
  );
}
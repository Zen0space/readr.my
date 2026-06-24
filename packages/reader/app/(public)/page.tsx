import type { Metadata } from 'next';
import { BrowseDashboard } from '@/components/reader/BrowseDashboard';
import { LandingPage } from '@/components/reader/LandingPage';
import type { Writing } from '@auror/shared/api';

export const metadata: Metadata = {
  title: 'Browse',
  description: 'Discover stories on Auror.',
};

/**
 * Fetch the browse feed from the backend directly. `NEXT_PUBLIC_API_BASE_URL`
 * points at the Fastify backend (port 4000), so server components and the
 * browser hit it directly. CORS is configured on the backend.
 */
const fetchStories = async (
  baseUrl: string,
  search: string,
): Promise<Writing[]> => {
  try {
    const qs = search ? `?q=${encodeURIComponent(search)}` : ''
    const res = await fetch(`${baseUrl}/v1/stories${qs}`, {
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
  searchParams: Promise<{ q?: string }>;
};

export default async function BrowsePage({ searchParams }: PageProps): Promise<React.ReactElement> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? ''
  const { q: search = '' } = await searchParams
  const [writings, isAuthed] = await Promise.all([
    fetchStories(baseUrl, search),
    fetchSessionFlag(baseUrl),
  ])

  if (!isAuthed) {
    return <LandingPage initialWritings={writings} />;
  }

  return (
    <BrowseDashboard
      initialWritings={writings}
      initialSearch={search}
      isAuthed={isAuthed}
    />
  );
}
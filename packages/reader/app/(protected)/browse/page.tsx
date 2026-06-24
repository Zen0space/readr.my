import type { Metadata } from 'next';
import { BrowseView } from '@/components/reader/BrowseView';
import { ErrorBanner } from '@/components/ui';
import { writingsApiClient } from '@/lib/api/serverClient';
import { parseFetchError } from '@/lib/errors';
import type { Writing } from '@auror/shared/api';

export const metadata: Metadata = {
  title: 'Browse · Auror',
  description: 'Discover e-novels from every author on Auror.',
};

type Sort = 'recent' | 'popular';
type Status = 'all' | 'ongoing' | 'completed';

type PageProps = {
  searchParams: Promise<{
    q?: string;
    genre?: string;
    status?: string;
    sort?: string;
  }>;
};

/**
 * Server component. The (protected) layout has already verified auth, so
 * we just pull the browse feed from the backend and let the client view
 * hydrate search/filter state from the URL.
 *
 * The browse endpoint (`/v1/stories`) accepts `q`, `genre`, `language`,
 * `status`, `sort`, plus cursor pagination. We forward only the params the
 * UI controls so a deep link like `/browse?genre=romance&sort=popular`
 * renders the matching slice on first paint.
 */
export default async function BrowsePage({ searchParams }: PageProps): Promise<React.ReactElement> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? ''
  const params = await searchParams
  const q = params.q?.trim() ?? ''
  const genre = params.genre?.trim() ?? ''
  const status: Status =
    params.status === 'ongoing' || params.status === 'completed' ? params.status : 'all'
  const sort: Sort = params.sort === 'popular' ? 'popular' : 'recent'

  let writings: Writing[] = []
  let backendError: ReturnType<typeof parseFetchError> = null
  try {
    const result = await writingsApiClient.list(baseUrl, {
      q: q || undefined,
      genre: genre || undefined,
      status: status === 'all' ? undefined : status,
      sort,
      limit: 48,
    })
    writings = result.items
  } catch (err) {
    backendError = parseFetchError(err)
  }

  return (
    <div className="space-y-8">
      {backendError ? (
        <ErrorBanner error={backendError} retryHref="/browse" />
      ) : null}
      <BrowseView
        initialWritings={writings}
        initialQuery={q}
        initialGenre={genre}
        initialStatus={status}
        initialSort={sort}
      />
    </div>
  );
}
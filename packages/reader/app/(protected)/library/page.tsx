import type { Metadata } from 'next';
import { LibraryView } from '@/components/reader/LibraryView';
import { libraryApiClient } from '@/lib/api/serverClient';
import { ErrorBanner } from '@/components/ui';
import { parseFetchError } from '@/lib/errors';
import { createServerComponentClient, isSupabaseConfigured } from '@/lib/supabase';
import type { LibraryItem } from '@auror/shared/api';

export const metadata: Metadata = {
  title: 'Library',
  description: 'Your saved stories.',
};

const resolveAccessToken = async (): Promise<string | null> => {
  if (!isSupabaseConfigured()) return null
  try {
    const supabase = await createServerComponentClient()
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ?? null
  } catch {
    return null
  }
}

export default async function LibraryPage(): Promise<React.ReactElement> {
  // We're inside the (protected) layout — auth has already been verified.
  // We still need the access_token to forward as a Bearer header to the
  // backend (server-side fetches can't piggy-back on the browser cookie).
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? ''
  const accessToken = await resolveAccessToken()

  let items: LibraryItem[] = []
  let backendError: ReturnType<typeof parseFetchError> = null
  try {
    const result = await libraryApiClient.list(baseUrl, { accessToken })
    items = result.items
  } catch (err) {
    backendError = parseFetchError(err)
  }

  return (
    <div className="space-y-8">
      {backendError ? (
        <ErrorBanner error={backendError} retryHref="/library" />
      ) : null}
      <LibraryView initialLibrary={items} isAuthed={true} />
    </div>
  );
}
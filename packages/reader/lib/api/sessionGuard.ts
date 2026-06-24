'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

/**
 * Session-expiry fallback for client-side fetches in the reader app.
 *
 * The `(protected)` layout is the primary auth gate — it redirects
 * unauthenticated visitors to `/login` before they ever reach a page.
 *
 * This helper covers the *secondary* case: a session that was valid at
 * page-load but expired mid-session (Supabase access tokens default to
 * 1 hour). When that happens a backend call returns 401 and the user
 * is silently looking at a half-broken page. We catch it here and
 * bounce to `/login?redirect=<currentPath>`.
 */

/**
 * Hook returning a function that redirects to `/login` while preserving
 * the user's current URL so they bounce back after signing in.
 */
export const useSessionRedirect = (): (() => void) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return useCallback(() => {
    const search = searchParams.toString();
    const current = `${pathname ?? ''}${search ? `?${search}` : ''}`;
    router.push(`/login?redirect=${encodeURIComponent(current)}`);
    router.refresh();
  }, [router, pathname, searchParams]);
};

/**
 * Wrap a raw `fetch` so a 401 from the backend triggers the
 * session-expired redirect. Use for ad-hoc client fetches that don't
 * go through the shared `ApiClient`.
 *
 * Throws on 401 after scheduling the navigation so the caller can
 * short-circuit.
 */
export const withSessionGuard = async (
  input: RequestInfo | URL,
  init?: RequestInit,
  onRedirect?: () => void,
): Promise<Response> => {
  const res = await fetch(input, init);
  if (res.status === 401) {
    if (onRedirect) {
      onRedirect();
    } else if (typeof window !== 'undefined') {
      // Safe fallback when the consumer isn't inside a React tree
      // (e.g. an event handler outside a hook scope).
      const current = `${window.location.pathname}${window.location.search}`;
      window.location.href = `/login?redirect=${encodeURIComponent(current)}`;
    }
    throw new Error('session_expired');
  }
  return res;
};

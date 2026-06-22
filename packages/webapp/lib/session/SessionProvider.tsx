'use client';

import { useCallback } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';
import {
  currentUserAtom,
  isAdminAtom,
  isAuthenticatedAtom,
  isAuthorAtom,
  lastApiErrorAtom,
  sessionAtom,
  type SessionState,
} from './atoms';
import { SessionExpiredError } from '@/lib/api/errors';

type Props = {
  initialSession: SessionState;
  children: React.ReactNode;
};

export const SessionProvider = ({ initialSession, children }: Props): React.ReactElement => {
  useHydrateAtoms([[sessionAtom, initialSession]], { dangerouslyForceHydrate: true });
  return <>{children}</>;
};

export const useSession = (): SessionState => useAtomValue(sessionAtom);
export const useCurrentUser = () => useAtomValue(currentUserAtom);
export const useIsAuthenticated = (): boolean => useAtomValue(isAuthenticatedAtom);
export const useIsAuthor = (): boolean => useAtomValue(isAuthorAtom);
export const useIsAdmin = (): boolean => useAtomValue(isAdminAtom);
export const useApiError = () => useAtomValue(lastApiErrorAtom);

export const useSetSession = () => useSetAtom(sessionAtom);

const navigateToLogin = (): void => {
  if (typeof window === 'undefined') return;
  const path = window.location.pathname;
  if (path.startsWith('/login') || path.startsWith('/register')) return;
  const next = encodeURIComponent(`${path}${window.location.search}`);
  window.location.assign(`/login?redirect=${next}`);
};

export const useApiCall = <Args extends unknown[], R>(
  fn: (...args: Args) => Promise<R>,
): ((...args: Args) => Promise<R | null>) => {
  const setSession = useSetAtom(sessionAtom);
  const setLastError = useSetAtom(lastApiErrorAtom);
  return useCallback(
    async (...args: Args): Promise<R | null> => {
      try {
        return await fn(...args);
      } catch (error) {
        if (error instanceof SessionExpiredError) {
          setSession({ status: 'anonymous' });
          setLastError(error);
          navigateToLogin();
          return null;
        }
        setLastError(error);
        throw error;
      }
    },
    [fn, setSession, setLastError],
  );
};

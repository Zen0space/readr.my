import { atom } from 'jotai';
import type { User } from '@auror/shared/api-client';

export type SessionState =
  | { status: 'loading' }
  | { status: 'anonymous' }
  | { status: 'authenticated'; user: User };

export const sessionAtom = atom<SessionState>({ status: 'loading' });

export const lastApiErrorAtom = atom<unknown>(null);

export const isAuthenticatedAtom = atom((get) => get(sessionAtom).status === 'authenticated');

export const currentUserAtom = atom((get) => {
  const session = get(sessionAtom);
  return session.status === 'authenticated' ? session.user : null;
});

export const isAdminAtom = atom((get) => {
  const session = get(sessionAtom);
  return session.status === 'authenticated' && session.user.role === 'admin';
});

export const isAuthorAtom = atom((get) => {
  const session = get(sessionAtom);
  return (
    session.status === 'authenticated' &&
    (session.user.role === 'author' || session.user.role === 'admin')
  );
});

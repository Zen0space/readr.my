import { atom } from 'jotai'
import {
  clearSession,
  loadSession,
  saveSession,
  type SessionRecord,
} from '../storage/session-store'
import { restoreSession } from '../api/auth'

export type SessionState =
  | { status: 'loading' }
  | { status: 'anonymous' }
  | { status: 'authenticated'; session: SessionRecord }

export const sessionAtom = atom<SessionState>({ status: 'loading' })

export const hydrateSessionAtom = atom(null, async (_get, set) => {
  const persisted = await loadSession()
  if (!persisted) {
    set(sessionAtom, { status: 'anonymous' })
    return
  }
  set(sessionAtom, { status: 'authenticated', session: persisted })
  const refreshed = await restoreSession(persisted.jwt, persisted.refreshToken)
  if (!refreshed) {
    return
  }
  if (refreshed.jwt === persisted.jwt && refreshed.refreshToken === persisted.refreshToken) {
    return
  }
  const next: SessionRecord = {
    ...persisted,
    jwt: refreshed.jwt,
    refreshToken: refreshed.refreshToken,
    refreshedAt: Date.now(),
  }
  await saveSession(next)
  set(sessionAtom, { status: 'authenticated', session: next })
})

export const setSessionAtom = atom(null, async (_get, set, session: SessionRecord) => {
  await saveSession(session)
  set(sessionAtom, { status: 'authenticated', session })
})

export const updateTokensAtom = atom(
  null,
  async (get, set, tokens: { jwt: string; refreshToken: string }) => {
    const current = get(sessionAtom)
    if (current.status !== 'authenticated') return
    const next: SessionRecord = {
      ...current.session,
      jwt: tokens.jwt,
      refreshToken: tokens.refreshToken,
      refreshedAt: Date.now(),
    }
    await saveSession(next)
    set(sessionAtom, { status: 'authenticated', session: next })
  },
)

export const clearSessionAtom = atom(null, async (_get, set) => {
  await clearSession()
  set(sessionAtom, { status: 'anonymous' })
})

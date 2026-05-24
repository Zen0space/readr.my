import { atom } from 'jotai'
import {
  clearSession,
  loadSession,
  saveSession,
  type SessionRecord,
} from '../storage/session-store'

export type SessionState =
  | { status: 'loading' }
  | { status: 'anonymous' }
  | { status: 'authenticated'; session: SessionRecord }

export const sessionAtom = atom<SessionState>({ status: 'loading' })

export const hydrateSessionAtom = atom(null, async (_get, set) => {
  const persisted = await loadSession()
  set(sessionAtom, persisted ? { status: 'authenticated', session: persisted } : { status: 'anonymous' })
})

export const setSessionAtom = atom(null, async (_get, set, session: SessionRecord) => {
  await saveSession(session)
  set(sessionAtom, { status: 'authenticated', session })
})

export const clearSessionAtom = atom(null, async (_get, set) => {
  await clearSession()
  set(sessionAtom, { status: 'anonymous' })
})

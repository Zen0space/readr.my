import { useEffect } from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import {
  clearSessionAtom,
  hydrateSessionAtom,
  sessionAtom,
  updateTokensAtom,
} from './atoms/session'
import { setApiTokenProvider, setOnUnauthorized } from './api/client'
import { subscribeToAuthChanges } from './api/auth'
import { LoginRoute } from './routes/login'
import { HomeRoute } from './routes/home'

export const App = () => {
  const session = useAtomValue(sessionAtom)
  const hydrate = useSetAtom(hydrateSessionAtom)
  const clearSession = useSetAtom(clearSessionAtom)
  const updateTokens = useSetAtom(updateTokensAtom)

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  useEffect(() => {
    setApiTokenProvider(() =>
      session.status === 'authenticated' ? session.session.jwt : null,
    )
  }, [session])

  useEffect(() => {
    setOnUnauthorized(() => {
      void clearSession()
    })
  }, [clearSession])

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((event, sess) => {
      if (event === 'SIGNED_OUT') {
        void clearSession()
        return
      }
      if ((event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') && sess) {
        void updateTokens({ jwt: sess.access_token, refreshToken: sess.refresh_token })
      }
    })
    return unsubscribe
  }, [clearSession, updateTokens])

  if (session.status === 'loading') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <span style={{ fontSize: 13, color: '#6b7280' }}>Loading…</span>
      </div>
    )
  }

  return session.status === 'authenticated' ? <HomeRoute /> : <LoginRoute />
}

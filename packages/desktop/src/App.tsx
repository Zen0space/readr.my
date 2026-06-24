import { useEffect } from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import {
  clearSessionAtom,
  hydrateSessionAtom,
  sessionAtom,
  updateTokensAtom,
} from './atoms/session'
import { routeAtom } from './atoms/route'
import { subscribeToAuthChanges } from './api/auth'
import { LoginRoute } from './routes/login'
import { LibraryRoute } from './routes/library'
import { StoryRoute } from './routes/story'
import { ChapterEditorRoute } from './routes/chapter-editor'
import { WalletRoute } from './routes/wallet'
import { EarningsRoute } from './routes/earnings'
import { Shell } from './components/Shell'

export const App = () => {
  const session = useAtomValue(sessionAtom)
  const route = useAtomValue(routeAtom)
  const hydrate = useSetAtom(hydrateSessionAtom)
  const clearSession = useSetAtom(clearSessionAtom)
  const updateTokens = useSetAtom(updateTokensAtom)

  useEffect(() => {
    void hydrate()
  }, [hydrate])

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

  if (session.status !== 'authenticated') {
    return <LoginRoute />
  }

  let body
  if (route.name === 'library') body = <LibraryRoute />
  else if (route.name === 'story') body = <StoryRoute storyId={route.storyId} />
  else if (route.name === 'chapter')
    body = <ChapterEditorRoute storyId={route.storyId} chapterId={route.chapterId} />
  else if (route.name === 'wallet') body = <WalletRoute />
  else if (route.name === 'earnings') body = <EarningsRoute />
  else body = <LibraryRoute />

  return <Shell>{body}</Shell>
}

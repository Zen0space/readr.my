import { useAtomValue, useSetAtom } from 'jotai'
import { clearSessionAtom, sessionAtom } from '../atoms/session'
import { signOut } from '../api/auth'
import { Button } from '../components/Button'

export const HomeRoute = () => {
  const session = useAtomValue(sessionAtom)
  const clearSession = useSetAtom(clearSessionAtom)

  if (session.status !== 'authenticated') return null

  const onLogout = async () => {
    await signOut()
    await clearSession()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <header
        style={{
          padding: '12px 20px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <strong style={{ fontSize: 14 }}>readr Author</strong>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: '#6b7280' }}>{session.session.email}</span>
          <Button variant="ghost" onClick={onLogout}>
            Logout
          </Button>
        </div>
      </header>
      <main style={{ padding: 20, flex: 1 }}>
        <p style={{ fontSize: 14, color: '#374151' }}>
          You're signed in. The story library, chapter editor, and earnings dashboard land in
          D0.3–D0.8.
        </p>
      </main>
    </div>
  )
}

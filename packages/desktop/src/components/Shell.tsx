import { useAtomValue, useSetAtom } from 'jotai'
import type { ReactNode } from 'react'
import { clearSessionAtom, sessionAtom } from '../atoms/session'
import { routeAtom, type Route } from '../atoms/route'
import { signOut } from '../api/auth'
import { Button } from './Button'

type NavItem = { route: Route; label: string }

const NAV: NavItem[] = [
  { route: { name: 'library' }, label: 'Library' },
  { route: { name: 'earnings' }, label: 'Earnings' },
  { route: { name: 'wallet' }, label: 'Wallet' },
]

type Props = { children: ReactNode }

export const Shell = ({ children }: Props) => {
  const session = useAtomValue(sessionAtom)
  const route = useAtomValue(routeAtom)
  const setRoute = useSetAtom(routeAtom)
  const clearSession = useSetAtom(clearSessionAtom)

  const onLogout = async (): Promise<void> => {
    await signOut()
    await clearSession()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <header
        style={{
          padding: '10px 20px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          gap: 24,
        }}
      >
        <strong style={{ fontSize: 14 }}>Auror</strong>
        <nav style={{ display: 'flex', gap: 4 }}>
          {NAV.map((item) => {
            const active = item.route.name === route.name
            return (
              <button
                key={item.route.name}
                type="button"
                onClick={() => setRoute(item.route)}
                style={{
                  appearance: 'none',
                  border: 'none',
                  background: active ? '#111827' : 'transparent',
                  color: active ? '#fff' : '#374151',
                  fontSize: 13,
                  padding: '6px 12px',
                  borderRadius: 6,
                  cursor: 'pointer',
                }}
              >
                {item.label}
              </button>
            )
          })}
        </nav>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          {session.status === 'authenticated' ? (
            <span style={{ fontSize: 13, color: '#6b7280' }}>{session.session.email}</span>
          ) : null}
          <Button variant="ghost" onClick={onLogout}>
            Logout
          </Button>
        </div>
      </header>
      <main style={{ padding: 24, flex: 1, background: '#fafafa' }}>{children}</main>
    </div>
  )
}

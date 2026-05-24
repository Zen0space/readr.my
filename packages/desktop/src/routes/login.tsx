import { useState, type FormEvent } from 'react'
import { useSetAtom } from 'jotai'
import { signInWithPassword } from '../api/auth'
import { setSessionAtom } from '../atoms/session'
import { Button } from '../components/Button'
import { Field } from '../components/Field'
import { getUserMessage } from '@readr/shared/errors'

export const LoginRoute = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const setSession = useSetAtom(setSessionAtom)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const result = await signInWithPassword(email, password)
      await setSession(result)
    } catch (err) {
      setError(getUserMessage(err, 'en'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f9fafb' }}>
      <form
        onSubmit={onSubmit}
        style={{
          width: 360,
          padding: 32,
          background: '#fff',
          borderRadius: 8,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>readr Author</h1>
        <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>Sign in to continue writing.</p>

        <Field
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />
        <Field
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error ? <div style={{ fontSize: 13, color: '#b91c1c' }}>{error}</div> : null}

        <Button type="submit" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </div>
  )
}

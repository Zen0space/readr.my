import { useState, type FormEvent } from 'react'
import { useSetAtom } from 'jotai'
import { signInWithPassword, signUpWithPassword, signOut } from '../api/auth'
import { fetchMe } from '../api/me'
import { setSessionAtom } from '../atoms/session'
import { Button } from '../components/Button'
import { Field } from '../components/Field'
import { getUserMessage } from '@readr/shared/errors'

type Mode = 'signin' | 'signup'

export const LoginRoute = () => {
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const setSession = useSetAtom(setSessionAtom)

  const isSignup = mode === 'signup'

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setSubmitting(true)
    try {
      if (isSignup) {
        if (!agreed) {
          setError('You must agree to the Terms of Use and Privacy Policy.')
          return
        }
        try {
          const result = await signUpWithPassword(email, password)
          await assertAuthorAndPersist(result)
        } catch (err) {
          const message = err instanceof Error ? err.message : getUserMessage(err, 'en')
          if (message.startsWith('Check your email')) {
            setInfo(message)
            return
          }
          throw err
        }
      } else {
        const result = await signInWithPassword(email, password)
        await assertAuthorAndPersist(result)
      }
    } catch (err) {
      setError(getUserMessage(err, 'en'))
    } finally {
      setSubmitting(false)
    }
  }

  const assertAuthorAndPersist = async (result: Awaited<ReturnType<typeof signInWithPassword>>) => {
    const me = await fetchMe(result.jwt)
    if (me.role === 'reader') {
      await signOut()
      throw new Error('This desktop app is for authors only. Readers, please use the web app.')
    }
    if (me.status === 'suspended') {
      await signOut()
      throw new Error('Your account is suspended.')
    }
    await setSession(result)
  }

  const switchMode = (next: Mode) => {
    setMode(next)
    setError(null)
    setInfo(null)
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#f9fafb',
      }}
    >
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
        <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
          {isSignup ? 'Create an account to start writing.' : 'Sign in to continue writing.'}
        </p>

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
          autoComplete={isSignup ? 'new-password' : 'current-password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={isSignup ? 8 : undefined}
        />

        {isSignup ? (
          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              fontSize: 13,
              color: '#374151',
              lineHeight: 1.4,
            }}
          >
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              style={{ marginTop: 2 }}
            />
            <span>
              I agree to the{' '}
              <a
                href="https://readr.my/terms"
                target="_blank"
                rel="noreferrer"
                style={{ color: '#1f2937', textDecoration: 'underline' }}
              >
                Terms of Use
              </a>{' '}
              and{' '}
              <a
                href="https://readr.my/privacy"
                target="_blank"
                rel="noreferrer"
                style={{ color: '#1f2937', textDecoration: 'underline' }}
              >
                Privacy Policy
              </a>
              .
            </span>
          </label>
        ) : null}

        {error ? <div style={{ fontSize: 13, color: '#b91c1c' }}>{error}</div> : null}
        {info ? <div style={{ fontSize: 13, color: '#047857' }}>{info}</div> : null}

        <Button type="submit" disabled={submitting || (isSignup && !agreed)}>
          {submitting ? (isSignup ? 'Creating account…' : 'Signing in…') : isSignup ? 'Create account' : 'Sign in'}
        </Button>

        <div style={{ fontSize: 13, color: '#6b7280', textAlign: 'center' }}>
          {isSignup ? (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => switchMode('signin')}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  color: '#1f2937',
                  fontWeight: 500,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Sign in
              </button>
            </>
          ) : (
            <>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => switchMode('signup')}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  color: '#1f2937',
                  fontWeight: 500,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Sign up
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  )
}

import { createClient, type SupabaseClient, type AuthChangeEvent, type Session } from '@supabase/supabase-js'
import { env } from '../config/env'

export const supabase: SupabaseClient = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false,
    detectSessionInUrl: false,
  },
})

export type SignInResult = {
  jwt: string
  refreshToken: string
  userId: string
  email: string
}

export const signInWithPassword = async (email: string, password: string): Promise<SignInResult> => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  const session = data.session
  const user = data.user
  if (!session || !user) throw new Error('No session returned')
  return {
    jwt: session.access_token,
    refreshToken: session.refresh_token,
    userId: user.id,
    email: user.email ?? email,
  }
}

export const signUpWithPassword = async (email: string, password: string): Promise<SignInResult> => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { role: 'author' } },
  })
  if (error) throw error
  const session = data.session
  const user = data.user
  if (!session || !user) {
    throw new Error('Check your email to confirm your account before signing in.')
  }
  return {
    jwt: session.access_token,
    refreshToken: session.refresh_token,
    userId: user.id,
    email: user.email ?? email,
  }
}

export const signOut = async (): Promise<void> => {
  await supabase.auth.signOut()
}

/**
 * Wake supabase-js with a previously-persisted session so its background
 * auto-refresh loop can keep the access token alive across app restarts.
 * Returns the (possibly refreshed) tokens, or null if the refresh token is
 * rejected by the auth server (revoked / expired beyond reuse).
 */
export const restoreSession = async (
  jwt: string,
  refreshToken: string,
): Promise<{ jwt: string; refreshToken: string } | null> => {
  try {
    const { data, error } = await supabase.auth.setSession({
      access_token: jwt,
      refresh_token: refreshToken,
    })
    if (error || !data.session) return null
    return {
      jwt: data.session.access_token,
      refreshToken: data.session.refresh_token,
    }
  } catch {
    return null
  }
}

/**
 * Subscribe to supabase-js auth state changes. Fires when tokens are refreshed
 * in the background (TOKEN_REFRESHED), when the user explicitly signs out
 * (SIGNED_OUT), and a few other events. Used to persist refreshed tokens.
 */
export const subscribeToAuthChanges = (
  cb: (event: AuthChangeEvent, session: Session | null) => void,
): (() => void) => {
  const { data } = supabase.auth.onAuthStateChange(cb)
  return () => data.subscription.unsubscribe()
}

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
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

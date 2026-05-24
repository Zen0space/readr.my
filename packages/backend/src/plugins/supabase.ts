import fp from 'fastify-plugin'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { env } from '../config/env.js'

declare module 'fastify' {
  interface FastifyInstance {
    /** Anonymous Supabase client — for unauthenticated reads. Respects RLS. */
    supabaseAnon: SupabaseClient
    /** Service-role client — bypasses RLS. Use only for privileged ops (admin, webhooks, jobs). */
    supabaseAdmin: SupabaseClient | null
    /** Returns a Supabase client bound to the caller's JWT (RLS-respecting). */
    supabaseForUser: (jwt: string) => SupabaseClient
  }
}

export default fp(async (app) => {
  const supabaseAnon = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const supabaseAdmin = env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null

  if (!supabaseAdmin) {
    app.log.warn('SUPABASE_SERVICE_ROLE_KEY not set — admin/webhook routes will fail.')
  }

  const supabaseForUser = (jwt: string): SupabaseClient =>
    createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    })

  app.decorate('supabaseAnon', supabaseAnon)
  app.decorate('supabaseAdmin', supabaseAdmin)
  app.decorate('supabaseForUser', supabaseForUser)
})

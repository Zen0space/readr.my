import fp from 'fastify-plugin'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { WebSocket as WsWebSocket } from 'ws'
import { env } from '../config/env.js'

interface WsLike {
  readonly CONNECTING: number; readonly OPEN: number; readonly CLOSING: number; readonly CLOSED: number
  readonly readyState: number; readonly url: string; readonly protocol: string
  close(code?: number, reason?: string): void
  send(data: string | ArrayBufferLike | ArrayBufferView): void
  onopen: ((this: unknown, ev: unknown) => unknown) | null
  onmessage: ((this: unknown, ev: unknown) => unknown) | null
  onclose: ((this: unknown, ev: unknown) => unknown) | null
  onerror: ((this: unknown, ev: unknown) => unknown) | null
  addEventListener(type: string, listener: (ev: unknown) => unknown): void
  removeEventListener(type: string, listener: (ev: unknown) => unknown): void
}
interface WsLikeConstructor { new(address: string | URL, protocols?: string | string[]): WsLike }

const wsTransport = WsWebSocket as unknown as WsLikeConstructor

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
    realtime: { transport: wsTransport },
  })

  const supabaseAdmin = env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
        realtime: { transport: wsTransport },
      })
    : null

  if (!supabaseAdmin) {
    app.log.warn('SUPABASE_SERVICE_ROLE_KEY not set — admin/webhook routes will fail.')
  }

  const supabaseForUser = (jwt: string): SupabaseClient =>
    createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
      realtime: { transport: wsTransport },
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    })

  app.decorate('supabaseAnon', supabaseAnon)
  app.decorate('supabaseAdmin', supabaseAdmin)
  app.decorate('supabaseForUser', supabaseForUser)
})

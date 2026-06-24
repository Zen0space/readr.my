import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Fastify, { type FastifyInstance } from 'fastify'
import { jsonSchemaTransform, serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import type { SupabaseClient } from '@supabase/supabase-js'

type User = { id: string; role: 'reader' | 'author' | 'admin'; status: 'active' | 'suspended' }

/**
 * Build a Fastify instance with all four Supabase roles wired to a fixed user
 * and the auth plugin stubbed. Tests can then `inject()` against the routes
 * without touching a real Supabase project.
 *
 * The service-role decorator (`supabaseAdmin`) is left as null; tests that
 * need it must inject one via `app.supabaseAdmin = mock`.
 */
export const buildTestApp = async (
  opts: {
    user?: User
    supabaseAnon?: SupabaseClient
    supabaseAdmin?: SupabaseClient | null
  } = {},
): Promise<FastifyInstance> => {
  const user: User = opts.user ?? {
    id: '00000000-0000-0000-0000-000000000001',
    role: 'reader',
    status: 'active',
  }
  const app = Fastify({ logger: false })

  // Mirror `packages/backend/src/app.ts` — without the Zod schema compilers
  // Fastify falls back to AJV which rejects Zod's `data/required` shape.
  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)

  app.decorate('supabaseAnon', opts.supabaseAnon ?? stubClient())
  app.decorate('supabaseAdmin', opts.supabaseAdmin ?? null)
  app.decorate('supabaseForUser', () => stubClient())

  // Stub decorators the auth plugin normally provides.
  app.decorate('requireAuth', async (req) => {
    if (!user) throw new Error('not authenticated')
    req.user = user
  })
  app.decorate('optionalAuth', async (req) => {
    req.user = user
  })
  app.decorate('requireRole', (allowed) => async (req) => {
    const roles = Array.isArray(allowed) ? allowed : [allowed]
    if (!roles.includes(user.role)) {
      const err = new Error('forbidden') as Error & { statusCode: number }
      err.statusCode = 403
      throw err
    }
    req.user = user
  })

  return app
}

/**
 * Bare-minimum Supabase client stub. Every chained call resolves to a
 * thenable whose `.data` is an empty array (or `null` for `maybeSingle` shapes).
 * The stub intentionally has no side effects; handlers that depend on real
 * DB lookups get a deterministic empty result, which is enough to test route
 * registration + status codes without spinning up Postgres.
 */
export const stubClient = (): SupabaseClient => {
  const builder = () => {
    const chain = {
      data: [] as unknown,
      error: null,
      count: 0,
    }
    const thenable = {
      ...chain,
      then: (resolve: (v: typeof chain) => void) => Promise.resolve(chain).then(resolve),
    }
    const proxy = new Proxy(thenable, {
      get: (target, prop) => {
        if (prop in target) return target[prop as keyof typeof thenable]
        // Every chained builder method (eq, in, select, …) returns the same
        // thenable so handlers can chain arbitrarily.
        return () => proxy
      },
    })
    return proxy
  }
  return {
    from: builder,
    storage: {
      from: () => ({
        createSignedUploadUrl: async () => ({
          data: { token: 'signed-token-stub' },
          error: null,
        }),
        getPublicUrl: () => ({ data: { publicUrl: 'https://example.test/public' } }),
      }),
    },
    rpc: async () => ({ data: null, error: null }),
  } as unknown as SupabaseClient
}

export const teardown = async (app: FastifyInstance | undefined): Promise<void> => {
  if (app) await app.close()
}

/**
 * Stub Authorization header. The route handlers `.slice(7)` past `Bearer ` to
 * get the JWT; the stub client returned by `supabaseForUser` ignores the token
 * and returns canned empty data, which is enough for the route registration +
 * status code assertions these tests make.
 */
export const authHeaders = (token = 'stub-token'): Record<string, string> => ({
  authorization: `Bearer ${token}`,
})

export const buildAndRegister = async <T>(
  module: { default?: T } | T,
  user?: User,
): Promise<FastifyInstance> => {
  const app = await buildTestApp({ user })
  const fn = (module as { default?: T }).default ?? module
  if (typeof fn !== 'function') throw new Error('Module is not a plugin function')
  await app.register(fn as never)
  await app.ready()
  return app
}

// Re-export `beforeAll`/`afterAll` so tests don't have to import vitest just for hooks.
export { describe, it, expect, beforeAll, afterAll }
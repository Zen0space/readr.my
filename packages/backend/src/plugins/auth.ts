import fp from 'fastify-plugin'
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose'
import type { UserRole } from '@readr/shared/domain'
import { AppError } from '@readr/shared/errors'
import { unauthorized } from '../lib/errors.js'
import { env } from '../config/env.js'

export type AuthedUser = {
  id: string
  email?: string
  role: UserRole
  status: 'active' | 'suspended'
  raw: JWTPayload
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthedUser
  }
  interface FastifyInstance {
    requireAuth: import('fastify').preHandlerAsyncHookHandler
    requireRole: (role: UserRole | UserRole[]) => import('fastify').preHandlerAsyncHookHandler
    optionalAuth: import('fastify').preHandlerAsyncHookHandler
  }
}

const jwks = (() => {
  const url = new URL('/auth/v1/.well-known/jwks.json', env.SUPABASE_URL)
  return createRemoteJWKSet(url)
})()

const verifyToken = async (token: string): Promise<JWTPayload> => {
  if (env.SUPABASE_JWT_SECRET) {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(env.SUPABASE_JWT_SECRET), {
      algorithms: ['HS256'],
    })
    return payload
  }
  const { payload } = await jwtVerify(token, jwks)
  return payload
}

const readBearer = (header: string | undefined): string | null => {
  if (!header) return null
  const [scheme, token] = header.split(' ')
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null
  return token
}

export default fp(async (app) => {
  const lookupRoleStatus = async (userId: string): Promise<{ role: UserRole; status: 'active' | 'suspended' }> => {
    const cacheKey = `user:role:${userId}`
    const cached = await app.redis.get(cacheKey).catch(() => null)
    if (cached) {
      const parts = cached.split('|')
      if (parts.length === 2) {
        return { role: parts[0] as UserRole, status: parts[1] as 'active' | 'suspended' }
      }
    }
    const client = app.supabaseAdmin ?? app.supabaseAnon
    const { data } = await client.from('users').select('role, status').eq('id', userId).maybeSingle()
    const row = (data ?? { role: 'reader', status: 'active' }) as { role: UserRole; status: 'active' | 'suspended' }
    await app.redis.set(cacheKey, `${row.role}|${row.status}`, 'EX', 30).catch(() => null)
    return row
  }

  const attach = async (req: import('fastify').FastifyRequest): Promise<AuthedUser | null> => {
    const token = readBearer(req.headers.authorization)
    if (!token) return null
    try {
      const payload = await verifyToken(token)
      if (!payload.sub) return null
      const { role, status } = await lookupRoleStatus(payload.sub)
      const user: AuthedUser = {
        id: payload.sub,
        email: typeof payload.email === 'string' ? payload.email : undefined,
        role,
        status,
        raw: payload,
      }
      req.user = user
      return user
    } catch (err) {
      req.log.debug({ err }, 'auth.verify_failed')
      return null
    }
  }

  app.decorate('requireAuth', async (req) => {
    const u = await attach(req)
    if (!u) throw unauthorized()
    if (u.status === 'suspended') throw new AppError('account_suspended', 403, 'Account suspended')
  })

  app.decorate('optionalAuth', async (req) => {
    await attach(req)
  })

  app.decorate('requireRole', (role) => async (req) => {
    const u = await attach(req)
    if (!u) throw unauthorized()
    if (u.status === 'suspended') throw new AppError('account_suspended', 403, 'Account suspended')
    const allowed = Array.isArray(role) ? role : [role]
    if (!allowed.includes(u.role)) {
      throw new AppError('forbidden', 403, `Requires role: ${allowed.join(', ')}`)
    }
  })
})

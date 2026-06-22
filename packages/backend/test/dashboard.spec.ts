import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { dashboardRoutes } from '../src/modules/dashboard/routes.js'
import { buildTestApp, teardown, authHeaders } from './helpers.js'

describe('dashboard routes', () => {
  let authorApp: FastifyInstance
  let readerApp: FastifyInstance

  beforeAll(async () => {
    authorApp = await buildTestApp({
      user: { id: '00000000-0000-0000-0000-000000000002', role: 'author', status: 'active' },
    })
    await authorApp.register(dashboardRoutes)
    await authorApp.ready()

    readerApp = await buildTestApp({
      user: { id: '00000000-0000-0000-0000-000000000001', role: 'reader', status: 'active' },
    })
    await readerApp.register(dashboardRoutes)
    await readerApp.ready()
  })

  afterAll(async () => {
    await teardown(authorApp)
    await teardown(readerApp)
  })

  it('GET /v1/me/dashboard returns reader-shape for a reader', async () => {
    const res = await readerApp.inject({
      method: 'GET',
      url: '/v1/me/dashboard',
      headers: authHeaders(),
    })
    expect(res.statusCode).toBe(200)
    const body = res.json() as { role: string; metrics: { total_writings: number } }
    expect(body.role).toBe('reader')
    expect(body.metrics.total_writings).toBe(0)
  })

  it('GET /v1/me/dashboard returns author-shape for an author', async () => {
    const res = await authorApp.inject({
      method: 'GET',
      url: '/v1/me/dashboard',
      headers: authHeaders(),
    })
    expect(res.statusCode).toBe(200)
    const body = res.json() as {
      role: string
      metrics: { total_writings: number; total_chapters: number }
    }
    expect(body.role).toBe('author')
    expect(typeof body.metrics.total_writings).toBe('number')
    expect(typeof body.metrics.total_chapters).toBe('number')
  })

  it('GET /v1/admin/dashboard rejects non-admin', async () => {
    const res = await readerApp.inject({
      method: 'GET',
      url: '/v1/admin/dashboard',
      headers: authHeaders(),
    })
    expect(res.statusCode).toBe(403)
  })
})
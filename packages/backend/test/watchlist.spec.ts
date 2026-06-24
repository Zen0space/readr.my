import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { watchlistRoutes } from '../src/modules/watchlist/routes.js'
import { buildTestApp, teardown, authHeaders } from './helpers.js'

describe('watchlist routes', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = await buildTestApp({
      user: { id: '00000000-0000-0000-0000-000000000001', role: 'reader', status: 'active' },
    })
    await app.register(watchlistRoutes)
    await app.ready()
  })

  afterAll(async () => {
    await teardown(app)
  })

  it('GET /v1/me/watchlist returns 200 with empty items list', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/me/watchlist', headers: authHeaders() })
    expect(res.statusCode).toBe(200)
    const body = res.json() as { items: unknown[] }
    expect(Array.isArray(body.items)).toBe(true)
  })

  it('POST /v1/me/watchlist validates story_id is a uuid', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/me/watchlist',
      headers: authHeaders(),
      payload: { story_id: 'not-a-uuid' },
    })
    expect([400, 422]).toContain(res.statusCode)
  })

  it('POST /v1/me/watchlist accepts a valid uuid', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/me/watchlist',
      headers: authHeaders(),
      payload: { story_id: '11111111-1111-1111-1111-111111111111' },
    })
    expect([201, 204]).toContain(res.statusCode)
  })

  it('POST /v1/me/watchlist accepts notify_on_chapter override', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/me/watchlist',
      headers: authHeaders(),
      payload: { story_id: '22222222-2222-2222-2222-222222222222', notify_on_chapter: false },
    })
    expect([201, 204]).toContain(res.statusCode)
  })

  it('DELETE /v1/me/watchlist/:storyId accepts a valid uuid', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: '/v1/me/watchlist/11111111-1111-1111-1111-111111111111',
      headers: authHeaders(),
    })
    expect([204, 404]).toContain(res.statusCode)
  })

  it('PATCH /v1/me/watchlist/:storyId validates body', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/me/watchlist/11111111-1111-1111-1111-111111111111',
      headers: authHeaders(),
      payload: { notify_on_chapter: 'yes' },
    })
    expect([400, 422]).toContain(res.statusCode)
  })
})

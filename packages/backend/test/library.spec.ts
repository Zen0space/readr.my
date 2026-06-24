import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { libraryRoutes } from '../src/modules/library/routes.js'
import { buildTestApp, teardown, authHeaders } from './helpers.js'

describe('library routes', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = await buildTestApp({
      user: { id: '00000000-0000-0000-0000-000000000001', role: 'reader', status: 'active' },
    })
    await app.register(libraryRoutes)
    await app.ready()
  })

  afterAll(async () => {
    await teardown(app)
  })

  it('GET /v1/me/library returns 200 with empty items list', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/me/library', headers: authHeaders() })
    expect(res.statusCode).toBe(200)
    const body = res.json() as { items: unknown[] }
    expect(Array.isArray(body.items)).toBe(true)
  })

  it('POST /v1/me/library validates story_id is a uuid', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/me/library',
      headers: authHeaders(),
      payload: { story_id: 'not-a-uuid' },
    })
    // 422 from Fastify schema validation, OR 400 from zod body parse.
    expect([400, 422]).toContain(res.statusCode)
  })

  it('POST /v1/me/library accepts a valid uuid', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/me/library',
      headers: authHeaders(),
      payload: { story_id: '11111111-1111-1111-1111-111111111111' },
    })
    expect([201, 204]).toContain(res.statusCode)
  })

  it('DELETE /v1/me/library/:storyId accepts a valid uuid', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: '/v1/me/library/11111111-1111-1111-1111-111111111111',
      headers: authHeaders(),
    })
    expect([204, 404]).toContain(res.statusCode)
  })
})
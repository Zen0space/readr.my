import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { uploadRoutes } from '../src/modules/uploads/routes.js'
import { buildTestApp, teardown, stubClient, authHeaders } from './helpers.js'

describe('upload routes', () => {
  let authorApp: FastifyInstance
  let readerApp: FastifyInstance

  beforeAll(async () => {
    authorApp = await buildTestApp({
      user: { id: '00000000-0000-0000-0000-000000000002', role: 'author', status: 'active' },
      supabaseAdmin: stubClient(),
    })
    await authorApp.register(uploadRoutes)
    await authorApp.ready()

    readerApp = await buildTestApp({
      user: { id: '00000000-0000-0000-0000-000000000001', role: 'reader', status: 'active' },
      supabaseAdmin: stubClient(),
    })
    await readerApp.register(uploadRoutes)
    await readerApp.ready()
  })

  afterAll(async () => {
    await teardown(authorApp)
    await teardown(readerApp)
  })

  it('POST /v1/me/avatar-upload-url accepts png', async () => {
    const res = await authorApp.inject({
      method: 'POST',
      url: '/v1/me/avatar-upload-url',
      headers: authHeaders(),
      payload: { ext: 'png' },
    })
    expect(res.statusCode).toBe(200)
    const body = res.json() as { path: string; token: string; public_url: string }
    expect(body.path).toContain('.png')
    expect(body.token).toBe('signed-token-stub')
    expect(body.public_url).toContain('http')
  })

  it('POST /v1/me/avatar-upload-url rejects unknown extensions', async () => {
    const res = await authorApp.inject({
      method: 'POST',
      url: '/v1/me/avatar-upload-url',
      headers: authHeaders(),
      payload: { ext: 'gif' },
    })
    expect([400, 422]).toContain(res.statusCode)
  })

  it('POST /v1/me/cover-upload-url rejects readers', async () => {
    const res = await readerApp.inject({
      method: 'POST',
      url: '/v1/me/cover-upload-url',
      headers: authHeaders(),
      payload: { story_id: '11111111-1111-1111-1111-111111111111', ext: 'png' },
    })
    expect(res.statusCode).toBe(403)
  })
})
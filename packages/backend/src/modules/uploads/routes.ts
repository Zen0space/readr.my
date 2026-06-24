import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { AppError } from '@auror/shared/errors'

const avatarBody = z.object({
  ext: z.enum(['jpg', 'jpeg', 'png', 'webp']),
})

const avatarResponse = z.object({
  path: z.string(),
  token: z.string(),
  public_url: z.string().url(),
})

const storyCoverBody = z.object({
  story_id: z.string().uuid(),
  ext: z.enum(['jpg', 'jpeg', 'png', 'webp']),
})

const storyCoverResponse = z.object({
  path: z.string(),
  token: z.string(),
  public_url: z.string().url(),
})

/**
 * Mint short-lived signed upload URLs into the Supabase storage buckets.
 *
 * - `/v1/me/avatar-upload-url` — anyone authenticated, into the `avatars` bucket.
 *   Path layout is `<user_id>/<timestamp>.<ext>`. The frontend PUTs the file
 *   directly to the signed URL, then writes the resulting public URL into
 *   the user's profile.
 *
 * - `/v1/me/cover-upload-url` — author/admin only, into the `covers` bucket.
 *   Verifies story ownership via the user-scoped client (RLS-respecting).
 *
 * The frontend never sees the service-role key; the backend mints a
 * pre-authorized upload token and the browser uploads directly to storage.
 */
export const uploadRoutes: FastifyPluginAsync = async (app) => {
  app.post('/v1/me/avatar-upload-url', {
    preHandler: app.requireAuth,
    schema: {
      tags: ['uploads'],
      body: avatarBody,
      response: { 200: avatarResponse },
    },
    handler: async (req) => {
      if (!app.supabaseAdmin) throw new AppError('internal', 500, 'service role not configured')
      const { ext } = req.body as z.infer<typeof avatarBody>
      const path = `${req.user!.id}/${Date.now()}.${ext}`
      const { data, error } = await app.supabaseAdmin.storage
        .from('avatars')
        .createSignedUploadUrl(path)
      if (error) throw error
      const { data: pub } = app.supabaseAdmin.storage.from('avatars').getPublicUrl(path)
      return { path, token: data.token, public_url: pub.publicUrl }
    },
  })

  app.post('/v1/me/cover-upload-url', {
    preHandler: app.requireRole(['author', 'admin']),
    schema: {
      tags: ['uploads'],
      body: storyCoverBody,
      response: { 200: storyCoverResponse },
    },
    handler: async (req) => {
      if (!app.supabaseAdmin) throw new AppError('internal', 500, 'service role not configured')
      const { story_id, ext } = req.body as z.infer<typeof storyCoverBody>

      const userDb = app.supabaseForUser(req.headers.authorization!.slice(7))
      const { data: story, error: e1 } = await userDb
        .from('stories')
        .select('id, author_id')
        .eq('id', story_id)
        .maybeSingle()
      if (e1) throw e1
      if (!story || (story as { author_id: string }).author_id !== req.user!.id) {
        throw app.httpErrors.forbidden('not your story')
      }

      const path = `${req.user!.id}/${story_id}-${Date.now()}.${ext}`
      const { data, error } = await app.supabaseAdmin.storage
        .from('covers')
        .createSignedUploadUrl(path)
      if (error) throw error
      const { data: pub } = app.supabaseAdmin.storage.from('covers').getPublicUrl(path)
      return { path, token: data.token, public_url: pub.publicUrl }
    },
  })
}
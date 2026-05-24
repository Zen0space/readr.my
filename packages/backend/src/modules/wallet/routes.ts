import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { conflict, notFound } from '../../lib/errors.js'
import { AppError } from '@readr/shared/errors'
import { getAdapter } from '../payments/adapter.js'
import { env } from '../../config/env.js'
import crypto from 'node:crypto'

export const walletRoutes: FastifyPluginAsync = async (app) => {
  app.get('/v1/wallet', {
    preHandler: app.requireAuth,
    schema: {
      tags: ['wallet'],
      response: {
        200: z.object({
          coin_balance: z.number(),
          coins_per_rm: z.number(),
          updated_at: z.string(),
        }),
      },
    },
    handler: async (req) => {
      const db = app.supabaseForUser(req.headers.authorization!.slice(7))
      const [{ data: wallet, error: e1 }, { data: cfg, error: e2 }] = await Promise.all([
        db.from('wallets').select('*').eq('user_id', req.user!.id).maybeSingle(),
        db.from('coin_config').select('coins_per_rm').eq('id', 1).maybeSingle(),
      ])
      if (e1) throw e1
      if (e2) throw e2
      return {
        coin_balance: Number((wallet as { coin_balance?: number } | null)?.coin_balance ?? 0),
        coins_per_rm: Number((cfg as { coins_per_rm?: number } | null)?.coins_per_rm ?? 10),
        updated_at: (wallet as { updated_at?: string } | null)?.updated_at ?? new Date().toISOString(),
      }
    },
  })

  app.get('/v1/wallet/transactions', {
    preHandler: app.requireAuth,
    schema: {
      tags: ['wallet'],
      querystring: z.object({ limit: z.coerce.number().int().min(1).max(100).default(50) }),
      response: {
        200: z.object({
          purchases: z.array(z.object({
            id: z.string().uuid(),
            pack_rm_cents: z.number(),
            coins: z.number(),
            status: z.enum(['pending', 'succeeded', 'failed']),
            created_at: z.string(),
          })),
          unlocks: z.array(z.object({
            id: z.string().uuid(),
            chapter_id: z.string().uuid(),
            coins_paid: z.number(),
            unlocked_at: z.string(),
          })),
        }),
      },
    },
    handler: async (req) => {
      const { limit } = req.query as { limit: number }
      const db = app.supabaseForUser(req.headers.authorization!.slice(7))
      const [{ data: pur }, { data: unl }] = await Promise.all([
        db
          .from('coin_purchases')
          .select('id, pack_rm_cents, coins, status, created_at')
          .eq('user_id', req.user!.id)
          .order('created_at', { ascending: false })
          .limit(limit),
        db
          .from('chapter_unlocks')
          .select('id, chapter_id, coins_paid, unlocked_at')
          .eq('user_id', req.user!.id)
          .order('unlocked_at', { ascending: false })
          .limit(limit),
      ])
      return {
        purchases: (pur ?? []) as never,
        unlocks: (unl ?? []) as never,
      }
    },
  })

  app.post('/v1/wallet/topup', {
    preHandler: app.requireAuth,
    schema: {
      tags: ['wallet'],
      body: z.object({ pack_rm: z.union([z.literal(5), z.literal(10), z.literal(20), z.literal(50)]) }),
      response: {
        201: z.object({
          purchase_id: z.string().uuid(),
          checkout_url: z.string().url(),
          coins: z.number(),
        }),
      },
    },
    handler: async (req, reply) => {
      if (!app.supabaseAdmin) throw new AppError('internal', 500, 'service role not configured')
      const { pack_rm } = req.body as { pack_rm: number }
      const adapter = getAdapter()
      const admin = app.supabaseAdmin

      const { data: cfg, error: e1 } = await admin.from('coin_config').select('coins_per_rm').eq('id', 1).maybeSingle()
      if (e1) throw e1
      const coinsPerRm = Number((cfg as { coins_per_rm?: number } | null)?.coins_per_rm ?? 10)
      const coins = pack_rm * coinsPerRm
      const amountCents = pack_rm * 100
      const idempotencyKey = crypto.randomBytes(16).toString('hex')

      const { data: purchase, error: e2 } = await admin
        .from('coin_purchases')
        .insert({
          user_id: req.user!.id,
          pack_rm_cents: amountCents,
          coins,
          status: 'pending',
          processor: adapter.name,
          idempotency_key: idempotencyKey,
        })
        .select('*')
        .single()
      if (e2) throw e2
      const purchaseId = (purchase as { id: string }).id

      const checkout = await adapter.createCheckout({
        purchaseId,
        userId: req.user!.id,
        amountRmCents: amountCents,
        description: `Top-up ${coins} coins`,
        redirectUrl: `${env.PAYMENT_WEBHOOK_BASE_URL}/v1/wallet/topup/return`,
        webhookUrl: `${env.PAYMENT_WEBHOOK_BASE_URL}/v1/wallet/topup/webhook`,
      })

      const { error: e3 } = await admin
        .from('coin_purchases')
        .update({ processor_ref: checkout.processorRef })
        .eq('id', purchaseId)
      if (e3) throw e3

      return reply.code(201).send({
        purchase_id: purchaseId,
        checkout_url: checkout.checkoutUrl,
        coins,
      })
    },
  })

  // Webhook from payment processor. Must be idempotent.
  app.post('/v1/wallet/topup/webhook', {
    config: { rateLimit: { max: 100, timeWindow: '1 minute' } },
    schema: { tags: ['wallet'] },
    handler: async (req, reply) => {
      if (!app.supabaseAdmin) throw new AppError('internal', 500, 'service role not configured')
      const adapter = getAdapter()
      const event = adapter.parseWebhook(req.headers as Record<string, string | undefined>, req.body)

      const { data: purchase, error: e1 } = await app.supabaseAdmin
        .from('coin_purchases')
        .select('*')
        .eq('processor_ref', event.processorRef)
        .eq('processor', adapter.name)
        .maybeSingle()
      if (e1) throw e1
      if (!purchase) throw notFound('internal', 'Purchase not found for webhook')

      const p = purchase as {
        id: string
        user_id: string
        coins: number
        pack_rm_cents: number
        status: 'pending' | 'succeeded' | 'failed'
      }

      // Idempotent: if already finalized, just ack.
      if (p.status !== 'pending') {
        return reply.code(200).send({ ok: true, already: true })
      }

      if (event.status === 'failed') {
        await app.supabaseAdmin
          .from('coin_purchases')
          .update({ status: 'failed', failed_at: new Date().toISOString(), failure_reason: 'processor reported failure' })
          .eq('id', p.id)
        return reply.code(200).send({ ok: true })
      }

      // Credit wallet atomically via a single SQL update.
      await app.withLock(`wallet:${p.user_id}`, 5000, async () => {
        const { error: updateErr } = await app.supabaseAdmin!.rpc('credit_wallet_for_purchase', {
          p_purchase_id: p.id,
        })
        if (updateErr) throw updateErr
      })
      return reply.code(200).send({ ok: true })
    },
  })

  // Spend coins to unlock a chapter.
  app.post('/v1/chapters/:id/unlock', {
    preHandler: app.requireAuth,
    schema: {
      tags: ['wallet'],
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: z.object({
          chapter_id: z.string().uuid(),
          coins_paid: z.number(),
          new_balance: z.number(),
        }),
      },
    },
    handler: async (req) => {
      if (!app.supabaseAdmin) throw new AppError('internal', 500, 'service role not configured')
      const { id } = req.params as { id: string }
      const userId = req.user!.id

      const result = await app.withLock(`wallet:${userId}`, 5000, async () => {
        const { data, error } = await app.supabaseAdmin!.rpc('spend_coins_for_unlock', {
          p_user_id: userId,
          p_chapter_id: id,
        })
        if (error) {
          const msg = error.message ?? ''
          if (msg.includes('insufficient_coins')) {
            throw new AppError('insufficient_coins', 409, 'Not enough coins')
          }
          if (msg.includes('chapter_not_found')) {
            throw new AppError('chapter_not_found', 404, 'Chapter not found')
          }
          if (msg.includes('chapter_not_coin_gated') || msg.includes('chapter_not_published')) {
            throw new AppError('conflict', 409, msg)
          }
          throw error
        }
        return data as { chapter_id: string; coins_paid: number }
      })

      const { data: wallet } = await app.supabaseAdmin
        .from('wallets')
        .select('coin_balance')
        .eq('user_id', userId)
        .single()
      return {
        chapter_id: result.chapter_id,
        coins_paid: result.coins_paid,
        new_balance: Number((wallet as { coin_balance?: number } | null)?.coin_balance ?? 0),
      }
    },
  })
}

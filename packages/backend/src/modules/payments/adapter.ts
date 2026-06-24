/**
 * Pluggable payment adapter. Each provider implements the same interface.
 * For smoke tests we ship a `mock` provider that simulates a successful payment.
 */
import crypto from 'node:crypto'
import { env } from '../../config/env.js'
import { AppError } from '@auror/shared/errors'

export type CreateCheckoutInput = {
  purchaseId: string
  userId: string
  amountRmCents: number
  description: string
  redirectUrl: string
  webhookUrl: string
}

export type CheckoutResult = {
  checkoutUrl: string
  processorRef: string
}

export type WebhookEvent = {
  processorRef: string
  status: 'succeeded' | 'failed'
  amountRmCents: number
  raw: unknown
}

export type PaymentAdapter = {
  name: string
  createCheckout: (input: CreateCheckoutInput) => Promise<CheckoutResult>
  /** Verify signature + parse provider-specific webhook payload into our shape. */
  parseWebhook: (headers: Record<string, string | undefined>, body: unknown) => WebhookEvent
}

const mockAdapter: PaymentAdapter = {
  name: 'mock',
  createCheckout: async (input) => {
    const ref = `mock_${crypto.randomBytes(8).toString('hex')}`
    return {
      processorRef: ref,
      checkoutUrl: `${input.redirectUrl}?mock_ref=${ref}&purchase=${input.purchaseId}`,
    }
  },
  parseWebhook: (_headers, body) => {
    const b = body as { processorRef?: string; status?: 'succeeded' | 'failed'; amountRmCents?: number }
    if (!b.processorRef || !b.status || typeof b.amountRmCents !== 'number') {
      throw new AppError('webhook_signature_invalid', 401, 'Malformed mock webhook')
    }
    return {
      processorRef: b.processorRef,
      status: b.status,
      amountRmCents: b.amountRmCents,
      raw: body,
    }
  },
}

const billplzAdapter: PaymentAdapter = {
  name: 'billplz',
  createCheckout: async (input) => {
    if (!env.BILLPLZ_API_KEY || !env.BILLPLZ_COLLECTION_ID) {
      throw new AppError('payment_processor_error', 502, 'Billplz not configured')
    }
    const res = await fetch('https://www.billplz.com/api/v3/bills', {
      method: 'POST',
      headers: {
        authorization: 'Basic ' + Buffer.from(`${env.BILLPLZ_API_KEY}:`).toString('base64'),
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        collection_id: env.BILLPLZ_COLLECTION_ID,
        email: 'user@example.com',
        name: input.userId.slice(0, 8),
        amount: input.amountRmCents,
        callback_url: input.webhookUrl,
        redirect_url: input.redirectUrl,
        description: input.description,
        reference_1: input.purchaseId,
      }),
    })
    if (!res.ok) {
      throw new AppError('payment_processor_error', 502, `Billplz: ${res.status}`)
    }
    const data = (await res.json()) as { id: string; url: string }
    return { processorRef: data.id, checkoutUrl: data.url }
  },
  parseWebhook: (headers, body) => {
    if (!env.BILLPLZ_XSIGN_SECRET) {
      throw new AppError('payment_processor_error', 502, 'Billplz X-Signature secret not configured')
    }
    const xsign = headers['x-signature']
    const b = body as Record<string, string>
    const expected = computeBillplzSignature(b, env.BILLPLZ_XSIGN_SECRET)
    if (xsign !== expected) {
      throw new AppError('webhook_signature_invalid', 401, 'Bad x-signature')
    }
    return {
      processorRef: String(b.id),
      status: b.paid === 'true' ? 'succeeded' : 'failed',
      amountRmCents: Number(b.amount),
      raw: body,
    }
  },
}

const computeBillplzSignature = (body: Record<string, string>, secret: string): string => {
  const sorted = Object.keys(body)
    .filter((k) => k !== 'x_signature')
    .sort()
    .map((k) => `${k}${body[k]}`)
    .join('|')
  return crypto.createHmac('sha256', secret).update(sorted).digest('hex')
}

export const adapters: Record<string, PaymentAdapter> = {
  mock: mockAdapter,
  billplz: billplzAdapter,
}

export const getAdapter = (): PaymentAdapter => {
  const a = adapters[env.PAYMENT_PROVIDER]
  if (!a) throw new Error(`Unknown payment provider: ${env.PAYMENT_PROVIDER}`)
  return a
}

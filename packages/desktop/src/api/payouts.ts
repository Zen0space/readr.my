import { api } from './client'

export type PayoutStatus = 'requested' | 'approved' | 'paid' | 'rejected'

export type Payout = {
  id: string
  author_id: string
  amount_coins: number
  amount_rm_cents: number
  status: PayoutStatus
  method_ref: string | null
  notes: string | null
  rejection_reason: string | null
  requested_at: string
  approved_at: string | null
  paid_at: string | null
  rejected_at: string | null
}

export type CreatePayoutInput = {
  amount_coins: number
  method_ref: string
}

export const listMyPayouts = (): Promise<{ items: Payout[] }> =>
  api.get<{ items: Payout[] }>('/v1/me/payouts')

export const requestPayout = (input: CreatePayoutInput): Promise<Payout> =>
  api.post<Payout>('/v1/payouts', input)

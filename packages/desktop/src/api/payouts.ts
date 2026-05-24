import { api } from './client'

export type Payout = {
  id: string
  amount_rm_cents: number
  status: string
  created_at: string
  paid_at: string | null
}

export type CreatePayoutInput = {
  amount_rm_cents: number
  method_id: string
}

export const listPayouts = (): Promise<{ items: Payout[] }> =>
  api.get<{ items: Payout[] }>('/v1/payouts')

export const requestPayout = (input: CreatePayoutInput): Promise<Payout> =>
  api.post<Payout>('/v1/payouts', input)

import { api } from './client'

export type EarningsPeriod = 'day' | 'week' | 'month'
export type EarningsSource = 'coin' | 'sub'

export type EarningsBucket = {
  bucket: string
  source: EarningsSource
  gross_coins: number
  author_cut_coins: number
  author_cut_rm_cents: number
}

export type EarningsResponse = {
  period: EarningsPeriod
  coins_per_rm: number
  buckets: EarningsBucket[]
}

export const getEarnings = (period: EarningsPeriod, days = 90): Promise<EarningsResponse> =>
  api.get<EarningsResponse>(`/v1/me/earnings?period=${period}&days=${days}`)

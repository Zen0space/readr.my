import { api } from './client'

export type Wallet = {
  coin_balance: number
  coins_per_rm: number
  updated_at: string
}

export type CoinPurchaseStatus = 'pending' | 'succeeded' | 'failed'

export type CoinPurchase = {
  id: string
  pack_rm_cents: number
  coins: number
  status: CoinPurchaseStatus
  created_at: string
}

export type ChapterUnlock = {
  id: string
  chapter_id: string
  coins_paid: number
  unlocked_at: string
}

export type WalletTransactions = {
  purchases: CoinPurchase[]
  unlocks: ChapterUnlock[]
}

export const getWallet = (): Promise<Wallet> => api.get<Wallet>('/v1/wallet')

export const getWalletTransactions = (limit = 50): Promise<WalletTransactions> =>
  api.get<WalletTransactions>(`/v1/wallet/transactions?limit=${limit}`)

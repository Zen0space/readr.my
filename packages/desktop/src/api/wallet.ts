import { api } from './client'

export type Wallet = {
  coin_balance: number
  updated_at: string
}

export const getWallet = (): Promise<Wallet> => api.get<Wallet>('/v1/wallet')

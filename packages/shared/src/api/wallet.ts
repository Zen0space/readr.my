import { z } from 'zod'
import { createApiClient } from '../api-client'
import { WalletResponseSchema, type WalletResponse } from '../api-client'

const apiClient = createApiClient()

const WalletBalanceSchema = z.object({
  coin_balance: z.number(),
  coins_per_rm: z.number(),
  updated_at: z.string(),
})

const TransactionSchema = z.object({
  id: z.string().uuid(),
  pack_rm_cents: z.number().optional(),
  coins: z.number().optional(),
  coins_paid: z.number().optional(),
  chapter_id: z.string().uuid().optional(),
  status: z.string().optional(),
  created_at: z.string().optional(),
  unlocked_at: z.string().optional(),
})
export type Transaction = z.infer<typeof TransactionSchema>

const TransactionsResponseSchema = z.object({
  purchases: z.array(TransactionSchema),
  unlocks: z.array(TransactionSchema),
})

const TopupResponseSchema = z.object({
  purchase_id: z.string().uuid(),
  checkout_url: z.string().url(),
  coins: z.number(),
})

export const walletApi = {
  balance: (): Promise<WalletResponse> =>
    apiClient.request('/v1/wallet', WalletBalanceSchema),

  transactions: (limit = 50): Promise<z.infer<typeof TransactionsResponseSchema>> =>
    apiClient.request(
      `/v1/wallet/transactions?limit=${limit}`,
      TransactionsResponseSchema,
    ),

  topup: (
    packRm: 5 | 10 | 20 | 50,
  ): Promise<z.infer<typeof TopupResponseSchema>> =>
    apiClient.request('/v1/wallet/topup', TopupResponseSchema, {
      method: 'POST',
      body: { pack_rm: packRm },
    }),

  requestPayout: (amountCoins: number, methodRef: string): Promise<{ id: string }> =>
    apiClient.request(
      '/v1/payouts',
      z.object({ id: z.string().uuid() }),
      {
        method: 'POST',
        body: { amount_coins: amountCoins, method_ref: methodRef },
      },
    ),
}

// Backwards-compat — webapp's legacy wallet shape
export { WalletResponseSchema as legacyWalletResponseSchema }
export type { WalletResponse }
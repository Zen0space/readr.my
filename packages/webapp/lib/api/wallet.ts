import { z } from 'zod';
import { apiClient } from './client';
import {
  WalletResponseSchema,
  type WalletResponse,
} from './types';

const TransactionSchema = z.object({
  id: z.string(),
  amount: z.number(),
  kind: z.string(),
  created_at: z.string(),
});
export type Transaction = z.infer<typeof TransactionSchema>;

const TransactionsResponseSchema = z.object({
  success: z.literal(true),
  transactions: z.array(TransactionSchema),
});
const PurchaseResponseSchema = z.object({
  success: z.literal(true),
  new_balance: z.number().optional(),
});
const PayoutResponseSchema = z.object({
  success: z.literal(true),
  payout_id: z.string().optional(),
});

export const walletApi = {
  balance: (): Promise<WalletResponse> =>
    apiClient.request('/api/wallet/balance', WalletResponseSchema),

  transactions: (): Promise<z.infer<typeof TransactionsResponseSchema>> =>
    apiClient.request('/api/wallet/transactions', TransactionsResponseSchema),

  purchase: (input:
    | { coins_id: string }
    | { coins: number; price: number }
  ): Promise<z.infer<typeof PurchaseResponseSchema>> =>
    apiClient.request('/api/wallet/purchase', PurchaseResponseSchema, {
      method: 'POST',
      body: input,
    }),

  requestPayout: (amount: number): Promise<z.infer<typeof PayoutResponseSchema>> =>
    apiClient.request('/api/wallet/payout', PayoutResponseSchema, {
      method: 'POST',
      body: { amount },
    }),
};

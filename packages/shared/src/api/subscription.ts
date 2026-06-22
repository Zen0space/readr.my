import { z } from 'zod'
import { createApiClient } from '../api-client'
import {
  SubscriptionResponseSchema,
  type SubscriptionResponse,
  type SubscriptionTier,
} from '../api-client'

const apiClient = createApiClient()

const SubscribeResponseSchema = z.object({
  success: z.literal(true),
  subscription_id: z.string().optional(),
})

export const subscriptionApi = {
  current: (): Promise<SubscriptionResponse> =>
    apiClient.request('/api/subscription', SubscriptionResponseSchema),

  subscribe: (tier: SubscriptionTier): Promise<z.infer<typeof SubscribeResponseSchema>> =>
    apiClient.request('/api/subscription', SubscribeResponseSchema, {
      method: 'POST',
      body: { tier },
    }),
}
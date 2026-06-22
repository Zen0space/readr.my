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

/**
 * Reader-tier subscription (premium_reader / vip_reader). NOT in the Fastify
 * backend yet — backend's `/v1/subscriptions` is the author-follow kind.
 * Wrapper keeps the legacy BFF path until a reader-tier endpoint lands.
 */
export const subscriptionApi = {
  current: (): Promise<SubscriptionResponse> =>
    apiClient.request('/api/subscription', SubscriptionResponseSchema),

  subscribe: (tier: SubscriptionTier): Promise<z.infer<typeof SubscribeResponseSchema>> =>
    apiClient.request('/api/subscription', SubscribeResponseSchema, {
      method: 'POST',
      body: { tier },
    }),
}
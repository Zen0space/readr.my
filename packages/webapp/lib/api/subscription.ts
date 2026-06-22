import { z } from 'zod';
import { apiClient } from './client';
import {
  SubscriptionResponseSchema,
  type SubscriptionResponse,
  type SubscriptionTier,
} from './types';

const SubscribeResponseSchema = z.object({
  success: z.literal(true),
  subscription_id: z.string().optional(),
});

export const subscriptionApi = {
  current: (): Promise<SubscriptionResponse> =>
    apiClient.request('/api/subscription', SubscriptionResponseSchema),

  subscribe: (tier: SubscriptionTier): Promise<z.infer<typeof SubscribeResponseSchema>> =>
    apiClient.request('/api/subscription', SubscribeResponseSchema, {
      method: 'POST',
      body: { tier },
    }),
};

export type ErrorCode =
  | 'story_not_found'
  | 'chapter_not_found'
  | 'user_not_found'
  | 'duplicate_title'
  | 'insufficient_coins'
  | 'chapter_locked'
  | 'already_unlocked'
  | 'subscription_required'
  | 'rate_limited'
  | 'payment_failed'
  | 'payment_processor_error'
  | 'webhook_signature_invalid'
  | 'network_unreachable'
  | 'validation_failed'
  | 'bad_request'
  | 'unauthorized'
  | 'forbidden'
  | 'account_suspended'
  | 'email_not_verified'
  | 'conflict'
  | 'internal'

export const errorStatus: Record<ErrorCode, number> = {
  story_not_found: 404,
  chapter_not_found: 404,
  user_not_found: 404,
  duplicate_title: 409,
  insufficient_coins: 409,
  chapter_locked: 403,
  already_unlocked: 409,
  subscription_required: 402,
  rate_limited: 429,
  payment_failed: 402,
  payment_processor_error: 502,
  webhook_signature_invalid: 401,
  network_unreachable: 0,
  validation_failed: 422,
  bad_request: 400,
  unauthorized: 401,
  forbidden: 403,
  account_suspended: 403,
  email_not_verified: 403,
  conflict: 409,
  internal: 500,
}

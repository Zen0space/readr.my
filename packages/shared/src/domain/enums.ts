export const UserRole = {
  Reader: 'reader',
  Author: 'author',
  Admin: 'admin',
} as const
export type UserRole = (typeof UserRole)[keyof typeof UserRole]

export const UserStatus = {
  Active: 'active',
  Suspended: 'suspended',
} as const
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus]

export const StoryStatus = {
  Draft: 'draft',
  Ongoing: 'ongoing',
  Completed: 'completed',
} as const
export type StoryStatus = (typeof StoryStatus)[keyof typeof StoryStatus]

export const ChapterGating = {
  Free: 'free',
  Coin: 'coin',
  Sub: 'sub',
} as const
export type ChapterGating = (typeof ChapterGating)[keyof typeof ChapterGating]

export const AgeRating = {
  General: 'general',
  Teen: 'teen',
  Mature: 'mature',
} as const
export type AgeRating = (typeof AgeRating)[keyof typeof AgeRating]

export const Language = {
  Ms: 'ms',
  En: 'en',
} as const
export type Language = (typeof Language)[keyof typeof Language]

export const PayoutStatus = {
  Requested: 'requested',
  Approved: 'approved',
  Paid: 'paid',
  Rejected: 'rejected',
} as const
export type PayoutStatus = (typeof PayoutStatus)[keyof typeof PayoutStatus]

export const SubscriptionStatus = {
  Active: 'active',
  Cancelled: 'cancelled',
  Expired: 'expired',
  PastDue: 'past_due',
} as const
export type SubscriptionStatus = (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus]

export const CoinPurchaseStatus = {
  Pending: 'pending',
  Succeeded: 'succeeded',
  Failed: 'failed',
} as const
export type CoinPurchaseStatus = (typeof CoinPurchaseStatus)[keyof typeof CoinPurchaseStatus]

export const ReportStatus = {
  Open: 'open',
  Dismissed: 'dismissed',
  Actioned: 'actioned',
} as const
export type ReportStatus = (typeof ReportStatus)[keyof typeof ReportStatus]

export const NotificationKind = {
  ChapterPublished: 'chapter_published',
  PayoutStateChanged: 'payout_state_changed',
} as const
export type NotificationKind = (typeof NotificationKind)[keyof typeof NotificationKind]

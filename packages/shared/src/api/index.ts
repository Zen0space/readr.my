export { authApi } from './auth'
export { writingsApi } from './writings'
export { walletApi } from './wallet'
export { libraryApi } from './library'
export { watchlistApi } from './watchlist'
export { subscriptionApi } from './subscription'
export { socialApi } from './social'
export { uploadApi } from './upload'
export { analyticsApi } from './analytics'
export { adminApi } from './admin'

export type { Transaction } from './wallet'
export type { CreateWritingInput, UpdateWritingInput, CreateChapterInput } from './writings'
export type { Comment } from './social'
export type { AdminUser, AdminReport } from './admin'
export type { DashboardMetrics } from './analytics'

export type {
  Chapter,
  Json,
  LibraryItem,
  LibraryResponse,
  WatchlistItem,
  WatchlistResponse,
  LoginResponse,
  RegisterResponse,
  Role,
  SessionResponse,
  Subscription,
  SubscriptionResponse,
  SubscriptionTier,
  User,
  Wallet,
  WalletResponse,
  Writing,
  WritingsListResponse,
  ApiErrorBody,
} from '../api-client'

export {
  ChapterSchema,
  LibraryItemSchema,
  LibraryResponseSchema,
  WatchlistItemSchema,
  WatchlistResponseSchema,
  LoginResponseSchema,
  RegisterResponseSchema,
  RoleSchema,
  SessionResponseSchema,
  SubscriptionResponseSchema,
  SubscriptionSchema,
  SubscriptionTierSchema,
  UserSchema,
  WalletResponseSchema,
  WalletSchema,
  WritingSchema,
  WritingsListResponseSchema,
  ApiErrorBodySchema,
} from '../api-client'
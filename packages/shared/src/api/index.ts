export { authApi } from './auth'
export { writingsApi } from './writings'
export { walletApi } from './wallet'
export { libraryApi } from './library'
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

// Re-export the api-client's domain types + zod schemas so a package can
// `import { Writing, Chapter, LibraryItem, Subscription, SubscriptionTier, Role, User }
// from '@auror/shared/api'` without reaching into the api-client subpath.
export type {
  Chapter,
  Json,
  LibraryItem,
  LibraryResponse,
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
  WritingStatus,
  WritingsListResponse,
  ApiErrorBody,
} from '../api-client'

export {
  ChapterSchema,
  LibraryItemSchema,
  LibraryResponseSchema,
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
  WritingStatusSchema,
  WritingsListResponseSchema,
  ApiErrorBodySchema,
} from '../api-client'
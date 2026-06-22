export { apiClient, ApiClient, swrFetcher } from './client';
export {
  ApiClientError,
  SessionExpiredError,
  ValidationError,
  NetworkUnreachableError,
  codeFromStatus,
} from './errors';
export type {
  User,
  Role,
  Writing,
  WritingStatus,
  Chapter,
  Wallet,
  Subscription,
  SubscriptionTier,
  LibraryItem,
  SessionResponse,
  LoginResponse,
  RegisterResponse,
  WritingsListResponse,
  WalletResponse,
  SubscriptionResponse,
  LibraryResponse,
  ApiErrorBody,
  Json,
} from './types';
export type { Comment } from './social';
export type { AdminUser, AdminReport } from './admin';
export type { DashboardMetrics } from './analytics';
export { authApi } from './auth';
export { writingsApi } from './writings';
export { walletApi } from './wallet';
export { subscriptionApi } from './subscription';
export { libraryApi } from './library';
export { socialApi } from './social';
export { uploadApi } from './upload';
export { analyticsApi } from './analytics';
export { adminApi } from './admin';

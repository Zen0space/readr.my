import { z } from 'zod'

export const RoleSchema = z.enum(['reader', 'author', 'admin'])
export type Role = z.infer<typeof RoleSchema>

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  username: z.string(),
  role: RoleSchema,
  // Avatar URLs are validated per-use-case at the consumer (the
  // <Avatar> component already tolerates missing/empty values).
  // We don't gate the entire response on a strict URL parse here,
  // because a single bad row in `profiles.avatar_url` would
  // otherwise 500 every login / session check.
  avatar_url: z.string().nullable().optional(),
})
export type User = z.infer<typeof UserSchema>

export const SessionResponseSchema = z.discriminatedUnion('authenticated', [
  z.object({ authenticated: z.literal(true), user: UserSchema }),
  z.object({ authenticated: z.literal(false) }),
])
export type SessionResponse = z.infer<typeof SessionResponseSchema>

export const LoginResponseSchema = z.object({
  success: z.literal(true),
  user: UserSchema,
})
export type LoginResponse = z.infer<typeof LoginResponseSchema>

export const RegisterResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  user: UserSchema.optional(),
})
export type RegisterResponse = z.infer<typeof RegisterResponseSchema>

/**
 * Story / Writing — matches the backend's `storyResponse` envelope from
 * packages/backend/src/modules/stories/schema.ts (which is the source of
 * truth, mirroring the public.stories table).
 */
export const WritingSchema = z.object({
  id: z.string().uuid(),
  author_id: z.string().uuid(),
  title: z.string(),
  blurb: z.string().nullable(),
  genre: z.string(),
  tags: z.array(z.string()),
  language: z.string(),
  age_rating: z.string(),
  status: z.enum(['draft', 'ongoing', 'completed']),
  cover_url: z.string().nullable(),
  published_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})
export type Writing = z.infer<typeof WritingSchema>

export const WritingsListResponseSchema = z.object({
  items: z.array(WritingSchema),
  next_cursor: z.string().nullable(),
})
export type WritingsListResponse = z.infer<typeof WritingsListResponseSchema>

/** Chapter — matches backend's `chapterResponse`. */
export const ChapterSchema = z.object({
  id: z.string().uuid(),
  story_id: z.string().uuid(),
  ord: z.number(),
  title: z.string(),
  gating: z.enum(['free', 'coin', 'sub']),
  price_coins: z.number(),
  has_content: z.boolean(),
  locked: z.boolean(),
  content_md: z.string().nullable(),
  published_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})
export type Chapter = z.infer<typeof ChapterSchema>

/**
 * Wallet — for the reader surface this is the coin balance only. Earnings
 * (author) is exposed via `/v1/me/earnings` instead.
 */
export const WalletSchema = z.object({
  coin_balance: z.number(),
})
export type Wallet = z.infer<typeof WalletSchema>

export const WalletResponseSchema = z.object({
  coin_balance: z.number(),
  coins_per_rm: z.number(),
  updated_at: z.string(),
})
export type WalletResponse = z.infer<typeof WalletResponseSchema>

export const SubscriptionTierSchema = z.enum(['premium_reader', 'vip_reader'])
export type SubscriptionTier = z.infer<typeof SubscriptionTierSchema>

export const SubscriptionSchema = z
  .object({
    id: z.string(),
    user_id: z.string(),
    tier: SubscriptionTierSchema,
    status: z.string(),
    started_at: z.string().nullable().optional(),
    ends_at: z.string().nullable().optional(),
  })
  .nullable()
export type Subscription = z.infer<typeof SubscriptionSchema>

export const SubscriptionResponseSchema = z.object({
  success: z.literal(true),
  subscription: SubscriptionSchema,
})
export type SubscriptionResponse = z.infer<typeof SubscriptionResponseSchema>

export const LibraryItemSchema = z.object({
  story_id: z.string().uuid(),
  added_at: z.string(),
  title: z.string(),
  blurb: z.string().nullable(),
  cover_url: z.string().nullable(),
  status: z.enum(['draft', 'ongoing', 'completed']),
  author_id: z.string().uuid(),
  author_pen_name: z.string().nullable(),
})
export type LibraryItem = z.infer<typeof LibraryItemSchema>

export const LibraryResponseSchema = z.object({
  items: z.array(LibraryItemSchema),
})
export type LibraryResponse = z.infer<typeof LibraryResponseSchema>

/**
 * Watchlist — a "follow this story" list. Distinct from `LibraryItem`:
 * the reader is signaling ongoing interest (e.g. wants new-chapter
 * notifications) but hasn't necessarily saved the story to their
 * private shelf yet. The `notify_on_chapter` flag drives whether
 * the backend mints a `chapter_published` notification when a new
 * chapter drops.
 */
export const WatchlistItemSchema = z.object({
  story_id: z.string().uuid(),
  added_at: z.string(),
  notify_on_chapter: z.boolean(),
  title: z.string(),
  blurb: z.string().nullable(),
  cover_url: z.string().nullable(),
  status: z.enum(['draft', 'ongoing', 'completed']),
  author_id: z.string().uuid(),
  author_pen_name: z.string().nullable(),
})
export type WatchlistItem = z.infer<typeof WatchlistItemSchema>

export const WatchlistResponseSchema = z.object({
  items: z.array(WatchlistItemSchema),
})
export type WatchlistResponse = z.infer<typeof WatchlistResponseSchema>

export const ApiErrorBodySchema = z.object({
  error: z.union([z.string(), z.object({ message: z.string() })]),
  details: z.unknown().optional(),
})
export type ApiErrorBody = z.infer<typeof ApiErrorBodySchema>

export type Json = null | boolean | number | string | Json[] | { [key: string]: Json }
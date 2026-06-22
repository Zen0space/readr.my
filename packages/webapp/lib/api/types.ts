import { z } from 'zod';

export const RoleSchema = z.enum(['reader', 'author', 'admin']);
export type Role = z.infer<typeof RoleSchema>;

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  username: z.string(),
  role: RoleSchema,
  avatar_url: z.string().url().nullable().optional(),
});
export type User = z.infer<typeof UserSchema>;

export const SessionResponseSchema = z.discriminatedUnion('authenticated', [
  z.object({ authenticated: z.literal(true), user: UserSchema }),
  z.object({ authenticated: z.literal(false) }),
]);
export type SessionResponse = z.infer<typeof SessionResponseSchema>;

export const LoginResponseSchema = z.object({
  success: z.literal(true),
  user: UserSchema,
});
export type LoginResponse = z.infer<typeof LoginResponseSchema>;

export const RegisterResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  user: UserSchema.optional(),
});
export type RegisterResponse = z.infer<typeof RegisterResponseSchema>;

export const WritingStatusSchema = z.enum(['draft', 'published']);
export type WritingStatus = z.infer<typeof WritingStatusSchema>;

export const WritingSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  cover_url: z.string().url().nullable().optional(),
  status: WritingStatusSchema,
  author_id: z.string(),
  created_at: z.string(),
  updated_at: z.string().optional(),
  profiles: z
    .object({ username: z.string() })
    .nullable()
    .optional(),
});
export type Writing = z.infer<typeof WritingSchema>;

export const WritingsListResponseSchema = z.object({
  success: z.literal(true),
  writings: z.array(WritingSchema),
});
export type WritingsListResponse = z.infer<typeof WritingsListResponseSchema>;

export const ChapterSchema = z.object({
  id: z.string(),
  writing_id: z.string(),
  title: z.string(),
  content: z.string().nullable().optional(),
  chapter_order: z.number(),
  is_premium: z.boolean(),
  coin_price: z.number(),
  status: WritingStatusSchema,
  published_at: z.string().nullable().optional(),
});
export type Chapter = z.infer<typeof ChapterSchema>;

export const WalletSchema = z.object({
  coin_balance: z.number(),
  earnings_balance: z.number(),
});
export type Wallet = z.infer<typeof WalletSchema>;

export const WalletResponseSchema = z.object({
  success: z.literal(true),
  wallet: WalletSchema,
});
export type WalletResponse = z.infer<typeof WalletResponseSchema>;

export const SubscriptionTierSchema = z.enum(['premium_reader', 'vip_reader']);
export type SubscriptionTier = z.infer<typeof SubscriptionTierSchema>;

export const SubscriptionSchema = z
  .object({
    id: z.string(),
    user_id: z.string(),
    tier: SubscriptionTierSchema,
    status: z.string(),
    started_at: z.string().nullable().optional(),
    ends_at: z.string().nullable().optional(),
  })
  .nullable();
export type Subscription = z.infer<typeof SubscriptionSchema>;

export const SubscriptionResponseSchema = z.object({
  success: z.literal(true),
  subscription: SubscriptionSchema,
});
export type SubscriptionResponse = z.infer<typeof SubscriptionResponseSchema>;

export const LibraryItemSchema = WritingSchema.extend({
  added_at: z.string(),
});
export type LibraryItem = z.infer<typeof LibraryItemSchema>;

export const LibraryResponseSchema = z.object({
  success: z.literal(true),
  library: z.array(LibraryItemSchema),
});
export type LibraryResponse = z.infer<typeof LibraryResponseSchema>;

export const ApiErrorBodySchema = z.object({
  error: z.union([z.string(), z.object({ message: z.string() })]),
  details: z.unknown().optional(),
});
export type ApiErrorBody = z.infer<typeof ApiErrorBodySchema>;

export type Json =
  | null
  | boolean
  | number
  | string
  | Json[]
  | { [key: string]: Json };

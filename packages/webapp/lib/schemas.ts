import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  username: z.string().min(2).max(32),
  role: z.enum(['reader', 'author']),
  avatarUrl: z.string().url().optional(),
});

export const SubscribeSchema = z.object({
  tier: z.enum(['premium_reader', 'vip_reader']),
});

export const WritingSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).default(''),
  cover_url: z.string().url().optional(),
  status: z.enum(['draft', 'published']).default('draft'),
});

export const ChapterSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().default(''),
  chapter_order: z.number().int().nonnegative(),
  is_premium: z.boolean().default(false),
  coin_price: z.number().int().nonnegative().default(0),
  status: z.enum(['draft', 'published']).default('draft'),
});

export const CommentSchema = z.object({
  writing_id: z.string().uuid(),
  content: z.string().min(1).max(2000),
  chapter_id: z.string().uuid().optional(),
});

export const PurchaseCoinsSchema = z
  .object({ coins_id: z.string().min(1) })
  .or(
    z.object({
      coins: z.number().int().positive(),
      price: z.number().positive(),
    }),
  );

export const PayoutSchema = z.object({
  amount: z.number().positive(),
});

export const TrackEventSchema = z.object({
  event_type: z.string().min(1),
  writing_id: z.string().uuid().optional(),
  chapter_id: z.string().uuid().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

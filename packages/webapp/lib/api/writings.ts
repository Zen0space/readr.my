import { z } from 'zod';
import { apiClient } from './client';
import {
  ChapterSchema,
  WritingSchema,
  WritingsListResponseSchema,
  type Chapter,
  type Writing,
  type WritingStatus,
  type WritingsListResponse,
} from './types';

const WritingResponseSchema = z.object({
  success: z.literal(true),
  writing: WritingSchema,
});
const ChaptersResponseSchema = z.object({
  success: z.literal(true),
  chapters: z.array(ChapterSchema),
});
const ChapterResponseSchema = z.object({
  success: z.literal(true),
  chapter: ChapterSchema,
});
const DeleteResponseSchema = z.object({
  success: z.literal(true),
});
const UnlockResponseSchema = z.object({
  success: z.literal(true),
});

export type CreateWritingInput = {
  title: string;
  description?: string;
  coverUrl?: string;
  status?: WritingStatus;
};

export type UpdateWritingInput = Partial<CreateWritingInput>;

export type CreateChapterInput = {
  title: string;
  content?: string;
  chapterOrder: number;
  isPremium?: boolean;
  coinPrice?: number;
  status?: WritingStatus;
};

export const writingsApi = {
  list: (params: Record<string, string | number | undefined> = {}): Promise<WritingsListResponse> => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        search.append(key, String(value));
      }
    }
    const query = search.toString();
    return apiClient.request(
      `/api/writings${query ? `?${query}` : ''}`,
      WritingsListResponseSchema,
    );
  },

  get: (id: string): Promise<{ success: true; writing: Writing }> =>
    apiClient.request(`/api/writings/${id}`, WritingResponseSchema),

  create: (input: CreateWritingInput): Promise<{ success: true; writing: Writing }> =>
    apiClient.request('/api/writings', WritingResponseSchema, {
      method: 'POST',
      body: {
        title: input.title,
        description: input.description ?? '',
        cover_url: input.coverUrl,
        status: input.status ?? 'draft',
      },
    }),

  update: (id: string, input: UpdateWritingInput): Promise<{ success: true; writing: Writing }> =>
    apiClient.request(`/api/writings/${id}`, WritingResponseSchema, {
      method: 'PUT',
      body: {
        title: input.title,
        description: input.description,
        cover_url: input.coverUrl,
        status: input.status,
      },
    }),

  remove: (id: string): Promise<{ success: true }> =>
    apiClient.request(`/api/writings/${id}`, DeleteResponseSchema, {
      method: 'DELETE',
    }),

  chapters: {
    list: (writingId: string): Promise<{ success: true; chapters: Chapter[] }> =>
      apiClient.request(
        `/api/writings/${writingId}/chapters`,
        ChaptersResponseSchema,
      ),

    create: (writingId: string, input: CreateChapterInput): Promise<{ success: true; chapter: Chapter }> =>
      apiClient.request(
        `/api/writings/${writingId}/chapters`,
        ChapterResponseSchema,
        {
          method: 'POST',
          body: {
            title: input.title,
            content: input.content ?? '',
            chapter_order: input.chapterOrder,
            is_premium: input.isPremium ?? false,
            coin_price: input.coinPrice ?? 0,
            status: input.status ?? 'draft',
          },
        },
      ),

    get: (chapterId: string): Promise<{ success: true; chapter: Chapter }> =>
      apiClient.request(
        `/api/chapters/${chapterId}`,
        ChapterResponseSchema,
      ),

    update: (chapterId: string, input: CreateChapterInput): Promise<{ success: true; chapter: Chapter }> =>
      apiClient.request(
        `/api/chapters/${chapterId}`,
        ChapterResponseSchema,
        {
          method: 'PUT',
          body: {
            title: input.title,
            content: input.content ?? '',
            chapter_order: input.chapterOrder,
            is_premium: input.isPremium ?? false,
            coin_price: input.coinPrice ?? 0,
            status: input.status ?? 'draft',
          },
        },
      ),

    remove: (chapterId: string): Promise<{ success: true }> =>
      apiClient.request(
        `/api/chapters/${chapterId}`,
        DeleteResponseSchema,
        { method: 'DELETE' },
      ),

    unlock: (chapterId: string): Promise<{ success: true }> =>
      apiClient.request(
        `/api/chapters/${chapterId}/unlock`,
        UnlockResponseSchema,
        { method: 'POST', body: {} },
      ),
  },
};

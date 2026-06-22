import { z } from 'zod';
import {
  ApiClientError,
  NetworkUnreachableError,
  SessionExpiredError,
  ValidationError,
  codeFromStatus,
} from './errors';
import { ApiErrorBodySchema } from './types';

export type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

export type RequestResult<T> = T;

export class ApiClient {
  constructor(private readonly baseUrl: string = '') {}

  async request<T>(
    path: string,
    schema: z.ZodType<T>,
    options: RequestOptions = {},
  ): Promise<T> {
    const { method = 'GET', body, headers, signal } = options;
    const url = path.startsWith('http') ? path : `${this.baseUrl}${path}`;

    const init: RequestInit = {
      method,
      headers: {
        Accept: 'application/json',
        ...headers,
      },
      credentials: 'include',
      signal,
    };

    if (body instanceof FormData) {
      init.body = body;
    } else if (body !== undefined) {
      init.body = JSON.stringify(body);
      (init.headers as Record<string, string>)['Content-Type'] =
        'application/json';
    }

    let response: Response;
    try {
      response = await fetch(url, init);
    } catch (cause) {
      throw new NetworkUnreachableError(cause);
    }

    if (response.status === 401) {
      throw new SessionExpiredError();
    }

    if (response.status === 422) {
      const data = await this.safeJson(response);
      throw new ValidationError(data);
    }

    if (!response.ok) {
      const errorBody = await this.safeJson(response);
      const parsed = ApiErrorBodySchema.safeParse(errorBody);
      const message =
        parsed.success && typeof parsed.data.error === 'string'
          ? parsed.data.error
          : `HTTP ${response.status}`;
      throw new ApiClientError(
        response.status,
        codeFromStatus(response.status),
        message,
        parsed.success ? parsed.data.details : errorBody,
      );
    }

    if (response.status === 204) {
      return schema.parse(undefined);
    }

    const data = (await response.json()) as unknown;
    return schema.parse(data);
  }

  private async safeJson(response: Response): Promise<unknown> {
    try {
      return (await response.json()) as unknown;
    } catch {
      return null;
    }
  }
}

export const apiClient = new ApiClient();

export const swrFetcher = async <T>(
  path: string,
  schema: z.ZodType<T>,
): Promise<T> => apiClient.request<T>(path, schema);

import type { ErrorCode } from '../errors/codes'
import { ApiClientError, NetworkUnreachableError, SessionExpiredError, ValidationError } from './errors'
import { ApiErrorBodySchema } from './types'

export type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  headers?: Record<string, string>
  signal?: AbortSignal
}

export type ApiClientConfig = {
  baseUrl?: string
  /**
   * Optional bearer token provider. Called on every request; returned value is sent
   * as `Authorization: Bearer <token>`. Leave undefined for cookie-only clients
   * (e.g. when hitting a same-origin BFF that reads the session from cookies).
   */
  getToken?: () => Promise<string | null>
  /** Optional callback fired when the server returns 401. Useful to clear in-memory session state. */
  onUnauthorized?: () => void
}

/**
 * Typed HTTP client. Sends cookies by default (`credentials: 'include'`) so
 * same-origin BFF routes that read the Supabase SSR cookie just work. When a
 * `getToken` is supplied, the token is attached as `Authorization: Bearer …`,
 * which is what the Fastify backend expects.
 *
 * Responses are validated with a Zod schema — caller receives a parsed value
 * or a typed error (network, session expired, validation, generic).
 */
export class ApiClient {
  constructor(private readonly config: ApiClientConfig = {}) {}

  async request<T>(
    path: string,
    schema: import('zod').ZodType<T>,
    options: RequestOptions = {},
  ): Promise<T> {
    const { method = 'GET', body, headers, signal } = options
    const baseUrl = this.config.baseUrl ?? ''
    const url = path.startsWith('http') ? path : `${baseUrl}${path}`

    const init: RequestInit = {
      method,
      headers: {
        Accept: 'application/json',
        ...headers,
      },
      credentials: 'include',
      signal,
    }

    if (body instanceof FormData) {
      init.body = body
    } else if (body !== undefined) {
      init.body = JSON.stringify(body)
      ;(init.headers as Record<string, string>)['Content-Type'] = 'application/json'
    }

    if (this.config.getToken) {
      const token = await this.config.getToken()
      if (token) {
        ;(init.headers as Record<string, string>).Authorization = `Bearer ${token}`
      }
    }

    let response: Response
    try {
      response = await fetch(url, init)
    } catch (cause) {
      throw new NetworkUnreachableError(cause)
    }

    if (response.status === 401) {
      this.config.onUnauthorized?.()
      throw new SessionExpiredError()
    }

    if (response.status === 422) {
      const data = await this.safeJson(response)
      throw new ValidationError(data)
    }

    if (!response.ok) {
      const errorBody = await this.safeJson(response)
      const parsed = ApiErrorBodySchema.safeParse(errorBody)
      const message =
        parsed.success && typeof parsed.data.error === 'string'
          ? parsed.data.error
          : `HTTP ${response.status}`
      throw new ApiClientError(
        response.status,
        codeFromStatus(response.status),
        message,
        parsed.success ? parsed.data.details : errorBody,
      )
    }

    if (response.status === 204) {
      return schema.parse(undefined)
    }

    const data = (await response.json()) as unknown
    return schema.parse(data)
  }

  private async safeJson(response: Response): Promise<unknown> {
    try {
      return (await response.json()) as unknown
    } catch {
      return null
    }
  }
}

/**
 * Helper that wires the client's `baseUrl` from `process.env.NEXT_PUBLIC_API_BASE_URL`
 * (or a passed-in override). Each frontend package calls this once at module
 * scope and gets back a ready-to-use client.
 */
export const createApiClient = (overrides: ApiClientConfig = {}): ApiClient => {
  const fromEnv = (globalThis as { process?: { env?: Record<string, string | undefined> } })
    .process?.env?.NEXT_PUBLIC_API_BASE_URL
  const baseUrl = overrides.baseUrl ?? fromEnv ?? ''
  return new ApiClient({ ...overrides, baseUrl })
}

/** Status → error code mapping. Mirrors the contract `@auror/shared/errors` expects. */
const statusToCode: Record<number, ErrorCode> = {
  400: 'bad_request',
  401: 'unauthorized',
  402: 'payment_failed',
  403: 'forbidden',
  404: 'user_not_found',
  409: 'conflict',
  422: 'validation_failed',
  429: 'rate_limited',
  500: 'internal',
  502: 'payment_processor_error',
}

export const codeFromStatus = (status: number): ErrorCode => statusToCode[status] ?? 'internal'

/** Convenience for use with SWR — wraps the schema + client in one call. */
export const swrFetcher =
  (client: ApiClient) =>
  async <T>(path: string, schema: import('zod').ZodType<T>): Promise<T> =>
    client.request<T>(path, schema)
import { ApiError, NetworkError, AppError } from '@auror/shared/errors'

/**
 * Generic failure shape surfaced by `parseFetchError`. Used by both
 * the server-side `ErrorBanner` and the client-side `ErrorToast` so
 * they can render consistent copy and retry affordances regardless
 * of where the failure originated.
 *
 * `kind` is a coarse classification — UI uses it to pick the right
 * colour palette (rose for 5xx, amber for 4xx, slate for offline).
 */
export type ErrorKind = 'network' | 'server' | 'client' | 'unknown'

export type NormalizedError = {
  kind: ErrorKind
  title: string
  message: string
  status?: number
  code?: string
  retryable: boolean
}

const isNetworkError = (err: unknown): err is NetworkError =>
  err instanceof NetworkError ||
  (err instanceof Error && err.name === 'NetworkError') ||
  // Native fetch() failure modes — when the backend isn't running
  // or the connection is refused, the promise rejects with a TypeError.
  (err instanceof TypeError && /fetch|network|connect/i.test(err.message))

const isApiError = (err: unknown): err is ApiError =>
  err instanceof ApiError ||
  (err instanceof Error && err.name === 'ApiError' && 'status' in err)

const isAppError = (err: unknown): err is AppError =>
  err instanceof AppError ||
  (err instanceof Error && err.name === 'AppError' && 'status' in err)

const errorMessage = (err: unknown): string => {
  if (err instanceof Error) return err.message
  if (typeof err === 'string') return err
  try {
    return JSON.stringify(err)
  } catch {
    return 'Unknown error'
  }
}

/**
 * Normalize any error value (thrown from `fetch`, server components,
 * or client-side `apiClient`) into a typed shape. Returns null when
 * the input is not actually an error — callers can treat that as
 * "no failure to surface".
 */
export const parseFetchError = (err: unknown): NormalizedError | null => {
  if (err === null || err === undefined) return null

  if (isNetworkError(err)) {
    return {
      kind: 'network',
      title: "Can't reach the server",
      message:
        'We couldn’t connect to the backend. Make sure it’s running and try again.',
      code: 'network_unreachable',
      retryable: true,
    }
  }

  if (isApiError(err) || isAppError(err)) {
    const status = (err as ApiError).status ?? (err as AppError).status
    const code = (err as ApiError).code ?? (err as AppError).code
    const devMessage = errorMessage(err)

    if (status >= 500) {
      return {
        kind: 'server',
        title: 'Something went wrong on our end',
        message: 'The server hit an unexpected error. Please try again in a moment.',
        status,
        code,
        retryable: true,
      }
    }

    if (status === 401) {
      return {
        kind: 'client',
        title: 'Your session has expired',
        message: 'Please sign in again to continue.',
        status,
        code,
        retryable: false,
      }
    }

    if (status === 403) {
      return {
        kind: 'client',
        title: "You don't have access",
        message: devMessage || 'This action isn’t available for your account.',
        status,
        code,
        retryable: false,
      }
    }

    if (status === 404) {
      return {
        kind: 'client',
        title: 'Not found',
        message: devMessage || 'The resource you’re looking for doesn’t exist.',
        status,
        code,
        retryable: false,
      }
    }

    return {
      kind: 'client',
      title: 'Request failed',
      message: devMessage || 'Please check your input and try again.',
      status,
      code,
      retryable: false,
    }
  }

  // Unknown / unclassified error — log to console so devs can debug.
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line no-console
    console.error('[parseFetchError] unhandled error:', err)
  }

  return {
    kind: 'unknown',
    title: 'Something went wrong',
    message: errorMessage(err),
    retryable: true,
  }
}
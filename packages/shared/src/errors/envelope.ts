import type { ErrorCode } from './codes'
import { errorStatus } from './codes'
import { AppError } from './classes'

export type ErrorEnvelope = {
  error: {
    code: ErrorCode
    message: string
    details?: unknown
  }
}

export const serializeError = (err: unknown): { status: number; body: ErrorEnvelope } => {
  if (err instanceof AppError) {
    return {
      status: err.status,
      body: { error: { code: err.code, message: err.message, details: err.details } },
    }
  }
  return {
    status: errorStatus.internal,
    body: { error: { code: 'internal', message: 'Internal server error' } },
  }
}

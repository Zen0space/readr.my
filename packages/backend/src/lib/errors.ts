import type { ErrorCode } from '@auror/shared/errors'
import { AppError } from '@auror/shared/errors'

export const appError = (code: ErrorCode, status: number, message: string, details?: unknown): AppError =>
  new AppError(code, status, message, details)

export const notFound = (code: ErrorCode, message: string) => appError(code, 404, message)
export const forbidden = (code: ErrorCode, message: string) => appError(code, 403, message)
export const unauthorized = (message = 'unauthorized') => appError('unauthorized', 401, message)
export const conflict = (code: ErrorCode, message: string) => appError(code, 409, message)
export const badGateway = (code: ErrorCode, message: string) => appError(code, 502, message)

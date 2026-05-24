import type { ErrorCode } from './codes'
import { ApiError, AppError, NetworkError } from './classes'
import { type Locale, messages } from './messages'

export const getUserMessage = (err: unknown, locale: Locale = 'ms'): string => {
  const code: ErrorCode =
    err instanceof ApiError || err instanceof AppError
      ? err.code
      : err instanceof NetworkError
        ? 'network_unreachable'
        : 'internal'
  return messages[locale][code] ?? messages[locale].internal
}

export type DevLogInfo = {
  method: string
  path: string
  status: number | 'NET'
  ms: number | null
  code?: string
}

export const formatDevLogLine = (info: DevLogInfo): string => {
  const status = info.status === 'NET' ? 'ERR    NET' : info.status >= 400 ? `ERR    ${info.status}` : String(info.status).padEnd(3)
  const method = info.method.padEnd(6)
  const path = info.path.padEnd(28)
  const ms = info.ms === null ? '--   ' : `${info.ms}ms`.padStart(6)
  const code = info.code ? `  code=${info.code}` : ''
  return `API ${status}  ${method} ${path} ${ms}${code}`
}

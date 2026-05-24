import type { ErrorCode } from './codes'
import { ApiError, NetworkError } from './classes'
import { formatDevLogLine } from './format'

export type ApiClientConfig = {
  baseUrl: string
  getToken: () => Promise<string | null>
  devLog?: (line: string) => void
  onUnauthorized?: () => void
}

export type ApiClient = {
  get: <T>(path: string) => Promise<T>
  post: <T>(path: string, body?: unknown) => Promise<T>
  patch: <T>(path: string, body?: unknown) => Promise<T>
  put: <T>(path: string, body?: unknown) => Promise<T>
  del: <T>(path: string) => Promise<T>
}

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

export const createApiClient = (cfg: ApiClientConfig): ApiClient => {
  const request = async <T>(method: Method, path: string, body?: unknown): Promise<T> => {
    const url = cfg.baseUrl.replace(/\/+$/, '') + path
    const token = await cfg.getToken()
    const headers: Record<string, string> = { 'content-type': 'application/json' }
    if (token) headers.authorization = `Bearer ${token}`

    const start = Date.now()
    let res: Response
    try {
      res = await fetch(url, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      })
    } catch (cause) {
      cfg.devLog?.(formatDevLogLine({ method, path, status: 'NET', ms: null, code: 'network_unreachable' }))
      throw new NetworkError(cause)
    }

    const ms = Date.now() - start

    if (res.status === 204) {
      cfg.devLog?.(formatDevLogLine({ method, path, status: res.status, ms }))
      return undefined as T
    }

    const text = await res.text()
    const parsed: unknown = text.length === 0 ? null : safeJson(text)

    if (!res.ok) {
      const envelope = parsed as { error?: { code?: string; message?: string; details?: unknown } } | null
      const code = (envelope?.error?.code as ErrorCode | undefined) ?? 'internal'
      const message = envelope?.error?.message ?? `HTTP ${res.status}`
      cfg.devLog?.(formatDevLogLine({ method, path, status: res.status, ms, code }))
      if (res.status === 401) cfg.onUnauthorized?.()
      throw new ApiError(res.status, code, message, envelope?.error?.details)
    }

    cfg.devLog?.(formatDevLogLine({ method, path, status: res.status, ms }))
    return parsed as T
  }

  return {
    get: (path) => request('GET', path),
    post: (path, body) => request('POST', path, body),
    patch: (path, body) => request('PATCH', path, body),
    put: (path, body) => request('PUT', path, body),
    del: (path) => request('DELETE', path),
  }
}

const safeJson = (text: string): unknown => {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

export const ipcErrorToApiError = (raw: unknown): ApiError => {
  if (raw instanceof ApiError) return raw
  const str = typeof raw === 'string' ? raw : raw instanceof Error ? raw.message : String(raw)
  const sep = str.indexOf(':')
  if (sep > 0) {
    const code = str.slice(0, sep).trim() as ErrorCode
    const message = str.slice(sep + 1).trim()
    return new ApiError(500, code, message)
  }
  return new ApiError(500, 'internal', str)
}

import { ApiError, NetworkError, type ErrorCode } from '@auror/shared/errors'
import { env } from '../config/env'

export type MeProfile = {
  id: string
  email: string | null
  role: 'reader' | 'author' | 'admin'
  status: 'active' | 'suspended'
}

/**
 * Fetch the caller's profile. Takes an explicit jwt because at login time the
 * session atom isn't set yet, so the shared api client's getToken() would
 * return null. Mirrors the shared client's error handling: a transport failure
 * (backend not running, offline) becomes a NetworkError so the user sees
 * "You appear to be offline" rather than a generic "Something went wrong".
 */
export const fetchMe = async (jwt: string): Promise<MeProfile> => {
  const url = env.apiBaseUrl.replace(/\/+$/, '') + '/v1/me'
  let res: Response
  try {
    res = await fetch(url, {
      method: 'GET',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${jwt}`,
      },
    })
  } catch (cause) {
    throw new NetworkError(cause)
  }

  const text = res.status === 204 ? '' : await res.text()
  if (!res.ok) {
    let code: ErrorCode = 'internal'
    let message = `HTTP ${res.status}`
    try {
      const body = JSON.parse(text) as { error?: { code?: string; message?: string } }
      if (body.error?.code) code = body.error.code as ErrorCode
      if (body.error?.message) message = body.error.message
    } catch {
      // non-JSON body — keep the HTTP fallback
    }
    throw new ApiError(res.status, code, message)
  }

  return JSON.parse(text) as MeProfile
}

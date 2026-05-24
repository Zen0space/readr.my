import { env } from '../config/env'

export type MeProfile = {
  id: string
  email: string | null
  role: 'reader' | 'author' | 'admin'
  status: 'active' | 'suspended'
}

export const fetchMe = async (jwt: string): Promise<MeProfile> => {
  const url = env.apiBaseUrl.replace(/\/+$/, '') + '/v1/me'
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${jwt}`,
    },
  })
  if (!res.ok) {
    let detail = `HTTP ${res.status}`
    try {
      const body = (await res.json()) as { error?: { message?: string } }
      if (body.error?.message) detail = body.error.message
    } catch {
      // ignore
    }
    throw new Error(detail)
  }
  return (await res.json()) as MeProfile
}

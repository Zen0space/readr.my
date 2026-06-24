import { createApiClient, type ApiClient } from '@auror/shared/errors'
import { getDefaultStore } from 'jotai'
import { env } from '../config/env'
import { sessionAtom, updateTokensAtom, clearSessionAtom } from '../atoms/session'
import { supabase } from './auth'

const store = getDefaultStore()

const readToken = (): string | null => {
  const s = store.get(sessionAtom)
  return s.status === 'authenticated' ? s.session.jwt : null
}

let inflightRefresh: Promise<boolean> | null = null

const refreshAuth = async (): Promise<boolean> => {
  if (inflightRefresh) return inflightRefresh
  inflightRefresh = (async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession()
      if (error || !data.session) {
        await store.set(clearSessionAtom)
        return false
      }
      await store.set(updateTokensAtom, {
        jwt: data.session.access_token,
        refreshToken: data.session.refresh_token,
      })
      return true
    } catch {
      await store.set(clearSessionAtom)
      return false
    } finally {
      inflightRefresh = null
    }
  })()
  return inflightRefresh
}

export const api: ApiClient = createApiClient({
  baseUrl: env.apiBaseUrl,
  getToken: async () => readToken(),
  devLog: (line) => {
    if (import.meta.env.DEV) console.log(line)
  },
  refreshAuth,
  onUnauthorized: () => {
    void store.set(clearSessionAtom)
  },
})

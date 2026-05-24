import { createApiClient, type ApiClient } from '@readr/shared/errors'
import { env } from '../config/env'

let tokenProvider: () => string | null = () => null

export const setApiTokenProvider = (fn: () => string | null): void => {
  tokenProvider = fn
}

let onUnauthorized: () => void = () => {}

export const setOnUnauthorized = (fn: () => void): void => {
  onUnauthorized = fn
}

export const api: ApiClient = createApiClient({
  baseUrl: env.apiBaseUrl,
  getToken: async () => tokenProvider(),
  devLog: (line) => {
    if (import.meta.env.DEV) console.log(line)
  },
  onUnauthorized: () => onUnauthorized(),
})

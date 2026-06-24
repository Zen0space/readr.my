import { getUserMessage } from './format'
import type { Locale } from './messages'

export type ToastAdapter = {
  error: (msg: string) => void
  success: (msg: string) => void
}

export type Toaster = {
  error: (err: unknown) => void
  success: (msg: string) => void
}

export const createToaster = (adapter: ToastAdapter, locale: Locale = 'ms'): Toaster => ({
  error: (err) => adapter.error(getUserMessage(err, locale)),
  success: (msg) => adapter.success(msg),
})

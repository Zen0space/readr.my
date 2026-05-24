import { LazyStore } from '@tauri-apps/plugin-store'

export type SessionRecord = {
  jwt: string
  refreshToken: string
  userId: string
  email: string
}

const FILE = 'session.json'
const KEY = 'session'

const store = new LazyStore(FILE)

export const loadSession = async (): Promise<SessionRecord | null> => {
  const value = await store.get<SessionRecord>(KEY)
  return value ?? null
}

export const saveSession = async (record: SessionRecord): Promise<void> => {
  await store.set(KEY, record)
  await store.save()
}

export const clearSession = async (): Promise<void> => {
  await store.delete(KEY)
  await store.save()
}

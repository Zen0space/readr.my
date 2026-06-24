import { atom } from 'jotai'

export type Route =
  | { name: 'library' }
  | { name: 'story'; storyId: string }
  | { name: 'chapter'; storyId: string; chapterId: string }
  | { name: 'wallet' }
  | { name: 'earnings' }

export const routeAtom = atom<Route>({ name: 'library' })

import { open } from '@tauri-apps/plugin-dialog'
import { readFile } from '@tauri-apps/plugin-fs'
import { requestCoverUpload } from '../api/stories'
import { supabase } from '../api/auth'

type Ext = 'jpg' | 'jpeg' | 'png' | 'webp'

const extOf = (path: string): Ext | null => {
  const m = /\.([a-z0-9]+)$/i.exec(path)
  if (!m || !m[1]) return null
  const v = m[1].toLowerCase()
  if (v === 'jpg' || v === 'jpeg' || v === 'png' || v === 'webp') return v
  return null
}

const mimeOf = (ext: Ext): string => {
  if (ext === 'png') return 'image/png'
  if (ext === 'webp') return 'image/webp'
  return 'image/jpeg'
}

// Returns the public cover URL on success, or null if the user cancelled.
export const uploadCoverImage = async (storyId: string): Promise<string | null> => {
  const selected = await open({
    multiple: false,
    directory: false,
    filters: [{ name: 'Image', extensions: ['jpg', 'jpeg', 'png', 'webp'] }],
  })
  if (!selected || typeof selected !== 'string') return null

  const ext = extOf(selected)
  if (!ext) throw new Error('Unsupported image type')

  const bytes = await readFile(selected)
  if (bytes.length > 5 * 1024 * 1024) throw new Error('Image must be 5 MB or smaller')

  const intent = await requestCoverUpload(storyId, ext)

  const blob = new Blob([bytes], { type: mimeOf(ext) })
  const { error } = await supabase.storage
    .from('covers')
    .uploadToSignedUrl(intent.path, intent.token, blob, {
      contentType: mimeOf(ext),
      upsert: true,
    })
  if (error) throw error

  // Bust caches downstream so the new cover renders immediately.
  return `${intent.public_url}?v=${Date.now()}`
}

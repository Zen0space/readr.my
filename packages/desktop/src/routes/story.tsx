import { useCallback, useEffect, useState } from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import { routeAtom } from '../atoms/route'
import {
  getStory,
  publishStory,
  updateStory,
  type Story,
} from '../api/stories'
import { createChapter, listChapters, type Chapter } from '../api/chapters'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { Field } from '../components/Field'
import { uploadCoverImage } from '../lib/cover-upload'

const statusVariant = (s: Story['status']): 'default' | 'success' | 'muted' => {
  if (s === 'ongoing') return 'default'
  if (s === 'completed') return 'success'
  return 'muted'
}

const chapterStatus = (c: Chapter): { label: string; variant: 'default' | 'success' | 'muted' } => {
  if (c.published_at) return { label: 'Published', variant: 'success' }
  return { label: 'Draft', variant: 'muted' }
}

type Props = { storyId: string }

export const StoryRoute = ({ storyId }: Props) => {
  const setRoute = useSetAtom(routeAtom)
  const route = useAtomValue(routeAtom)
  const [story, setStory] = useState<Story | null>(null)
  const [chapters, setChapters] = useState<Chapter[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [uploading, setUploading] = useState(false)

  const load = useCallback(async (): Promise<void> => {
    try {
      const [s, c] = await Promise.all([getStory(storyId), listChapters(storyId)])
      setStory(s)
      setChapters(c.items.sort((a, b) => a.ord - b.ord))
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    }
  }, [storyId])

  useEffect(() => {
    void load()
  }, [load])

  if (route.name !== 'story') return null

  if (!story) {
    return (
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <BackLink onClick={() => setRoute({ name: 'library' })} />
        {error ? (
          <p style={{ color: '#991b1b', fontSize: 13 }}>{error}</p>
        ) : (
          <p style={{ color: '#6b7280', fontSize: 13 }}>Loading…</p>
        )}
      </div>
    )
  }

  const publishStoryStatus = async (next: 'ongoing' | 'completed'): Promise<void> => {
    setPublishing(true)
    try {
      const updated = await publishStory(story.id, next)
      setStory(updated)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setPublishing(false)
    }
  }

  const onCover = async (): Promise<void> => {
    setUploading(true)
    try {
      const url = await uploadCoverImage(story.id)
      if (url) {
        const updated = await updateStory(story.id, { cover_url: url })
        setStory(updated)
      }
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ maxWidth: 880, margin: '0 auto' }}>
      <BackLink onClick={() => setRoute({ name: 'library' })} />

      <div
        style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          padding: 20,
          display: 'flex',
          gap: 20,
        }}
      >
        <CoverPreview url={story.cover_url} onPick={onCover} uploading={uploading} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Badge variant={statusVariant(story.status)}>{story.status}</Badge>
            <span style={{ fontSize: 12, color: '#6b7280' }}>
              {story.language.toUpperCase()} · {story.age_rating}
            </span>
          </div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>{story.title}</h1>
          {story.blurb ? (
            <p style={{ margin: 0, fontSize: 14, color: '#374151', lineHeight: 1.5 }}>{story.blurb}</p>
          ) : (
            <p style={{ margin: 0, fontSize: 13, color: '#9ca3af' }}>No blurb yet.</p>
          )}

          <div style={{ marginTop: 'auto', display: 'flex', gap: 8 }}>
            {story.status === 'draft' ? (
              <Button onClick={() => void publishStoryStatus('ongoing')} disabled={publishing}>
                {publishing ? 'Publishing…' : 'Publish story'}
              </Button>
            ) : story.status === 'ongoing' ? (
              <Button variant="ghost" onClick={() => void publishStoryStatus('completed')} disabled={publishing}>
                {publishing ? 'Working…' : 'Mark as completed'}
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', marginTop: 24, marginBottom: 12 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Chapters</h2>
        <div style={{ marginLeft: 'auto' }}>
          <Button onClick={() => setShowCreate((v) => !v)}>
            {showCreate ? 'Cancel' : 'New chapter'}
          </Button>
        </div>
      </div>

      {showCreate ? (
        <NewChapterForm
          storyId={story.id}
          nextOrd={(chapters?.length ?? 0) + 1}
          onCreated={(c) => {
            setShowCreate(false)
            setChapters((prev) => (prev ? [...prev, c].sort((a, b) => a.ord - b.ord) : [c]))
            setRoute({ name: 'chapter', storyId: story.id, chapterId: c.id })
          }}
        />
      ) : null}

      {error ? (
        <div
          style={{
            padding: 10,
            background: '#fef2f2',
            color: '#991b1b',
            borderRadius: 6,
            fontSize: 13,
            marginBottom: 8,
          }}
        >
          {error}
        </div>
      ) : null}

      {chapters && chapters.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {chapters.map((c) => {
            const s = chapterStatus(c)
            return (
              <button
                key={c.id}
                type="button"
                onClick={() =>
                  setRoute({ name: 'chapter', storyId: story.id, chapterId: c.id })
                }
                style={{
                  appearance: 'none',
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: 6,
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span style={{ fontSize: 12, color: '#9ca3af', width: 28 }}>#{c.ord}</span>
                <span style={{ fontSize: 14, color: '#111827', flex: 1 }}>{c.title}</span>
                <Badge variant="muted">{c.gating}</Badge>
                <Badge variant={s.variant}>{s.label}</Badge>
              </button>
            )
          })}
        </div>
      ) : chapters ? (
        <p style={{ fontSize: 13, color: '#6b7280' }}>No chapters yet.</p>
      ) : (
        <p style={{ fontSize: 13, color: '#6b7280' }}>Loading…</p>
      )}
    </div>
  )
}

const BackLink = ({ onClick }: { onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      appearance: 'none',
      background: 'transparent',
      border: 'none',
      color: '#6b7280',
      fontSize: 13,
      padding: 0,
      cursor: 'pointer',
      marginBottom: 12,
    }}
  >
    ← Back to library
  </button>
)

type CoverPreviewProps = { url: string | null; onPick: () => void; uploading: boolean }

const CoverPreview = ({ url, onPick, uploading }: CoverPreviewProps) => (
  <div style={{ width: 120, flexShrink: 0 }}>
    <div
      style={{
        width: 120,
        aspectRatio: '2/3',
        background: url ? `center/cover no-repeat url(${url})` : '#f3f4f6',
        border: '1px solid #e5e7eb',
        borderRadius: 6,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#9ca3af',
        fontSize: 11,
        marginBottom: 6,
      }}
    >
      {url ? null : 'No cover'}
    </div>
    <Button variant="ghost" onClick={onPick} disabled={uploading} style={{ width: '100%', height: 28, fontSize: 12 }}>
      {uploading ? 'Uploading…' : url ? 'Replace cover' : 'Add cover'}
    </Button>
  </div>
)

type NewChapterFormProps = {
  storyId: string
  nextOrd: number
  onCreated: (c: Chapter) => void
}

const NewChapterForm = ({ storyId, nextOrd, onCreated }: NewChapterFormProps) => {
  const [title, setTitle] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const c = await createChapter(storyId, { title: title.trim(), ord: nextOrd, gating: 'free' })
      onCreated(c)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form
      onSubmit={submit}
      style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        padding: 14,
        marginBottom: 12,
        display: 'flex',
        gap: 8,
        alignItems: 'flex-end',
      }}
    >
      <div style={{ flex: 1 }}>
        <Field
          label={`Chapter ${nextOrd} title`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={200}
        />
      </div>
      <Button type="submit" disabled={busy || title.trim().length === 0}>
        {busy ? 'Creating…' : 'Create draft'}
      </Button>
      {error ? <span style={{ color: '#991b1b', fontSize: 12 }}>{error}</span> : null}
    </form>
  )
}

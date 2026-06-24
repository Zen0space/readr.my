import { useCallback, useEffect, useState } from 'react'
import { useSetAtom } from 'jotai'
import { routeAtom } from '../atoms/route'
import {
  createStory,
  listMyStories,
  type CreateStoryInput,
  type Story,
  type StoryAgeRating,
  type StoryLanguage,
} from '../api/stories'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { Field } from '../components/Field'

const GENRES = [
  'romance',
  'fantasy',
  'thriller',
  'mystery',
  'sci-fi',
  'historical',
  'horror',
  'literary',
  'young-adult',
  'non-fiction',
] as const

const statusVariant = (status: Story['status']): 'default' | 'success' | 'muted' => {
  if (status === 'ongoing') return 'default'
  if (status === 'completed') return 'success'
  return 'muted'
}

export const LibraryRoute = () => {
  const [stories, setStories] = useState<Story[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const load = useCallback(async (): Promise<void> => {
    try {
      const res = await listMyStories()
      setStories(res.items)
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  if (creating) {
    return (
      <CreateStoryForm
        onCancel={() => setCreating(false)}
        onCreated={() => {
          setCreating(false)
          void load()
        }}
      />
    )
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>Your stories</h1>
        <div style={{ marginLeft: 'auto' }}>
          <Button onClick={() => setCreating(true)}>New story</Button>
        </div>
      </div>

      {error ? (
        <div
          style={{
            padding: 12,
            background: '#fef2f2',
            color: '#991b1b',
            borderRadius: 6,
            fontSize: 13,
            marginBottom: 12,
          }}
        >
          {error}
        </div>
      ) : null}

      {stories === null ? (
        <p style={{ color: '#6b7280', fontSize: 13 }}>Loading…</p>
      ) : stories.length === 0 ? (
        <div
          style={{
            border: '1px dashed #d1d5db',
            borderRadius: 8,
            padding: 40,
            textAlign: 'center',
            background: '#fff',
          }}
        >
          <p style={{ fontSize: 14, color: '#374151', margin: 0 }}>No stories yet.</p>
          <p style={{ fontSize: 13, color: '#6b7280', marginTop: 6 }}>
            Start your first story — title and a one-line blurb is all you need to begin.
          </p>
          <div style={{ marginTop: 16 }}>
            <Button onClick={() => setCreating(true)}>Create your first story</Button>
          </div>
        </div>
      ) : (
        <StoryGrid stories={stories} />
      )}
    </div>
  )
}

const StoryGrid = ({ stories }: { stories: Story[] }) => {
  const setRoute = useSetAtom(routeAtom)
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 14 }}>
      {stories.map((s) => (
        <button
          type="button"
          key={s.id}
          onClick={() => setRoute({ name: 'story', storyId: s.id })}
          style={{
            textAlign: 'left',
            appearance: 'none',
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            padding: 14,
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Badge variant={statusVariant(s.status)}>{s.status}</Badge>
            <span style={{ fontSize: 12, color: '#6b7280' }}>{s.language.toUpperCase()}</span>
          </div>
          <strong style={{ fontSize: 15 }}>{s.title}</strong>
          <span style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.4 }}>
            {s.blurb ?? 'No blurb yet.'}
          </span>
          <span style={{ fontSize: 11, color: '#9ca3af', marginTop: 'auto' }}>
            Updated {new Date(s.updated_at).toLocaleDateString()}
          </span>
        </button>
      ))}
    </div>
  )
}

type CreateFormProps = {
  onCancel: () => void
  onCreated: (story: Story) => void
}

const CreateStoryForm = ({ onCancel, onCreated }: CreateFormProps) => {
  const [title, setTitle] = useState('')
  const [blurb, setBlurb] = useState('')
  const [genre, setGenre] = useState<string>(GENRES[0])
  const [tagsInput, setTagsInput] = useState('')
  const [language, setLanguage] = useState<StoryLanguage>('en')
  const [ageRating, setAgeRating] = useState<StoryAgeRating>('general')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const input: CreateStoryInput = {
        title: title.trim(),
        blurb: blurb.trim() || undefined,
        genre,
        tags: tagsInput
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        language,
        age_rating: ageRating,
      }
      const created = await createStory(input)
      onCreated(created)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={submit}
      style={{
        maxWidth: 560,
        margin: '0 auto',
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <h1 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>New story</h1>

      <Field
        label="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        maxLength={200}
      />

      <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 12, color: '#6b7280' }}>Blurb</span>
        <textarea
          value={blurb}
          onChange={(e) => setBlurb(e.target.value)}
          maxLength={2000}
          rows={3}
          style={{
            padding: '8px 12px',
            border: '1px solid #e5e7eb',
            borderRadius: 6,
            fontSize: 14,
            fontFamily: 'inherit',
            resize: 'vertical',
          }}
        />
      </label>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 12, color: '#6b7280' }}>Genre</span>
        <select
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          style={{
            height: 36,
            padding: '0 10px',
            border: '1px solid #e5e7eb',
            borderRadius: 6,
            fontSize: 14,
            background: '#fff',
          }}
        >
          {GENRES.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </label>

      <Field
        label="Tags (comma-separated)"
        value={tagsInput}
        onChange={(e) => setTagsInput(e.target.value)}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 12, color: '#6b7280' }}>Language</span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as StoryLanguage)}
            style={selectStyle}
          >
            <option value="en">English</option>
            <option value="ms">Bahasa Melayu</option>
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 12, color: '#6b7280' }}>Age rating</span>
          <select
            value={ageRating}
            onChange={(e) => setAgeRating(e.target.value as StoryAgeRating)}
            style={selectStyle}
          >
            <option value="general">General</option>
            <option value="teen">Teen</option>
            <option value="mature">Mature</option>
          </select>
        </label>
      </div>

      {error ? (
        <div
          style={{
            padding: 10,
            background: '#fef2f2',
            color: '#991b1b',
            borderRadius: 6,
            fontSize: 13,
          }}
        >
          {error}
        </div>
      ) : null}

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting || title.trim().length === 0}>
          {submitting ? 'Creating…' : 'Create'}
        </Button>
      </div>
    </form>
  )
}

const selectStyle: React.CSSProperties = {
  height: 36,
  padding: '0 10px',
  border: '1px solid #e5e7eb',
  borderRadius: 6,
  fontSize: 14,
  background: '#fff',
}

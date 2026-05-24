import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSetAtom } from 'jotai'
import { routeAtom } from '../atoms/route'
import {
  getChapter,
  publishChapter,
  updateChapter,
  type Chapter,
  type ChapterGating,
} from '../api/chapters'
import {
  MarkdownEditor,
  SaveIndicator,
  useDebouncedAutosave,
} from '../components/MarkdownEditor'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'

type Props = { storyId: string; chapterId: string }

export const ChapterEditorRoute = ({ storyId, chapterId }: Props) => {
  const setRoute = useSetAtom(routeAtom)
  const [chapter, setChapter] = useState<Chapter | null>(null)
  const [content, setContent] = useState('')
  const [baseline, setBaseline] = useState('')
  const [title, setTitle] = useState('')
  const [gating, setGating] = useState<ChapterGating>('free')
  const [priceCoins, setPriceCoins] = useState<number>(0)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async (): Promise<void> => {
      try {
        const c = await getChapter(chapterId)
        if (cancelled) return
        setChapter(c)
        const md = c.content_md ?? ''
        setContent(md)
        setBaseline(md)
        setTitle(c.title)
        setGating(c.gating)
        setPriceCoins(c.price_coins)
      } catch (e) {
        if (!cancelled) setLoadError((e as Error).message)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [chapterId])

  const save = useCallback(
    async (next: string): Promise<void> => {
      await updateChapter(chapterId, { draft_content_md: next })
      setBaseline(next)
    },
    [chapterId],
  )

  const status = useDebouncedAutosave(content, baseline, save, 10_000)

  const isDraft = chapter?.published_at === null
  const metaDirty = useMemo(() => {
    if (!chapter) return false
    return (
      title !== chapter.title || gating !== chapter.gating || priceCoins !== chapter.price_coins
    )
  }, [chapter, title, gating, priceCoins])

  const saveMeta = async (): Promise<void> => {
    if (!chapter) return
    const updated = await updateChapter(chapterId, {
      title: title !== chapter.title ? title : undefined,
      gating: gating !== chapter.gating ? gating : undefined,
      price_coins: priceCoins !== chapter.price_coins ? priceCoins : undefined,
    })
    setChapter(updated)
  }

  const onPublish = async (): Promise<void> => {
    setPublishing(true)
    setPublishError(null)
    try {
      if (metaDirty) await saveMeta()
      // Flush any pending content edits before publishing.
      if (content !== baseline) {
        await save(content)
      }
      const updated = await publishChapter(chapterId)
      setChapter(updated)
    } catch (e) {
      setPublishError((e as Error).message)
    } finally {
      setPublishing(false)
    }
  }

  if (loadError) {
    return (
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <BackLink onClick={() => setRoute({ name: 'story', storyId })} />
        <p style={{ color: '#991b1b', fontSize: 13 }}>{loadError}</p>
      </div>
    )
  }

  if (!chapter) {
    return (
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <BackLink onClick={() => setRoute({ name: 'story', storyId })} />
        <p style={{ color: '#6b7280', fontSize: 13 }}>Loading…</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px - 48px)' }}>
      <BackLink onClick={() => setRoute({ name: 'story', storyId })} />

      <div
        style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          padding: 14,
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          marginBottom: 12,
          flexWrap: 'wrap',
        }}
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Chapter title"
          style={{
            flex: '1 1 240px',
            minWidth: 200,
            fontSize: 16,
            fontWeight: 600,
            border: '1px solid transparent',
            background: 'transparent',
            padding: 6,
            outline: 'none',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
          onBlur={(e) => (e.currentTarget.style.borderColor = 'transparent')}
        />

        <GatingPicker
          gating={gating}
          priceCoins={priceCoins}
          onGatingChange={setGating}
          onPriceChange={setPriceCoins}
        />

        {isDraft ? (
          <Badge variant="muted">Draft</Badge>
        ) : (
          <Badge variant="success">Published</Badge>
        )}

        <Button
          variant="ghost"
          onClick={() => void saveMeta()}
          disabled={!metaDirty}
          style={{ height: 32 }}
        >
          Save meta
        </Button>

        {isDraft ? (
          <Button onClick={() => void onPublish()} disabled={publishing} style={{ height: 32 }}>
            {publishing ? 'Publishing…' : 'Publish chapter'}
          </Button>
        ) : null}
      </div>

      {publishError ? (
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
          {publishError}
        </div>
      ) : null}

      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <MarkdownEditor initialValue={baseline} onChange={setContent} />
      </div>

      <div
        style={{
          marginTop: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 12,
          color: '#6b7280',
        }}
      >
        <SaveIndicator status={status} />
        <span>
          {content.length.toLocaleString()} chars · markdown
        </span>
      </div>
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
      alignSelf: 'flex-start',
    }}
  >
    ← Back to story
  </button>
)

type GatingPickerProps = {
  gating: ChapterGating
  priceCoins: number
  onGatingChange: (g: ChapterGating) => void
  onPriceChange: (n: number) => void
}

const GatingPicker = ({ gating, priceCoins, onGatingChange, onPriceChange }: GatingPickerProps) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
    <select
      value={gating}
      onChange={(e) => onGatingChange(e.target.value as ChapterGating)}
      style={{
        height: 32,
        padding: '0 8px',
        border: '1px solid #e5e7eb',
        borderRadius: 6,
        fontSize: 13,
        background: '#fff',
      }}
    >
      <option value="free">Free</option>
      <option value="coin">Coin-locked</option>
      <option value="sub">Subscription</option>
    </select>
    {gating === 'coin' ? (
      <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6b7280' }}>
        Price
        <input
          type="number"
          min={1}
          step={1}
          value={priceCoins}
          onChange={(e) => onPriceChange(Number(e.target.value))}
          style={{
            width: 72,
            height: 32,
            padding: '0 8px',
            border: '1px solid #e5e7eb',
            borderRadius: 6,
            fontSize: 13,
          }}
        />
        coins
      </label>
    ) : null}
  </div>
)

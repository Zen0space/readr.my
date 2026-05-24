import { useCallback, useEffect, useRef, useState } from 'react'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap, lineNumbers, highlightActiveLine } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { markdown } from '@codemirror/lang-markdown'

type Props = {
  initialValue: string
  onChange: (next: string) => void
  readOnly?: boolean
}

export const MarkdownEditor = ({ initialValue, onChange, readOnly = false }: Props) => {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const viewRef = useRef<EditorView | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    if (!hostRef.current) return
    const state = EditorState.create({
      doc: initialValue,
      extensions: [
        history(),
        lineNumbers(),
        highlightActiveLine(),
        markdown(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        EditorView.lineWrapping,
        EditorState.readOnly.of(readOnly),
        EditorView.updateListener.of((v) => {
          if (v.docChanged) onChangeRef.current(v.state.doc.toString())
        }),
        EditorView.theme({
          '&': { height: '100%', fontSize: '14px' },
          '.cm-content': { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', padding: '12px 0' },
          '.cm-scroller': { overflow: 'auto' },
          '.cm-gutters': { background: '#fafafa', border: 'none' },
        }),
      ],
    })
    const view = new EditorView({ state, parent: hostRef.current })
    viewRef.current = view
    return () => {
      view.destroy()
      viewRef.current = null
    }
  // We intentionally re-mount when initialValue or readOnly changes — chapter switching
  // resets the doc; this is fine for the desktop's single-chapter editor.
  }, [initialValue, readOnly])

  return (
    <div
      ref={hostRef}
      style={{
        flex: 1,
        minHeight: 0,
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        background: '#fff',
        overflow: 'hidden',
      }}
    />
  )
}

export type SaveStatus =
  | { state: 'idle' }
  | { state: 'dirty' }
  | { state: 'saving' }
  | { state: 'saved'; at: number }
  | { state: 'error'; message: string }

export const useDebouncedAutosave = (
  value: string,
  baseline: string,
  save: (next: string) => Promise<void>,
  delayMs = 10_000,
): SaveStatus => {
  const [status, setStatus] = useState<SaveStatus>({ state: 'idle' })
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inFlightRef = useRef(false)
  const latestValueRef = useRef(value)
  latestValueRef.current = value

  const flush = useCallback(async (): Promise<void> => {
    if (inFlightRef.current) return
    if (latestValueRef.current === baseline) return
    const snapshot = latestValueRef.current
    inFlightRef.current = true
    setStatus({ state: 'saving' })
    try {
      await save(snapshot)
      setStatus({ state: 'saved', at: Date.now() })
    } catch (e) {
      setStatus({ state: 'error', message: (e as Error).message })
    } finally {
      inFlightRef.current = false
    }
  }, [baseline, save])

  useEffect(() => {
    if (value === baseline) return
    setStatus({ state: 'dirty' })
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      void flush()
    }, delayMs)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [value, baseline, delayMs, flush])

  return status
}

type IndicatorProps = { status: SaveStatus }

export const SaveIndicator = ({ status }: IndicatorProps) => {
  const [, setTick] = useState(0)
  useEffect(() => {
    if (status.state !== 'saved') return
    const id = setInterval(() => setTick((t) => t + 1), 30_000)
    return () => clearInterval(id)
  }, [status])

  let label = ''
  let color = '#6b7280'
  if (status.state === 'idle') label = 'No changes'
  else if (status.state === 'dirty') label = 'Unsaved changes'
  else if (status.state === 'saving') label = 'Saving…'
  else if (status.state === 'saved') label = `Saved ${formatRelative(status.at)}`
  else if (status.state === 'error') {
    label = `Save failed: ${status.message}`
    color = '#991b1b'
  }

  return (
    <span
      title="Conflict policy: last-write-wins. Editing the same chapter on two devices will overwrite the older draft."
      style={{ fontSize: 12, color, cursor: 'help' }}
    >
      {label}
    </span>
  )
}

const formatRelative = (at: number): string => {
  const seconds = Math.max(0, Math.round((Date.now() - at) / 1000))
  if (seconds < 5) return 'just now'
  if (seconds < 60) return `${seconds}s ago`
  const mins = Math.round(seconds / 60)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  return `${hours}h ago`
}

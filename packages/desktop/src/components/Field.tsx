import { useState, type InputHTMLAttributes } from 'react'

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string
}

export const Field = ({ label, id, type, style, ...rest }: Props) => {
  const fieldId = id ?? `field-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
  const isPassword = type === 'password'
  const [revealed, setRevealed] = useState(false)
  const effectiveType = isPassword ? (revealed ? 'text' : 'password') : type

  return (
    <label htmlFor={fieldId} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 12, color: '#6b7280' }}>{label}</span>
      <div style={{ position: 'relative', display: 'flex' }}>
        <input
          id={fieldId}
          type={effectiveType}
          {...rest}
          style={{
            flex: 1,
            height: 36,
            padding: isPassword ? '0 40px 0 12px' : '0 12px',
            border: '1px solid #e5e7eb',
            borderRadius: 6,
            fontSize: 14,
            outline: 'none',
            ...style,
          }}
        />
        {isPassword ? (
          <button
            type="button"
            aria-label={revealed ? 'Hide password' : 'Show password'}
            onClick={() => setRevealed((v) => !v)}
            style={{
              position: 'absolute',
              right: 6,
              top: 0,
              bottom: 0,
              width: 30,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: '#6b7280',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
            }}
          >
            {revealed ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        ) : null}
      </div>
    </label>
  )
}

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-6.5 0-10-7-10-7a18.45 18.45 0 0 1 4.06-4.94" />
    <path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c6.5 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19" />
    <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
    <line x1="2" y1="2" x2="22" y2="22" />
  </svg>
)

import type { CSSProperties, ReactNode } from 'react'

type Props = {
  children: ReactNode
  variant?: 'default' | 'success' | 'warning' | 'muted'
  style?: CSSProperties
}

const palette = {
  default: { bg: '#eef2ff', fg: '#3730a3' },
  success: { bg: '#dcfce7', fg: '#166534' },
  warning: { bg: '#fef3c7', fg: '#92400e' },
  muted: { bg: '#f3f4f6', fg: '#6b7280' },
} as const

export const Badge = ({ children, variant = 'default', style }: Props) => {
  const c = palette[variant]
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontSize: 11,
        fontWeight: 600,
        padding: '2px 8px',
        borderRadius: 9999,
        background: c.bg,
        color: c.fg,
        textTransform: 'uppercase',
        letterSpacing: 0.3,
        ...style,
      }}
    >
      {children}
    </span>
  )
}

import type { InputHTMLAttributes } from 'react'

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string
}

export const Field = ({ label, id, style, ...rest }: Props) => {
  const fieldId = id ?? `field-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
  return (
    <label htmlFor={fieldId} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 12, color: '#6b7280' }}>{label}</span>
      <input
        id={fieldId}
        {...rest}
        style={{
          height: 36,
          padding: '0 12px',
          border: '1px solid #e5e7eb',
          borderRadius: 6,
          fontSize: 14,
          outline: 'none',
          ...style,
        }}
      />
    </label>
  )
}

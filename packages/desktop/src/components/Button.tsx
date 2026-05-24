import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  variant?: 'primary' | 'ghost'
}

export const Button = ({ children, variant = 'primary', style, ...rest }: Props) => {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 36,
    padding: '0 16px',
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 500,
    cursor: rest.disabled ? 'not-allowed' : 'pointer',
    opacity: rest.disabled ? 0.6 : 1,
    border: '1px solid transparent',
    transition: 'opacity 120ms',
  } as const

  const variantStyle =
    variant === 'primary'
      ? { background: '#111827', color: '#fff' }
      : { background: 'transparent', color: '#111827', borderColor: '#e5e7eb' }

  return (
    <button {...rest} style={{ ...base, ...variantStyle, ...style }}>
      {children}
    </button>
  )
}

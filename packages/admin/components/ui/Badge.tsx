import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: Tone;
  size?: 'sm' | 'md';
};

const toneClass: Record<Tone, string> = {
  neutral: 'bg-surface-container text-on-surface-variant',
  primary: 'bg-primary-container/20 text-primary',
  success: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  warning: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  danger: 'bg-error/15 text-error',
};

const sizeClass: Record<NonNullable<BadgeProps['size']>, string> = {
  sm: 'h-5 px-2 text-[10px]',
  md: 'h-6 px-2.5 text-xs',
};

export const Badge = ({
  tone = 'neutral',
  size = 'md',
  className,
  children,
  ...rest
}: BadgeProps): React.ReactElement => (
  <span
    className={cn(
      'inline-flex items-center gap-1 rounded-full font-display font-semibold uppercase tracking-wider',
      toneClass[tone],
      sizeClass[size],
      className,
    )}
    {...rest}
  >
    {children}
  </span>
);

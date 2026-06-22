import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type AvatarProps = HTMLAttributes<HTMLDivElement> & {
  src?: string | null;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fallback?: string;
};

const sizeClass: Record<NonNullable<AvatarProps['size']>, string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
  xl: 'h-20 w-20 text-xl',
};

const initials = (text: string): string => {
  const trimmed = text.trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) {
    const first = parts[0] ?? '';
    return first.slice(0, 2).toUpperCase();
  }
  const a = parts[0]?.[0] ?? '';
  const b = parts[parts.length - 1]?.[0] ?? '';
  return `${a}${b}`.toUpperCase();
};

export const Avatar = ({
  src,
  alt,
  size = 'md',
  fallback,
  className,
  ...rest
}: AvatarProps): React.ReactElement => {
  return (
    <div
      role="img"
      aria-label={alt}
      className={cn(
        'inline-flex items-center justify-center overflow-hidden rounded-full bg-primary-container/20 font-display font-semibold text-primary',
        sizeClass[size],
        className,
      )}
      {...rest}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <span aria-hidden="true">{initials(fallback ?? alt)}</span>
      )}
    </div>
  );
};

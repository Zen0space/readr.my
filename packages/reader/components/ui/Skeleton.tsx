import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
  rounded?: 'sm' | 'md' | 'lg' | 'full';
};

const roundedClass = {
  sm: 'rounded',
  md: 'rounded-xl',
  lg: 'rounded-2xl',
  full: 'rounded-full',
} as const;

export const Skeleton = ({ className, rounded = 'md', ...rest }: SkeletonProps): React.ReactElement => (
  <div
    aria-hidden="true"
    className={cn(
      'animate-pulse bg-gradient-to-r from-surface-container via-surface-container-high to-surface-container bg-[length:200%_100%]',
      roundedClass[rounded],
      className,
    )}
    {...rest}
  />
);

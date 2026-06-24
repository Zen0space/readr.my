import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/cn';

type CardProps = HTMLAttributes<HTMLDivElement> & {
  elevated?: boolean;
  glass?: boolean;
};

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, elevated, glass, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        'rounded-2xl border border-outline-variant/40 bg-surface-container-lowest',
        elevated && 'shadow-card-elevated',
        !elevated && 'shadow-card',
        glass && 'glass',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
});

export const CardHeader = ({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('p-6 pb-4', className)} {...rest}>
    {children}
  </div>
);

export const CardTitle = ({ className, children, ...rest }: HTMLAttributes<HTMLHeadingElement>) => (
  <h3
    className={cn('font-display text-lg font-semibold text-on-surface', className)}
    {...rest}
  >
    {children}
  </h3>
);

export const CardDescription = ({ className, children, ...rest }: HTMLAttributes<HTMLParagraphElement>) => (
  <p
    className={cn('mt-1 text-sm text-on-surface-variant', className)}
    {...rest}
  >
    {children}
  </p>
);

export const CardBody = ({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('p-6 pt-0', className)} {...rest}>
    {children}
  </div>
);

export const CardFooter = ({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex items-center justify-end gap-2 border-t border-outline-variant/30 p-4', className)}
    {...rest}
  >
    {children}
  </div>
);

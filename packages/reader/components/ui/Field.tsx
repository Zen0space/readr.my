import {
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
  forwardRef,
  useId,
} from 'react';
import { cn } from '@/lib/cn';

type FieldWrapperProps = {
  label: string;
  hint?: string;
  error?: string;
  id: string;
  required?: boolean;
  children: ReactNode;
};

const FieldWrapper = ({ label, hint, error, id, required, children }: FieldWrapperProps) => (
  <div className="flex flex-col gap-1.5">
    <label
      htmlFor={id}
      className="font-display text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
    >
      {label}
      {required ? <span className="ml-1 text-error">*</span> : null}
    </label>
    {children}
    {hint && !error ? (
      <p className="text-xs text-on-surface-variant">{hint}</p>
    ) : null}
    {error ? (
      <p className="text-xs font-medium text-error" role="alert">
        {error}
      </p>
    ) : null}
  </div>
);

const baseInputClass =
  'h-11 w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-4 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, id, required, className, ...rest },
  ref,
) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  return (
    <FieldWrapper label={label} hint={hint} error={error} id={fieldId} required={required}>
      <input
        ref={ref}
        id={fieldId}
        required={required}
        aria-invalid={error ? 'true' : 'false'}
        className={cn(baseInputClass, error && 'border-error focus:border-error focus:ring-error/20', className)}
        {...rest}
      />
    </FieldWrapper>
  );
});

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hint?: string;
  error?: string;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, id, required, className, rows = 4, ...rest },
  ref,
) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  return (
    <FieldWrapper label={label} hint={hint} error={error} id={fieldId} required={required}>
      <textarea
        ref={ref}
        id={fieldId}
        rows={rows}
        required={required}
        aria-invalid={error ? 'true' : 'false'}
        className={cn(
          baseInputClass,
          'h-auto min-h-[6rem] py-3 resize-y',
          error && 'border-error focus:border-error focus:ring-error/20',
          className,
        )}
        {...rest}
      />
    </FieldWrapper>
  );
});

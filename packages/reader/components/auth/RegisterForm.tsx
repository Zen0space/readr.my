'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useState, type FormEvent } from 'react';
import { z } from 'zod';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { Button, Icon, Input, Label } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useApiCall } from '@/lib/session';
import { authApi } from '@/lib/api';

const RegisterClientSchema = z
  .object({
    email: z.string().email('Enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

/**
 * Derive a backend-compatible username from the email's local part.
 * Strips characters the username schema rejects and pads short ones
 * with a random suffix so the server contract (3-30 chars, safe set)
 * is always satisfied even when the email starts with a number or
 * is unusually short.
 */
const deriveUsername = (email: string): string => {
  const local = email.split('@')[0] ?? 'reader';
  const sanitized = local
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '')
    .slice(0, 24);
  if (sanitized.length >= 3) return sanitized;
  return `reader-${Math.random().toString(36).slice(2, 8)}`;
};

type RegisterFormProps = {
  initialError?: string;
};

export const RegisterForm = ({
  initialError,
}: RegisterFormProps): React.ReactElement => {
  const router = useRouter();
  const callRegister = useApiCall(authApi.register);
  const emailId = useId();
  const passwordId = useId();
  const confirmPasswordId = useId();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Live "do the two password fields match?" check. Runs as the user
  // types in either field, so they get instant feedback instead of
  // waiting for a submit. Empty confirm field → no error.
  const [confirmMismatch, setConfirmMismatch] = useState(false);
  useEffect(() => {
    if (!confirmPassword) {
      setConfirmMismatch(false);
      return;
    }
    setConfirmMismatch(password !== confirmPassword);
  }, [password, confirmPassword]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    if (!agreedToTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy.');
      return;
    }

    const parsed = RegisterClientSchema.safeParse({
      email,
      password,
      confirmPassword,
    });
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        email: flat.email?.[0],
        password: flat.password?.[0],
        confirmPassword: flat.confirmPassword?.[0],
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // The backend still requires `username` + `role` in the payload.
      // Username is derived from the email; role is hardcoded to
      // `reader` — authors sign up on a different domain.
      // `confirmPassword` is client-only — it's validated above and
      // stripped from the payload before it leaves the browser.
      const { confirmPassword: _confirm, ...payload } = parsed.data;
      const result = await callRegister({
        ...payload,
        username: deriveUsername(parsed.data.email),
        role: 'reader',
      });
      if (result === null) {
        return;
      }
      setIsSuccess(true);
      setTimeout(() => {
        router.push(`/login?registered=${encodeURIComponent(email)}`);
        router.refresh();
      }, 1200);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="gradient-ring rounded-2xl">
        <div className="surface-elevated relative overflow-hidden rounded-2xl">
          <div
            aria-hidden="true"
            className="h-1.5 bg-gradient-to-r from-primary via-secondary to-tertiary"
          />

          <div className="p-7 sm:p-8">
            <header className="mb-5 text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                <Icon name="user-plus" size={12} strokeWidth={2.5} />
                Join Auror
              </span>
            </header>

            {error ? (
              <div
                role="alert"
                className="mb-6 flex items-start gap-3 rounded-xl border border-error/30 bg-error/5 p-4 text-sm text-error"
              >
                <Icon name="alert-circle" size={18} className="mt-0.5 shrink-0" />
                <span className="leading-relaxed">{error}</span>
              </div>
            ) : null}

            {isSuccess ? (
              <div
                role="status"
                className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-300/40 bg-emerald-50 p-4 text-sm text-emerald-700"
              >
                <Icon
                  name="check-circle"
                  size={18}
                  className="mt-0.5 shrink-0"
                />
                <span className="leading-relaxed">
                  Account created! Redirecting to sign in…
                </span>
              </div>
            ) : null}

            <form onSubmit={onSubmit} className="space-y-4" noValidate>
              <div>
                <Label
                  htmlFor={emailId}
                  className="font-display text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
                >
                  Email
                  <span className="ml-1 text-error">*</span>
                </Label>
                <div className="relative mt-1.5">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant">
                    <Icon name="mail" size={18} />
                  </span>
                  <Input
                    id={emailId}
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="name@example.com"
                    className="auth-input"
                    value={email}
                    onChange={(e) => setEmail(e.currentTarget.value)}
                  />
                </div>
                {fieldErrors.email ? (
                  <p
                    className="mt-1 text-xs font-medium text-error"
                    role="alert"
                  >
                    {fieldErrors.email}
                  </p>
                ) : null}
              </div>

              <div>
                <Label
                  htmlFor={passwordId}
                  className="font-display text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
                >
                  Password
                  <span className="ml-1 text-error">*</span>
                </Label>
                <div className="relative mt-1.5">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant">
                    <Icon name="lock" size={18} />
                  </span>
                  <Input
                    id={passwordId}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    placeholder="At least 8 characters"
                    minLength={8}
                    className="auth-input pr-11"
                    value={password}
                    onChange={(e) => setPassword(e.currentTarget.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
                {fieldErrors.password ? (
                  <p
                    className="mt-1 text-xs font-medium text-error"
                    role="alert"
                  >
                    {fieldErrors.password}
                  </p>
                ) : null}
              </div>

              <div>
                <Label
                  htmlFor={confirmPasswordId}
                  className="font-display text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
                >
                  Confirm password
                  <span className="ml-1 text-error">*</span>
                </Label>
                <div className="relative mt-1.5">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant">
                    <Icon name="lock" size={18} />
                  </span>
                  <Input
                    id={confirmPasswordId}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    placeholder="Re-enter your password"
                    aria-invalid={confirmMismatch ? 'true' : 'false'}
                    className={cn(
                      'auth-input pr-11',
                      confirmMismatch &&
                        'border-error focus-visible:border-error focus-visible:ring-error/20',
                    )}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.currentTarget.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
                {confirmMismatch ? (
                  <p
                    className="mt-1 text-xs font-medium text-error"
                    role="alert"
                  >
                    Passwords do not match
                  </p>
                ) : null}
              </div>

              <label className="flex cursor-pointer select-none items-start gap-2.5 text-sm text-on-surface-variant">
                <span className="relative mt-0.5 inline-flex shrink-0">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.currentTarget.checked)}
                    className="peer h-4 w-4 cursor-pointer appearance-none rounded-md border border-outline-variant/60 bg-surface-container-lowest transition-colors checked:border-primary checked:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  />
                  <Icon
                    name="check"
                    size={11}
                    strokeWidth={3}
                    className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-on-primary opacity-0 transition-opacity peer-checked:opacity-100"
                  />
                </span>
                <span>
                  I agree to the{' '}
                  <Link
                    href="/terms"
                    className="font-semibold text-primary hover:underline"
                  >
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link
                    href="/privacy"
                    className="font-semibold text-primary hover:underline"
                  >
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>

              <Button
                type="submit"
                variant="default"
                size="lg"
                className="group w-full gap-2 bg-gradient-to-r from-primary to-secondary text-on-primary shadow-primary-glow hover:from-primary/90 hover:to-secondary/90"
                disabled={isSubmitting || isSuccess}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Creating account…
                  </>
                ) : (
                  <>
                    Create account
                    <Icon
                      name="arrow-right"
                      size={18}
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </>
                )}
              </Button>
            </form>

            <div className="my-5 flex items-center gap-3" aria-hidden="true">
              <span className="h-px flex-1 bg-gradient-to-r from-transparent via-outline-variant/60 to-transparent" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-on-surface-variant">
                or continue with
              </span>
              <span className="h-px flex-1 bg-gradient-to-r from-transparent via-outline-variant/60 to-transparent" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-11 border-outline-variant/50 bg-surface-container-lowest/60 transition-all hover:border-primary/40 hover:bg-primary/5"
                disabled
                title="Google sign-up coming soon"
                aria-label="Continue with Google (coming soon)"
              >
                <GoogleGlyph />
                Google
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11 border-outline-variant/50 bg-surface-container-lowest/60 transition-all hover:border-primary/40 hover:bg-primary/5"
                disabled
                title="GitHub sign-up coming soon"
                aria-label="Continue with GitHub (coming soon)"
              >
                <GithubGlyph />
                GitHub
              </Button>
            </div>

            <div className="mt-5 flex items-center justify-center gap-1.5 text-[11px] font-medium text-on-surface-variant/80">
              <Icon name="shield" size={12} className="text-primary/70" />
              Secured with end-to-end encryption
            </div>
          </div>

          <div className="border-t border-outline-variant/30 bg-surface-container-low/40 px-7 py-4 text-center sm:px-8">
            <p className="text-sm text-on-surface-variant">
              Already have an account?{' '}
              <Link
                href="/login"
                className="ml-1 font-semibold text-primary transition-colors hover:text-secondary hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const GoogleGlyph = (): React.ReactElement => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
    <path
      fill="#4285F4"
      d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4c-.2 1.3-.9 2.4-2 3.1v2.6h3.2c1.9-1.7 3-4.3 3-7.5z"
    />
    <path
      fill="#34A853"
      d="M12 22c2.7 0 5-1 6.6-2.5l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6C4.7 19.6 8.1 22 12 22z"
    />
    <path
      fill="#FBBC05"
      d="M6.4 13.9c-.2-.6-.3-1.2-.3-1.9s.1-1.3.3-1.9V7.5H3.1A10 10 0 0 0 2 12c0 1.6.4 3.1 1.1 4.5l3.3-2.6z"
    />
    <path
      fill="#EA4335"
      d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.8-2.8C17 3 14.7 2 12 2 8.1 2 4.7 4.4 3.1 7.5l3.3 2.6c.8-2.3 3-4.2 5.6-4.2z"
    />
  </svg>
);

const GithubGlyph = (): React.ReactElement => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
    <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.9 1.2 1.9 1.2 1.1 1.9 2.9 1.4 3.6 1 .1-.8.4-1.4.8-1.7-2.7-.3-5.5-1.3-5.5-6 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.7-2.8 5.7-5.5 6 .4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3" />
  </svg>
);

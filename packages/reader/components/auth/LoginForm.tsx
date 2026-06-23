'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Button, Icon, Input } from '@/components/ui';
import { useApiCall, useSetSession } from '@/lib/session';
import { authApi } from '@/lib/api';

const SAFE_REDIRECT = /^\/[a-zA-Z0-9_\-/]*$/;

const resolveRedirect = (raw: string | null): string => {
  if (!raw) return '/';
  const decoded = decodeURIComponent(raw);
  if (SAFE_REDIRECT.test(decoded)) return decoded;
  return '/';
};

type LoginFormProps = {
  initialError?: string;
  redirectTo?: string;
};

export const LoginForm = ({ initialError, redirectTo }: LoginFormProps): React.ReactElement => {
  const router = useRouter();
  const setSession = useSetSession();
  const callLogin = useApiCall(authApi.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const target = resolveRedirect(redirectTo ?? null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await callLogin({ email, password });
      if (result === null) {
        return;
      }
      setSession({ status: 'authenticated', user: result.user });
      router.push(target);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid credentials. Please try again.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative w-full max-w-md">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1.5 rounded-t-2xl bg-gradient-to-r from-primary to-secondary"
      />
      <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest/70 p-8 shadow-card-elevated backdrop-blur-xl">
        <div className="mb-8 text-center">
          <h1 className="bg-gradient-to-r from-primary to-secondary bg-clip-text font-display text-4xl font-bold text-transparent">
            Auror
          </h1>
          <p className="mt-2 font-display text-sm font-medium tracking-wide text-on-surface-variant">
            Enter the Realm of Deep Flow
          </p>
        </div>

        {error ? (
          <div
            role="alert"
            className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-error"
          >
            <Icon name="error" size={20} />
            <span>{error}</span>
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="space-y-6" noValidate>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant">
              <Icon name="mail" size={20} />
            </span>
            <Input
              type="email"
              name="email"
              label="Email Address"
              required
              autoComplete="email"
              placeholder="name@example.com"
              className="pl-11"
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
            />
          </div>

          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant">
              <Icon name="lock" size={20} />
            </span>
            <Input
              type={showPassword ? 'text' : 'password'}
              name="password"
              label="Password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="pl-11 pr-12"
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-9 text-on-surface-variant hover:text-on-surface"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isSubmitting}
            disabled={isSubmitting || !email || !password}
          >
            <span>Sign In</span>
            <Icon name="login" size={18} />
          </Button>
        </form>

        <div className="mt-8 border-t border-outline-variant/20 pt-6 text-center">
          <p className="text-xs font-medium text-on-surface-variant">
            New to Auror?{' '}
            <Link href="/register" className="ml-1 font-semibold text-primary hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

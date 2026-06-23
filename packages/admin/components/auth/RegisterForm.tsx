'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { z } from 'zod';
import { Button, Icon, Input } from '@/components/ui';
import { useApiCall } from '@/lib/session';
import { authApi } from '@/lib/api';

const RegisterClientSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(30),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['reader', 'author']),
});

const roleOptions: { value: 'reader' | 'author'; label: string; description: string }[] = [
  { value: 'reader', label: 'Reader', description: 'Browse & unlock stories' },
  { value: 'author', label: 'Author', description: 'Publish stories & earn' },
];

type RegisterFormProps = {
  initialError?: string;
};

export const RegisterForm = ({ initialError }: RegisterFormProps): React.ReactElement => {
  const router = useRouter();
  const callRegister = useApiCall(authApi.register);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'reader' | 'author'>('reader');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [fieldErrors, setFieldErrors] = useState<{
    username?: string;
    email?: string;
    password?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    const parsed = RegisterClientSchema.safeParse({ username, email, password, role });
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        username: flat.username?.[0],
        email: flat.email?.[0],
        password: flat.password?.[0],
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await callRegister(parsed.data);
      if (result === null) {
        return;
      }
      setIsSuccess(true);
      setTimeout(() => {
        router.push(`/login?registered=${encodeURIComponent(email)}`);
        router.refresh();
      }, 1200);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed. Please try again.';
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
            Join the Realm of Deep Flow
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

        {isSuccess ? (
          <div
            role="status"
            className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
          >
            <Icon name="check-circle" size={20} />
            <span>Account created! Redirecting to sign in…</span>
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-9 -translate-y-1/2 text-on-surface-variant">
              <Icon name="person" size={20} />
            </span>
            <Input
              type="text"
              name="username"
              label="Username"
              required
              autoComplete="username"
              placeholder="johndoe"
              minLength={3}
              maxLength={30}
              className="pl-11"
              value={username}
              onChange={(e) => setUsername(e.currentTarget.value)}
              error={fieldErrors.username}
            />
          </div>

          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-9 -translate-y-1/2 text-on-surface-variant">
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
              error={fieldErrors.email}
            />
          </div>

          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-9 -translate-y-1/2 text-on-surface-variant">
              <Icon name="lock" size={20} />
            </span>
            <Input
              type={showPassword ? 'text' : 'password'}
              name="password"
              label="Password"
              required
              autoComplete="new-password"
              placeholder="••••••••"
              minLength={8}
              className="pl-11 pr-12"
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
              error={fieldErrors.password}
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

          <fieldset>
            <legend className="mb-2 block font-display text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              I want to be a
            </legend>
            <div className="grid grid-cols-2 gap-2">
              {roleOptions.map((option) => {
                const selected = role === option.value;
                return (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer flex-col gap-1 rounded-xl border p-3 transition-all ${
                      selected
                        ? 'border-primary bg-primary/5 shadow-primary-glow'
                        : 'border-outline-variant/40 hover:border-primary/40'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="role"
                        value={option.value}
                        checked={selected}
                        onChange={() => setRole(option.value)}
                        className="sr-only"
                      />
                      <Icon name="badge" size={18} />
                      <span className="font-display text-sm font-semibold text-on-surface">
                        {option.label}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant">{option.description}</p>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isSubmitting}
            disabled={isSubmitting || isSuccess}
          >
            <span>Create Account</span>
            <Icon name="person-add" size={18} />
          </Button>
        </form>

        <div className="mt-8 border-t border-outline-variant/20 pt-6 text-center">
          <p className="text-xs font-medium text-on-surface-variant">
            Already have an account?{' '}
            <Link href="/login" className="ml-1 font-semibold text-primary hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

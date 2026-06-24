import { cookies } from 'next/headers';
import { createServerClient as createSsrServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { NextResponse } from 'next/server';

type CookieWriter = {
  set(name: string, value: string, options?: CookieOptions): void;
};

const url = (): string => process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const anonKey = (): string => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const serviceKey = (): string => process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const isConfigured = (): boolean => url().length > 0 && anonKey().length > 0;

class SupabaseNotConfiguredError extends Error {
  constructor() {
    super('Supabase env vars are not configured');
    this.name = 'SupabaseNotConfiguredError';
  }
}

/**
 * Cookie options applied to every cookie set by Supabase SSR. The `Domain=.auror.my`
 * is what makes the single-login-across-subdomains trick work — the cookie set by
 * reader.auror.my's login is visible to author.auror.my and admin.auror.my.
 *
 * `NEXT_PUBLIC_COOKIE_DOMAIN` overrides the default; set it to e.g. `localhost`
 * (no leading dot) for local dev to avoid browsers rejecting unknown domains.
 */
const apexCookieOptions = (): Partial<CookieOptions> => {
  const isProd = process.env.NODE_ENV === 'production'
  if (!isProd) return { secure: false }
  const domain = process.env.NEXT_PUBLIC_COOKIE_DOMAIN ?? '.auror.my'
  return {
    domain,
    secure: true,
    sameSite: 'lax',
    httpOnly: true,
    path: '/',
  }
}

const buildServerClient = async (writer: CookieWriter): Promise<SupabaseClient> => {
  if (!isConfigured()) {
    throw new SupabaseNotConfiguredError();
  }
  const cookieOpts = apexCookieOptions()
  return createSsrServerClient(url(), anonKey(), {
    cookies: {
      getAll: async () => {
        const store = await cookies();
        return store.getAll().map(({ name, value }) => ({ name, value }));
      },
      setAll: (toSet: { name: string; value: string; options?: CookieOptions }[]) => {
        for (const { name, value } of toSet) {
          // Strip any explicit domain set by Supabase — we control it via apexCookieOptions.
          writer.set(name, value, { ...cookieOpts });
        }
      },
    },
  });
};

export const createServerClient = async (...args: [] | [NextResponse]): Promise<SupabaseClient> => {
  if (args.length === 0) {
    return buildServerClient({
      set: async (name, value, options) => {
        const store = await cookies();
        store.set({ name, value, ...options });
      },
    });
  }
  const [response] = args;
  return buildServerClient({
    set: (name, value, options) => {
      response.cookies.set({ name, value, ...options });
    },
  });
};

export const createAdminClient = (): SupabaseClient => {
  if (!isConfigured() || serviceKey().length === 0) {
    throw new SupabaseNotConfiguredError();
  }
  return createClient(url(), serviceKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
};

export const isSupabaseConfigured = isConfigured;
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

const buildServerClient = (writer: CookieWriter): SupabaseClient => {
  if (!isConfigured()) {
    throw new SupabaseNotConfiguredError();
  }
  return createSsrServerClient(url(), anonKey(), {
    cookies: {
      getAll: () => {
        const store = cookies();
        return store.getAll().map(({ name, value }) => ({ name, value }));
      },
      setAll: (toSet: { name: string; value: string; options?: CookieOptions }[]) => {
        for (const { name, value, options } of toSet) {
          writer.set(name, value, options);
        }
      },
    },
  });
};

export const createServerClient = (...args: [] | [NextResponse]): SupabaseClient => {
  if (args.length === 0) {
    return buildServerClient({
      set: (name, value, options) => {
        const store = cookies();
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

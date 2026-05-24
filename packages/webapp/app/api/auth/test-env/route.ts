import { NextResponse } from 'next/server';

export async function GET() {
  const envVars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT_SET',
    SUPABASE_URL_FROM_ENV: process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT_SET',
    NODE_ENV: process.env.NODE_ENV || 'NOT_SET',
    keys: Object.keys(process.env).filter(k => k.includes('SUPABASE') || k.includes('NEXT_PUBLIC'))
  };
  return NextResponse.json(envVars);
}

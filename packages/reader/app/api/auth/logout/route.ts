import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, copyCookies } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const cookieResponse = NextResponse.next();
    const supabase = await createServerClient(req, cookieResponse);
    const { error } = await supabase.auth.signOut();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const finalResponse = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

    copyCookies(cookieResponse, finalResponse);
    return finalResponse;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const response = NextResponse.next();
    const supabase = await createServerClient(response);
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    const finalResponse = NextResponse.json({ success: true, message: 'Logged out successfully' });

    // Copy the cookies updated by Supabase SSR in the response to the final response
    response.cookies.getAll().forEach((cookie) => {
      finalResponse.cookies.set(cookie.name, cookie.value, {
        path: cookie.path || '/',
        domain: cookie.domain,
        expires: cookie.expires,
        maxAge: cookie.maxAge,
        secure: cookie.secure ?? process.env.NODE_ENV === 'production',
        httpOnly: cookie.httpOnly ?? true,
        sameSite: cookie.sameSite ?? 'lax'
      });
    });

    return finalResponse;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

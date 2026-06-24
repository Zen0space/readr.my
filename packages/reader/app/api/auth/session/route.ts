import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, copyCookies } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const cookieResponse = NextResponse.next();
    const supabase = await createServerClient(req, cookieResponse);
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      const finalResponse = NextResponse.json({ authenticated: false }, { status: 401 });
      copyCookies(cookieResponse, finalResponse);
      return finalResponse;
    }

    // Fetch profile details
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, username, avatar_url')
      .eq('id', user.id)
      .single();

    const body = profileError
      ? {
          authenticated: true,
          user: {
            id: user.id,
            email: user.email,
            role: 'reader',
            username: user.email?.split('@')[0] || '',
          },
        }
      : {
          authenticated: true,
          user: {
            id: user.id,
            email: user.email,
            username: profile.username,
            role: profile.role,
            avatar_url: profile.avatar_url ?? null,
          },
        };

    const finalResponse = NextResponse.json(body);
    copyCookies(cookieResponse, finalResponse);
    return finalResponse;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

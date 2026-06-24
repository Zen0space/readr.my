import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, copyCookies } from '@/lib/supabase';
import { LoginSchema } from '@auror/shared/domain';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = LoginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation error', details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, password } = result.data;

    // Build the response that will carry the Supabase session cookie
    // first, then hand it to the Supabase client. We copy the cookies
    // onto a separate body response after the profile fetch since we
    // need the user shape before we can build the body.
    const cookieResponse = NextResponse.next();
    const supabase = await createServerClient(req, cookieResponse);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    // Fetch profile details
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, username, avatar_url')
      .eq('id', data.user.id)
      .single();

    const finalResponse = NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        username: profile?.username || '',
        role: profile?.role || 'reader',
        avatar_url: profile?.avatar_url ?? null,
      },
    });

    copyCookies(cookieResponse, finalResponse);
    return finalResponse;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

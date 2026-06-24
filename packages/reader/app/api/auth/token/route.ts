import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, copyCookies } from '@/lib/supabase';

/**
 * BFF endpoint that returns the current Supabase access token to the
 * client. The client can't read the httpOnly session cookie directly,
 * so it round-trips through here to get a bearer token it can attach
 * to outbound calls to the Fastify backend.
 *
 * Side-effect: if the session is near expiry, `getSession()` refreshes
 * it (the adapter writes the new tokens onto `cookieResponse`), and we
 * forward those Set-Cookie headers on the response so the browser's
 * cookie stays in sync.
 */
export async function GET(req: NextRequest) {
  try {
    const cookieResponse = NextResponse.next();
    const supabase = await createServerClient(req, cookieResponse);

    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
      const finalResponse = NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 },
      );
      copyCookies(cookieResponse, finalResponse);
      return finalResponse;
    }

    const finalResponse = NextResponse.json({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at,
      token_type: 'bearer',
    });
    copyCookies(cookieResponse, finalResponse);
    return finalResponse;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

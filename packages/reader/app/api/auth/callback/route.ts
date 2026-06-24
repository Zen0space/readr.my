import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, copyCookies } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // if "next" is in param, use it as the redirect path, else default to '/'
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const cookieResponse = NextResponse.redirect(`${origin}${next}`);
    const supabase = await createServerClient(request, cookieResponse);
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Fetch user profile to redirect to correct dashboard
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        const role = profile?.role || 'reader';

        let redirectUrl = `${origin}/`;
        if (role === 'admin') {
          redirectUrl = `${origin}/admin`;
        } else if (role === 'author') {
          redirectUrl = `${origin}/author/studio`;
        }

        const finalResponse = NextResponse.redirect(redirectUrl);
        copyCookies(cookieResponse, finalResponse);
        return finalResponse;
      }
      return cookieResponse;
    }
    // Redirect to login with error reason
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=No+authorization+code+provided`);
}

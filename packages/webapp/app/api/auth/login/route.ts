import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { LoginSchema } from '@/lib/schemas';

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
    const response = NextResponse.next();
    const supabase = await createServerClient(response);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
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
        avatar_url: profile?.avatar_url || ''
      }
    });

    // Copy the cookies set by Supabase SSR in the response to the final response
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

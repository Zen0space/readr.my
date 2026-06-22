import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { RegisterSchema } from '@/lib/schemas';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = RegisterSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation error', details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    
    const { email, password, username, role, avatarUrl } = result.data;
    const response = NextResponse.next();
    const supabase = await createServerClient(response);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          role,
          avatar_url: avatarUrl || ''
        }
      }
    });
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    const finalResponse = NextResponse.json({ 
      success: true, 
      message: 'Registration successful.',
      user: {
        id: data.user?.id,
        email: data.user?.email,
        username,
        role
      }
    }, { status: 201 });

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

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, copyCookies } from '@/lib/supabase';
import { RegisterSchema } from '@auror/shared/domain';

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

    const cookieResponse = NextResponse.next();
    const supabase = await createServerClient(req, cookieResponse);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          role,
          avatar_url: avatarUrl ?? null,
        },
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const finalResponse = NextResponse.json(
      {
        success: true,
        message: 'Registration successful.',
        user: {
          id: data.user?.id,
          email: data.user?.email,
          username,
          role,
        },
      },
      { status: 201 }
    );

    copyCookies(cookieResponse, finalResponse);
    return finalResponse;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

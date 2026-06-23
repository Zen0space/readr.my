import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const allCookies = req.cookies.getAll();
    console.log('GET /api/auth/session - Received cookies:', allCookies.map(c => c.name));
    
    const supabase = await createServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      console.log('GET /api/auth/session - Auth failed:', error?.message || 'No user');
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
    
    // Fetch profile details
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, username, avatar_url')
      .eq('id', user.id)
      .single();
      
    if (profileError) {
      return NextResponse.json({ 
        authenticated: true,
        user: {
          id: user.id,
          email: user.email,
          role: 'reader',
          username: user.email?.split('@')[0] || ''
        }
      });
    }
    
    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        username: profile.username,
        role: profile.role,
        avatar_url: profile.avatar_url
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

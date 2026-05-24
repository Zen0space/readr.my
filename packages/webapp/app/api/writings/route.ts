import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '../../lib/supabase';
import { WritingSchema } from '../../lib/schemas';

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerClient();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const authorId = searchParams.get('author_id');
    const authorFilter = searchParams.get('author'); // e.g. "me"
    
    let query = supabase.from('writings').select('*, profiles(username)');
    
    if (authorFilter === 'me') {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      query = query.eq('author_id', user.id);
    } else {
      // By default, only show published writings
      query = query.eq('status', 'published');
      if (authorId) {
        query = query.eq('author_id', authorId);
      }
    }
    
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }
    
    const { data: writings, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ success: true, writings });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
      
    if (!profile || (profile.role !== 'author' && profile.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden. Author role required.' }, { status: 403 });
    }
    
    const body = await req.json();
    const result = WritingSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation error', details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    
    const { title, description, cover_url, status } = result.data;
    
    const { data: writing, error } = await supabase
      .from('writings')
      .insert({
        author_id: user.id,
        title,
        description,
        cover_url: cover_url || '',
        status
      })
      .select()
      .single();
      
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ success: true, writing }, { status: 201 });
    
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

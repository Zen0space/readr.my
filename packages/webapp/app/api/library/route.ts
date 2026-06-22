import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { data: library, error } = await supabase
      .from('library')
      .select('created_at, writings(*, profiles(username))')
      .eq('user_id', user.id);
      
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    const list = library.map((item: any) => ({
      added_at: item.created_at,
      ...item.writings
    }));
    
    return NextResponse.json({ success: true, library: list });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { writing_id } = await req.json();
    if (!writing_id) {
      return NextResponse.json({ error: 'writing_id is required' }, { status: 400 });
    }
    
    const { data: entry, error } = await supabase
      .from('library')
      .insert({
        user_id: user.id,
        writing_id
      })
      .select()
      .single();
      
    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ success: true, message: 'Already in library' });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ success: true, entry }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(req.url);
    const writing_id = searchParams.get('writing_id');
    
    if (!writing_id) {
      return NextResponse.json({ error: 'writing_id parameter is required' }, { status: 400 });
    }
    
    const { error } = await supabase
      .from('library')
      .delete()
      .eq('user_id', user.id)
      .eq('writing_id', writing_id);
      
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ success: true, message: 'Removed from library successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

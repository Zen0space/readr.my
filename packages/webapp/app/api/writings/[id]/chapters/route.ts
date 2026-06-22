import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { ChapterSchema } from '@auror/shared/domain';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    let isAuthor = false;
    let isAdmin = false;

    if (user) {
      const { data: writing } = await supabase
        .from('writings')
        .select('author_id')
        .eq('id', id)
        .single();

      isAuthor = writing?.author_id === user.id;

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      isAdmin = profile?.role === 'admin';
    }

    // Exclude 'content' to protect premium and long texts from general metadata searches
    let query = supabase
      .from('chapters')
      .select('id, writing_id, title, chapter_order, is_premium, coin_price, status, created_at')
      .eq('writing_id', id);
      
    if (!isAuthor && !isAdmin) {
      query = query.eq('status', 'published');
    }
    
    const { data: chapters, error } = await query.order('chapter_order', { ascending: true });
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ success: true, chapters });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if writing exists and user is author
    const { data: writing, error: fetchError } = await supabase
      .from('writings')
      .select('author_id')
      .eq('id', id)
      .single();
      
    if (fetchError || !writing) {
      return NextResponse.json({ error: 'Writing not found' }, { status: 404 });
    }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
      
    const isOwner = user.id === writing.author_id;
    const isAdmin = profile?.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden. Owner permissions required.' }, { status: 403 });
    }
    
    const body = await req.json();
    const result = ChapterSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation error', details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    
    const { title, content, chapter_order, is_premium, coin_price, status } = result.data;
    
    const { data: chapter, error: insertError } = await supabase
      .from('chapters')
      .insert({
        writing_id: id,
        title,
        content,
        chapter_order,
        is_premium,
        coin_price: is_premium ? coin_price : 0,
        status
      })
      .select()
      .single();
      
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }
    
    return NextResponse.json({ success: true, chapter }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

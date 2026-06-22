import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { CommentSchema } from '@auror/shared/domain';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { searchParams } = new URL(req.url);
    const writingId = searchParams.get('writing_id');
    const chapterId = searchParams.get('chapter_id');
    
    if (!writingId) {
      return NextResponse.json({ error: 'writing_id is required' }, { status: 400 });
    }
    
    let query = supabase
      .from('comments')
      .select('*, profiles(username, avatar_url)')
      .eq('writing_id', writingId);
      
    if (chapterId) {
      query = query.eq('chapter_id', chapterId);
    } else {
      query = query.is('chapter_id', null);
    }
    
    const { data: comments, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ success: true, comments });
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
    
    const body = await req.json();
    const result = CommentSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation error', details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    
    const { writing_id, chapter_id, content } = result.data;
    
    const { data: comment, error } = await supabase
      .from('comments')
      .insert({
        user_id: user.id,
        writing_id,
        chapter_id: chapter_id || null,
        content
      })
      .select('*, profiles(username, avatar_url)')
      .single();
      
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ success: true, comment }, { status: 201 });
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
    const commentId = searchParams.get('id');
    
    if (!commentId) {
      return NextResponse.json({ error: 'comment id parameter is required' }, { status: 400 });
    }
    
    const { data: comment, error: fetchError } = await supabase
      .from('comments')
      .select('*, writings(author_id)')
      .eq('id', commentId)
      .single();
      
    if (fetchError || !comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
      
    const isCommenter = user.id === comment.user_id;
    const isWritingAuthor = user.id === (comment.writings as any)?.author_id;
    const isAdmin = profile?.role === 'admin';
    
    if (!isCommenter && !isWritingAuthor && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const { error: deleteError } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);
      
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 400 });
    }
    
    return NextResponse.json({ success: true, message: 'Comment deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

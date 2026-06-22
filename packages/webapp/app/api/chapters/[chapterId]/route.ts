import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { ChapterSchema } from '@/lib/schemas';

export async function GET(req: NextRequest, { params }: { params: Promise<{ chapterId: string }> }) {
  try {
    const { chapterId } = await params;
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch chapter and the author's id
    const { data: chapter, error } = await supabase
      .from('chapters')
      .select('*, writings(author_id, status)')
      .eq('id', chapterId)
      .single();
      
    if (error || !chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }
    
    const writingAuthorId = (chapter.writings as any)?.author_id;
    const isAuthor = user?.id === writingAuthorId;
    
    let isAdmin = false;
    let hasActiveSubscription = false;
    
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      isAdmin = profile?.role === 'admin';
      
      // Check for active subscription
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .gt('ends_at', new Date().toISOString())
        .maybeSingle();
        
      if (sub) {
        hasActiveSubscription = true;
      }
    }
    
    if (chapter.status === 'draft' && !isAuthor && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized to view draft chapter' }, { status: 403 });
    }
    
    // Check premium restriction
    if (chapter.is_premium && !isAuthor && !isAdmin && !hasActiveSubscription) {
      if (!user) {
        return NextResponse.json({ error: 'Authentication required for premium content', premium: true }, { status: 401 });
      }
      
      // Check if unlocked in transactions
      const { data: wallet } = await supabase
        .from('wallets')
        .select('id')
        .eq('user_id', user.id)
        .single();
        
      if (!wallet) {
        return NextResponse.json({ error: 'User wallet not found', premium: true }, { status: 404 });
      }
      
      const { data: transaction } = await supabase
        .from('transactions')
        .select('id')
        .eq('wallet_id', wallet.id)
          .eq('type', 'chapter_unlock')
          .eq('metadata->>chapter_id', chapterId)
        .maybeSingle();
        
      if (!transaction) {
        return NextResponse.json({ 
          error: 'Premium chapter must be unlocked', 
          premium: true,
          unlocked: false,
          coin_price: chapter.coin_price 
        }, { status: 402 }); // 402 Payment Required
      }
    }
    
    // Log reading progress in history & analytics
    if (user && chapter.status === 'published') {
      await supabase
        .from('reading_history')
        .upsert({
          user_id: user.id,
          writing_id: chapter.writing_id,
          chapter_id: chapter.id,
          scroll_position: 0,
          last_read_at: new Date().toISOString()
        }, {
          onConflict: 'user_id, writing_id'
        });
        
      await supabase
        .from('analytics')
        .insert({
          event_type: 'read_chapter',
          user_id: user.id,
          writing_id: chapter.writing_id,
          chapter_id: chapter.id
        });
    }
    
    return NextResponse.json({ success: true, chapter });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ chapterId: string }> }) {
  try {
    const { chapterId } = await params;
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: chapter, error: fetchError } = await supabase
      .from('chapters')
      .select('*, writings(author_id)')
      .eq('id', chapterId)
      .single();
      
    if (fetchError || !chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
      
    const isOwner = user.id === (chapter.writings as any)?.author_id;
    const isAdmin = profile?.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
    
    const { data: updatedChapter, error: updateError } = await supabase
      .from('chapters')
      .update({
        title,
        content,
        chapter_order,
        is_premium,
        coin_price: is_premium ? coin_price : 0,
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', chapterId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }
    
    return NextResponse.json({ success: true, chapter: updatedChapter });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ chapterId: string }> }) {
  try {
    const { chapterId } = await params;
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: chapter, error: fetchError } = await supabase
      .from('chapters')
      .select('*, writings(author_id)')
      .eq('id', chapterId)
      .single();
      
    if (fetchError || !chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
      
    const isOwner = user.id === (chapter.writings as any)?.author_id;
    const isAdmin = profile?.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const { error: deleteError } = await supabase
      .from('chapters')
      .delete()
      .eq('id', chapterId);
      
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 400 });
    }
    
    return NextResponse.json({ success: true, message: 'Chapter deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

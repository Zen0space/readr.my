import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(req: NextRequest, { params }: { params: Promise<{ chapterId: string }> }) {
  try {
    const { chapterId } = await params;
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Call database function. p_coin_rate represents coin value, 0.01 means 1 coin = $0.01 credit
    const { data, error } = await supabase.rpc('unlock_chapter', {
      p_user_id: user.id,
      p_chapter_id: chapterId,
      p_coin_rate: 0.01
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const response = data as any;
    if (!response || response.success === false) {
      return NextResponse.json({ error: response?.error || 'Unlock failed' }, { status: 400 });
    }

    // Fetch chapter content since it is now successfully unlocked
    const { data: chapter, error: chapterError } = await supabase
      .from('chapters')
      .select('*')
      .eq('id', chapterId)
      .single();
      
    if (chapterError || !chapter) {
      return NextResponse.json({ error: 'Failed to retrieve chapter content after unlock' }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Chapter unlocked successfully',
      coins_spent: response.coins_spent,
      chapter
    });
    
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

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
    
    // Check check-status
    const { data: existingLike } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', user.id)
      .eq('writing_id', writing_id)
      .maybeSingle();
      
    let liked = false;
    
    if (existingLike) {
      // Delete (Unlike)
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('id', existingLike.id);
        
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      liked = false;
    } else {
      // Insert (Like)
      const { error } = await supabase
        .from('likes')
        .insert({
          user_id: user.id,
          writing_id
        });
        
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      liked = true;
    }
    
    // Fetch total likes
    const { count } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('writing_id', writing_id);
      
    return NextResponse.json({ success: true, liked, likes_count: count || 0 });
    
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

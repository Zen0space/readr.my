import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { TrackEventSchema } from '@/lib/schemas';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    const body = await req.json();
    const result = TrackEventSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation error', details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    
    const { event_type, writing_id, chapter_id, metadata } = result.data;
    
    const { data: event, error } = await supabase
      .from('analytics')
      .insert({
        event_type,
        user_id: user?.id || null,
        writing_id: writing_id || null,
        chapter_id: chapter_id || null,
        metadata: metadata || {}
      })
      .select()
      .single();
      
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ success: true, event });
    
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

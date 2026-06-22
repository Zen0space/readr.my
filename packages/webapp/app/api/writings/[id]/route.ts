import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { WritingSchema } from '@/lib/schemas';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerClient();
    const { data: writing, error } = await supabase
      .from('writings')
      .select('*, profiles(username)')
      .eq('id', params.id)
      .single();
      
    if (error || !writing) {
      return NextResponse.json({ error: 'Writing not found' }, { status: 404 });
    }
    
    // If it's a draft, check authorization
    if (writing.status === 'draft') {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || (user.id !== writing.author_id)) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user?.id || '')
          .single();
          
        if (profile?.role !== 'admin') {
          return NextResponse.json({ error: 'Unauthorized to view draft content' }, { status: 403 });
        }
      }
    }
    
    return NextResponse.json({ success: true, writing });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Fetch the writing to verify owner
    const { data: writing, error: fetchError } = await supabase
      .from('writings')
      .select('author_id')
      .eq('id', params.id)
      .single();
      
    if (fetchError || !writing) {
      return NextResponse.json({ error: 'Writing not found' }, { status: 404 });
    }
    
    // Check if user is the author or admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
      
    const isOwner = user.id === writing.author_id;
    const isAdmin = profile?.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
    
    const { data: updatedWriting, error: updateError } = await supabase
      .from('writings')
      .update({
        title,
        description,
        cover_url: cover_url || '',
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single();
      
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }
    
    return NextResponse.json({ success: true, writing: updatedWriting });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { data: writing, error: fetchError } = await supabase
      .from('writings')
      .select('author_id')
      .eq('id', params.id)
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
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const { error: deleteError } = await supabase
      .from('writings')
      .delete()
      .eq('id', params.id);
      
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 400 });
    }
    
    return NextResponse.json({ success: true, message: 'Writing deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

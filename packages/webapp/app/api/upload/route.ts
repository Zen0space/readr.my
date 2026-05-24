import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '../../lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const bucket = formData.get('bucket') as string || 'avatars';
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    if (!['avatars', 'writing-covers'].includes(bucket)) {
      return NextResponse.json({ error: 'Invalid storage bucket requested' }, { status: 400 });
    }
    
    // Enforce 5MB limit
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 });
    }
    
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Generate unique name under user directory
    const fileExtension = file.name.split('.').pop() || 'png';
    const fileName = `${user.id}/${Date.now()}.${fileExtension}`;
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true
      });
      
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);
      
    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: data.path
    });
    
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

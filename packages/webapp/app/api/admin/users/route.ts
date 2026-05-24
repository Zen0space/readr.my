import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '../../../lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Admin verified, fetch profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) {
      return NextResponse.json({ error: profilesError.message }, { status: 500 });
    }

    // Fetch emails from auth.users using adminClient
    const adminClient = createAdminClient();
    const { data: { users: authUsers }, error: authError } = await adminClient.auth.admin.listUsers();

    // Map emails
    const emailMap: Record<string, string> = {};
    if (!authError && authUsers) {
      authUsers.forEach(u => {
        if (u.email) {
          emailMap[u.id] = u.email;
        }
      });
    }

    const result = profiles.map(p => ({
      id: p.id,
      username: p.username,
      role: p.role,
      avatar_url: p.avatar_url,
      created_at: p.created_at,
      email: emailMap[p.id] || 'N/A',
      status: p.metadata?.status || 'active'
    }));

    return NextResponse.json({ success: true, users: result });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', currentUser.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId, role, status } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const updates: any = {};
    if (role) {
      updates.role = role;
    }
    
    // Get existing profile to preserve other metadata
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('metadata')
      .eq('id', userId)
      .single();

    if (status !== undefined) {
      updates.metadata = {
        ...(targetProfile?.metadata || {}),
        status: status
      };
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Also update role in auth.users app_metadata/user_metadata via admin client if role is changed
    if (role) {
      const adminClient = createAdminClient();
      await adminClient.auth.admin.updateUserById(userId, {
        user_metadata: { role }
      });
    }

    return NextResponse.json({ success: true, user: data });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

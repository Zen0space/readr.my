import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '../../../lib/supabase';

// Helper to seed dummy reports if the database is empty
async function seedDummyReports(supabase: any) {
  try {
    // Check if we already have profiles, if not we need some dummy ones
    const { data: profiles } = await supabase.from('profiles').select('id, username').limit(2);
    
    let reporterId = null;
    if (profiles && profiles.length > 0) {
      reporterId = profiles[0].id;
    }

    const dummyReports = [
      {
        reporter_id: reporterId,
        target_type: 'comment',
        target_id: '00000000-0000-0000-0000-000000000001',
        reason: 'Harassment',
        content_snippet: '...nobody cares about your generic opinions, you should just stop writing entirely.',
        status: 'pending',
        priority: 'high',
        created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString() // 2 mins ago
      },
      {
        reporter_id: null, // Auto-Mod
        target_type: 'comment',
        target_id: '00000000-0000-0000-0000-000000000002',
        reason: 'Spam / Promotional',
        content_snippet: "Great read! Check out my new book at bit.ly/xyz123 it's way better tbh.",
        status: 'pending',
        priority: 'medium',
        created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString() // 15 mins ago
      }
    ];

    const adminClient = createAdminClient();
    await adminClient.from('reports').insert(dummyReports);
  } catch (err) {
    console.error('Error seeding reports:', err);
  }
}

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

    // Fetch reports
    let { data: reports, error } = await supabase
      .from('reports')
      .select('*, profiles:reporter_id(username, avatar_url)')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Auto-seed if empty
    if (!reports || reports.length === 0) {
      await seedDummyReports(supabase);
      // Fetch again after seeding
      const { data: seededReports } = await supabase
        .from('reports')
        .select('*, profiles:reporter_id(username, avatar_url)')
        .order('created_at', { ascending: false });
      reports = seededReports || [];
    }

    const mappedReports = (reports || []).map(r => ({
      id: r.id,
      reporterName: r.profiles?.username || 'Auto-Mod',
      reporterAvatar: r.profiles?.avatar_url || null,
      targetType: r.target_type,
      targetId: r.target_id,
      reason: r.reason,
      contentSnippet: r.content_snippet,
      status: r.status,
      priority: r.priority,
      createdAt: r.created_at
    }));

    return NextResponse.json({ success: true, reports: mappedReports });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
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

    const body = await req.json();
    const { reportId, status, resolutionAction } = body;

    if (!reportId) {
      return NextResponse.json({ error: 'Report ID is required' }, { status: 400 });
    }

    // Fetch the target report details
    const { data: report, error: fetchError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (fetchError || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const adminClient = createAdminClient();
    let updatedStatus = status || report.status;

    if (resolutionAction === 'remove') {
      // Delete target content via admin client to bypass standard user permissions
      if (report.target_type === 'comment') {
        await adminClient.from('comments').delete().eq('id', report.target_id);
      } else if (report.target_type === 'chapter') {
        await adminClient.from('chapters').delete().eq('id', report.target_id);
      } else if (report.target_type === 'writing') {
        await adminClient.from('writings').delete().eq('id', report.target_id);
      }
      updatedStatus = 'resolved';
    } else if (resolutionAction === 'approve') {
      updatedStatus = 'resolved';
    }

    // Update report
    const { data: updatedReport, error: updateError } = await supabase
      .from('reports')
      .update({
        status: updatedStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', reportId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, report: updatedReport });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

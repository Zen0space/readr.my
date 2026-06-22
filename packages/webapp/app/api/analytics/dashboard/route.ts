import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
      
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }
    
    if (profile.role === 'author') {
      const { data: writings } = await supabase
        .from('writings')
        .select('id, title, description, cover_url, status, created_at')
        .eq('author_id', user.id);
        
      const writingIds = writings?.map(w => w.id) || [];
      
      let totalViews = 0;
      let totalReads = 0;
      let chapterUnlocks = 0;
      let totalLikes = 0;
      let writingsWithStats: any[] = [];
      
      const { data: wallet } = await supabase
        .from('wallets')
        .select('id, coin_balance, earnings_balance')
        .eq('user_id', user.id)
        .single();
        
      if (writingIds.length > 0) {
        // 1. Get chapters for these writings
        const { data: chapters } = await supabase
          .from('chapters')
          .select('id, writing_id, coin_price')
          .in('writing_id', writingIds);
          
        const chapterIds = chapters?.map(c => c.id) || [];
        
        // Maps
        const chapterToWritingMap: Record<string, string> = {};
        chapters?.forEach(c => {
          chapterToWritingMap[c.id] = c.writing_id;
        });
        
        // 2. Get analytics events
        const { data: events } = await supabase
          .from('analytics')
          .select('event_type, writing_id, chapter_id');
          
        // 3. Get likes
        const { data: likes } = await supabase
          .from('likes')
          .select('writing_id')
          .in('writing_id', writingIds);
          
        // 4. Get earnings credits for this wallet
        let earningsCredits: any[] = [];
        if (wallet) {
          const { data: credits } = await supabase
            .from('transactions')
            .select('amount_currency, metadata')
            .eq('wallet_id', wallet.id)
            .eq('type', 'earnings_credit');
          earningsCredits = credits || [];
        }
        
        // Initialize maps for counts per writing
        const viewsMap: Record<string, number> = {};
        const readsMap: Record<string, number> = {};
        const unlocksMap: Record<string, number> = {};
        const likesMap: Record<string, number> = {};
        const revenueMap: Record<string, number> = {};
        
        writingIds.forEach(id => {
          viewsMap[id] = 0;
          readsMap[id] = 0;
          unlocksMap[id] = 0;
          likesMap[id] = 0;
          revenueMap[id] = 0;
        });
        
        // Aggregate analytics events
        events?.forEach(evt => {
          if (evt.event_type === 'view_writing' && evt.writing_id && writingIds.includes(evt.writing_id)) {
            viewsMap[evt.writing_id] = (viewsMap[evt.writing_id] || 0) + 1;
            totalViews++;
          } else if (evt.event_type === 'read_chapter' && evt.chapter_id) {
            const wId = chapterToWritingMap[evt.chapter_id];
            if (wId) {
              readsMap[wId] = (readsMap[wId] || 0) + 1;
              totalReads++;
            }
          } else if (evt.event_type === 'unlock_chapter' && evt.chapter_id) {
            const wId = chapterToWritingMap[evt.chapter_id];
            if (wId) {
              unlocksMap[wId] = (unlocksMap[wId] || 0) + 1;
              chapterUnlocks++;
            }
          }
        });
        
        // Aggregate likes
        likes?.forEach(lk => {
          if (lk.writing_id) {
            likesMap[lk.writing_id] = (likesMap[lk.writing_id] || 0) + 1;
            totalLikes++;
          }
        });
        
        // Aggregate revenue (USD credit * 100 = coins)
        earningsCredits?.forEach(credit => {
          const chapterId = credit.metadata?.chapter_id;
          if (chapterId) {
            const wId = chapterToWritingMap[chapterId];
            if (wId) {
              revenueMap[wId] = (revenueMap[wId] || 0) + (Number(credit.amount_currency) * 100);
            }
          }
        });
        
        // Build writingsWithStats
        writingsWithStats = (writings || []).map(w => {
          const v = viewsMap[w.id] || 0;
          const r = readsMap[w.id] || 0;
          return {
            ...w,
            views_count: v,
            reads_count: r,
            likes_count: likesMap[w.id] || 0,
            unlocks_count: unlocksMap[w.id] || 0,
            revenue_coins: Math.round(revenueMap[w.id] || 0),
            completion_rate: v > 0 ? Math.min(100, Math.round((r / v) * 100)) : 0
          };
        });
      }
      
      let earningsHistory: any[] = [];
      if (wallet) {
        const { data: txs } = await supabase
          .from('transactions')
          .select('id, amount_currency, created_at, metadata')
          .eq('wallet_id', wallet.id)
          .eq('type', 'earnings_credit')
          .order('created_at', { ascending: false })
          .limit(10);
        earningsHistory = txs || [];
      }
      
      return NextResponse.json({
        success: true,
        role: 'author',
        metrics: {
          total_writings: writings?.length || 0,
          total_views: totalViews,
          total_reads: totalReads,
          chapter_unlocks: chapterUnlocks,
          total_likes: totalLikes,
          current_earnings: wallet?.earnings_balance || '0.00'
        },
        writings: writingsWithStats,
        recent_earnings: earningsHistory
      });
      
    } else if (profile.role === 'admin') {
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
        
      const { count: writingsCount } = await supabase
        .from('writings')
        .select('*', { count: 'exact', head: true });
        
      const { data: txs } = await supabase
        .from('transactions')
        .select('amount_currency')
        .eq('type', 'coin_purchase');
        
      const totalRevenue = txs?.reduce((sum, tx) => sum + Number(tx.amount_currency), 0) || 0.00;
      
      const { count: totalReadsCount } = await supabase
        .from('analytics')
        .select('*', { count: 'exact', head: true })
        .eq('event_type', 'read_chapter');
        
      return NextResponse.json({
        success: true,
        role: 'admin',
        metrics: {
          total_users: usersCount || 0,
          total_writings: writingsCount || 0,
          total_reads: totalReadsCount || 0,
          total_revenue: totalRevenue.toFixed(2)
        }
      });
      
    } else {
      return NextResponse.json({ error: 'Forbidden. Reader analytics dashboard not available.' }, { status: 403 });
    }
    
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '../../../lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { data: wallet, error } = await supabase
      .from('wallets')
      .select('coin_balance, earnings_balance')
      .eq('user_id', user.id)
      .single();
      
    if (error || !wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      wallet: {
        coin_balance: wallet.coin_balance,
        earnings_balance: wallet.earnings_balance
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase';
import { PayoutSchema } from '@auror/shared/domain';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
      
    if (!profile || (profile.role !== 'author' && profile.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden. Author permissions required.' }, { status: 403 });
    }
    
    const body = await req.json();
    const result = PayoutSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation error', details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    
    const { amount } = result.data;
    
    const admin = createAdminClient();
    
    const { data: wallet, error: walletError } = await admin
      .from('wallets')
      .select('id, earnings_balance')
      .eq('user_id', user.id)
      .single();
      
    if (walletError || !wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }
    
    const balance = Number(wallet.earnings_balance);
    if (balance < amount) {
      return NextResponse.json({ error: 'Insufficient earnings balance for cashout request' }, { status: 400 });
    }
    
    const { data: updatedWallet, error: updateError } = await admin
      .from('wallets')
      .update({
        earnings_balance: balance - amount,
        updated_at: new Date().toISOString()
      })
      .eq('id', wallet.id)
      .select()
      .single();
      
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }
    
    await admin
      .from('transactions')
      .insert({
        wallet_id: wallet.id,
        type: 'earnings_payout',
        amount_coins: 0,
        amount_currency: amount,
        metadata: { status: 'requested', date: new Date().toISOString() }
      });
      
    return NextResponse.json({
      success: true,
      message: 'Payout requested successfully',
      earnings_balance: updatedWallet.earnings_balance
    });
    
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

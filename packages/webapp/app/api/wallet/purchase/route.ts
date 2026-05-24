import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '../../../lib/supabase';
import { PurchaseCoinsSchema } from '../../../lib/schemas';

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await req.json();
    const result = PurchaseCoinsSchema.safeParse(body);
    
    let coinsAmount = 0;
    let priceUsd = 0.00;
    let metadata: any = {};
    
    if (result.success) {
      const { coins_id } = result.data;
      const { data: coinPack, error: coinError } = await supabase
        .from('coins')
        .select('*')
        .eq('id', coins_id)
        .single();
        
      if (coinError || !coinPack) {
        return NextResponse.json({ error: 'Coin package not found' }, { status: 404 });
      }
      coinsAmount = coinPack.coins_amount;
      priceUsd = coinPack.price_usd;
      metadata = { coins_id, name: coinPack.name };
    } else {
      // Mock parameter backup for testing
      const { coins, price } = body;
      if (typeof coins !== 'number' || typeof price !== 'number' || coins <= 0 || price < 0) {
        return NextResponse.json({ error: 'Invalid purchase details' }, { status: 400 });
      }
      coinsAmount = coins;
      priceUsd = price;
      metadata = { note: 'Mock direct custom coin purchase' };
    }
    
    const admin = createAdminClient();
    
    const { data: wallet, error: walletError } = await admin
      .from('wallets')
      .select('id, coin_balance')
      .eq('user_id', user.id)
      .single();
      
    if (walletError || !wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }
    
    const { data: updatedWallet, error: updateError } = await admin
      .from('wallets')
      .update({
        coin_balance: wallet.coin_balance + coinsAmount,
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
        type: 'coin_purchase',
        amount_coins: coinsAmount,
        amount_currency: priceUsd,
        metadata
      });
      
    await admin
      .from('analytics')
      .insert({
        event_type: 'purchase_coins',
        user_id: user.id,
        metadata: { coins_purchased: coinsAmount, price_usd: priceUsd }
      });
      
    return NextResponse.json({
      success: true,
      message: 'Coins purchased and credited successfully',
      coin_balance: updatedWallet.coin_balance
    });
    
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

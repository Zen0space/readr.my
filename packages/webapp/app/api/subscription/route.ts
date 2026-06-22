import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/supabase';
import { z } from 'zod';

const SubscribeSchema = z.object({
  tier: z.enum(['premium_reader', 'vip_reader'])
});

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('ends_at', { ascending: false })
      .limit(1)
      .maybeSingle();
      
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      subscription
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await req.json();
    const result = SubscribeSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid subscription tier' }, { status: 400 });
    }
    
    const { tier } = result.data;
    const priceCoins = tier === 'vip_reader' ? 600 : 300;
    
    const admin = createAdminClient();
    
    // Check reader's wallet
    const { data: wallet, error: walletError } = await admin
      .from('wallets')
      .select('id, coin_balance')
      .eq('user_id', user.id)
      .single();
      
    if (walletError || !wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }
    
    if (wallet.coin_balance < priceCoins) {
      return NextResponse.json({ error: 'Insufficient coins in wallet. Please purchase more coins.' }, { status: 400 });
    }
    
    // Deduct coins from reader
    const { error: updateError } = await admin
      .from('wallets')
      .update({
        coin_balance: wallet.coin_balance - priceCoins,
        updated_at: new Date().toISOString()
      })
      .eq('id', wallet.id);
      
    if (updateError) {
      return NextResponse.json({ error: 'Failed to update wallet balance' }, { status: 400 });
    }
    
    // Deactivate previous active subscriptions
    await admin
      .from('subscriptions')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('status', 'active');
      
    // Create new subscription record
    const endsAt = new Date();
    endsAt.setMonth(endsAt.getMonth() + 1);
    
    const { data: subscription, error: subError } = await admin
      .from('subscriptions')
      .insert({
        user_id: user.id,
        tier,
        status: 'active',
        starts_at: new Date().toISOString(),
        ends_at: endsAt.toISOString()
      })
      .select()
      .single();
      
    if (subError) {
      return NextResponse.json({ error: subError.message }, { status: 400 });
    }
    
    // Create transaction log
    await admin
      .from('transactions')
      .insert({
        wallet_id: wallet.id,
        type: 'subscription_purchase',
        amount_coins: -priceCoins,
        amount_currency: 0.00,
        metadata: { subscription_id: subscription.id, tier }
      });
      
    return NextResponse.json({
      success: true,
      message: `Successfully subscribed to ${tier === 'vip_reader' ? 'VIP' : 'Premium'} tier!`,
      subscription
    });
    
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

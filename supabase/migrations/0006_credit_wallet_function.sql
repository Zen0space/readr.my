-- Credits a wallet atomically when a coin_purchases row goes pending -> succeeded.
-- Idempotent: noop if the purchase is already finalized.
create or replace function public.credit_wallet_for_purchase(
  p_purchase_id uuid
) returns void
  language plpgsql security definer set search_path = public as $$
declare
  v_purchase public.coin_purchases%rowtype;
begin
  select * into v_purchase from public.coin_purchases where id = p_purchase_id for update;
  if not found then
    raise exception 'coin_purchase_not_found' using errcode = 'P0002';
  end if;
  if v_purchase.status <> 'pending' then
    return;  -- already settled; noop
  end if;

  update public.wallets
    set coin_balance = coin_balance + v_purchase.coins
    where user_id = v_purchase.user_id;

  if not found then
    -- create wallet if missing (defensive; trigger should have created one)
    insert into public.wallets (user_id, coin_balance) values (v_purchase.user_id, v_purchase.coins);
  end if;

  update public.coin_purchases
    set status = 'succeeded', succeeded_at = now()
    where id = p_purchase_id;
end $$;

comment on function public.credit_wallet_for_purchase(uuid) is 'Idempotent: credits wallet for a pending coin_purchases row and marks it succeeded.';

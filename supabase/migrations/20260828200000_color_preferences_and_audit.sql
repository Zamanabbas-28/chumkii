-- Migration: 20260828200000_color_preferences_and_audit.sql
-- Description: Server-side price & shipping validation, security audit, and color preferences support.

create extension if not exists "pgcrypto";

-- Helper function to validate delivery charges server-side
create or replace function public.calculate_server_delivery_charge(
  p_district_id text,
  p_district_name text,
  p_total_qty int
)
returns numeric
language plpgsql
immutable
as $$
declare
  v_dist text;
  v_base numeric;
  v_platform_fee numeric := 10;
begin
  v_dist := lower(trim(coalesce(nullif(p_district_id, ''), nullif(p_district_name, ''), '')));
  
  if v_dist in ('sylhet', 'moulvibazar', 'habiganj', 'sunamganj') then
    v_base := 60;
  elsif v_dist = 'dhaka' then
    v_base := 105;
  else
    v_base := 125;
  end if;

  return v_base + v_platform_fee;
end;
$$;

-- Enhanced place_order RPC with server-side price & shipping validation
create or replace function public.place_order(
  p_customer jsonb,
  p_delivery jsonb,
  p_items jsonb,
  p_subtotal numeric,
  p_delivery_charge numeric,
  p_total numeric,
  p_meta jsonb default '{}'::jsonb,
  p_idempotency_key text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing public.orders%rowtype;
  v_order public.orders%rowtype;
  v_order_number text;
  v_item jsonb;
  v_attempts int := 0;
  v_token text;
  v_advance numeric(12, 2);
  v_remaining numeric(12, 2);
  
  -- Validation accumulators
  v_calculated_subtotal numeric(12, 2) := 0;
  v_calculated_delivery numeric(12, 2) := 0;
  v_total_qty int := 0;
  v_item_qty int;
  v_item_unit_price numeric(12, 2);
  v_item_total_price numeric(12, 2);
  v_variant_id uuid;
  v_product_id uuid;
  v_db_price numeric(12, 2);
begin
  -- 1. Idempotency Check
  if p_idempotency_key is not null and length(trim(p_idempotency_key)) > 0 then
    select * into v_existing
    from public.orders
    where idempotency_key = p_idempotency_key
    limit 1;

    if found then
      return jsonb_build_object(
        'order_id', v_existing.id,
        'order_number', v_existing.order_number,
        'status', v_existing.status,
        'payment_token', v_existing.payment_token,
        'advance_amount', v_existing.advance_amount,
        'remaining_amount', v_existing.remaining_amount,
        'total', v_existing.total,
        'delivery_charge', v_existing.delivery_charge,
        'duplicate', true
      );
    end if;
  end if;

  -- 2. Validate Customer Payload
  if p_customer is null
     or coalesce(nullif(trim(p_customer->>'name'), ''), '') = ''
     or coalesce(nullif(trim(p_customer->>'phone'), ''), '') = '' then
    raise exception 'INVALID_CUSTOMER' using errcode = 'P0001';
  end if;

  -- 3. Validate Delivery Payload
  if p_delivery is null
     or coalesce(nullif(trim(p_delivery->>'district'), ''), '') = ''
     or coalesce(nullif(trim(p_delivery->>'full_address'), ''), '') = '' then
    raise exception 'INVALID_DELIVERY' using errcode = 'P0001';
  end if;

  -- 4. Validate Items Payload
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) < 1 then
    raise exception 'INVALID_ITEMS' using errcode = 'P0001';
  end if;

  -- 5. Calculate & Validate Item Quantities and Prices
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_item_qty := coalesce((v_item->>'quantity')::int, 0);
    if v_item_qty < 1 then
      raise exception 'INVALID_ITEM_QTY' using errcode = 'P0001';
    end if;
    v_total_qty := v_total_qty + v_item_qty;

    v_item_unit_price := coalesce((v_item->>'unit_price')::numeric, -1);
    v_item_total_price := coalesce((v_item->>'total_price')::numeric, -1);
    if v_item_unit_price < 0 or v_item_total_price < 0 then
      raise exception 'INVALID_ITEM_PRICE' using errcode = 'P0001';
    end if;

    -- Validate price against database catalog if variant_id or product_id is provided
    v_variant_id := nullif(v_item->>'variant_id', '')::uuid;
    v_product_id := nullif(v_item->>'product_id', '')::uuid;
    
    if v_variant_id is not null then
      select price into v_db_price
      from public.product_variants
      where id = v_variant_id and is_available = true;

      if found and v_db_price is not null then
        if v_item_unit_price <> v_db_price then
          raise exception 'PRICE_MANIPULATION_DETECTED' using errcode = 'P0001';
        end if;
      end if;
    end if;

    v_calculated_subtotal := v_calculated_subtotal + (v_item_unit_price * v_item_qty);
  end loop;

  -- Verify subtotal matches calculated item sum
  if abs(p_subtotal - v_calculated_subtotal) > 0.01 then
    raise exception 'INVALID_SUBTOTAL' using errcode = 'P0001';
  end if;

  -- 6. Server-Side Shipping Verification
  v_calculated_delivery := public.calculate_server_delivery_charge(
    p_delivery->>'district_id',
    p_delivery->>'district',
    v_total_qty
  );

  if abs(p_delivery_charge - v_calculated_delivery) > 0.01 then
    raise exception 'INVALID_DELIVERY_CHARGE' using errcode = 'P0001';
  end if;

  -- Verify Total
  if abs(p_total - (p_subtotal + p_delivery_charge)) > 0.01 then
    raise exception 'INVALID_TOTALS' using errcode = 'P0001';
  end if;

  -- Advance = delivery charge only
  v_advance := p_delivery_charge;
  v_remaining := greatest(p_total - v_advance, 0);

  -- 7. Insert Order
  loop
    v_attempts := v_attempts + 1;
    v_order_number := public.generate_order_number();
    v_token := encode(extensions.gen_random_bytes(24), 'hex');
    begin
      insert into public.orders (
        order_number,
        customer_name,
        phone,
        email,
        district,
        district_id,
        area,
        full_address,
        notes,
        subtotal,
        delivery_charge,
        total,
        advance_amount,
        remaining_amount,
        currency,
        status,
        payment_token,
        idempotency_key,
        meta
      ) values (
        v_order_number,
        trim(p_customer->>'name'),
        trim(p_customer->>'phone'),
        nullif(trim(coalesce(p_customer->>'email', '')), ''),
        trim(p_delivery->>'district'),
        nullif(trim(coalesce(p_delivery->>'district_id', '')), ''),
        nullif(trim(coalesce(p_delivery->>'area', '')), ''),
        trim(p_delivery->>'full_address'),
        nullif(trim(coalesce(p_delivery->>'notes', '')), ''),
        p_subtotal,
        p_delivery_charge,
        p_total,
        v_advance,
        v_remaining,
        'BDT',
        'payment_pending',
        v_token,
        nullif(trim(coalesce(p_idempotency_key, '')), ''),
        coalesce(p_meta, '{}'::jsonb)
      )
      returning * into v_order;
      exit;
    exception
      when unique_violation then
        if v_attempts >= 5 then
          raise;
        end if;
    end;
  end loop;

  -- 8. Insert Order Items (with Color Preferences in customization_data)
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    insert into public.order_items (
      order_id,
      product_id,
      variant_id,
      product_name,
      variant_type,
      size,
      quantity,
      unit_price,
      total_price,
      customization_data
    ) values (
      v_order.id,
      nullif(v_item->>'product_id', '')::uuid,
      nullif(v_item->>'variant_id', '')::uuid,
      coalesce(nullif(trim(v_item->>'product_name'), ''), 'Chumki item'),
      nullif(trim(coalesce(v_item->>'variant_type', '')), ''),
      nullif(trim(coalesce(v_item->>'size', '')), ''),
      (v_item->>'quantity')::int,
      (v_item->>'unit_price')::numeric,
      (v_item->>'total_price')::numeric,
      coalesce(v_item->'customization_data', '{}'::jsonb)
    );
  end loop;

  return jsonb_build_object(
    'order_id', v_order.id,
    'order_number', v_order.order_number,
    'status', v_order.status,
    'payment_token', v_order.payment_token,
    'advance_amount', v_order.advance_amount,
    'remaining_amount', v_order.remaining_amount,
    'total', v_order.total,
    'delivery_charge', v_order.delivery_charge,
    'duplicate', false
  );
end;
$$;

revoke all on function public.place_order(jsonb, jsonb, jsonb, numeric, numeric, numeric, jsonb, text) from public;
grant execute on function public.place_order(jsonb, jsonb, jsonb, numeric, numeric, numeric, jsonb, text) to anon, authenticated;

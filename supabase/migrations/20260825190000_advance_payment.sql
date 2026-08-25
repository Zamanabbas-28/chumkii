-- Chumki advance payment: statuses, payments table, RPCs, private storage
-- Project: lsbdjmlvbnqznsebooef

create extension if not exists "pgcrypto" with schema extensions;

-- ---------------------------------------------------------------------------
-- Orders: payment columns + status migration
-- ---------------------------------------------------------------------------
alter table public.orders
  add column if not exists advance_amount numeric(12, 2) not null default 0;

alter table public.orders
  drop constraint if exists orders_advance_amount_check;
alter table public.orders
  add constraint orders_advance_amount_check check (advance_amount >= 0);

alter table public.orders
  add column if not exists remaining_amount numeric(12, 2) not null default 0;

alter table public.orders
  drop constraint if exists orders_remaining_amount_check;
alter table public.orders
  add constraint orders_remaining_amount_check check (remaining_amount >= 0);

alter table public.orders
  add column if not exists payment_token text;

-- Backfill payment tokens for existing rows
update public.orders
set payment_token = encode(extensions.gen_random_bytes(24), 'hex')
where payment_token is null;

alter table public.orders
  alter column payment_token set not null;

create unique index if not exists orders_payment_token_uidx
  on public.orders (payment_token);

-- Drop old status check BEFORE migrating values
alter table public.orders drop constraint if exists orders_status_check;

-- Migrate legacy pending → payment_pending
update public.orders
set status = 'payment_pending'
where status = 'pending';

-- Backfill advance / remaining from delivery_charge when zero
update public.orders
set
  advance_amount = delivery_charge,
  remaining_amount = greatest(total - delivery_charge, 0)
where coalesce(advance_amount, 0) = 0 and delivery_charge > 0;

-- New payment-aware status check
alter table public.orders
  add constraint orders_status_check check (
    status in (
      'payment_pending',
      'payment_verification',
      'confirmed',
      'in_production',
      'ready_for_delivery',
      'shipped',
      'delivered',
      'cancelled'
    )
  );

alter table public.orders
  alter column status set default 'payment_pending';

-- ---------------------------------------------------------------------------
-- payments table
-- ---------------------------------------------------------------------------
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  payment_method text not null check (payment_method in ('bkash', 'rocket')),
  payment_amount numeric(12, 2) not null check (payment_amount >= 0),
  transaction_id text,
  payment_proof_path text not null,
  payment_status text not null default 'verification_pending' check (
    payment_status in (
      'pending_submission',
      'verification_pending',
      'verified',
      'rejected'
    )
  ),
  rejection_reason text,
  verified_at timestamptz,
  verified_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payments_order_id_idx on public.payments (order_id);
create index if not exists payments_status_idx on public.payments (payment_status);
create index if not exists payments_created_at_idx on public.payments (created_at desc);

drop trigger if exists payments_set_updated_at on public.payments;
create trigger payments_set_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

alter table public.payments enable row level security;
-- No public SELECT/INSERT/UPDATE/DELETE policies — access via security definer RPCs only

-- ---------------------------------------------------------------------------
-- place_order: payment_pending + token + advance = delivery charge
-- ---------------------------------------------------------------------------
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
begin
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

  if p_customer is null
     or coalesce(nullif(trim(p_customer->>'name'), ''), '') = ''
     or coalesce(nullif(trim(p_customer->>'phone'), ''), '') = '' then
    raise exception 'INVALID_CUSTOMER' using errcode = 'P0001';
  end if;

  if p_delivery is null
     or coalesce(nullif(trim(p_delivery->>'district'), ''), '') = ''
     or coalesce(nullif(trim(p_delivery->>'full_address'), ''), '') = '' then
    raise exception 'INVALID_DELIVERY' using errcode = 'P0001';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) < 1 then
    raise exception 'INVALID_ITEMS' using errcode = 'P0001';
  end if;

  if p_subtotal is null or p_subtotal < 0
     or p_delivery_charge is null or p_delivery_charge < 0
     or p_total is null or p_total < 0 then
    raise exception 'INVALID_TOTALS' using errcode = 'P0001';
  end if;

  -- Advance = delivery charge only
  v_advance := p_delivery_charge;
  v_remaining := greatest(p_total - v_advance, 0);

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

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    if coalesce((v_item->>'quantity')::int, 0) < 1 then
      raise exception 'INVALID_ITEM_QTY' using errcode = 'P0001';
    end if;
    if coalesce((v_item->>'unit_price')::numeric, -1) < 0
       or coalesce((v_item->>'total_price')::numeric, -1) < 0 then
      raise exception 'INVALID_ITEM_PRICE' using errcode = 'P0001';
    end if;

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

-- ---------------------------------------------------------------------------
-- get_order_for_payment (guest, token-gated)
-- ---------------------------------------------------------------------------
create or replace function public.get_order_for_payment(
  p_order_number text,
  p_payment_token text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_items jsonb;
  v_latest public.payments%rowtype;
  v_payment jsonb;
begin
  if coalesce(nullif(trim(p_order_number), ''), '') = ''
     or coalesce(nullif(trim(p_payment_token), ''), '') = '' then
    return null;
  end if;

  select * into v_order
  from public.orders
  where order_number = trim(p_order_number)
    and payment_token = trim(p_payment_token)
  limit 1;

  if not found then
    return null;
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'product_name', oi.product_name,
        'variant_type', oi.variant_type,
        'size', oi.size,
        'quantity', oi.quantity,
        'unit_price', oi.unit_price,
        'total_price', oi.total_price,
        'customization_data', oi.customization_data
      )
      order by oi.created_at
    ),
    '[]'::jsonb
  )
  into v_items
  from public.order_items oi
  where oi.order_id = v_order.id;

  select * into v_latest
  from public.payments
  where order_id = v_order.id
  order by created_at desc
  limit 1;

  if found then
    v_payment := jsonb_build_object(
      'id', v_latest.id,
      'payment_method', v_latest.payment_method,
      'payment_amount', v_latest.payment_amount,
      'payment_status', v_latest.payment_status,
      'transaction_id', v_latest.transaction_id,
      'rejection_reason', v_latest.rejection_reason,
      'created_at', v_latest.created_at
    );
  else
    v_payment := null;
  end if;

  return jsonb_build_object(
    'order_id', v_order.id,
    'order_number', v_order.order_number,
    'status', v_order.status,
    'subtotal', v_order.subtotal,
    'delivery_charge', v_order.delivery_charge,
    'total', v_order.total,
    'advance_amount', v_order.advance_amount,
    'remaining_amount', v_order.remaining_amount,
    'currency', v_order.currency,
    'customer_name', v_order.customer_name,
    'items', v_items,
    'latest_payment', v_payment,
    'created_at', v_order.created_at
  );
end;
$$;

revoke all on function public.get_order_for_payment(text, text) from public;
grant execute on function public.get_order_for_payment(text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- submit_payment_proof (guest, token-gated)
-- ---------------------------------------------------------------------------
create or replace function public.submit_payment_proof(
  p_order_number text,
  p_payment_token text,
  p_payment_method text,
  p_transaction_id text default null,
  p_proof_path text default null,
  p_payment_amount numeric default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_latest public.payments%rowtype;
  v_payment public.payments%rowtype;
  v_method text;
  v_path text;
  v_amount numeric(12, 2);
  v_prefix text;
begin
  if coalesce(nullif(trim(p_order_number), ''), '') = ''
     or coalesce(nullif(trim(p_payment_token), ''), '') = '' then
    raise exception 'INVALID_TOKEN' using errcode = 'P0001';
  end if;

  v_method := lower(trim(coalesce(p_payment_method, '')));
  if v_method not in ('bkash', 'rocket') then
    raise exception 'INVALID_METHOD' using errcode = 'P0001';
  end if;

  v_path := trim(coalesce(p_proof_path, ''));
  if v_path = '' then
    raise exception 'INVALID_PROOF' using errcode = 'P0001';
  end if;

  select * into v_order
  from public.orders
  where order_number = trim(p_order_number)
    and payment_token = trim(p_payment_token)
  limit 1;

  if not found then
    raise exception 'INVALID_TOKEN' using errcode = 'P0001';
  end if;

  if v_order.status not in ('payment_pending', 'payment_verification') then
    raise exception 'ORDER_NOT_PAYABLE' using errcode = 'P0001';
  end if;

  -- Proof path must be under this order's UUID folder
  v_prefix := v_order.id::text || '/';
  if position(v_prefix in v_path) <> 1 then
    raise exception 'INVALID_PROOF_PATH' using errcode = 'P0001';
  end if;

  select * into v_latest
  from public.payments
  where order_id = v_order.id
  order by created_at desc
  limit 1;

  if found then
    if v_latest.payment_status = 'verified' then
      raise exception 'ALREADY_VERIFIED' using errcode = 'P0001';
    end if;
    if v_latest.payment_status = 'verification_pending' then
      raise exception 'ALREADY_SUBMITTED' using errcode = 'P0001';
    end if;
    -- rejected (or pending_submission) → allow new proof
  end if;

  v_amount := coalesce(p_payment_amount, v_order.advance_amount);
  if v_amount is null or v_amount < 0 then
    raise exception 'INVALID_AMOUNT' using errcode = 'P0001';
  end if;

  insert into public.payments (
    order_id,
    payment_method,
    payment_amount,
    transaction_id,
    payment_proof_path,
    payment_status
  ) values (
    v_order.id,
    v_method,
    v_amount,
    nullif(trim(coalesce(p_transaction_id, '')), ''),
    v_path,
    'verification_pending'
  )
  returning * into v_payment;

  update public.orders
  set status = 'payment_verification',
      updated_at = now()
  where id = v_order.id
  returning * into v_order;

  return jsonb_build_object(
    'order_id', v_order.id,
    'order_number', v_order.order_number,
    'order_status', v_order.status,
    'payment_id', v_payment.id,
    'payment_status', v_payment.payment_status,
    'payment_method', v_payment.payment_method,
    'payment_amount', v_payment.payment_amount,
    'advance_amount', v_order.advance_amount,
    'remaining_amount', v_order.remaining_amount
  );
end;
$$;

revoke all on function public.submit_payment_proof(text, text, text, text, text, numeric) from public;
grant execute on function public.submit_payment_proof(text, text, text, text, text, numeric) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Private storage bucket: payment-proofs
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payment-proofs',
  'payment-proofs',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Allow anon INSERT into payment-proofs only (path validated again in RPC)
drop policy if exists "Anon upload payment proofs" on storage.objects;
create policy "Anon upload payment proofs"
  on storage.objects for insert
  to anon, authenticated
  with check (
    bucket_id = 'payment-proofs'
    and (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  );

-- No public SELECT on payment proofs (admin uses signed URLs / service role later)
drop policy if exists "No public read payment proofs" on storage.objects;
-- Explicitly do not create a SELECT policy for anon

-- Allow uploader to update/overwrite own path object (replace before submit)
drop policy if exists "Anon update own payment proof upload" on storage.objects;
create policy "Anon update own payment proof upload"
  on storage.objects for update
  to anon, authenticated
  using (
    bucket_id = 'payment-proofs'
    and (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  )
  with check (
    bucket_id = 'payment-proofs'
    and (storage.foldername(name))[1] ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  );

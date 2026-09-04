-- Chumki full schema: products, variants, orders, order_items, RPC, RLS, seed
-- Project: lsbdjmlvbnqznsebooef

create extension if not exists "pgcrypto";

-- updated_at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  short_description text,
  description text,
  design_details text,
  category text,
  base_image text,
  shape text not null default 'round' check (shape in ('round', 'square')),
  color_palette jsonb not null default '[]'::jsonb,
  available_colors text[] not null default '{}',
  is_customizable boolean not null default true,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_slug_idx on public.products (slug);
create index if not exists products_active_idx on public.products (is_active);
create index if not exists products_featured_idx on public.products (is_featured);

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- product_variants
-- ---------------------------------------------------------------------------
create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  variant_type text not null check (variant_type in ('full_stack', 'big', 'medium', 'small')),
  name text not null,
  description text,
  price numeric(12, 2) not null check (price >= 0),
  available_sizes text[] not null default array['2.2','2.4','2.6','2.8'],
  image text,
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, variant_type)
);

create index if not exists product_variants_product_id_idx on public.product_variants (product_id);

drop trigger if exists product_variants_set_updated_at on public.product_variants;
create trigger product_variants_set_updated_at
  before update on public.product_variants
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_name text not null,
  phone text not null,
  email text,
  district text not null,
  district_id text,
  area text,
  full_address text not null,
  notes text,
  subtotal numeric(12, 2) not null check (subtotal >= 0),
  delivery_charge numeric(12, 2) not null check (delivery_charge >= 0),
  total numeric(12, 2) not null check (total >= 0),
  currency text not null default 'BDT',
  status text not null default 'pending' check (
    status in (
      'pending',
      'confirmed',
      'in_production',
      'ready_for_delivery',
      'shipped',
      'delivered',
      'cancelled'
    )
  ),
  idempotency_key text unique,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_order_number_idx on public.orders (order_number);
create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_status_idx on public.orders (status);

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- order_items
-- ---------------------------------------------------------------------------
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  variant_id uuid references public.product_variants (id) on delete set null,
  product_name text not null,
  variant_type text,
  size text,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  total_price numeric(12, 2) not null check (total_price >= 0),
  customization_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists order_items_order_id_idx on public.order_items (order_id);

-- ---------------------------------------------------------------------------
-- order number sequence + generator
-- ---------------------------------------------------------------------------
create sequence if not exists public.chumki_order_seq start 10000;

create or replace function public.generate_order_number()
returns text
language plpgsql
as $$
declare
  y text := to_char(now() at time zone 'Asia/Dhaka', 'YYYY');
  n bigint;
begin
  n := nextval('public.chumki_order_seq');
  return 'CHM-' || y || '-' || lpad((n % 100000)::text, 5, '0');
end;
$$;

-- ---------------------------------------------------------------------------
-- place_order RPC (guest checkout, transactional)
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

  loop
    v_attempts := v_attempts + 1;
    v_order_number := public.generate_order_number();
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
        currency,
        status,
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
        'BDT',
        'pending',
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
    'duplicate', false
  );
end;
$$;

revoke all on function public.place_order(jsonb, jsonb, jsonb, numeric, numeric, numeric, jsonb, text) from public;
grant execute on function public.place_order(jsonb, jsonb, jsonb, numeric, numeric, numeric, jsonb, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "Public read active products" on public.products;
create policy "Public read active products"
  on public.products for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists "Public read available variants" on public.product_variants;
create policy "Public read available variants"
  on public.product_variants for select
  to anon, authenticated
  using (
    is_available = true
    and exists (
      select 1 from public.products p
      where p.id = product_id and p.is_active = true
    )
  );

-- No public policies on orders / order_items (insert only via place_order)

-- ---------------------------------------------------------------------------
-- Seed products + variants
-- ---------------------------------------------------------------------------
insert into public.products (
  slug, name, short_description, description, design_details, category,
  base_image, shape, color_palette, available_colors, is_customizable, is_active, is_featured
) values
(
  'ohona', 'OHONA',
  'Smooth finishing thread work in a black and silver Y2K-inspired stack.',
  'Smooth finishing thread work with a black and silver combination in a soft Y2K style — made to match your everyday fit.',
  'Silk-thread wrapped stack with silver sequin vine details and mirror accents. Handmade in Sylhet.',
  'modern-minimal', '/images/products/ohona-1.jpg', 'round',
  '[{"name":"Black","hex":"#1a1a1a"},{"name":"Silver","hex":"#c0c0c0"}]'::jsonb,
  array['black','silver','white','gold'], true, true, true
),
(
  'ohona-2-0', 'OHONA 2.0',
  'Black and silver mirror-work stack with sequin florals and ghungroo side bangles.',
  'An updated OHONA look — thick black and silver statement bangle with shisha mirrors and sequin flower motifs, paired with slim black companion bangles finished with silver chumki and soft ghungroo bells.',
  'Wide central bangle in alternating black and silver silk with circular mirrors ringed in sequins and four-petal sequin florals. Two thin black side bangles with vertical silver sequin rows and dangling ghungroo accents. Handmade in Sylhet.',
  'modern-minimal', '/images/products/ohona-2-0-1.jpg', 'round',
  '[{"name":"Black","hex":"#1a1a1a"},{"name":"Silver","hex":"#c0c0c0"}]'::jsonb,
  array['black','silver','white','gold'], true, true, true
),
(
  'charkona-kakan', 'Charkona Kakan',
  'Square silk-wrapped bangles with silver chumki and soothing jhunjhuri.',
  'Beautifully sequenced with silver chumki and jhunjhuri, finished with smooth silk thread. Choose your own colour and stack.',
  'Square frames with rounded corners, silver sequins, and corner bells.',
  'traditional', '/images/products/charkona-1.jpg', 'square',
  '[{"name":"Lavender","hex":"#a78bbf"},{"name":"Fuchsia","hex":"#d9468f"},{"name":"Lime","hex":"#8fbf3a"},{"name":"Black","hex":"#1a1a1a"}]'::jsonb,
  array['lavender','pink','lime','black','red','emerald','gold'], true, true, true
),
(
  'neela', 'NEELA',
  'Vibrant navy kundan work with soft off-white contrast stacks.',
  'Smooth finishing of thread work along with kundan in a vibrant blue, set against an off-white contrast.',
  'Navy statement centre with cream companions and gold-toned kundan stone settings.',
  'stone-mirror', '/images/products/neela-1.jpg', 'round',
  '[{"name":"Navy","hex":"#1a2744"},{"name":"Off-White","hex":"#f0e6d8"},{"name":"Gold","hex":"#c4a574"}]'::jsonb,
  array['navy','royal-blue','cream','gold','silver'], true, true, true
),
(
  'dahlia', 'DAHLIA',
  'Fuchsia and lime stacks with kundan sparkle and ghungroo accents.',
  'Beautifully sequenced handmade bangles with kundan and smooth thread finishing.',
  'Bold fuchsia and lime pairing with kundan stones, stars, and soft ghungroo details.',
  'colorful-threads', '/images/products/dahlia-1.jpg', 'round',
  '[{"name":"Fuchsia","hex":"#d9468f"},{"name":"Lime","hex":"#8fbf3a"},{"name":"Gold","hex":"#c4a574"}]'::jsonb,
  array['fuchsia','lime','pink','emerald','gold'], true, true, true
),
(
  'siya', 'SIYA',
  'Black silk stack with silver mirror work, ghungroo bells, and pearl accents.',
  'A striking black and silver combination finished with smooth thread work, geometric mirror pieces, and soft ghungroo details — made for everyday and festive wear.',
  'Deep black silk wrap with silver wire bands, shisha mirror triangles and diamonds, pearl clusters, and dangling ghungroo accents. Handmade in Sylhet.',
  'stone-mirror', '/images/products/siya-1.jpg', 'round',
  '[{"name":"Black","hex":"#1a1a1a"},{"name":"Silver","hex":"#c0c0c0"},{"name":"Pearl","hex":"#f5f0e8"}]'::jsonb,
  array['black','silver','white','cream','gold'], true, true, true
),
(
  'zaria', 'ZARIA',
  'Magenta, lime, and maroon silk stack with kundan florals and pearl accents.',
  'A festive magenta and lime combination finished with smooth thread work, green kundan stones, pearl-lined spacers, and gold-toned settings — made for celebrations and special occasions.',
  'Thick magenta statement bangles with floral kundan centres, lime green medium bands with teardrop stones, and maroon pearl companion bangles. Handmade in Sylhet.',
  'stone-mirror', '/images/products/zaria-2.jpg', 'round',
  '[{"name":"Magenta","hex":"#c2185b"},{"name":"Lime Green","hex":"#8fbf3a"},{"name":"Maroon","hex":"#7a2048"}]'::jsonb,
  array['fuchsia','pink','lime','maroon','red','gold','cream'], true, true, true
),
(
  'pori', 'PORI',
  'Magenta and silver mirror stack with sequins and jori shuta — a triple-tone everyday contrast.',
  'Smooth finishing of thread work along with mirror accents, a touch of sequins, and silver jori shuta. A triple colour combination you can match in contrast with your fit of the day.',
  'Magenta silk medium bands with silver wire spiral and chumki, paired with silver jori-shuta companions set with diamond mirrors and sequins. Handmade in Sylhet.',
  'colorful-threads', '/images/products/pori-1.jpg', 'round',
  '[{"name":"Magenta","hex":"#c2185b"},{"name":"Silver","hex":"#c0c0c0"}]'::jsonb,
  array['fuchsia','pink','silver','white','gold','black'], true, true, true
),
(
  'emerald-bloom', 'Emerald Bloom',
  'Deep green thread paired with delicate stones and metallic details.',
  'A rich emerald-inspired combination with soft metallic accents.',
  'Deep green silk wrap with gold accents.',
  'stone-mirror', null, 'round',
  '[{"name":"Emerald","hex":"#2d5a4a"},{"name":"Gold","hex":"#c4a574"},{"name":"Cream","hex":"#f0e6d8"}]'::jsonb,
  array['emerald','lime','gold','cream'], true, false, false
),
(
  'lavender-spark', 'Lavender Spark',
  'Soft lavender tones finished with delicate decorative stones.',
  'A soft lavender mood with gentle sparkle — perfect for lighter outfits.',
  'Lavender thread with soft silver sparkle and blush accents.',
  'colorful-threads', null, 'round',
  '[{"name":"Lavender","hex":"#a78bbf"},{"name":"Silver","hex":"#c0c0c0"},{"name":"Blush","hex":"#d4a5a5"}]'::jsonb,
  array['lavender','purple','pink','silver'], true, false, false
),
(
  'blush-gold', 'Blush & Gold',
  'A soft pink and gold combination designed for an elegant finish.',
  'Warm blush tones with muted gold accents — everyday to occasion.',
  'Blush silk with muted gold metallic accents.',
  'modern-minimal', null, 'round',
  '[{"name":"Blush","hex":"#d4a5a5"},{"name":"Gold","hex":"#c4a574"},{"name":"Cream","hex":"#f0e6d8"}]'::jsonb,
  array['pink','gold','cream','white'], true, false, false
),
(
  'royal-muse', 'Royal Muse',
  'Rich statement stack with bold stonework and metallic shine.',
  'A richer statement look for evenings and celebrations.',
  'Royal blue with gold and silver accents.',
  'stone-mirror', null, 'round',
  '[{"name":"Royal Blue","hex":"#1e3a8a"},{"name":"Gold","hex":"#c4a574"},{"name":"Silver","hex":"#c0c0c0"}]'::jsonb,
  array['royal-blue','navy','gold','silver'], true, false, false
)
on conflict (slug) do update set
  name = excluded.name,
  short_description = excluded.short_description,
  description = excluded.description,
  design_details = excluded.design_details,
  category = excluded.category,
  shape = excluded.shape,
  color_palette = excluded.color_palette,
  available_colors = excluded.available_colors,
  is_customizable = excluded.is_customizable,
  is_active = excluded.is_active,
  is_featured = excluded.is_featured,
  updated_at = now();

-- Variants for each product (full_stack / big / small)
insert into public.product_variants (product_id, variant_type, name, description, price, available_sizes, is_available)
select p.id, v.variant_type, v.name, v.description, v.price, array['2.2','2.4','2.6','2.8'], true
from public.products p
cross join lateral (
  values
    ('full_stack', 'Full Stack', 'Get the complete matching bangle set.',
      case p.slug
        when 'ohona' then 1200
        when 'ohona-2-0' then 350
        when 'charkona-kakan' then 1100
        when 'neela' then 1500
        when 'dahlia' then 1400
        when 'siya' then 250
        when 'zaria' then 600
        when 'pori' then 400
        when 'emerald-bloom' then 1300
        when 'lavender-spark' then 1250
        when 'blush-gold' then 1350
        when 'royal-muse' then 1600
        else 1200
      end::numeric),
    ('big', 'Big Bangle', 'Purchase only the larger statement bangle.',
      case p.slug
        when 'siya' then 100
        when 'zaria' then 100
        when 'ohona-2-0' then 150
        else round(
          case p.slug
            when 'ohona' then 1200
            when 'charkona-kakan' then 1100
            when 'neela' then 1500
            when 'dahlia' then 1400
            when 'emerald-bloom' then 1300
            when 'lavender-spark' then 1250
            when 'blush-gold' then 1350
            when 'royal-muse' then 1600
            else 1200
          end * 0.45
        )
      end::numeric),
    ('small', 'Small Bangle', 'Purchase only the smaller matching bangle.',
      case p.slug
        when 'siya' then 75
        when 'zaria' then 50
        when 'ohona-2-0' then 100
        when 'pori' then 50
        else round(
          case p.slug
            when 'ohona' then 1200
            when 'charkona-kakan' then 1100
            when 'neela' then 1500
            when 'dahlia' then 1400
            when 'emerald-bloom' then 1300
            when 'lavender-spark' then 1250
            when 'blush-gold' then 1350
            when 'royal-muse' then 1600
            else 1200
          end * 0.25
        )
      end::numeric)
) as v(variant_type, name, description, price)
where not (p.slug = 'pori' and v.variant_type = 'big')
on conflict (product_id, variant_type) do update set
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  available_sizes = excluded.available_sizes,
  is_available = excluded.is_available,
  updated_at = now();

-- Medium bangle variants (Zaria, Pori)
insert into public.product_variants (product_id, variant_type, name, description, price, available_sizes, is_available)
select p.id, 'medium', 'Medium Bangle', 'Purchase only the medium-width bangle.',
  case p.slug when 'pori' then 100 else 75 end,
  array['2.2','2.4','2.6','2.8'], true
from public.products p
where p.slug in ('zaria', 'pori')
on conflict (product_id, variant_type) do update set
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  available_sizes = excluded.available_sizes,
  is_available = excluded.is_available,
  updated_at = now();


-- =============================================================================
-- Advance payment (see also migrations/20260825190000_advance_payment.sql)
-- For a brand-new database, run migrations in order via supabase db push.
-- =============================================================================

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

-- ---------------------------------------------------------------------------
-- place_order: payment_pending + token + advance = delivery charge
-- with server-side price & shipping validation
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

  if abs(p_subtotal - v_calculated_subtotal) > 0.01 then
    raise exception 'INVALID_SUBTOTAL' using errcode = 'P0001';
  end if;

  v_calculated_delivery := public.calculate_server_delivery_charge(
    p_delivery->>'district_id',
    p_delivery->>'district',
    v_total_qty
  );

  if abs(p_delivery_charge - v_calculated_delivery) > 0.01 then
    raise exception 'INVALID_DELIVERY_CHARGE' using errcode = 'P0001';
  end if;

  if abs(p_total - (p_subtotal + p_delivery_charge)) > 0.01 then
    raise exception 'INVALID_TOTALS' using errcode = 'P0001';
  end if;

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

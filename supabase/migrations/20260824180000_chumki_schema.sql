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
  variant_type text not null check (variant_type in ('full_stack', 'big', 'small')),
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
  shape, color_palette, available_colors, is_customizable, is_active, is_featured
) values
(
  'ohona', 'OHONA',
  'Smooth finishing thread work in a black and silver Y2K-inspired stack.',
  'Smooth finishing thread work with a black and silver combination in a soft Y2K style — made to match your everyday fit.',
  'Silk-thread wrapped stack with silver sequin vine details and mirror accents. Handmade in Sylhet.',
  'modern-minimal', 'round',
  '[{"name":"Black","hex":"#1a1a1a"},{"name":"Silver","hex":"#c0c0c0"}]'::jsonb,
  array['black','silver','white','gold'], true, true, true
),
(
  'charkona-kakan', 'Charkona Kakan',
  'Square silk-wrapped bangles with silver chumki and soothing jhunjhuri.',
  'Beautifully sequenced with silver chumki and jhunjhuri, finished with smooth silk thread. Choose your own colour and stack.',
  'Square frames with rounded corners, silver sequins, and corner bells.',
  'traditional', 'square',
  '[{"name":"Lavender","hex":"#a78bbf"},{"name":"Fuchsia","hex":"#d9468f"},{"name":"Lime","hex":"#8fbf3a"},{"name":"Black","hex":"#1a1a1a"}]'::jsonb,
  array['lavender','pink','lime','black','red','emerald','gold'], true, true, true
),
(
  'neela', 'NEELA',
  'Vibrant navy kundan work with soft off-white contrast stacks.',
  'Smooth finishing of thread work along with kundan in a vibrant blue, set against an off-white contrast.',
  'Navy statement centre with cream companions and gold-toned kundan stone settings.',
  'stone-mirror', 'round',
  '[{"name":"Navy","hex":"#1a2744"},{"name":"Off-White","hex":"#f0e6d8"},{"name":"Gold","hex":"#c4a574"}]'::jsonb,
  array['navy','royal-blue','cream','gold','silver'], true, true, true
),
(
  'dahlia', 'DAHLIA',
  'Fuchsia and lime stacks with kundan sparkle and ghungroo accents.',
  'Beautifully sequenced handmade bangles with kundan and smooth thread finishing.',
  'Bold fuchsia and lime pairing with kundan stones, stars, and soft ghungroo details.',
  'colorful-threads', 'round',
  '[{"name":"Fuchsia","hex":"#d9468f"},{"name":"Lime","hex":"#8fbf3a"},{"name":"Gold","hex":"#c4a574"}]'::jsonb,
  array['fuchsia','lime','pink','emerald','gold'], true, true, false
),
(
  'emerald-bloom', 'Emerald Bloom',
  'Deep green thread paired with delicate stones and metallic details.',
  'A rich emerald-inspired combination with soft metallic accents.',
  'Deep green silk wrap with gold accents.',
  'stone-mirror', 'round',
  '[{"name":"Emerald","hex":"#2d5a4a"},{"name":"Gold","hex":"#c4a574"},{"name":"Cream","hex":"#f0e6d8"}]'::jsonb,
  array['emerald','lime','gold','cream'], true, true, false
),
(
  'lavender-spark', 'Lavender Spark',
  'Soft lavender tones finished with delicate decorative stones.',
  'A soft lavender mood with gentle sparkle — perfect for lighter outfits.',
  'Lavender thread with soft silver sparkle and blush accents.',
  'colorful-threads', 'round',
  '[{"name":"Lavender","hex":"#a78bbf"},{"name":"Silver","hex":"#c0c0c0"},{"name":"Blush","hex":"#d4a5a5"}]'::jsonb,
  array['lavender','purple','pink','silver'], true, true, false
),
(
  'blush-gold', 'Blush & Gold',
  'A soft pink and gold combination designed for an elegant finish.',
  'Warm blush tones with muted gold accents — everyday to occasion.',
  'Blush silk with muted gold metallic accents.',
  'modern-minimal', 'round',
  '[{"name":"Blush","hex":"#d4a5a5"},{"name":"Gold","hex":"#c4a574"},{"name":"Cream","hex":"#f0e6d8"}]'::jsonb,
  array['pink','gold','cream','white'], true, true, false
),
(
  'royal-muse', 'Royal Muse',
  'Rich statement stack with bold stonework and metallic shine.',
  'A richer statement look for evenings and celebrations.',
  'Royal blue with gold and silver accents.',
  'stone-mirror', 'round',
  '[{"name":"Royal Blue","hex":"#1e3a8a"},{"name":"Gold","hex":"#c4a574"},{"name":"Silver","hex":"#c0c0c0"}]'::jsonb,
  array['royal-blue','navy','gold','silver'], true, true, true
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
        when 'charkona-kakan' then 1100
        when 'neela' then 1500
        when 'dahlia' then 1400
        when 'emerald-bloom' then 1300
        when 'lavender-spark' then 1250
        when 'blush-gold' then 1350
        when 'royal-muse' then 1600
        else 1200
      end::numeric),
    ('big', 'Big Bangle', 'Purchase only the larger statement bangle.',
      round(
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
      )::numeric),
    ('small', 'Small Bangle', 'Purchase only the smaller matching bangle.',
      round(
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
      )::numeric)
) as v(variant_type, name, description, price)
on conflict (product_id, variant_type) do update set
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  available_sizes = excluded.available_sizes,
  is_available = excluded.is_available,
  updated_at = now();

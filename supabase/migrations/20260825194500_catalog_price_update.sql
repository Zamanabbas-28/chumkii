-- Catalog price update (2026-08-25)
-- OHONA 350, DAHLIA/NEELA 250, others 300 full stack
-- Charkona Kakan: per piece ৳100 only (disable full_stack + big)

-- Stack products: update full_stack / big / small from stack formula
with prices(slug, stack) as (
  values
    ('ohona', 350::numeric),
    ('dahlia', 250::numeric),
    ('neela', 250::numeric),
    ('emerald-bloom', 300::numeric),
    ('lavender-spark', 300::numeric),
    ('blush-gold', 300::numeric),
    ('royal-muse', 300::numeric)
)
update public.product_variants pv
set
  price = case pv.variant_type
    when 'full_stack' then prices.stack
    when 'big' then round(prices.stack * 0.45)
    when 'small' then round(prices.stack * 0.25)
  end,
  is_available = true,
  updated_at = now()
from public.products p
join prices on prices.slug = p.slug
where pv.product_id = p.id;

-- Charkona: only one sellable option (stored as small / "Per piece")
update public.product_variants pv
set
  price = 100,
  name = 'Per piece',
  description = 'One handmade square bangle — priced per piece.',
  is_available = true,
  updated_at = now()
from public.products p
where pv.product_id = p.id
  and p.slug = 'charkona-kakan'
  and pv.variant_type = 'small';

update public.product_variants pv
set
  is_available = false,
  updated_at = now()
from public.products p
where pv.product_id = p.id
  and p.slug = 'charkona-kakan'
  and pv.variant_type in ('full_stack', 'big');

-- Keep product copy in sync for Charkona
update public.products
set
  description = 'Beautifully sequenced with silver chumki and jhunjhuri, finished with smooth silk thread. Sold per piece.',
  design_details = 'Square frames with rounded corners, silver sequins, and corner bells. Priced ৳100 per piece.',
  updated_at = now()
where slug = 'charkona-kakan';

-- Explicit Big/Small catalog prices (Full Stack unchanged)
-- OHONA big 150 / small 100
-- DAHLIA, NEELA, and remaining stacks: big 100 / small 75

with prices(slug, big_price, small_price) as (
  values
    ('ohona', 150::numeric, 100::numeric),
    ('dahlia', 100::numeric, 75::numeric),
    ('neela', 100::numeric, 75::numeric),
    ('emerald-bloom', 100::numeric, 75::numeric),
    ('lavender-spark', 100::numeric, 75::numeric),
    ('blush-gold', 100::numeric, 75::numeric),
    ('royal-muse', 100::numeric, 75::numeric)
)
update public.product_variants pv
set
  price = case pv.variant_type
    when 'big' then prices.big_price
    when 'small' then prices.small_price
    else pv.price
  end,
  updated_at = now()
from public.products p
join prices on prices.slug = p.slug
where pv.product_id = p.id
  and pv.variant_type in ('big', 'small');

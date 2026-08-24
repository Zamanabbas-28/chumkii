# Chumki Supabase

Project ref: `lsbdjmlvbnqznsebooef`  
URL: `https://lsbdjmlvbnqznsebooef.supabase.co`

## What this folder contains

- `migrations/` — versioned SQL (products, variants, orders, order_items, `generate_order_number`, `place_order` RPC, RLS, seed)
- `schema.sql` — same schema as a single file (handy for SQL Editor paste)
- `config.toml` — local Supabase CLI config

## Frontend env

In the repo root `.env` (see `.env.example`):

```
VITE_SUPABASE_URL=https://lsbdjmlvbnqznsebooef.supabase.co
VITE_SUPABASE_ANON_KEY=<anon public key from Project Settings → API>
```

Never use the **service_role** key in Vite or commit it.

## Apply schema (CLI)

```bash
npx supabase login
npx supabase link --project-ref lsbdjmlvbnqznsebooef
npx supabase db push
```

You may be asked for the database password once (Dashboard → Project Settings → Database).

## Apply schema (SQL Editor)

1. Open Supabase Dashboard → SQL Editor
2. Paste `schema.sql` (or the latest file in `migrations/`)
3. Run

## Security model (guest checkout)

| Resource | Public (anon) |
| --- | --- |
| `products` / `product_variants` | SELECT active / available rows only |
| `orders` / `order_items` | No SELECT / INSERT / UPDATE / DELETE |
| `place_order` RPC | EXECUTE only |

Thank You confirmation uses `sessionStorage` (`chumki-last-order`) plus an optional `?ref=CHM-…` display param. The app does **not** query orders by number from the browser.

## Storage (later)

Product images currently use local placeholders. When you are ready:

1. Create a public Storage bucket (e.g. `product-images`)
2. Upload assets and set `products.base_image` / variant `image` URLs
3. Keep placeholder UI until real URLs are filled in

## Seed note

Seed maps catalog designs (OHONA, Charkona Kakan, etc.) with three variants each:

- DB `full_stack` ↔ frontend `stack` (Full Stack)
- `big` / `small` as on the product page

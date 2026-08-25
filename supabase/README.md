# Chumki Supabase

Project ref: `lsbdjmlvbnqznsebooef`  
URL: `https://lsbdjmlvbnqznsebooef.supabase.co`

## What this folder contains

- `migrations/` — versioned SQL (catalog, orders, advance payment, RPCs, RLS, seed, storage)
- `schema.sql` — combined reference SQL (prefer `db push` for live updates)
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

## Advance payment overview

1. Customer places order → `place_order` creates order with status **`payment_pending`**, `advance_amount = delivery_charge`, and a secret **`payment_token`**.
2. Customer opens `/payment/:orderNumber?token=…` → `get_order_for_payment` returns a safe summary.
3. Customer uploads a screenshot to the private **`payment-proofs`** bucket under `{order_id}/…`.
4. Customer submits → `submit_payment_proof` inserts a `payments` row (`verification_pending`) and sets order status to **`payment_verification`**.
5. Store owner verifies later (admin UI not built yet) → set payment `verified` and order `confirmed`.

### Order statuses (customer labels)

| Internal | Customer display |
| --- | --- |
| `payment_pending` | Payment Required |
| `payment_verification` | Awaiting Verification |
| `confirmed` | Order Confirmed |
| `in_production` | Preparing Your Chumki |
| `ready_for_delivery` | Ready for Delivery |
| `shipped` | On the Way |
| `delivered` | Delivered |
| `cancelled` | Cancelled |

### Payment statuses

| Internal | Meaning |
| --- | --- |
| `pending_submission` | Not submitted yet (app-side) |
| `verification_pending` | Screenshot received; awaiting review |
| `verified` | Owner confirmed |
| `rejected` | Owner rejected; customer may resubmit |

Guests **cannot** set `verified` / `confirmed` from the frontend. Only `submit_payment_proof` may move an order to `payment_verification`.

## Payment-proofs storage bucket

The migration creates a **private** bucket `payment-proofs` (max 5 MB; jpeg/png/webp).

If the bucket is missing in the Dashboard:

1. Storage → New bucket → name `payment-proofs` → **Private**
2. File size limit 5 MB; restrict mime types to images
3. Policies (also in the migration):
   - **INSERT** for `anon` / `authenticated` only when the first path folder is an order UUID
   - **No public SELECT** — do not make the bucket public
   - Admins should view files with **signed URLs** (service role / future admin app)

Path format: `{order_uuid}/{timestamp}-{uuid}.jpg`

`submit_payment_proof` rejects any `payment_proof_path` that does not start with that order’s UUID.

## Security model (guest checkout)

| Resource | Public (anon) |
| --- | --- |
| `products` / `product_variants` | SELECT active / available rows only |
| `orders` / `order_items` / `payments` | No SELECT / INSERT / UPDATE / DELETE |
| `place_order` | EXECUTE |
| `get_order_for_payment` | EXECUTE (requires order number + payment_token) |
| `submit_payment_proof` | EXECUTE (token-gated; cannot verify) |
| Storage `payment-proofs` | INSERT only (UUID folder); no public read |

Thank You confirmation uses `sessionStorage` (`chumki-last-order`) plus an optional `?ref=CHM-…` display param. There is **no** public order lookup by order number alone.

## Future admin verification (manual for now)

In SQL Editor / future dashboard, for a payment awaiting review:

```sql
-- Verify
update public.payments
set payment_status = 'verified', verified_at = now(), verified_by = 'owner'
where id = '<payment_id>';

update public.orders
set status = 'confirmed'
where id = '<order_id>';

-- Reject (customer can upload again)
update public.payments
set payment_status = 'rejected',
    rejection_reason = 'Could not match transaction'
where id = '<payment_id>';
-- Leave order as payment_verification (or payment_pending); do not delete the order
```

## Product images (later)

Catalog still uses local placeholders. When ready, add a separate public bucket for product photos — keep it separate from private payment proofs.

## Seed note

Seed maps catalog designs with three variants each:

- DB `full_stack` ↔ frontend `stack` (Full Stack)
- `big` / `small` as on the product page

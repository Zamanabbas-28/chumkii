# Chumki — handmade customized bangles (Sylhet)

Vite + React shop with guest checkout backed by Supabase.

## Setup

1. Copy env file and fill in your project values:

```bash
cp .env.example .env
```

```
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Use the **anon** (public) key only. Never put the service_role key in the frontend or commit `.env`.

2. Install and run:

```bash
npm install
npm run dev
```

## Supabase

Schema, seed, RLS, and the `place_order` RPC live under [`supabase/`](supabase/).

See [`supabase/README.md`](supabase/README.md) for linking the CLI and applying migrations.

**Products** load from Supabase first; if the fetch fails or the catalog is empty, the app falls back to [`src/data/products.js`](src/data/products.js).

**Orders** are created through the secure `place_order` RPC (guest checkout). After Place Order, customers complete an **advance payment** (delivery charge only) at `/payment/:orderNumber`, upload a private screenshot proof, then see Thank You with status **Awaiting Verification**. There is no public order lookup by order number alone.

See [`supabase/README.md`](supabase/README.md) for payment statuses, the private `payment-proofs` bucket, and how a future admin can verify or reject payments.

## Scripts

- `npm run dev` — local Vite server
- `npm run build` — production build
- `npm run preview` — preview the build

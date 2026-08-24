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

**Orders** are created only through the secure `place_order` RPC (guest checkout). The Thank You page reads confirmation from `sessionStorage` — there is no public order lookup by order number.

## Scripts

- `npm run dev` — local Vite server
- `npm run build` — production build
- `npm run preview` — preview the build

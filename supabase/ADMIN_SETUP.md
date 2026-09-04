# Chumki Admin Dashboard Setup

## Access

- Login: `https://chumkii.vercel.app/admin/login` (or local `/admin/login`)
- Admin email: `noxshiniii@gmail.com`

## 1. Apply database migration

```bash
npx supabase login
npx supabase link --project-ref lsbdjmlvbnqznsebooef
npx supabase db push
```

Or paste / run the SQL from:

`supabase/migrations/20260904190000_admin_dashboard.sql`

in the Supabase **SQL Editor**.

## 2. Create the admin Auth user

1. Supabase Dashboard → **Authentication** → **Users** → **Add user**
2. Email: `noxshiniii@gmail.com`
3. Set a strong password (do not commit it to git)
4. Confirm email if your project requires it (or disable confirm for this user)

Then promote to admin:

```sql
insert into public.profiles (id, email, role)
select id, email, 'admin'
from auth.users
where lower(email) = lower('noxshiniii@gmail.com')
on conflict (id) do update
  set role = 'admin', email = excluded.email;
```

## 3. Enable Realtime (recommended)

Supabase Dashboard → **Database** → **Replication** (or Realtime):

Enable for tables:

- `notifications`
- `orders` (optional)
- `payments` (optional)

## 4. Email notifications (Resend)

1. Create an API key at [resend.com](https://resend.com)
2. Deploy the Edge Function:

```bash
npx supabase functions deploy notify-admin
```

3. Set secrets:

```bash
npx supabase secrets set RESEND_API_KEY=re_xxx
npx supabase secrets set ADMIN_NOTIFICATION_EMAIL=noxshiniii@gmail.com
npx supabase secrets set ADMIN_SITE_URL=https://chumkii.vercel.app
# optional after domain verify:
# npx supabase secrets set RESEND_FROM="Chumki <orders@yourdomain.com>"
```

4. Database Webhook (Dashboard → Database → Webhooks):

- Table: `notifications`
- Events: `INSERT`
- Type: Supabase Edge Function → `notify-admin`

The function only emails for `new_order` and `payment_proof` types.

Until Resend is configured, the **admin UI and in-app notifications still work**.

## 5. Payment screenshots

Bucket `payment-proofs` stays **private**. Admins view proofs via short-lived signed URLs after login.

## Security notes

- Never put `service_role` or `RESEND_API_KEY` in `VITE_*` env vars
- Customers cannot verify payments or list all orders (RLS + `is_admin()` RPCs)
- Payment attempt history is kept in the existing `payments` table (multiple rows per order)

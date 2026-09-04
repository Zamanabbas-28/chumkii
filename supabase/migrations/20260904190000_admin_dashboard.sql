-- =============================================================================
-- Chumki Admin Dashboard: profiles, notifications, history, notes, audit,
-- admin RPCs, RLS, storage SELECT for admins, notification triggers
-- =============================================================================

create extension if not exists "pgcrypto" with schema extensions;

-- ---------------------------------------------------------------------------
-- profiles (admin allowlist)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  role text check (role is null or role = 'admin'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists profiles_email_idx on public.profiles (email);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, null)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null check (
    type in (
      'new_order',
      'payment_proof',
      'payment_verified',
      'payment_rejected',
      'status_changed'
    )
  ),
  order_id uuid references public.orders (id) on delete set null,
  title text not null,
  message text not null default '',
  payload jsonb not null default '{}'::jsonb,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_read_created_idx
  on public.notifications (read, created_at desc);
create index if not exists notifications_order_id_idx
  on public.notifications (order_id);
create index if not exists notifications_created_at_idx
  on public.notifications (created_at desc);

-- ---------------------------------------------------------------------------
-- order_status_history
-- ---------------------------------------------------------------------------
create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  old_status text,
  new_status text not null,
  changed_by uuid references auth.users (id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists order_status_history_order_id_idx
  on public.order_status_history (order_id, created_at desc);

-- ---------------------------------------------------------------------------
-- order_notes (admin-only)
-- ---------------------------------------------------------------------------
create table if not exists public.order_notes (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  admin_id uuid references auth.users (id) on delete set null,
  note text not null,
  created_at timestamptz not null default now()
);

create index if not exists order_notes_order_id_idx
  on public.order_notes (order_id, created_at desc);

-- ---------------------------------------------------------------------------
-- audit_logs
-- ---------------------------------------------------------------------------
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users (id) on delete set null,
  action text not null,
  order_id uuid references public.orders (id) on delete set null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_created_at_idx
  on public.audit_logs (created_at desc);
create index if not exists audit_logs_order_id_idx
  on public.audit_logs (order_id);

-- ---------------------------------------------------------------------------
-- app_settings
-- ---------------------------------------------------------------------------
create table if not exists public.app_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

insert into public.app_settings (key, value)
values ('admin_notification_email', 'noxshiniii@gmail.com')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- is_admin()
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, anon;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.notifications enable row level security;
alter table public.order_status_history enable row level security;
alter table public.order_notes enable row level security;
alter table public.audit_logs enable row level security;
alter table public.app_settings enable row level security;

drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile"
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists "Admins update profiles" on public.profiles;
create policy "Admins update profiles"
  on public.profiles for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins read orders" on public.orders;
create policy "Admins read orders"
  on public.orders for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Admins read order_items" on public.order_items;
create policy "Admins read order_items"
  on public.order_items for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Admins read payments" on public.payments;
create policy "Admins read payments"
  on public.payments for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Admins read notifications" on public.notifications;
create policy "Admins read notifications"
  on public.notifications for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Admins update notifications" on public.notifications;
create policy "Admins update notifications"
  on public.notifications for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins read status history" on public.order_status_history;
create policy "Admins read status history"
  on public.order_status_history for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Admins read order notes" on public.order_notes;
create policy "Admins read order notes"
  on public.order_notes for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Admins read audit logs" on public.audit_logs;
create policy "Admins read audit logs"
  on public.audit_logs for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Admins read app settings" on public.app_settings;
create policy "Admins read app settings"
  on public.app_settings for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Admins update app settings" on public.app_settings;
create policy "Admins update app settings"
  on public.app_settings for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins insert app settings" on public.app_settings;
create policy "Admins insert app settings"
  on public.app_settings for insert
  to authenticated
  with check (public.is_admin());

-- Storage: admins can SELECT payment proofs (for signed URLs)
drop policy if exists "Admins read payment proofs" on storage.objects;
create policy "Admins read payment proofs"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'payment-proofs'
    and public.is_admin()
  );

-- ---------------------------------------------------------------------------
-- Notification helpers + triggers
-- ---------------------------------------------------------------------------
create or replace function public.notify_admin_new_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (type, order_id, title, message, payload)
  values (
    'new_order',
    new.id,
    'New Order',
    'Order ' || new.order_number || ' — ৳' || trim(to_char(new.total, 'FM999999990.00')),
    jsonb_build_object(
      'order_number', new.order_number,
      'customer_name', new.customer_name,
      'total', new.total,
      'status', new.status
    )
  );
  insert into public.order_status_history (order_id, old_status, new_status, note)
  values (new.id, null, new.status, 'Order placed');
  return new;
end;
$$;

drop trigger if exists orders_notify_admin on public.orders;
create trigger orders_notify_admin
  after insert on public.orders
  for each row execute function public.notify_admin_new_order();

create or replace function public.notify_admin_payment_proof()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
begin
  if new.payment_status <> 'verification_pending' then
    return new;
  end if;

  select * into v_order from public.orders where id = new.order_id;

  insert into public.notifications (type, order_id, title, message, payload)
  values (
    'payment_proof',
    new.order_id,
    'Payment Proof Submitted',
    'Order ' || coalesce(v_order.order_number, '') || ' — ৳' ||
      trim(to_char(new.payment_amount, 'FM999999990.00')) || ' via ' || new.payment_method,
    jsonb_build_object(
      'order_number', v_order.order_number,
      'payment_id', new.id,
      'payment_method', new.payment_method,
      'payment_amount', new.payment_amount,
      'transaction_id', new.transaction_id
    )
  );
  return new;
end;
$$;

drop trigger if exists payments_notify_admin on public.payments;
create trigger payments_notify_admin
  after insert on public.payments
  for each row execute function public.notify_admin_payment_proof();

-- ---------------------------------------------------------------------------
-- Allowed status transitions
-- ---------------------------------------------------------------------------
create or replace function public.admin_can_transition(p_from text, p_to text)
returns boolean
language plpgsql
immutable
as $$
begin
  if p_from = p_to then
    return false;
  end if;
  if p_to = 'cancelled' and p_from not in ('delivered', 'cancelled') then
    return true;
  end if;
  return case p_from
    when 'payment_pending' then p_to in ('payment_verification', 'cancelled')
    when 'payment_verification' then p_to in ('confirmed', 'payment_pending', 'cancelled')
    when 'confirmed' then p_to in ('in_production', 'cancelled')
    when 'in_production' then p_to in ('ready_for_delivery', 'cancelled')
    when 'ready_for_delivery' then p_to in ('shipped', 'cancelled')
    when 'shipped' then p_to in ('delivered', 'cancelled')
    when 'delivered' then false
    when 'cancelled' then false
    else false
  end;
end;
$$;

-- ---------------------------------------------------------------------------
-- admin_dashboard_stats
-- ---------------------------------------------------------------------------
create or replace function public.admin_dashboard_stats()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := (now() at time zone 'Asia/Dhaka')::date;
  v_result jsonb;
begin
  if not public.is_admin() then
    raise exception 'UNAUTHORIZED' using errcode = 'P0001';
  end if;

  select jsonb_build_object(
    'by_status', (
      select coalesce(jsonb_object_agg(s.status, s.cnt), '{}'::jsonb)
      from (
        select status, count(*)::int as cnt
        from public.orders
        group by status
      ) s
    ),
    'awaiting_verification', (
      select count(*)::int from public.payments
      where payment_status = 'verification_pending'
    ),
    'total_orders', (select count(*)::int from public.orders),
    'today_orders', (
      select count(*)::int from public.orders
      where (created_at at time zone 'Asia/Dhaka')::date = v_today
    ),
    'today_revenue', (
      select coalesce(sum(total), 0)
      from public.orders
      where (created_at at time zone 'Asia/Dhaka')::date = v_today
        and status not in ('cancelled')
    ),
    'recent_orders', (
      select coalesce(jsonb_agg(row_to_json(r)::jsonb), '[]'::jsonb)
      from (
        select
          o.id,
          o.order_number,
          o.customer_name,
          o.created_at,
          o.total,
          o.status,
          (
            select count(*)::int from public.order_items oi where oi.order_id = o.id
          ) as item_count,
          (
            select p.payment_status
            from public.payments p
            where p.order_id = o.id
            order by p.created_at desc
            limit 1
          ) as payment_status
        from public.orders o
        order by o.created_at desc
        limit 8
      ) r
    )
  ) into v_result;

  return v_result;
end;
$$;

revoke all on function public.admin_dashboard_stats() from public;
grant execute on function public.admin_dashboard_stats() to authenticated;

-- ---------------------------------------------------------------------------
-- admin_list_orders
-- ---------------------------------------------------------------------------
create or replace function public.admin_list_orders(
  p_search text default null,
  p_status text default null,
  p_payment_status text default null,
  p_date_from timestamptz default null,
  p_date_to timestamptz default null,
  p_page int default 1,
  p_page_size int default 20
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_page int := greatest(coalesce(p_page, 1), 1);
  v_size int := least(greatest(coalesce(p_page_size, 20), 1), 50);
  v_offset int;
  v_total int;
  v_q text;
  v_rows jsonb;
begin
  if not public.is_admin() then
    raise exception 'UNAUTHORIZED' using errcode = 'P0001';
  end if;

  v_offset := (v_page - 1) * v_size;
  v_q := nullif(trim(coalesce(p_search, '')), '');

  select count(*)::int into v_total
  from public.orders o
  where (p_status is null or p_status = '' or o.status = p_status)
    and (p_date_from is null or o.created_at >= p_date_from)
    and (p_date_to is null or o.created_at < p_date_to)
    and (
      v_q is null
      or o.order_number ilike '%' || v_q || '%'
      or o.customer_name ilike '%' || v_q || '%'
      or o.phone ilike '%' || v_q || '%'
      or exists (
        select 1 from public.payments p
        where p.order_id = o.id
          and p.transaction_id ilike '%' || v_q || '%'
      )
    )
    and (
      p_payment_status is null or p_payment_status = ''
      or (
        p_payment_status = 'unpaid'
        and not exists (select 1 from public.payments p where p.order_id = o.id)
      )
      or exists (
        select 1 from public.payments p
        where p.order_id = o.id
          and p.payment_status = p_payment_status
          and p.created_at = (
            select max(p2.created_at) from public.payments p2 where p2.order_id = o.id
          )
      )
    );

  select coalesce(jsonb_agg(row_to_json(r)::jsonb), '[]'::jsonb) into v_rows
  from (
    select
      o.id,
      o.order_number,
      o.customer_name,
      o.phone,
      o.created_at,
      o.subtotal,
      o.delivery_charge,
      o.total,
      o.status,
      o.advance_amount,
      (
        select count(*)::int from public.order_items oi where oi.order_id = o.id
      ) as item_count,
      (
        select p.payment_status
        from public.payments p
        where p.order_id = o.id
        order by p.created_at desc
        limit 1
      ) as payment_status,
      (
        select p.payment_method
        from public.payments p
        where p.order_id = o.id
        order by p.created_at desc
        limit 1
      ) as payment_method
    from public.orders o
    where (p_status is null or p_status = '' or o.status = p_status)
      and (p_date_from is null or o.created_at >= p_date_from)
      and (p_date_to is null or o.created_at < p_date_to)
      and (
        v_q is null
        or o.order_number ilike '%' || v_q || '%'
        or o.customer_name ilike '%' || v_q || '%'
        or o.phone ilike '%' || v_q || '%'
        or exists (
          select 1 from public.payments p
          where p.order_id = o.id
            and p.transaction_id ilike '%' || v_q || '%'
        )
      )
      and (
        p_payment_status is null or p_payment_status = ''
        or (
          p_payment_status = 'unpaid'
          and not exists (select 1 from public.payments p where p.order_id = o.id)
        )
        or exists (
          select 1 from public.payments p
          where p.order_id = o.id
            and p.payment_status = p_payment_status
            and p.created_at = (
              select max(p2.created_at) from public.payments p2 where p2.order_id = o.id
            )
        )
      )
    order by o.created_at desc
    offset v_offset
    limit v_size
  ) r;

  return jsonb_build_object(
    'total', v_total,
    'page', v_page,
    'page_size', v_size,
    'orders', v_rows
  );
end;
$$;

revoke all on function public.admin_list_orders(text, text, text, timestamptz, timestamptz, int, int) from public;
grant execute on function public.admin_list_orders(text, text, text, timestamptz, timestamptz, int, int) to authenticated;

-- ---------------------------------------------------------------------------
-- admin_get_order
-- ---------------------------------------------------------------------------
create or replace function public.admin_get_order(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
begin
  if not public.is_admin() then
    raise exception 'UNAUTHORIZED' using errcode = 'P0001';
  end if;

  select * into v_order from public.orders where id = p_order_id;
  if not found then
    raise exception 'ORDER_NOT_FOUND' using errcode = 'P0001';
  end if;

  return jsonb_build_object(
    'order', row_to_json(v_order)::jsonb,
    'items', (
      select coalesce(jsonb_agg(row_to_json(i)::jsonb order by i.created_at), '[]'::jsonb)
      from public.order_items i
      where i.order_id = p_order_id
    ),
    'payments', (
      select coalesce(jsonb_agg(row_to_json(p)::jsonb order by p.created_at desc), '[]'::jsonb)
      from public.payments p
      where p.order_id = p_order_id
    ),
    'status_history', (
      select coalesce(jsonb_agg(row_to_json(h)::jsonb order by h.created_at), '[]'::jsonb)
      from public.order_status_history h
      where h.order_id = p_order_id
    ),
    'notes', (
      select coalesce(jsonb_agg(row_to_json(n)::jsonb order by n.created_at desc), '[]'::jsonb)
      from public.order_notes n
      where n.order_id = p_order_id
    )
  );
end;
$$;

revoke all on function public.admin_get_order(uuid) from public;
grant execute on function public.admin_get_order(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- admin_list_payment_queue
-- ---------------------------------------------------------------------------
create or replace function public.admin_list_payment_queue(
  p_page int default 1,
  p_page_size int default 20
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_page int := greatest(coalesce(p_page, 1), 1);
  v_size int := least(greatest(coalesce(p_page_size, 20), 1), 50);
  v_offset int;
  v_total int;
  v_rows jsonb;
begin
  if not public.is_admin() then
    raise exception 'UNAUTHORIZED' using errcode = 'P0001';
  end if;

  v_offset := (v_page - 1) * v_size;

  select count(*)::int into v_total
  from public.payments
  where payment_status = 'verification_pending';

  select coalesce(jsonb_agg(row_to_json(r)::jsonb), '[]'::jsonb) into v_rows
  from (
    select
      p.id as payment_id,
      p.order_id,
      p.payment_method,
      p.payment_amount,
      p.transaction_id,
      p.payment_proof_path,
      p.payment_status,
      p.created_at,
      o.order_number,
      o.customer_name,
      o.phone,
      o.total,
      o.status as order_status
    from public.payments p
    join public.orders o on o.id = p.order_id
    where p.payment_status = 'verification_pending'
    order by p.created_at desc
    offset v_offset
    limit v_size
  ) r;

  return jsonb_build_object(
    'total', v_total,
    'page', v_page,
    'page_size', v_size,
    'payments', v_rows
  );
end;
$$;

revoke all on function public.admin_list_payment_queue(int, int) from public;
grant execute on function public.admin_list_payment_queue(int, int) to authenticated;

-- ---------------------------------------------------------------------------
-- admin_verify_payment
-- ---------------------------------------------------------------------------
create or replace function public.admin_verify_payment(p_payment_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.payments%rowtype;
  v_order public.orders%rowtype;
  v_old text;
begin
  if not public.is_admin() then
    raise exception 'UNAUTHORIZED' using errcode = 'P0001';
  end if;

  select * into v_payment from public.payments where id = p_payment_id for update;
  if not found then
    raise exception 'PAYMENT_NOT_FOUND' using errcode = 'P0001';
  end if;
  if v_payment.payment_status <> 'verification_pending' then
    raise exception 'INVALID_PAYMENT_STATUS' using errcode = 'P0001';
  end if;

  select * into v_order from public.orders where id = v_payment.order_id for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND' using errcode = 'P0001';
  end if;

  update public.payments
  set
    payment_status = 'verified',
    verified_at = now(),
    verified_by = auth.uid()::text,
    updated_at = now()
  where id = p_payment_id
  returning * into v_payment;

  v_old := v_order.status;
  if v_order.status in ('payment_pending', 'payment_verification') then
    update public.orders
    set status = 'confirmed', updated_at = now()
    where id = v_order.id
    returning * into v_order;

    insert into public.order_status_history (order_id, old_status, new_status, changed_by, note)
    values (v_order.id, v_old, 'confirmed', auth.uid(), 'Payment verified');
  end if;

  insert into public.audit_logs (admin_id, action, order_id, meta)
  values (
    auth.uid(),
    'payment_verified',
    v_order.id,
    jsonb_build_object('payment_id', p_payment_id)
  );

  insert into public.notifications (type, order_id, title, message, payload)
  values (
    'payment_verified',
    v_order.id,
    'Payment Verified',
    'Order ' || v_order.order_number || ' payment verified',
    jsonb_build_object('order_number', v_order.order_number, 'payment_id', p_payment_id)
  );

  return jsonb_build_object(
    'ok', true,
    'payment', row_to_json(v_payment)::jsonb,
    'order_status', v_order.status
  );
end;
$$;

revoke all on function public.admin_verify_payment(uuid) from public;
grant execute on function public.admin_verify_payment(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- admin_reject_payment
-- ---------------------------------------------------------------------------
create or replace function public.admin_reject_payment(
  p_payment_id uuid,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.payments%rowtype;
  v_order public.orders%rowtype;
  v_reason text;
begin
  if not public.is_admin() then
    raise exception 'UNAUTHORIZED' using errcode = 'P0001';
  end if;

  v_reason := nullif(trim(coalesce(p_reason, '')), '');

  select * into v_payment from public.payments where id = p_payment_id for update;
  if not found then
    raise exception 'PAYMENT_NOT_FOUND' using errcode = 'P0001';
  end if;
  if v_payment.payment_status <> 'verification_pending' then
    raise exception 'INVALID_PAYMENT_STATUS' using errcode = 'P0001';
  end if;

  select * into v_order from public.orders where id = v_payment.order_id;

  update public.payments
  set
    payment_status = 'rejected',
    rejection_reason = coalesce(v_reason, 'Payment proof could not be verified'),
    updated_at = now()
  where id = p_payment_id
  returning * into v_payment;

  -- Keep order in payment_verification so customer can resubmit
  if v_order.status = 'payment_pending' then
    update public.orders
    set status = 'payment_verification', updated_at = now()
    where id = v_order.id;
  end if;

  insert into public.audit_logs (admin_id, action, order_id, meta)
  values (
    auth.uid(),
    'payment_rejected',
    v_order.id,
    jsonb_build_object('payment_id', p_payment_id, 'reason', v_payment.rejection_reason)
  );

  insert into public.notifications (type, order_id, title, message, payload)
  values (
    'payment_rejected',
    v_order.id,
    'Payment Rejected',
    'Order ' || v_order.order_number || ' payment rejected',
    jsonb_build_object(
      'order_number', v_order.order_number,
      'payment_id', p_payment_id,
      'reason', v_payment.rejection_reason
    )
  );

  return jsonb_build_object('ok', true, 'payment', row_to_json(v_payment)::jsonb);
end;
$$;

revoke all on function public.admin_reject_payment(uuid, text) from public;
grant execute on function public.admin_reject_payment(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- admin_update_order_status
-- ---------------------------------------------------------------------------
create or replace function public.admin_update_order_status(
  p_order_id uuid,
  p_new_status text,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_old text;
  v_new text;
begin
  if not public.is_admin() then
    raise exception 'UNAUTHORIZED' using errcode = 'P0001';
  end if;

  v_new := trim(coalesce(p_new_status, ''));
  if v_new not in (
    'payment_pending', 'payment_verification', 'confirmed', 'in_production',
    'ready_for_delivery', 'shipped', 'delivered', 'cancelled'
  ) then
    raise exception 'INVALID_STATUS' using errcode = 'P0001';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND' using errcode = 'P0001';
  end if;

  v_old := v_order.status;
  if not public.admin_can_transition(v_old, v_new) then
    raise exception 'INVALID_TRANSITION' using errcode = 'P0001';
  end if;

  -- Require verified payment before confirming / production path
  if v_new = 'confirmed' and not exists (
    select 1 from public.payments
    where order_id = p_order_id and payment_status = 'verified'
  ) then
    raise exception 'PAYMENT_NOT_VERIFIED' using errcode = 'P0001';
  end if;

  update public.orders
  set status = v_new, updated_at = now()
  where id = p_order_id
  returning * into v_order;

  insert into public.order_status_history (order_id, old_status, new_status, changed_by, note)
  values (p_order_id, v_old, v_new, auth.uid(), nullif(trim(coalesce(p_note, '')), ''));

  insert into public.audit_logs (admin_id, action, order_id, meta)
  values (
    auth.uid(),
    'status_changed',
    p_order_id,
    jsonb_build_object('old_status', v_old, 'new_status', v_new)
  );

  insert into public.notifications (type, order_id, title, message, payload)
  values (
    'status_changed',
    p_order_id,
    'Order Status Updated',
    'Order ' || v_order.order_number || ' → ' || v_new,
    jsonb_build_object('order_number', v_order.order_number, 'old_status', v_old, 'new_status', v_new)
  );

  return jsonb_build_object('ok', true, 'order', row_to_json(v_order)::jsonb);
end;
$$;

revoke all on function public.admin_update_order_status(uuid, text, text) from public;
grant execute on function public.admin_update_order_status(uuid, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- admin_add_order_note
-- ---------------------------------------------------------------------------
create or replace function public.admin_add_order_note(
  p_order_id uuid,
  p_note text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_note text;
  v_row public.order_notes%rowtype;
begin
  if not public.is_admin() then
    raise exception 'UNAUTHORIZED' using errcode = 'P0001';
  end if;

  v_note := nullif(trim(coalesce(p_note, '')), '');
  if v_note is null then
    raise exception 'INVALID_NOTE' using errcode = 'P0001';
  end if;

  if not exists (select 1 from public.orders where id = p_order_id) then
    raise exception 'ORDER_NOT_FOUND' using errcode = 'P0001';
  end if;

  insert into public.order_notes (order_id, admin_id, note)
  values (p_order_id, auth.uid(), v_note)
  returning * into v_row;

  insert into public.audit_logs (admin_id, action, order_id, meta)
  values (auth.uid(), 'note_added', p_order_id, jsonb_build_object('note_id', v_row.id));

  return jsonb_build_object('ok', true, 'note', row_to_json(v_row)::jsonb);
end;
$$;

revoke all on function public.admin_add_order_note(uuid, text) from public;
grant execute on function public.admin_add_order_note(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Notifications mark read
-- ---------------------------------------------------------------------------
create or replace function public.admin_mark_notifications_read(p_ids uuid[])
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'UNAUTHORIZED' using errcode = 'P0001';
  end if;

  update public.notifications
  set read = true
  where id = any (p_ids);

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.admin_mark_notifications_read(uuid[]) from public;
grant execute on function public.admin_mark_notifications_read(uuid[]) to authenticated;

create or replace function public.admin_mark_all_notifications_read()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'UNAUTHORIZED' using errcode = 'P0001';
  end if;

  update public.notifications set read = true where read = false;
  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.admin_mark_all_notifications_read() from public;
grant execute on function public.admin_mark_all_notifications_read() to authenticated;

create or replace function public.admin_list_notifications(
  p_limit int default 30,
  p_unread_only boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_limit int := least(greatest(coalesce(p_limit, 30), 1), 100);
  v_rows jsonb;
  v_unread int;
begin
  if not public.is_admin() then
    raise exception 'UNAUTHORIZED' using errcode = 'P0001';
  end if;

  select count(*)::int into v_unread
  from public.notifications where read = false;

  select coalesce(jsonb_agg(row_to_json(n)::jsonb), '[]'::jsonb) into v_rows
  from (
    select *
    from public.notifications
    where (not p_unread_only) or read = false
    order by created_at desc
    limit v_limit
  ) n;

  return jsonb_build_object('unread', v_unread, 'notifications', v_rows);
end;
$$;

revoke all on function public.admin_list_notifications(int, boolean) from public;
grant execute on function public.admin_list_notifications(int, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- admin settings helpers
-- ---------------------------------------------------------------------------
create or replace function public.admin_get_settings()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'UNAUTHORIZED' using errcode = 'P0001';
  end if;

  return coalesce(
    (select jsonb_object_agg(key, value) from public.app_settings),
    '{}'::jsonb
  );
end;
$$;

revoke all on function public.admin_get_settings() from public;
grant execute on function public.admin_get_settings() to authenticated;

create or replace function public.admin_update_setting(p_key text, p_value text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'UNAUTHORIZED' using errcode = 'P0001';
  end if;

  if p_key not in ('admin_notification_email') then
    raise exception 'INVALID_SETTING' using errcode = 'P0001';
  end if;

  insert into public.app_settings (key, value, updated_at)
  values (p_key, trim(p_value), now())
  on conflict (key) do update
    set value = excluded.value, updated_at = now();

  return jsonb_build_object('ok', true, 'key', p_key, 'value', trim(p_value));
end;
$$;

revoke all on function public.admin_update_setting(text, text) from public;
grant execute on function public.admin_update_setting(text, text) to authenticated;

-- Align Sylhet-division districts with frontend: treat as sylhet rate (already)
-- Frontend will map habiganj/moulvibazar/sunamganj to sylhet zone.

-- Promote admin when auth user exists (safe if not yet created)
do $$
begin
  update public.profiles
  set role = 'admin'
  where lower(email) = lower('noxshiniii@gmail.com');
exception when others then
  null;
end;
$$;

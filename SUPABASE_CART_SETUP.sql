-- Cart table setup for persistent shopping cart
-- Run this in Supabase SQL Editor

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid,
  product_id uuid,
  quantity integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Normalize legacy column names if table already exists with old schema
do $$
declare
  legacy_customer_col text;
  legacy_product_col text;
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'cart_items' and column_name = 'customer_id'
  ) then
    select c.column_name
      into legacy_customer_col
    from information_schema.columns c
    where c.table_schema = 'public'
      and c.table_name = 'cart_items'
      and lower(c.column_name) in ('customerid', 'user_id', 'userid')
    limit 1;

    if legacy_customer_col is not null then
      execute format('alter table public.cart_items rename column %I to customer_id', legacy_customer_col);
    end if;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'cart_items' and column_name = 'product_id'
  ) then
    select c.column_name
      into legacy_product_col
    from information_schema.columns c
    where c.table_schema = 'public'
      and c.table_name = 'cart_items'
      and lower(c.column_name) in ('productid', 'product_id')
    limit 1;

    if legacy_product_col is not null and legacy_product_col <> 'product_id' then
      execute format('alter table public.cart_items rename column %I to product_id', legacy_product_col);
    end if;
  end if;
end
$$;

-- Ensure required columns exist
alter table public.cart_items add column if not exists customer_id uuid;
alter table public.cart_items add column if not exists product_id uuid;
alter table public.cart_items add column if not exists quantity integer not null default 1;
alter table public.cart_items add column if not exists created_at timestamptz not null default now();
alter table public.cart_items add column if not exists updated_at timestamptz not null default now();

-- Backfill null quantity values if any legacy rows exist
update public.cart_items set quantity = 1 where quantity is null or quantity <= 0;

-- Remove duplicate customer/product rows before adding unique constraint.
-- Keep the newest row and delete older duplicates.
delete from public.cart_items t
using public.cart_items d
where t.customer_id = d.customer_id
  and t.product_id = d.product_id
  and t.id <> d.id
  and t.updated_at < d.updated_at;

delete from public.cart_items t
using public.cart_items d
where t.customer_id = d.customer_id
  and t.product_id = d.product_id
  and t.id <> d.id
  and t.updated_at = d.updated_at
  and t.id::text < d.id::text;

-- Keep constraints idempotent
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'cart_items_quantity_check'
  ) then
    alter table public.cart_items
      add constraint cart_items_quantity_check check (quantity > 0);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'cart_items_customer_product_unique'
  ) then
    alter table public.cart_items
      add constraint cart_items_customer_product_unique unique (customer_id, product_id);
  end if;
end
$$;

-- Add FKs only when not already present
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'cart_items_customer_fk'
  ) then
    alter table public.cart_items
      add constraint cart_items_customer_fk foreign key (customer_id)
      references public.users(id) on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'cart_items_product_fk'
  ) then
    alter table public.cart_items
      add constraint cart_items_product_fk foreign key (product_id)
      references public.products(id) on delete cascade;
  end if;
end
$$;

create index if not exists idx_cart_items_customer_id on public.cart_items (customer_id);
create index if not exists idx_cart_items_product_id on public.cart_items (product_id);

create or replace function public.set_cart_items_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_cart_items_updated_at on public.cart_items;
create trigger trg_cart_items_updated_at
before update on public.cart_items
for each row
execute function public.set_cart_items_updated_at();

-- Optional: enable RLS only if you plan to access table directly from browser client.
-- API routes using service role key can work without these policies.
-- alter table public.cart_items enable row level security;
-- create policy "customers_manage_their_cart"
-- on public.cart_items
-- for all
-- to authenticated
-- using (customer_id = auth.uid())
-- with check (customer_id = auth.uid());

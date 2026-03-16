-- Seller accounts ledger for commission credits from orders
-- Run this in Supabase SQL Editor

create table if not exists public.seller_accounts (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null unique,
  total_earnings numeric not null default 0 check (total_earnings >= 0),
  available_balance numeric not null default 0 check (available_balance >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint seller_accounts_seller_fk foreign key (seller_id)
    references public.users(id) on delete cascade
);

create index if not exists idx_seller_accounts_seller_id
  on public.seller_accounts (seller_id);

create or replace function public.set_seller_accounts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_seller_accounts_updated_at on public.seller_accounts;
create trigger trg_seller_accounts_updated_at
before update on public.seller_accounts
for each row
execute function public.set_seller_accounts_updated_at();

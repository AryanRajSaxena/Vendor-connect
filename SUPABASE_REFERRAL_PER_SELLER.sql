-- Enforce one referral code per seller across all courses/products
-- Run this in Supabase SQL editor

-- 1) Drop old global unique referral constraint (if present)
alter table public.seller_products
  drop constraint if exists seller_products_referral_code_key;

-- 2) Ensure seller-product pair stays unique
create unique index if not exists seller_products_seller_product_unique_idx
  on public.seller_products (seller_id, product_id);

-- 3) Normalize existing data so each seller uses one referral code
with seller_primary_code as (
  select distinct on (seller_id)
    seller_id,
    referral_code
  from public.seller_products
  where referral_code is not null and referral_code <> ''
  order by seller_id, added_at asc nulls last, id asc
)
update public.seller_products sp
set referral_code = pc.referral_code
from seller_primary_code pc
where sp.seller_id = pc.seller_id
  and sp.referral_code is distinct from pc.referral_code;

-- 4) Backfill missing referral codes with deterministic seller-level value
update public.seller_products
set referral_code = left('SEL' || upper(regexp_replace(seller_id::text, '[^A-Za-z0-9]', '', 'g')), 20)
where referral_code is null or trim(referral_code) = '';

-- 5) Helpful lookup index for order referral resolution
create index if not exists seller_products_referral_product_idx
  on public.seller_products (referral_code, product_id);

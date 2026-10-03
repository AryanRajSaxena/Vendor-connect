-- ============================================================================
-- Migration: Guest Checkout Flow, Database Tables, and Webhook Atomic Processor
-- ============================================================================

-- 1. Create guest_customers table with UNIQUE email constraint
CREATE TABLE IF NOT EXISTS public.guest_customers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email character varying NOT NULL UNIQUE,
  name character varying NOT NULL,
  phone character varying,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT guest_customers_pkey PRIMARY KEY (id)
);

-- 2. Modify orders table to support guest checkouts and payment gateway IDs
-- Allow NULLs for customer_id since guest buyers don't have registered user accounts
ALTER TABLE public.orders ALTER COLUMN customer_id DROP NOT NULL;

-- Add guest_customer_id referencing guest_customers(id)
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS guest_customer_id uuid REFERENCES public.guest_customers(id) ON DELETE SET NULL;

-- Add payment gateway transaction tracking columns
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS payment_gateway_order_id character varying;

ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS payment_gateway_payment_id character varying;

-- 3. Helpful indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_guest_customers_email ON public.guest_customers(email);
CREATE INDEX IF NOT EXISTS idx_orders_guest_customer_id ON public.orders(guest_customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_pg_order_id ON public.orders(payment_gateway_order_id);

-- 4. Atomic PostgreSQL Transaction Function for Successful Checkout / Webhooks
CREATE OR REPLACE FUNCTION public.process_guest_checkout_order(
  p_order_id VARCHAR,
  p_buyer_email VARCHAR,
  p_buyer_name VARCHAR,
  p_buyer_phone VARCHAR,
  p_product_id UUID,
  p_seller_id UUID DEFAULT NULL,
  p_referral_code VARCHAR DEFAULT NULL,
  p_payment_gateway_order_id VARCHAR DEFAULT NULL,
  p_payment_gateway_payment_id VARCHAR DEFAULT NULL,
  p_payment_method VARCHAR DEFAULT 'upi',
  p_quantity INT DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_guest_id UUID;
  v_vendor_id UUID;
  v_final_price NUMERIC;
  v_seller_pct NUMERIC := 10;
  v_platform_pct NUMERIC := 10;
  v_cooling_days INT := 15;
  v_total_amount NUMERIC;
  v_seller_commission NUMERIC := 0;
  v_platform_commission NUMERIC := 0;
  v_vendor_payout NUMERIC := 0;
  v_release_date TIMESTAMP;
  v_matched_seller_id UUID := p_seller_id;
  v_seller_product_id UUID;
  v_customer_details JSONB;
BEGIN
  -- Step 1: Find or Create Guest Customer
  SELECT id INTO v_guest_id 
  FROM public.guest_customers 
  WHERE LOWER(email) = LOWER(TRIM(p_buyer_email));

  IF v_guest_id IS NULL THEN
    INSERT INTO public.guest_customers (email, name, phone)
    VALUES (LOWER(TRIM(p_buyer_email)), TRIM(p_buyer_name), TRIM(p_buyer_phone))
    RETURNING id INTO v_guest_id;
  ELSE
    UPDATE public.guest_customers
    SET name = COALESCE(NULLIF(TRIM(p_buyer_name), ''), name),
        phone = COALESCE(NULLIF(TRIM(p_buyer_phone), ''), phone),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = v_guest_id;
  END IF;

  -- Step 2: Fetch product details
  SELECT vendor_id, COALESCE(final_price, base_price, 0)
  INTO v_vendor_id, v_final_price
  FROM public.products
  WHERE id = p_product_id;

  IF v_vendor_id IS NULL THEN
    RAISE EXCEPTION 'Product with ID % not found', p_product_id;
  END IF;

  -- Step 3: Resolve seller if referral code or seller_id was supplied
  IF v_matched_seller_id IS NULL AND p_referral_code IS NOT NULL AND TRIM(p_referral_code) <> '' THEN
    SELECT seller_id, id INTO v_matched_seller_id, v_seller_product_id
    FROM public.seller_products
    WHERE LOWER(referral_code) = LOWER(TRIM(p_referral_code)) AND product_id = p_product_id
    LIMIT 1;

    IF v_matched_seller_id IS NULL THEN
      SELECT id INTO v_matched_seller_id
      FROM public.sellers
      WHERE id::text = TRIM(p_referral_code)
      LIMIT 1;
    END IF;
  ELSIF v_matched_seller_id IS NOT NULL THEN
    SELECT id INTO v_seller_product_id
    FROM public.seller_products
    WHERE seller_id = v_matched_seller_id AND product_id = p_product_id
    LIMIT 1;
  END IF;

  -- Step 4: Fetch Admin Commission Settings & Calculate Splits
  SELECT 
    COALESCE(seller_commission_percentage, 10),
    COALESCE(platform_commission_percentage, 10),
    COALESCE(commission_cooling_period_days, 15)
  INTO v_seller_pct, v_platform_pct, v_cooling_days
  FROM public.admin_settings
  LIMIT 1;

  v_total_amount := ROUND((v_final_price * p_quantity)::numeric, 2);
  IF v_matched_seller_id IS NOT NULL THEN
    v_seller_commission := ROUND((v_total_amount * (v_seller_pct / 100.0))::numeric, 2);
  ELSE
    v_seller_commission := 0;
  END IF;
  v_platform_commission := ROUND((v_total_amount * (v_platform_pct / 100.0))::numeric, 2);
  v_vendor_payout := ROUND((v_total_amount - v_seller_commission - v_platform_commission)::numeric, 2);
  v_release_date := CURRENT_TIMESTAMP + (v_cooling_days || ' days')::interval;

  v_customer_details := jsonb_build_object(
    'name', TRIM(p_buyer_name),
    'email', LOWER(TRIM(p_buyer_email)),
    'phone', TRIM(p_buyer_phone)
  );

  -- Step 5: Insert the Order
  INSERT INTO public.orders (
    id,
    customer_id,
    guest_customer_id,
    seller_id,
    vendor_id,
    product_id,
    quantity,
    final_price,
    seller_commission,
    platform_commission,
    vendor_payout,
    referral_code,
    customer_details,
    payment_method,
    payment_status,
    order_status,
    commission_status,
    commission_release_date,
    payment_gateway_order_id,
    payment_gateway_payment_id
  ) VALUES (
    p_order_id,
    NULL,
    v_guest_id,
    v_matched_seller_id,
    v_vendor_id,
    p_product_id,
    p_quantity,
    v_total_amount,
    v_seller_commission,
    v_platform_commission,
    v_vendor_payout,
    p_referral_code,
    v_customer_details,
    p_payment_method,
    'completed',
    'confirmed',
    'pending',
    v_release_date,
    p_payment_gateway_order_id,
    p_payment_gateway_payment_id
  );

  -- Step 6: Increment product sold count
  UPDATE public.products
  SET sold_count = COALESCE(sold_count, 0) + p_quantity,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = p_product_id;

  -- Step 7: Update Seller Stats in seller_products
  IF v_matched_seller_id IS NOT NULL THEN
    IF v_seller_product_id IS NOT NULL THEN
      UPDATE public.seller_products
      SET sales = COALESCE(sales, 0) + p_quantity,
          earnings = ROUND((COALESCE(earnings, 0) + v_seller_commission)::numeric, 2)
      WHERE id = v_seller_product_id;
    ELSE
      INSERT INTO public.seller_products (seller_id, product_id, referral_code, sales, earnings)
      VALUES (
        v_matched_seller_id,
        p_product_id,
        COALESCE(p_referral_code, SUBSTRING(v_matched_seller_id::text, 1, 8)),
        p_quantity,
        v_seller_commission
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'guest_customer_id', v_guest_id,
    'seller_id', v_matched_seller_id,
    'vendor_id', v_vendor_id,
    'total_amount', v_total_amount,
    'seller_commission', v_seller_commission,
    'platform_commission', v_platform_commission,
    'vendor_payout', v_vendor_payout
  );
END;
$$;

# Supabase Database Setup Guide

## 📋 Overview

This guide walks you through deploying the VendorConnect database schema to your Supabase project.

**Current Status:**
- ✅ Supabase client configured
- ✅ Credentials added to `src/lib/supabase.ts`
- ❌ Database tables not yet created
- ❌ API routes not yet implemented

---

## 🔑 Your Supabase Credentials

```
Project URL: https://iuuteecnutmqugbjtntg.supabase.co
Anon Key: sb_publishable_0XpZsUiq-Zbx9IYQMEF01A_1UEaFRFK
```

---

## 🚀 Step 1: Access Supabase Dashboard

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Sign in with your account
3. Click on your project: **VendorConnect** (or whatever name you gave it)
4. Navigate to **SQL Editor** (left sidebar)

---

## 📊 Step 2: Create Tables

Copy and paste the following SQL into the Supabase SQL Editor and execute each section:

### Table 1: Users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('vendor', 'seller', 'customer', 'admin')),
  phone VARCHAR(20),
  business_name VARCHAR(255),
  gst_number VARCHAR(20),
  pan_number VARCHAR(20),
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for email lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

### Table 2: Products
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT,
  base_price DECIMAL(10, 2) NOT NULL,
  final_price DECIMAL(10, 2) NOT NULL,
  markup DECIMAL(10, 2) NOT NULL,
  markup_percentage DECIMAL(5, 2) NOT NULL DEFAULT 25,
  images TEXT[],
  specifications JSONB,
  stock INT NOT NULL DEFAULT 0,
  sold_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_products_vendor ON products(vendor_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_active ON products(is_active);
```

### Table 3: Orders
```sql
CREATE TABLE orders (
  id VARCHAR(50) PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES users(id) ON DELETE SET NULL,
  vendor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INT NOT NULL,
  final_price DECIMAL(10, 2) NOT NULL,
  seller_commission DECIMAL(10, 2) NOT NULL,
  platform_commission DECIMAL(10, 2) NOT NULL,
  vendor_payout DECIMAL(10, 2) NOT NULL,
  referral_code VARCHAR(20),
  customer_details JSONB,
  delivery_address JSONB,
  payment_method VARCHAR(50),
  payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed')),
  order_status VARCHAR(50) DEFAULT 'pending' CHECK (order_status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  commission_status VARCHAR(50) DEFAULT 'pending' CHECK (commission_status IN ('pending', 'available', 'paid')),
  commission_release_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_seller ON orders(seller_id);
CREATE INDEX idx_orders_vendor ON orders(vendor_id);
CREATE INDEX idx_orders_product ON orders(product_id);
CREATE INDEX idx_orders_referral ON orders(referral_code);
CREATE INDEX idx_orders_commission_status ON orders(commission_status);
```

### Table 4: Seller Products (Mapping Table)
```sql
CREATE TABLE seller_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  referral_code VARCHAR(20) UNIQUE NOT NULL,
  clicks INT DEFAULT 0,
  sales INT DEFAULT 0,
  earnings DECIMAL(10, 2) DEFAULT 0,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(seller_id, product_id)
);

-- Create indexes
CREATE INDEX idx_seller_products_seller ON seller_products(seller_id);
CREATE INDEX idx_seller_products_product ON seller_products(product_id);
CREATE INDEX idx_seller_products_referral ON seller_products(referral_code);
```

### Table 5: Admin Settings
```sql
CREATE TABLE admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_markup_percentage DECIMAL(5, 2) DEFAULT 25,
  seller_commission_percentage DECIMAL(5, 2) DEFAULT 10,
  platform_commission_percentage DECIMAL(5, 2) DEFAULT 15,
  min_withdrawal_amount DECIMAL(10, 2) DEFAULT 500,
  commission_cooling_period_days INT DEFAULT 15,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT INTO admin_settings (platform_markup_percentage, seller_commission_percentage, platform_commission_percentage, min_withdrawal_amount, commission_cooling_period_days)
VALUES (25, 10, 15, 500, 15);
```

### Table 6: Withdrawal Requests
```sql
CREATE TABLE withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  withdrawal_method VARCHAR(50), -- 'upi' or 'bank'
  upi_id VARCHAR(100),
  bank_account VARCHAR(20),
  bank_ifsc VARCHAR(20),
  bank_name VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  transaction_ref VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_withdrawals_seller ON withdrawal_requests(seller_id);
CREATE INDEX idx_withdrawals_status ON withdrawal_requests(status);
```

### Table 7: Leads
```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  product_id UUID REFERENCES products(id),
  status VARCHAR(50) DEFAULT 'not_contacted' CHECK (status IN ('not_contacted', 'contacted', 'converted', 'not_interested')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_leads_vendor ON leads(vendor_id);
CREATE INDEX idx_leads_seller ON leads(seller_id);
CREATE INDEX idx_leads_status ON leads(status);
```

---

## 🔐 Step 3: Set Row Level Security (RLS) Policies

**IMPORTANT:** After creating tables, enable RLS for security (Optional for MVP, recommended for production)

### Enable RLS for users table:
```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can view their own data
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid() = id OR auth.jwt() ->> 'role' = 'admin');

-- Users can update their own data
CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid() = id);
```

### Enable RLS for orders table:
```sql
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Users can view their own orders
CREATE POLICY "Users can view their own orders" ON orders
  FOR SELECT USING (
    auth.uid() = customer_id 
    OR auth.uid() = seller_id 
    OR auth.uid() = vendor_id 
    OR auth.jwt() ->> 'role' = 'admin'
  );
```

---

## 📝 Step 4: Insert Sample Data (Optional)

```sql
-- Insert sample admin settings
INSERT INTO admin_settings (platform_markup_percentage, seller_commission_percentage) 
VALUES (25, 10) 
ON CONFLICT DO NOTHING;

-- Sample data will be loaded from localStorage first, then migrated
```

---

## ✅ Step 5: Verify Tables Created

In your Supabase dashboard:

1. Go to **Table Editor**
2. You should see these tables:
   - `users`
   - `products`
   - `orders`
   - `seller_products`
   - `admin_settings`
   - `withdrawal_requests`
   - `leads`

All with proper indexes and constraints ✅

---

## 🔗 Step 6: Update Your Application

Once tables are created, update your components to use Supabase instead of localStorage:

### For Products (Example):
```typescript
// Before (localStorage):
const products = JSON.parse(localStorage.getItem('products') || '[]');

// After (Supabase):
const { data: products, error } = await supabase
  .from('products')
  .select('*')
  .eq('is_active', true);
```

### For Orders (Example):
```typescript
// Before (localStorage):
localStorage.setItem('orders', JSON.stringify(newOrder));

// After (Supabase):
const { data, error } = await supabase
  .from('orders')
  .insert([newOrder]);
```

---

## 🌐 Step 7: Create API Routes

Create Next.js API routes to handle all database operations:

**File:** `src/app/api/products/route.ts`
```typescript
import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const { data, error } = await supabase
    .from('products')
    .insert([body])
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data[0], { status: 201 });
}
```

---

## 🚀 Step 8: Deploy to Production

1. **Environment Variables:**
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://iuuteecnutmqugbjtntg.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_0XpZsUiq-Zbx9IYQMEF01A_1UEaFRFK
   ```

2. **Vercel Deployment:**
   - Push code to GitHub
   - Connect to Vercel
   - Add environment variables
   - Deploy

3. **Backup Database:**
   - Go to Supabase → Settings → Backups
   - Enable automated backups

---

## 🆘 Troubleshooting

### Issue: "Cannot execute query - Row Level Security violation"
**Solution:** RLS policies may be blocking queries. Either:
- Disable RLS for development: `ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;`
- Or fix the RLS policies to allow your queries

### Issue: "Duplicate key value violates unique constraint"
**Solution:** Clear existing data before re-inserting:
```sql
TRUNCATE users CASCADE;
TRUNCATE products CASCADE;
TRUNCATE orders CASCADE;
```

### Issue: Foreign key constraint fails
**Solution:** Insert data in correct order:
1. Users (no dependencies)
2. Products (depends on users)
3. Orders (depends on users and products)
4. Seller products (depends on users and products)

### Issue: Cannot connect to Supabase
**Solution:** Check:
- Project URL is correct
- Anon key is valid
- Supabase project is active (not paused)
- Network connectivity is working

---

## 📚 Next Steps

After setting up the database:

1. ✅ Create API routes for all CRUD operations
2. ✅ Update components to use Supabase queries
3. ✅ Test authentication with Supabase Auth (optional)
4. ✅ Implement webhooks for order notifications (optional)
5. ✅ Set up real-time subscriptions for live updates (optional)

---

## 📖 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/v2)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

**VendorConnect Database Setup Complete! 🎉**

Once you've deployed the schema, the application will be ready to use live data from Supabase instead of localStorage.

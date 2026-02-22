# API Integration Guide - Frontend to Backend

Complete guide for connecting React components to Supabase API endpoints.

---

## 📋 Overview

Your application currently uses **localStorage** for data persistence. This guide shows how to migrate each component to use the **Supabase API routes** for real-time, persistent data storage.

---

## 🎯 Integration Priority

**Priority 1 (Critical):**
- Authentication (Login/Signup)
- Products (Browse, Display)
- Orders (Create, Track)

**Priority 2 (Important):**
- Seller Products (Add to Store)
- Withdrawals (Request Funds)

**Priority 3 (Optional):**
- Leads Management
- Admin Settings
- User Profile Updates

---

## 🔐 Part 1: Authentication Integration

### Current Implementation (localStorage)

**File:** `src/hooks/useAuth.tsx`

```typescript
// BEFORE - Using localStorage
const login = async (email: string, password: string) => {
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  const user = users.find((u: any) => u.email === email);
  // ...
  localStorage.setItem('currentUser', JSON.stringify(user));
};
```

### New Implementation (Supabase API)

**Updated Code:**
```typescript
const login = async (email: string, password: string) => {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }

    const user = await response.json();
    localStorage.setItem('currentUser', JSON.stringify(user));
    setUser(user);
    return user;
  } catch (error) {
    setError((error as Error).message);
    throw error;
  }
};
```

### Signup Integration

```typescript
const signup = async (
  email: string,
  password: string,
  name: string,
  role: string,
  additionalData?: any
) => {
  try {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        name,
        role,
        phone: additionalData?.phone,
        businessName: additionalData?.businessName,
        gstNumber: additionalData?.gstNumber,
        panNumber: additionalData?.panNumber,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }

    const newUser = await response.json();
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    setUser(newUser);
    return newUser;
  } catch (error) {
    setError((error as Error).message);
    throw error;
  }
};
```

---

## 📦 Part 2: Products Integration

### Get All Products

**Current (localStorage):**
```typescript
const products = JSON.parse(localStorage.getItem('products') || '[]');
```

**New (API):**
```typescript
import { useEffect, useState } from 'react';

interface Product {
  id: string;
  name: string;
  category: string;
  base_price: number;
  final_price: number;
  stock: number;
  // ... other fields
}

export function useProducts(category?: string) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const query = new URLSearchParams();
        if (category) query.append('category', category);

        const response = await fetch(`/api/products?${query}`);
        if (!response.ok) throw new Error('Failed to fetch products');

        const data = await response.json();
        setProducts(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [category]);

  return { products, loading, error };
}
```

### Get Single Product

**File:** `src/app/products/[id]/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';

interface ProductdetailProps {
  params: { id: string };
}

export default function ProductDetail({ params }: ProductdetailProps) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/products/${params.id}`);
        if (!response.ok) throw new Error('Product not found');
        const data = await response.json();
        setProduct(data);
      } catch (error) {
        console.error('Failed to fetch product:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [params.id]);

  if (loading) return <div>Loading...</div>;
  if (!product) return <div>Product not found</div>;

  return (
    <div>
      {/* Render product details */}
    </div>
  );
}
```

### Create Product (Vendor)

**File:** `src/app/vendor/add-product.tsx`

```typescript
const handlePublish = async () => {
  try {
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vendorId: user?.id,
        name: formData.name,
        category: formData.category,
        description: formData.description,
        basePrice: parseFloat(formData.basePrice),
        finalPrice: commission.finalPrice,
        markup: commission.markup,
        markupPercentage: 25,
        images: uploadedImages,
        specifications: specs,
        stock: parseInt(formData.stock),
      }),
    });

    if (!response.ok) throw new Error('Failed to create product');

    const product = await response.json();
    toast.success('Product published successfully!');
    navigate('/vendor/products');
  } catch (error) {
    toast.error((error as Error).message);
  }
};
```

---

## 🛒 Part 3: Orders Integration

### Create Order

**File:** `src/app/checkout/page.tsx`

```typescript
const handlePlaceOrder = async () => {
  try {
    const orderId = `ORD-${Date.now()}`;
    
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: orderId,
        customerId: user?.id,
        sellerId: referralCode ? getSellerIdFromCode(referralCode) : null,
        vendorId: product.vendor_id,
        productId: product.id,
        quantity: cartItems.reduce((sum, item) => sum + item.quantity, 0),
        finalPrice: totalAmount,
        sellerCommission: calculateCommissions(product.base_price).sellerCommission,
        platformCommission: calculateCommissions(product.base_price).platformCommission,
        vendorPayout: product.base_price,
        referralCode: referralCode,
        customerDetails: {
          name: deliveryData.name,
          email: deliveryData.email,
          phone: deliveryData.phone,
        },
        deliveryAddress: {
          address: deliveryData.address,
          city: deliveryData.city,
          state: deliveryData.state,
          pincode: deliveryData.pincode,
        },
        paymentMethod: paymentMethod,
        paymentStatus: 'completed',
        orderStatus: 'pending',
        commissionStatus: 'pending',
      }),
    });

    if (!response.ok) throw new Error('Failed to create order');

    const order = await response.json();
    navigate(`/order-confirmation?orderId=${order.id}`);
  } catch (error) {
    toast.error((error as Error).message);
  }
};
```

### Fetch User Orders

**File:** `src/app/orders/page.tsx` (new page)

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function MyOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?.id) return;

      try {
        const response = await fetch(`/api/orders?customerId=${user.id}`);
        if (!response.ok) throw new Error('Failed to fetch orders');
        const data = await response.json();
        setOrders(data);
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user?.id]);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {orders.map((order) => (
        <div key={order.id} className="card">
          <h3>Order {order.id}</h3>
          <p>Status: {order.order_status}</p>
          <p>Total: ₹{order.final_price}</p>
        </div>
      ))}
    </div>
  );
}
```

### Update Order Status (Vendor/Admin)

```typescript
const updateOrderStatus = async (orderId: string, newStatus: string) => {
  try {
    const response = await fetch(`/api/orders/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderStatus: newStatus,
        // Mark commission as available after 15 days
        commissionStatus: shouldReleaseCommission(orderId) ? 'available' : 'pending',
        commissionReleaseDate: calculateReleaseDate(),
      }),
    });

    if (!response.ok) throw new Error('Failed to update order');
    const updatedOrder = await response.json();
    toast.success('Order status updated');
    return updatedOrder;
  } catch (error) {
    toast.error((error as Error).message);
  }
};
```

---

## 👥 Part 4: Seller Products Integration

### Get Seller's Products

**File:** `src/app/seller/my-store.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface SellerProduct {
  id: string;
  product_id: string;
  referral_code: string;
  clicks: number;
  sales: number;
  earnings: number;
  products: any;
}

export default function MyStore() {
  const { user } = useAuth();
  const [sellerProducts, setSellerProducts] = useState<SellerProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSellerProducts = async () => {
      if (!user?.id || user.role !== 'seller') return;

      try {
        const response = await fetch(`/api/seller-products?sellerId=${user.id}`);
        if (!response.ok) throw new Error('Failed to fetch products');
        const data = await response.json();
        setSellerProducts(data);
      } catch (error) {
        console.error('Failed to fetch seller products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSellerProducts();
  }, [user?.id]);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {sellerProducts.map((sp) => (
        <div key={sp.id} className="product-card">
          <h3>{sp.products.name}</h3>
          <p>Referral Code: {sp.referral_code}</p>
          <p>Clicks: {sp.clicks}</p>
          <p>Sales: {sp.sales}</p>
          <p>Earnings: ₹{sp.earnings}</p>
          <button onClick={() => copyReferralLink(sp.referral_code)}>
            Copy Link
          </button>
        </div>
      ))}
    </div>
  );
}
```

### Add Product to Store

**File:** `src/app/seller/marketplace.tsx`

```typescript
const handleAddToStore = async (productId: string) => {
  try {
    const referralCode = generateReferralCode(`seller_${user?.id}`, `product_${productId}`);

    const response = await fetch('/api/seller-products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sellerId: user?.id,
        productId: productId,
        referralCode: referralCode,
      }),
    });

    if (!response.ok) throw new Error('Failed to add product');

    const sellerProduct = await response.json();
    toast.success('Product added to your store!');
    // Update local state to show "Added" instead of "Add to Store"
    setMyProducts([...myProducts, productId]);
    return sellerProduct;
  } catch (error) {
    toast.error((error as Error).message);
  }
};
```

### Remove Product from Store

```typescript
const handleRemoveFromStore = async (sellerProductId: string, productId: string) => {
  try {
    const response = await fetch(`/api/seller-products/${sellerProductId}`, {
      method: 'DELETE',
    });

    if (!response.ok) throw new Error('Failed to remove product');

    toast.success('Product removed from store');
    setMyProducts(myProducts.filter((id) => id !== productId));
  } catch (error) {
    toast.error((error as Error).message);
  }
};
```

---

## 💰 Part 5: Withdrawals Integration

### Request Withdrawal

**File:** `src/app/seller/earnings.tsx`

```typescript
const handleWithdrawal = async () => {
  if (!withdrawalAmount || withdrawalAmount < 500) {
    toast.error('Minimum withdrawal amount is ₹500');
    return;
  }

  try {
    const body =
      withdrawalMethod === 'upi'
        ? {
            sellerId: user?.id,
            amount: withdrawalAmount,
            withdrawalMethod: 'upi',
            upiId: upiId,
          }
        : {
            sellerId: user?.id,
            amount: withdrawalAmount,
            withdrawalMethod: 'bank',
            bankAccount: bankAccount,
            bankIfsc: bankIfsc,
            bankName: bankName,
          };

    const response = await fetch('/api/withdrawals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) throw new Error('Failed to request withdrawal');

    const withdrawal = await response.json();
    toast.success('Withdrawal request submitted!');
    setWithdrawalAmount(0);
    return withdrawal;
  } catch (error) {
    toast.error((error as Error).message);
  }
};
```

### Get Withdrawal History

```typescript
const fetchWithdrawalHistory = async () => {
  try {
    const response = await fetch(`/api/withdrawals?sellerId=${user?.id}`);
    if (!response.ok) throw new Error('Failed to fetch withdrawal history');
    const data = await response.json();
    setWithdrawals(data);
  } catch (error) {
    console.error('Failed to fetch withdrawal history:', error);
  }
};
```

---

## ⚙️ Part 6: Admin Settings Integration

### Get Current Settings

```typescript
const fetchSettings = async () => {
  try {
    const response = await fetch('/api/admin/settings');
    if (!response.ok) throw new Error('Failed to fetch settings');
    const data = await response.json();
    setSettings(data);
  } catch (error) {
    console.error('Failed to fetch settings:', error);
  }
};
```

### Update Settings

**File:** `src/app/admin/settings.tsx` (new page)

```typescript
const handleUpdateSettings = async () => {
  try {
    const response = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platformMarkupPercentage: settings.platformMarkupPercentage,
        sellerCommissionPercentage: settings.sellerCommissionPercentage,
        platformCommissionPercentage: settings.platformCommissionPercentage,
        minWithdrawalAmount: settings.minWithdrawalAmount,
        commissionCoolingPeriodDays: settings.commissionCoolingPeriodDays,
      }),
    });

    if (!response.ok) throw new Error('Failed to update settings');
    const updated = await response.json();
    toast.success('Settings updated successfully!');
    setSettings(updated);
  } catch (error) {
    toast.error((error as Error).message);
  }
};
```

---

## 🔄 Part 7: Custom Hook Pattern

Create reusable hooks for API calls:

**File:** `src/hooks/useApi.ts`

```typescript
import { useState, useCallback } from 'react';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useApi<T>(url: string, method = 'GET') {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const fetch = useCallback(
    async (body?: any) => {
      setState({ data: null, loading: true, error: null });
      try {
        const response = await window.fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: body ? JSON.stringify(body) : undefined,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Request failed');
        }

        const data = await response.json();
        setState({ data, loading: false, error: null });
        return data;
      } catch (error) {
        const errorMessage = (error as Error).message;
        setState({ data: null, loading: false, error: errorMessage });
        throw error;
      }
    },
    [url, method]
  );

  return { ...state, fetch };
}

// Usage:
// const { data: product, loading, error, fetch } = useApi<Product>(`/api/products/${id}`);
```

---

## 🚀 Implementation Checklist

### Phase 1 - Critical (Week 1)
- [ ] Update useAuth.tsx for login/signup API calls
- [ ] Update products page to fetch from API
- [ ] Update product detail page to fetch single product
- [ ] Update checkout to create orders via API
- [ ] Test complete purchase flow

### Phase 2 - Important (Week 2)
- [ ] Update vendor add product to use API
- [ ] Update seller marketplace to use API
- [ ] Update seller product management
- [ ] Add withdrawal requests

### Phase 3 - Polish (Week 3)
- [ ] Add loading spinners during API calls
- [ ] Add error handling and toast messages
- [ ] Add success feedback
- [ ] Test all user flows
- [ ] Performance optimization

---

## 📝 Testing API Endpoints

### Using Postman or curl

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"vendor@example.com","password":"password123"}'

# Get products
curl http://localhost:3000/api/products?category=electronics

# Create order
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"customerId":"uuid","vendorId":"uuid",...}'

# Get my orders
curl "http://localhost:3000/api/orders?customerId=uuid"
```

---

## 🔒 Error Handling Pattern

Apply this pattern to all API calls:

```typescript
try {
  const response = await fetch(url, options);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  const data = await response.json();
  return data;
} catch (error) {
  console.error('API Error:', error);
  // Show user-friendly error message
  toast.error((error as Error).message);
  throw error;
}
```

---

## 🎯 Next Steps

1. Start with **Phase 1** integration (auth, products, orders)
2. Test each integration thoroughly
3. Move to **Phase 2** (seller features)
4. Add loading states and error handling
5. Deploy to production when all tests pass

---

**Integration Guide Complete!** 🚀

Your app is now ready to connect to the real Supabase database with full API routes.

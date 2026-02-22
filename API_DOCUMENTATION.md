# VendorConnect API Documentation

Complete API reference for all backend endpoints.

---

## 🔐 BASE URL

```
http://localhost:3000/api
```

or in production:
```
https://your-domain.com/api
```

---

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [Products](#products)
3. [Orders](#orders)
4. [Seller Products](#seller-products)
5. [Withdrawals](#withdrawals)
6. [Admin Settings](#admin-settings)
7. [Leads](#leads)
8. [Users](#users)

---

## 🔐 Authentication

### Signup

**Endpoint:** `POST /auth/signup`

Create a new user account.

**Request Body:**
```json
{
  "email": "vendor@example.com",
  "password": "password123",
  "name": "John Vendor",
  "role": "vendor",
  "phone": "9876543210",
  "businessName": "Tech Solutions",
  "gstNumber": "18AABCU9603R1Z0",
  "panNumber": "ABCDE1234F"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "email": "vendor@example.com",
  "name": "John Vendor",
  "role": "vendor",
  "phone": "9876543210",
  "business_name": "Tech Solutions",
  "gst_number": "18AABCU9603R1Z0",
  "pan_number": "ABCDE1234F",
  "is_verified": false,
  "created_at": "2026-02-14T..."
}
```

**Error Response (400/409/500):**
```json
{
  "error": "Email already registered"
}
```

**Notes:**
- `role` must be: `vendor`, `seller`, `customer`, or `admin`
- Password minimum 6 characters
- Email must be unique
- `phone`, `businessName`, `gstNumber`, `panNumber` are optional

---

### Login

**Endpoint:** `POST /auth/login`

Authenticate user and get their profile.

**Request Body:**
```json
{
  "email": "vendor@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "email": "vendor@example.com",
  "name": "John Vendor",
  "role": "vendor",
  "phone": "9876543210",
  "is_verified": true,
  "created_at": "2026-02-14T..."
}
```

**Error Response (401):**
```json
{
  "error": "Invalid email or password"
}
```

---

## 📦 Products

### Get All Products

**Endpoint:** `GET /products`

Retrieve products with optional filters.

**Query Parameters:**
- `category` (optional): Filter by category
- `vendorId` (optional): Filter by vendor
- `isActive` (optional): Default `true`

**Example:**
```
GET /products?category=electronics&isActive=true
```

**Response (200):**
```json
[
  {
    "id": "uuid",
    "vendor_id": "uuid",
    "name": "Wireless Earbuds",
    "category": "electronics",
    "description": "Premium wireless earbuds",
    "base_price": 2000,
    "final_price": 2500,
    "markup": 500,
    "markup_percentage": 25,
    "images": ["image1.jpg", "image2.jpg"],
    "specifications": { "color": "black", "warranty": "1 year" },
    "stock": 50,
    "sold_count": 15,
    "is_active": true,
    "created_at": "2026-02-14T...",
    "updated_at": "2026-02-14T..."
  }
]
```

---

### Create Product

**Endpoint:** `POST /products`

Add a new product (Vendor only).

**Request Body:**
```json
{
  "vendorId": "uuid",
  "name": "Wireless Earbuds",
  "category": "electronics",
  "description": "Premium wireless earbuds with noise cancellation",
  "basePrice": 2000,
  "finalPrice": 2500,
  "markup": 500,
  "markupPercentage": 25,
  "images": ["image1.jpg", "image2.jpg"],
  "specifications": {
    "color": "black",
    "warranty": "1 year",
    "batteryLife": "8 hours"
  },
  "stock": 50
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "vendor_id": "uuid",
  "name": "Wireless Earbuds",
  ...
}
```

---

### Get Product by ID

**Endpoint:** `GET /products/[id]`

Retrieve a single product.

**Response (200):**
```json
{
  "id": "uuid",
  "name": "Wireless Earbuds",
  ...
}
```

**Error Response (404):**
```json
{
  "error": "Product not found"
}
```

---

### Update Product

**Endpoint:** `PUT /products/[id]`

Update product details (Vendor only).

**Request Body:**
```json
{
  "name": "Updated Product Name",
  "stock": 100,
  "is_active": true,
  "description": "Updated description"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "name": "Updated Product Name",
  ...
}
```

---

### Delete Product

**Endpoint:** `DELETE /products/[id]`

Delete a product (Vendor only).

**Response (200):**
```json
{
  "message": "Product deleted successfully"
}
```

---

## 🛒 Orders

### Get Orders

**Endpoint:** `GET /orders`

Retrieve orders with optional filters.

**Query Parameters:**
- `customerId` (optional): Customer's orders
- `vendorId` (optional): Vendor's sales
- `sellerId` (optional): Seller's commissions

**Example:**
```
GET /orders?customerId=uuid
```

**Response (200):**
```json
[
  {
    "id": "ORD-20260214-001",
    "customer_id": "uuid",
    "seller_id": "uuid",
    "vendor_id": "uuid",
    "product_id": "uuid",
    "quantity": 2,
    "final_price": 5000,
    "seller_commission": 500,
    "platform_commission": 375,
    "vendor_payout": 4000,
    "referral_code": "SELLER001",
    "customer_details": {
      "name": "Raj Kumar",
      "email": "raj@example.com",
      "phone": "9876543210"
    },
    "delivery_address": {
      "address": "123 Main St",
      "city": "Delhi",
      "state": "Delhi",
      "pincode": "110001"
    },
    "payment_method": "UPI",
    "payment_status": "completed",
    "order_status": "shipped",
    "commission_status": "pending",
    "commission_release_date": "2026-02-28T...",
    "created_at": "2026-02-14T..."
  }
]
```

---

### Create Order

**Endpoint:** `POST /orders`

Place a new order.

**Request Body:**
```json
{
  "id": "ORD-20260214-001",
  "customerId": "uuid",
  "sellerId": "uuid",
  "vendorId": "uuid",
  "productId": "uuid",
  "quantity": 2,
  "finalPrice": 5000,
  "sellerCommission": 500,
  "platformCommission": 375,
  "vendorPayout": 4000,
  "referralCode": "SELLER001",
  "customerDetails": {
    "name": "Raj Kumar",
    "email": "raj@example.com",
    "phone": "9876543210"
  },
  "deliveryAddress": {
    "address": "123 Main St",
    "city": "Delhi",
    "state": "Delhi",
    "pincode": "110001"
  },
  "paymentMethod": "UPI",
  "paymentStatus": "completed",
  "orderStatus": "pending",
  "commissionStatus": "pending"
}
```

**Response (201):**
```json
{
  "id": "ORD-20260214-001",
  "customer_id": "uuid",
  ...
}
```

---

### Get Order by ID

**Endpoint:** `GET /orders/[id]`

Retrieve order details.

**Response (200):**
```json
{
  "id": "ORD-20260214-001",
  ...
}
```

---

### Update Order

**Endpoint:** `PUT /orders/[id]`

Update order status and commission tracking.

**Request Body:**
```json
{
  "orderStatus": "delivered",
  "commissionStatus": "available",
  "commissionReleaseDate": "2026-02-28T00:00:00Z"
}
```

**Response (200):**
```json
{
  "id": "ORD-20260214-001",
  "order_status": "delivered",
  "commission_status": "available",
  ...
}
```

---

## 👥 Seller Products

### Get Seller Products

**Endpoint:** `GET /seller-products`

Retrieve products added by a seller to their store.

**Query Parameters:**
- `sellerId` (required): Seller's ID

**Example:**
```
GET /seller-products?sellerId=uuid
```

**Response (200):**
```json
[
  {
    "id": "uuid",
    "seller_id": "uuid",
    "product_id": "uuid",
    "referral_code": "SELLER001",
    "clicks": 150,
    "sales": 12,
    "earnings": 3000,
    "added_at": "2026-02-14T...",
    "products": {
      "id": "uuid",
      "name": "Wireless Earbuds",
      "final_price": 2500,
      ...
    }
  }
]
```

---

### Add Product to Seller Store

**Endpoint:** `POST /seller-products`

Seller adds a product to their personal store.

**Request Body:**
```json
{
  "sellerId": "uuid",
  "productId": "uuid",
  "referralCode": "SELLER001"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "seller_id": "uuid",
  "product_id": "uuid",
  "referral_code": "SELLER001",
  "clicks": 0,
  "sales": 0,
  "earnings": 0,
  "added_at": "2026-02-14T..."
}
```

**Error Response (409):**
```json
{
  "error": "Product already added to store"
}
```

---

### Update Seller Product Stats

**Endpoint:** `PUT /seller-products/[id]`

Update clicks, sales, and earnings for a seller's product.

**Request Body:**
```json
{
  "clicks": 150,
  "sales": 12,
  "earnings": 3000
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "clicks": 150,
  "sales": 12,
  "earnings": 3000,
  ...
}
```

---

### Remove Product from Seller Store

**Endpoint:** `DELETE /seller-products/[id]`

Remove a product from seller's store.

**Response (200):**
```json
{
  "message": "Product removed from store"
}
```

---

## 💰 Withdrawals

### Get Withdrawals

**Endpoint:** `GET /withdrawals`

Retrieve withdrawal requests.

**Query Parameters:**
- `sellerId` (optional): Filter by seller
- `status` (optional): Filter by status (`pending`, `completed`, `failed`, `cancelled`)

**Example:**
```
GET /withdrawals?sellerId=uuid&status=pending
```

**Response (200):**
```json
[
  {
    "id": "uuid",
    "seller_id": "uuid",
    "amount": 5000,
    "withdrawal_method": "upi",
    "upi_id": "seller@upi",
    "status": "pending",
    "transaction_ref": null,
    "created_at": "2026-02-14T..."
  }
]
```

---

### Create Withdrawal Request

**Endpoint:** `POST /withdrawals`

Request funds withdrawal.

**Request Body:**
```json
{
  "sellerId": "uuid",
  "amount": 5000,
  "withdrawalMethod": "upi",
  "upiId": "seller@upi"
}
```

Or for bank transfer:
```json
{
  "sellerId": "uuid",
  "amount": 5000,
  "withdrawalMethod": "bank",
  "bankAccount": "1234567890",
  "bankIfsc": "HDFC0000001",
  "bankName": "HDFC Bank"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "seller_id": "uuid",
  "amount": 5000,
  "status": "pending",
  ...
}
```

---

### Update Withdrawal

**Endpoint:** `PUT /withdrawals/[id]`

Update withdrawal status (Admin only).

**Request Body:**
```json
{
  "status": "completed",
  "transactionRef": "TXN-202602140001"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "status": "completed",
  "transaction_ref": "TXN-202602140001",
  ...
}
```

---

### Cancel Withdrawal

**Endpoint:** `DELETE /withdrawals/[id]`

Cancel a pending withdrawal.

**Response (200):**
```json
{
  "message": "Withdrawal cancelled"
}
```

---

## ⚙️ Admin Settings

### Get Settings

**Endpoint:** `GET /admin/settings`

Retrieve platform configuration.

**Response (200):**
```json
{
  "id": "uuid",
  "platform_markup_percentage": 25,
  "seller_commission_percentage": 10,
  "platform_commission_percentage": 15,
  "min_withdrawal_amount": 500,
  "commission_cooling_period_days": 15,
  "created_at": "2026-02-14T...",
  "updated_at": "2026-02-14T..."
}
```

---

### Update Settings

**Endpoint:** `PUT /admin/settings`

Update platform configuration (Admin only).

**Request Body:**
```json
{
  "platformMarkupPercentage": 25,
  "sellerCommissionPercentage": 10,
  "platformCommissionPercentage": 15,
  "minWithdrawalAmount": 500,
  "commissionCoolingPeriodDays": 15
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "platform_markup_percentage": 25,
  ...
}
```

---

## 📋 Leads

### Get Leads

**Endpoint:** `GET /leads`

Retrieve leads.

**Query Parameters:**
- `vendorId` (optional): Vendor's leads
- `sellerId` (optional): Leads assigned to seller
- `status` (optional): Filter by status

**Example:**
```
GET /leads?vendorId=uuid&status=not_contacted
```

**Response (200):**
```json
[
  {
    "id": "uuid",
    "vendor_id": "uuid",
    "seller_id": "uuid",
    "name": "Priya Patel",
    "phone": "9876543210",
    "email": "priya@example.com",
    "product_id": "uuid",
    "status": "not_contacted",
    "notes": "Follow up tomorrow",
    "created_at": "2026-02-14T..."
  }
]
```

---

### Create Lead

**Endpoint:** `POST /leads`

Add a new lead.

**Request Body:**
```json
{
  "vendorId": "uuid",
  "sellerId": "uuid",
  "name": "Priya Patel",
  "phone": "9876543210",
  "email": "priya@example.com",
  "productId": "uuid",
  "status": "not_contacted"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "vendor_id": "uuid",
  "name": "Priya Patel",
  ...
}
```

---

### Update Lead

**Endpoint:** `PUT /leads/[id]`

Update lead status or assignment.

**Request Body:**
```json
{
  "status": "converted",
  "sellerId": "uuid",
  "notes": "Customer agreed to purchase"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "status": "converted",
  ...
}
```

---

### Delete Lead

**Endpoint:** `DELETE /leads/[id]`

Remove a lead.

**Response (200):**
```json
{
  "message": "Lead deleted"
}
```

---

## 👤 Users

### Get User by ID

**Endpoint:** `GET /users/[id]`

Retrieve user profile.

**Response (200):**
```json
{
  "id": "uuid",
  "email": "vendor@example.com",
  "name": "John Vendor",
  "role": "vendor",
  "phone": "9876543210",
  "business_name": "Tech Solutions",
  "is_verified": true,
  "created_at": "2026-02-14T..."
}
```

---

### Update User Profile

**Endpoint:** `PUT /users/[id]`

Update user information.

**Request Body:**
```json
{
  "name": "John Updated",
  "phone": "9876543210",
  "business_name": "Tech Solutions Updated"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "name": "John Updated",
  ...
}
```

**Note:** Password and email cannot be updated via this endpoint.

---

## 🔄 Common Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized |
| 404 | Not Found |
| 409 | Conflict (duplicate entry) |
| 500 | Server Error |

---

## 🔒 Authentication

All endpoints except `/auth/signup` and `/auth/login` should include user authentication. For MVP, pass the user ID in request headers or body.

**Future:** Add JWT tokens for production security.

---

## 📝 Rate Limiting

Not currently implemented. Add in production:
- 100 requests per minute per user
- 1000 requests per minute per IP

---

## 🚀 Testing with curl

### Create a product
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "vendorId": "uuid",
    "name": "Test Product",
    "category": "electronics",
    "basePrice": 1000,
    "finalPrice": 1250,
    "markup": 250,
    "markupPercentage": 25,
    "stock": 10
  }'
```

### Get all products
```bash
curl http://localhost:3000/api/products
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "vendor@example.com",
    "password": "password123"
  }'
```

---

## 📚 Next Steps

1. ✅ **API Routes Created** - All endpoints implemented
2. ⏭️ **Update Components** - Connect frontend to API routes
3. ⏭️ **Add Error Handling** - Implement try-catch in UI
4. ⏭️ **Add Loading States** - Show spinners during requests
5. ⏭️ **Add Authentication** - Implement JWT or sessions
6. ⏭️ **Add Rate Limiting** - Production security
7. ⏭️ **Add Request Validation** - Server-side verification
8. ⏭️ **Add CORS** - Enable cross-origin requests

---

**VendorConnect API Complete!** 🚀

All endpoints are ready to use. Start by updating your frontend components to call these APIs instead of using localStorage.

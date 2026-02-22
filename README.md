# VendorConnect - Commission-Based Marketplace MVP

A production-ready, industry-standard commission-based marketplace application with three distinct user interfaces: Vendor Dashboard, Seller Dashboard, and Customer Shopping Interface.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Key Features Implementation](#key-features-implementation)
- [Pricing Model](#pricing-model)
- [User Interfaces](#user-interfaces)
- [Database Schema](#database-schema)
- [API Routes](#api-routes)
- [Deployment](#deployment)

## Features

### Core Marketplace Features
- **Three Distinct User Roles**: Vendor, Seller, Customer
- **Commission-Based Revenue Model**: Automatic markup calculation and commission distribution
- **Product Management**: Vendors can list, edit, and manage products
- **Seller Marketplace**: Sellers can discover products and earn commissions
- **Shopping Experience**: Customers can browse, search, filter, and purchase products
- **Order Management**: Complete order lifecycle from placement to delivery
- **Commission Tracking**: Real-time earnings and commission status
- **Referral System**: Track which seller referred which customer

### Advanced Features
- **Role-Based Authentication**: Email/password with role-based access control
- **Shopping Cart**: Persistent cart using localStorage
- **Multi-Step Checkout**: Address, payment method, and order review
- **Order Tracking**: Real-time order status updates
- **Seller Leads Management**: Upload and manage customer leads
- **Analytics Dashboard**: Sales charts and performance metrics
- **Responsive Design**: Mobile-first, 100% responsive UI
- **Form Validation**: Comprehensive validation with helpful error messages
- **Toast Notifications**: User feedback for all actions

## Tech Stack

### Frontend
- **Framework**: Next.js 13+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with Radix UI primitives
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod validation
- **HTTP Client**: Axios

### Backend
- **API Routes**: Next.js API routes (serverless)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Custom JWT-based (mock for MVP)
- **File Storage**: Supabase Storage

### Development
- **Package Manager**: npm
- **Linting**: ESLint
- **Type Checking**: TypeScript

## Getting Started

### Prerequisites
- Node.js 18.17 or higher
- npm 9.0 or higher

### Installation

1. **Clone the repository**
```bash
git clone <repo-url>
cd vendor_connect
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Create `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=https://iuuteecnutmqugbjtntg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_0XpZsUiq-Zbx9IYQMEF01A_1UEaFRFK
```

4. **Run development server**
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Build for Production
```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/                      # Next.js app directory
│   ├── (auth)/              # Auth routes group
│   ├── (vendor)/            # Vendor dashboard routes
│   │   ├── dashboard/
│   │   ├── products/
│   │   ├── add-product/
│   │   ├── sales/
│   │   └── analytics/
│   ├── (seller)/            # Seller dashboard routes
│   │   ├── dashboard/
│   │   ├── marketplace/
│   │   ├── my-store/
│   │   └── earnings/
│   ├── (customer)/          # Customer routes
│   │   ├── products/
│   │   ├── product/[id]/
│   │   ├── cart/
│   │   ├── checkout/
│   │   └── order-confirmation/
│   ├── api/                 # API routes
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Homepage
│   └── globals.css          # Global styles
├── components/
│   ├── shared/              # Shared components
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── AuthModal.tsx
│   ├── vendor/              # Vendor-specific components
│   ├── seller/              # Seller-specific components
│   └── customer/            # Customer-specific components
├── hooks/
│   └── useAuth.tsx          # Authentication hook
├── lib/
│   └── supabase.ts          # Supabase configuration
├── types/
│   └── index.ts             # TypeScript type definitions
├── utils/
│   ├── auth.ts              # Auth utilities
│   └── calculations.ts      # Commission calculations
└── styles/                  # Global and component styles
```

## Key Features Implementation

### 1. Commission Calculation Engine

The system automatically calculates commissions based on a configurable markup percentage:

```typescript
// Example: Base Price ₹2000, Markup 25%
basePrice = 2000
markup = 500 (25%)
finalPrice = 2500
sellerCommission = 250 (10% of final price)
platformCommission = 150 (6% of final price)
vendorPayout = 2000 (base price)
```

**Location**: `/src/utils/calculations.ts`

### 2. Authentication System

- Custom JWT-based authentication (mock for MVP)
- Role-based access control (Vendor, Seller, Customer)
- Protected routes using middleware
- Session persistence via localStorage

**Location**: `/src/hooks/useAuth.tsx`, `/src/utils/auth.ts`

### 3. Shopping Cart

- Persistent cart using localStorage
- Add/remove/modify quantity operations
- Automatic price recalculation
- Cart data structure optimized for performance

**Location**: Customer pages (cart, checkout)

### 4. Order Management

Complete order lifecycle:
1. **Order Placement**: Customer submits order with address and payment method
2. **Payment Processing**: Mock Razorpay integration
3. **Order Confirmation**: Generate order ID and confirmation
4. **Vendor Confirmation**: Vendor confirms product availability
5. **Shipping**: Order shipped with tracking number
6. **Delivery**: Order marked as delivered
7. **Commission Release**: Seller commission available after 15 days

### 5. Referral Tracking

- Generate unique 8-character referral codes for sellers
- Store referral code in URL and localStorage
- Track which seller referred which customer
- Auto-assign commissions based on referral code

### 6. Admin Settings

Configurable platform parameters:
- Platform markup percentage (default: 25%)
- Seller commission percentage (default: 10%)
- Minimum withdrawal amount (₹500)
- Commission cooling period (15 days)

## Pricing Model

### How It Works

1. **Vendor sets Base Price**: ₹2000 (their actual cost)
2. **Platform adds Markup**: 25% mark-up = ₹500
3. **Customer sees Final Price**: ₹2500
4. **On Sale Distribution**:
   - Vendor receives: ₹2000 (base price)
   - Seller earns: ₹250 (10% of ₹2500)
   - Platform earns: ₹150 (6% of ₹2500)

### Commission Breakdown
- **Final Price** = Base Price + Markup
- **Seller Commission** = 10% of Final Price
- **Platform Commission** = Markup - Seller Commission

**Validation**: `basePrice + sellerCommission + platformCommission = finalPrice`

## User Interfaces

### Interface 1: Vendor Dashboard
**Access**: `/vendor/dashboard`

**Features**:
- Add and manage products with pricing breakdown
- View sales tracking with commission details
- Analytics dashboard with sales charts
- Seller insights and performance metrics
- Lead management system
- Payout tracking

### Interface 2: Seller Dashboard
**Access**: `/seller/dashboard`

**Features**:
- Browse product marketplace
- Add products to personal store with referral links
- Track sales and earnings
- Earnings dashboard with withdrawal functionality
- Assigned leads management
- Training center with resources

### Interface 3: Customer Shopping Interface
**Access**: `/products`

**Features**:
- Browse and search products
- Filter by category, price, rating
- View detailed product information
- Shopping cart with persistent storage
- Multi-step checkout process
- Order confirmation and tracking
- Order history and management

## Database Schema

### Tables

#### Users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL, -- 'vendor', 'seller', 'customer', 'admin'
  phone VARCHAR(20),
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Products
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT,
  base_price DECIMAL(10, 2) NOT NULL,
  final_price DECIMAL(10, 2) NOT NULL,
  markup DECIMAL(10, 2) NOT NULL,
  markup_percentage DECIMAL(5, 2) NOT NULL,
  images TEXT[], -- Array of image URLs
  stock INT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Orders
```sql
CREATE TABLE orders (
  id VARCHAR(50) PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES users(id),
  seller_id UUID REFERENCES users(id),
  vendor_id UUID NOT NULL REFERENCES users(id),
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INT NOT NULL,
  final_price DECIMAL(10, 2) NOT NULL,
  seller_commission DECIMAL(10, 2) NOT NULL,
  platform_commission DECIMAL(10, 2) NOT NULL,
  vendor_payout DECIMAL(10, 2) NOT NULL,
  referral_code VARCHAR(20),
  customer_details JSONB,
  payment_method VARCHAR(50),
  payment_status VARCHAR(50), -- 'pending', 'completed', 'failed'
  order_status VARCHAR(50), -- 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'
  commission_status VARCHAR(50), -- 'pending', 'available', 'paid'
  commission_release_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### SellerProducts (Mapping)
```sql
CREATE TABLE seller_products (
  id UUID PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES users(id),
  product_id UUID NOT NULL REFERENCES products(id),
  referral_code VARCHAR(20) UNIQUE NOT NULL,
  clicks INT DEFAULT 0,
  sales INT DEFAULT 0,
  earnings DECIMAL(10, 2) DEFAULT 0,
  added_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(seller_id, product_id)
);
```

#### AdminSettings
```sql
CREATE TABLE admin_settings (
  id UUID PRIMARY KEY,
  platform_markup_percentage DECIMAL(5, 2) DEFAULT 25,
  seller_commission_percentage DECIMAL(5, 2) DEFAULT 10,
  min_withdrawal_amount DECIMAL(10, 2) DEFAULT 500,
  commission_cooling_period_days INT DEFAULT 15,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## API Routes

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Product Endpoints
- `GET /api/products` - List all products
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product (vendor only)
- `PUT /api/products/:id` - Update product (vendor only)
- `DELETE /api/products/:id` - Delete product (vendor only)

### Order Endpoints
- `POST /api/orders` - Create order
- `GET /api/orders/:id` - Get order details
- `GET /api/orders` - List user's orders
- `PUT /api/orders/:id/status` - Update order status

### Seller Endpoints
- `GET /api/seller/marketplace` - Get products available for sellers
- `POST /api/seller/products/:id` - Add product to seller's store
- `GET /api/seller/products` - Get seller's products
- `GET /api/seller/earnings` - Get seller's earnings
- `POST /api/seller/withdrawal` - Request withdrawal

### Admin Endpoints
- `GET /api/admin/settings` - Get platform settings
- `PUT /api/admin/settings` - Update platform settings
- `GET /api/admin/orders` - List all orders
- `GET /api/admin/analytics` - Get platform analytics

## Mock Data

The application comes with pre-seeded mock data:

### Vendors
- TechHub
- ElectroStore
- FashionHub

### Sellers
- 5 active sellers with various commissions earned

### Products
- 15+ products across categories
- Realistic Indian pricing
- Sample images (emoji placeholders for MVP)

### Orders
- 10+ sample orders in different statuses
- Complete customer details
- Realistic timestamps

## Security Features

- Role-based access control (RBAC)
- Route protection (redirects unauthorized users)
- Password validation (minimum 6 characters)
- Email format validation
- CORS protection
- Input sanitization in forms

## Performance Optimizations

- Server-side rendering (SSR) with Next.js
- Image optimization
- Bundle code splitting
- Efficient state management
- Debounced search and filters
- Lazy loading of components

## Browser Support

- Chrome/Chromium (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

## Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables (Production)
```env
NEXT_PUBLIC_SUPABASE_URL=<your-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-key>
NEXT_PUBLIC_API_URL=<your-api-url>
```

## Testing Mock Data

### Test Vendor Login
- Email: `vendor@test.com`
- Password: `password123`

### Test Seller Login
- Email: `seller@test.com`
- Password: `password123`

### Test Customer
- Email: `customer@test.com`
- Password: `password123`

## Troubleshooting

### Port 3000 already in use
```bash
# Mac/Linux
lsof -i :3000
kill -9 <PID>

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Dependencies issues
```bash
rm -rf node_modules package-lock.json
npm install
```

### Build errors
```bash
npm run type-check
npm run lint
npm run build
```

## Future Enhancements

- [ ] Real Razorpay integration for payments
- [ ] Email notifications for orders
- [ ] SMS notifications for tracking
- [ ] Inventory management system
- [ ] Product reviews and ratings
- [ ] Seller verification system
- [ ] Bulk order management
- [ ] Advanced analytics and reports
- [ ] Multi-language support
- [ ] Dark mode
- [ ] Progressive Web App (PWA)
- [ ] Mobile native apps (React Native)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - See LICENSE file for details

## Support

For support, email support@vendorconnect.in or contact us through the platform.

## Changelog

### Version 1.0.0 (Initial Release)
- Vendor dashboard with product management
- Seller marketplace with commission tracking
- Customer shopping interface with checkout
- Order management system
- Commission calculation engine
- Referral tracking system
- Admin settings panel
- Mock Razorpay integration

---

**Built with ❤️ by the VendorConnect Team**

Last updated: February 14, 2026

// User types
export type UserRole = 'vendor' | 'seller' | 'customer' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  avatar?: string;
  businessName?: string;
  business_name?: string;
  accountNumber?: string;
  account_number?: string;
  ifscCode?: string;
  ifsc_code?: string;
  upiId?: string;
  upi_id?: string;
  gstNumber?: string;
  gst_number?: string;
  panNumber?: string;
  pan_number?: string;
  supportEmail?: string;
  support_email?: string;
  bankAccountHolder?: string;
  bank_account_holder?: string;
  isLocked?: boolean;
  is_locked?: boolean;
}

export interface Vendor {
  id: string;
  email?: string;
  name?: string;
  role?: 'vendor';
  businessName?: string;
  business_name?: string;
  supportEmail?: string;
  support_email?: string;
  phone?: string;
  gstNumber?: string;
  gst_number?: string;
  panNumber?: string;
  pan_number?: string;
  bankAccountHolder?: string;
  bank_account_holder?: string;
  accountNumber?: string;
  account_number?: string;
  ifscCode?: string;
  ifsc_code?: string;
  isLocked?: boolean;
  is_locked?: boolean;
  isVerified?: boolean;
  is_verified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Seller {
  id: string;
  email?: string;
  name?: string;
  role?: 'seller';
  phone?: string;
  businessName?: string;
  business_name?: string;
  storeName?: string;
  store_name?: string;
  upiId?: string;
  upi_id?: string;
  bankAccountHolder?: string;
  bank_account_holder?: string;
  accountNumber?: string;
  account_number?: string;
  ifscCode?: string;
  ifsc_code?: string;
  isLocked?: boolean;
  is_locked?: boolean;
  isVerified?: boolean;
  is_verified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface VendorProfile extends User {
  businessName: string;
  gstNumber: string;
  bankDetails: {
    accountHolder: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
  };
}

export interface SellerProfile extends User {
  panNumber: string;
  bankAccount: string;
  upiId: string;
  totalEarnings: number;
  availableBalance: number;
}

export interface CustomerProfile extends User {
  addresses: Address[];
  savedPaymentMethods: PaymentMethod[];
}

// Product types
export interface Product {
  id: string;
  vendorId: string;
  name: string;
  category: ProductCategory;
  description: string;
  basePrice: number;
  markup: number;
  markupPercentage: number;
  images: string[];
  stock: number;
  specscs: Record<string, string>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  vendorRating?: number;
  totalSold?: number;
}

export type ProductCategory = 
  | 'Electronics' 
  | 'Fashion' 
  | 'Home Appliances' 
  | 'Services' 
  | 'Education' 
  | 'Healthcare' 
  | 'Other';

export interface GuestCustomer {
  id: string;
  email: string;
  name: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

// Order types
export interface Order {
  id: string;
  customerId?: string;
  guestCustomerId?: string;
  sellerId?: string;
  vendorId: string;
  productId: string;
  quantity: number;
  basePrice: number;
  sellerCommission: number;
  platformCommission: number;
  vendorPayout: number;
  referralCode?: string;
  paymentGatewayOrderId?: string;
  paymentGatewayPaymentId?: string;
  customerDetails: {
    name: string;
    phone: string;
    email: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  paymentMethod: PaymentMethodType;
  paymentStatus: 'pending' | 'completed' | 'failed';
  orderStatus: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  commissionStatus: 'pending' | 'available' | 'paid';
  commissionReleaseDate?: string;
  timestamps?: {
    placed: string;
    confirmed?: string;
    shipped?: string;
    delivered?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export type PaymentMethodType = 'cod' | 'upi' | 'card' | 'netbanking' | 'wallet';

export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  details: Record<string, string>;
  isDefault: boolean;
}

// Cart types
export interface CartItem {
  productId: string;
  quantity: number;
  price: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  deliveryCharge: number;
  total: number;
}

// Address types
export interface Address {
  id: string;
  name: string;
  phone: string;
  email: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

// Seller Product Mapping
export interface SellerProduct {
  id: string;
  sellerId: string;
  productId: string;
  referralCode: string;
  clicks: number;
  sales: number;
  earnings: number;
  addedAt: string;
}

// Admin Settings
export interface AdminSettings {
  id: string;
  platformMarkupPercentage: number;
  sellerCommissionPercentage: number;
  platformCommissionPercentage: number;
  minWithdrawalAmount: number;
  commissionCoolingPeriodDays: number;
  createdAt: string;
  updatedAt: string;
}

// Referral & Analytics
export interface ReferralTracking {
  id: string;
  sellerId: string;
  productId: string;
  customerId?: string;
  orderId?: string;
  referralCode: string;
  clicks: number;
  conversions: number;
  createdAt: string;
}

export interface LeadEntry {
  id: string;
  vendorId: string;
  name: string;
  phone: string;
  email: string;
  productInterest?: string;
  assignedToSellerId?: string;
  status: 'not_contacted' | 'contacted' | 'converted' | 'not_interested';
  notes: string;
  createdAt: string;
}

// Withdrawal Request
export interface WithdrawalRequest {
  id: string;
  userId: string;
  amount: number;
  paymentMethod: PaymentMethodType;
  paymentDetails: Record<string, string>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requestedAt: string;
  processedAt?: string;
}

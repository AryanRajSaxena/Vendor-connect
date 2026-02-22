import { Order } from '@/types';

const DEFAULT_MARKUP_PERCENTAGE = 25;
const DEFAULT_SELLER_COMMISSION_PERCENTAGE = 10;

export interface CommissionBreakdown {
  basePrice: number;
  markup: number;
  markupPercentage: number;
  finalPrice: number;
  sellerCommission: number;
  platformCommission: number;
  vendorPayout: number;
}

/**
 * Calculate commission breakdown for a product
 */
export function calculateCommissions(
  basePrice: number,
  markupPercentage: number = DEFAULT_MARKUP_PERCENTAGE,
  sellerCommissionPercentage: number = DEFAULT_SELLER_COMMISSION_PERCENTAGE
): CommissionBreakdown {
  const markup = basePrice * (markupPercentage / 100);
  const finalPrice = basePrice + markup;
  const sellerCommission = finalPrice * (sellerCommissionPercentage / 100);
  const platformCommission = finalPrice * ((markupPercentage - sellerCommissionPercentage) / 100);
  const vendorPayout = basePrice;

  return {
    basePrice,
    markup: Math.round(markup * 100) / 100,
    markupPercentage,
    finalPrice: Math.round(finalPrice * 100) / 100,
    sellerCommission: Math.round(sellerCommission * 100) / 100,
    platformCommission: Math.round(platformCommission * 100) / 100,
    vendorPayout: Math.round(vendorPayout * 100) / 100,
  };
}

/**
 * Validate commission breakdown
 */
export function validateCommissionBreakdown(breakdown: CommissionBreakdown): boolean {
  const calculated = breakdown.basePrice + breakdown.sellerCommission + breakdown.platformCommission;
  return Math.abs(calculated - breakdown.finalPrice) < 0.01;
}

/**
 * Generate referral code
 */
export function generateReferralCode(sellerId: string, productId: string): string {
  const timestamp = Date.now().toString(36);
  const hash = Math.random().toString(36).substring(2, 8);
  return `${sellerId.substring(0, 4).toUpperCase()}_${productId.substring(0, 4).toUpperCase()}_${hash}`.substring(0, 8);
}

/**
 * Format Indian currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format currency without symbol
 */
export function formatCurrencyAmount(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Get order status badge color
 */
export function getOrderStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    shipped: 'bg-indigo-100 text-indigo-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

/**
 * Get commission status badge color
 */
export function getCommissionStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    available: 'bg-green-100 text-green-800',
    paid: 'bg-blue-100 text-blue-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

/**
 * Mask customer name
 */
export function maskCustomerName(name: string): string {
  if (!name || name.length < 2) return '****';
  const firstChar = name.charAt(0);
  const lastChar = name.charAt(name.length - 1);
  const middleLength = Math.max(2, name.length - 2);
  return `${firstChar}${new Array(middleLength).fill('*').join('')}${lastChar}`;
}

/**
 * Format date time
 */
export function formatDateTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-IN') + ' ' + d.toLocaleTimeString('en-IN');
}

/**
 * Format date only
 */
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-IN');
}

/**
 * Check if commission is available for withdrawal
 */
export function isCommissionAvailable(commissionReleaseDate: string | undefined): boolean {
  if (!commissionReleaseDate) return false;
  return new Date(commissionReleaseDate) <= new Date();
}

/**
 * Calculate days until commission is available
 */
export function daysUntilCommissionAvailable(commissionReleaseDate: string | undefined): number {
  if (!commissionReleaseDate) return 0;
  const releaseDate = new Date(commissionReleaseDate);
  const today = new Date();
  const diff = releaseDate.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

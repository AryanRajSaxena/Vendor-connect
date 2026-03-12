const DEFAULT_VENDOR_PAYOUT_PERCENTAGE = 80;
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
  vendorPayoutPercentage: number = DEFAULT_VENDOR_PAYOUT_PERCENTAGE,
  sellerCommissionPercentage: number = DEFAULT_SELLER_COMMISSION_PERCENTAGE
): CommissionBreakdown {
  const finalPrice = basePrice; // no markup — listed at vendor's price
  const vendorPayout = finalPrice * (vendorPayoutPercentage / 100);
  const sellerCommission = finalPrice * (sellerCommissionPercentage / 100);
  const platformCommission = finalPrice - vendorPayout - sellerCommission;

  return {
    basePrice,
    markup: 0,
    markupPercentage: 0,
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
  const hash = Math.random().toString(36).substring(2, 8);
  return `${sellerId.substring(0, 4).toUpperCase()}_${productId.substring(0, 4).toUpperCase()}_${hash}`.substring(0, 8);
}

/**
 * Convert a cover image URL to a directly embeddable src.
 * Handles Google Drive share links → direct view URL.
 * Returns null if the value is empty or an emoji (non-http string).
 */
export function getImageUrl(url: string | undefined | null): string | null {
  if (!url || !url.startsWith('http')) return null;

  // Google Drive: https://drive.google.com/file/d/FILE_ID/view...
  const driveFile = url.match(/drive\.google\.com\/file\/d\/([^/?]+)/);
  if (driveFile) {
    return `https://drive.google.com/thumbnail?id=${driveFile[1]}&sz=w800`;
  }

  // Google Drive: https://drive.google.com/open?id=FILE_ID
  const driveOpen = url.match(/drive\.google\.com\/open\?.*id=([^&]+)/);
  if (driveOpen) {
    return `https://drive.google.com/thumbnail?id=${driveOpen[1]}&sz=w800`;
  }

  return url;
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

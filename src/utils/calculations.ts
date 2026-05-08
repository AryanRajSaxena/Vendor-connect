import { superheroData, adjectives } from '@/superhero';

const DEFAULT_VENDOR_PAYOUT_PERCENTAGE = 80;

export interface CommissionBreakdown {
  basePrice: number;
  markup: number;
  markupPercentage: number;
  customerPrice: number;
  sellerCommission: number;
  platformCommission: number;
  vendorPayout: number;
}

/**
 * Calculate commission breakdown for a product
 * Vendor receives 80%, Platform gets 20%
 */
export function calculateCommissions(
  basePrice: number,
  vendorPayoutPercentage: number = DEFAULT_VENDOR_PAYOUT_PERCENTAGE
): CommissionBreakdown {
  const customerPrice = basePrice; // no markup — listed at vendor's price
  const vendorPayout = customerPrice * (vendorPayoutPercentage / 100);
  const platformCommission = customerPrice * ((100 - vendorPayoutPercentage) / 100);
  const sellerCommission = 0; // Not used in display anymore

  return {
    basePrice,
    markup: 0,
    markupPercentage: 0,
    customerPrice: Math.round(customerPrice * 100) / 100,
    sellerCommission: Math.round(sellerCommission * 100) / 100,
    platformCommission: Math.round(platformCommission * 100) / 100,
    vendorPayout: Math.round(vendorPayout * 100) / 100,
  };
}

/**
 * Validate commission breakdown
 */
export function validateCommissionBreakdown(breakdown: CommissionBreakdown): boolean {
  const calculated =
    breakdown.vendorPayout +
    breakdown.sellerCommission +
    breakdown.platformCommission;
  return Math.abs(calculated - breakdown.customerPrice) < 0.01;
}

/**
 * Generate referral code using superhero names and adjectives
 * Creates a unique, memorable code based on seller ID
 * @param sellerId - The seller's unique identifier
 * @returns A unique referral code in format: "Adjective-Superhero"
 */
export function generateReferralCode(sellerId: string): string {
  // Create a hash from the seller ID to ensure consistency
  let hash = 0;
  for (let i = 0; i < sellerId.length; i++) {
    const charCode = sellerId.charCodeAt(i);
    hash = (hash << 5) - hash + charCode;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Use the hash to get consistent indices
  const adjectiveIndex = Math.abs(hash % adjectives.length);
  const superheroIndex = Math.abs(Math.floor(hash / adjectives.length) % superheroData.length);

  const selectedAdjective = adjectives[adjectiveIndex];
  const selectedSuperhero = superheroData[superheroIndex];

  return `${selectedAdjective}-${selectedSuperhero}`;
}

/**
 * Convert a cover image URL to a directly embeddable src.
 * Handles Google Drive share links → proxy URL for browser compatibility.
 * Returns null if the value is empty or an emoji (non-http string).
 */
export function getImageUrl(url: string | undefined | null): string | null {
  if (!url) return null;

  const raw = url.trim();
  if (!raw) return null;

  if (raw.startsWith('data:image/')) return raw;

  // Normalize local/relative paths (including Windows-style backslashes)
  const normalizedPath = raw.replace(/\\/g, '/').replace(/^\.\//, '');

  if (normalizedPath.startsWith('/images/')) {
    return normalizedPath;
  }

  if (normalizedPath.startsWith('images/')) {
    return `/${normalizedPath}`;
  }

  if (normalizedPath.startsWith('public/images/')) {
    return `/${normalizedPath.replace(/^public\//, '')}`;
  }

  if (normalizedPath.startsWith('src/images/')) {
    return `/${normalizedPath.replace(/^src\//, '')}`;
  }

  if (!raw.startsWith('http')) return null;

  // Google Drive: https://drive.google.com/file/d/FILE_ID/view...
  const driveFile = raw.match(/drive\.google\.com\/file\/d\/([^/?]+)/);
  if (driveFile) {
    return `/api/images/proxy/drive/${driveFile[1]}?sz=w800`;
  }

  // Google Drive: https://drive.google.com/open?id=FILE_ID
  const driveOpen = raw.match(/drive\.google\.com\/open\?.*id=([^&]+)/);
  if (driveOpen) {
    return `/api/images/proxy/drive/${driveOpen[1]}?sz=w800`;
  }

  // If it's a Google Drive lh3 URL, also proxy it via query fallback
  if (raw.includes('lh3.googleusercontent.com')) {
    return `/api/images/proxy?url=${encodeURIComponent(raw)}`;
  }

  return raw;
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

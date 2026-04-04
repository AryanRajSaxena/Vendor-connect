/**
 * Payment Status Utilities
 * Helper functions for tracking and managing payment statuses
 */

export type PaymentStatus = 'initiated' | 'completed' | 'failed' | 'pending' | 'unknown';
export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

/**
 * Map Cashfree order status to internal status
 */
export function mapCashfreeOrderStatus(cashfreeStatus: string): PaymentStatus {
  const statusMap: Record<string, PaymentStatus> = {
    'ACTIVE': 'pending',
    'PAID': 'completed',
    'CANCELLED': 'failed',
    'EXPIRED': 'failed',
  };

  return statusMap[cashfreeStatus?.toUpperCase()] || 'unknown';
}

/**
 * Payment status labels for UI display
 */
export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  initiated: 'Awaiting Payment',
  completed: 'Paid',
  failed: 'Payment Failed',
  pending: 'Processing',
  unknown: 'Unknown',
};

/**
 * Payment status colors for UI
 */
export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  initiated: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  pending: 'bg-yellow-100 text-yellow-800',
  unknown: 'bg-gray-100 text-gray-800',
};

/**
 * Determine if payment is terminal (no further changes expected)
 */
export function isTerminalPaymentStatus(status: PaymentStatus): boolean {
  return status === 'completed' || status === 'failed';
}

/**
 * Determine if order should be processable (payment completed)
 */
export function isOrderProcessable(paymentStatus: PaymentStatus | null, paymentMethod: string): boolean {
  if (paymentMethod === 'cod') {
    return true; // COD orders processable immediately
  }

  return paymentStatus === 'completed';
}

/**
 * Generate order summary for email/receipt
 */
export interface OrderSummary {
  orderId: string;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  customerName: string;
  customerEmail: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

export function generateOrderSummary(order: any): OrderSummary {
  return {
    orderId: order.id,
    total: Number(order.base_price || 0),
    paymentMethod: order.payment_method || 'unknown',
    paymentStatus: order.payment_status || 'pending',
    orderStatus: order.order_status || 'pending',
    customerName: order.customer_details?.name || 'Customer',
    customerEmail: order.customer_details?.email || '',
    items: order.items || [],
  };
}

/**
 * Validate payment amount (prevent fraud)
 */
export function validatePaymentAmount(
  amount: number,
  tolerance: number = 0.01
): { valid: boolean; error?: string } {
  // Check amount is positive
  if (amount <= 0) {
    return { valid: false, error: 'Amount must be greater than 0' };
  }

  // Check amount is not more than 10 lakhs (Cashfree limit)
  if (amount > 1000000) {
    return { valid: false, error: 'Amount exceeds maximum limit' };
  }

  // Check amount has max 2 decimals
  if (amount * 100 !== Math.round(amount * 100)) {
    return { valid: false, error: 'Amount must have at most 2 decimal places' };
  }

  return { valid: true };
}

/**
 * Format payment method for display
 */
export function formatPaymentMethod(method: string): string {
  const labels: Record<string, string> = {
    'card': 'Credit/Debit Card',
    'upi': 'UPI',
    'netbanking': 'Net Banking',
    'wallet': 'Digital Wallet',
    'cod': 'Cash on Delivery',
  };

  return labels[method?.toLowerCase()] || method || 'Unknown';
}

/**
 * Check if payment needs retry logic
 */
export function shouldRetryPayment(error: any): boolean {
  // Retry on network errors
  if (error?.message?.includes('fetch') || error?.message?.includes('network')) {
    return true;
  }

  // Retry on timeout
  if (error?.code === 'ECONNRESET' || error?.code === 'ETIMEDOUT') {
    return true;
  }

  // Retry on 5xx errors
  if (error?.status >= 500) {
    return true;
  }

  return false;
}

/**
 * Calculate retry delay (exponential backoff)
 */
export function calculateRetryDelay(attemptNumber: number): number {
  // Base delay: 1 second, max: 30 seconds
  const delay = Math.min(1000 * Math.pow(2, attemptNumber - 1), 30000);
  // Add jitter (±10%)
  const jitter = delay * 0.1 * (Math.random() - 0.5) * 2;
  return delay + jitter;
}

/**
 * Generate transaction reference number
 */
export function generateTransactionRef(orderId: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const hash = Math.random().toString(36).substr(2, 5).toUpperCase();
  return `TXN-${orderId}-${timestamp}-${hash}`;
}

/**
 * Log payment event (for analytics)
 */
export interface PaymentEvent {
  eventType: 'initiated' | 'completed' | 'failed' | 'verified' | 'retried';
  orderId: string;
  paymentMethod?: string;
  amount?: number;
  timestamp: string;
  details?: Record<string, any>;
}

export function logPaymentEvent(event: PaymentEvent): void {
  if (typeof window !== 'undefined') {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Payment Event]', event);
    }

    // Could send to analytics service here
    // analytics.track('payment_event', event);
  }
}

/**
 * Parse Cashfree error response
 */
export function parseCashfreeError(response: any): string {
  if (typeof response === 'string') {
    return response;
  }

  if (response?.message) {
    return response.message;
  }

  if (response?.error) {
    return typeof response.error === 'string' ? response.error : response.error.message || 'Unknown error';
  }

  return 'Payment gateway error. Please try again.';
}

/**
 * Check if customer can retry payment
 */
export function canRetryPayment(
  lastAttempt: Date | null,
  maxRetries: number = 3,
  attemptedCount: number = 0
): { canRetry: boolean; reason?: string } {
  // Check attempts limit
  if (attemptedCount >= maxRetries) {
    return {
      canRetry: false,
      reason: `Maximum retry attempts (${maxRetries}) exceeded. Please contact support.`,
    };
  }

  // Check rate limiting (min 30 seconds between attempts)
  if (lastAttempt) {
    const timeSinceLastAttempt = Date.now() - new Date(lastAttempt).getTime();
    if (timeSinceLastAttempt < 30000) {
      return {
        canRetry: false,
        reason: 'Please wait before retrying. Try again in a few moments.',
      };
    }
  }

  return { canRetry: true };
}

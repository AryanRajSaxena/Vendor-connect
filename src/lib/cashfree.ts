import crypto from 'crypto';

/**
 * Cashfree configuration and utility functions
 * Documentation: https://www.cashfree.com/docs/payments/online/web/redirect
 */

export interface CashfreeConfig {
  appId: string;
  appSecret: string;
  apiVersion: string;
  baseUrl: string;
  returnUrl: string;
  notifyUrl: string;
}

export interface CashfreePaymentRequest {
  orderId: string;
  orderAmount: number;
  orderCurrency: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  returnUrl: string;
  notifyUrl: string;
  metadata?: Record<string, string>;
}

export interface CashfreePaymentResponse {
  status: number;
  message: string;
  data?: {
    cf_order_id: number;
    created_at: string;
    customer_details: {
      customer_id: string;
      customer_email: string;
      customer_phone: string;
      customer_name: string;
    };
    order_id: string;
    order_amount: number;
    order_currency: string;
    order_expiry_time: string;
    order_meta: {
      return_url: string;
      notify_url: string;
    };
    order_note: string;
    order_splits: null;
    order_status: string;
    order_tags: Record<string, string>;
    payments: null;
    refunds: null;
    settlements: null;
  };
}

export interface CashfreeWebhookPayload {
  data: {
    order: {
      order_id: string;
      order_amount: number;
      order_currency: string;
      order_status: string;
      cf_order_id: number;
    };
    payment: {
      cf_payment_id: number;
      payment_status: string;
      payment_amount: number;
      payment_currency: string;
      payment_method: {
        upi?: string;
        netbanking?: {
          bank_name: string;
        };
        card?: {
          card_number: string;
          card_type: string;
        };
        wallet?: {
          wallet_name: string;
        };
      };
      payment_time: string;
    };
  };
  event_id: string;
  event_time: string;
}

/**
 * Get Cashfree configuration from environment variables
 */
export function getCashfreeConfig(): CashfreeConfig {
  console.log('[getCashfreeConfig] Reading environment variables...');
  
  const appId = process.env.CASHFREE_APP_ID;
  const appSecret = process.env.CASHFREE_APP_SECRET;
  const returnUrl = process.env.CASHFREE_RETURN_URL;
  const notifyUrl = process.env.CASHFREE_NOTIFY_URL;

  console.log('[getCashfreeConfig] Env vars:');
  console.log('  CASHFREE_APP_ID:', appId ? `✓ (length: ${appId.length})` : '✗ MISSING');
  console.log('  CASHFREE_APP_SECRET:', appSecret ? `✓ (length: ${appSecret.length})` : '✗ MISSING');
  console.log('  CASHFREE_RETURN_URL:', returnUrl ? `✓` : '✗ MISSING');
  console.log('  CASHFREE_NOTIFY_URL:', notifyUrl ? `✓` : '✗ MISSING');

  if (!appId || !appSecret || !returnUrl || !notifyUrl) {
    console.error('[getCashfreeConfig] MISSING Cashfree configuration:');
    console.error('  CASHFREE_APP_ID:', appId ? '✓' : '✗ MISSING');
    console.error('  CASHFREE_APP_SECRET:', appSecret ? '✓' : '✗ MISSING');
    console.error('  CASHFREE_RETURN_URL:', returnUrl ? '✓' : '✗ MISSING');
    console.error('  CASHFREE_NOTIFY_URL:', notifyUrl ? '✓' : '✗ MISSING');
    throw new Error('Missing Cashfree configuration in environment variables');
  }

  // Use sandbox for staging, production for live
  const isDevelopment = process.env.NODE_ENV === 'development';
  const baseUrl = isDevelopment
    ? 'https://sandbox.cashfree.com/pg'
    : 'https://api.cashfree.com/pg';

  console.log(`[getCashfreeConfig] ✓ Using Cashfree ${isDevelopment ? 'SANDBOX' : 'PRODUCTION'} endpoint: ${baseUrl}`);

  return {
    appId,
    appSecret,
    apiVersion: '2023-08-01',
    baseUrl,
    returnUrl,
    notifyUrl,
  };
}

/**
 * Generate Cashfree payment authorization header
 * Implementation of: https://www.cashfree.com/docs/payments/online/web/redirect
 */
export function generateCashfreeAuth(
  method: string,
  path: string,
  body: string = ''
): { Authorization: string; 'X-Idempotency-Key': string } {
  const config = getCashfreeConfig();

  // Create timestamp in SECONDS (Unix timestamp) - NOT milliseconds
  // Cashfree API requires seconds for signature generation
  const timestamp = Math.floor(Date.now() / 1000).toString();

  // Create signature: HMAC-SHA256 of {METHOD}{PATH}{BODY}{TIMESTAMP}
  const message = `${method}${path}${body}${timestamp}`;
  const signature = crypto
    .createHmac('sha256', config.appSecret)
    .update(message)
    .digest('base64');

  const authHeader = `${config.appId}:${timestamp}:${signature}`;

  // Log auth details for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log('=== Cashfree Auth Debug ===');
    console.log('Method:', method);
    console.log('Path:', path);
    console.log('AppId length:', config.appId.length);
    console.log('AppSecret length:', config.appSecret.length);
    console.log('Timestamp (seconds):', timestamp);
    console.log('Message for signing:', message.substring(0, 100) + '...');
    console.log('Generated signature:', signature.substring(0, 50) + '...');
    console.log('Auth header:', authHeader.substring(0, 50) + '...');
    console.log('========================');
  }

  return {
    Authorization: authHeader,
    'X-Idempotency-Key': crypto.randomUUID(),
  };
}

/**
 * Verify Cashfree webhook signature
 * Validates that the webhook request came from Cashfree
 */
export function verifyCashfreeWebhookSignature(
  payload: string,
  signature: string
): boolean {
  try {
    const config = getCashfreeConfig();
    const expectedSignature = crypto
      .createHmac('sha256', config.appSecret)
      .update(payload)
      .digest('base64');

    return expectedSignature === signature;
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return false;
  }
}

/**
 * Create a Cashfree payment order
 */
export async function createCashfreePaymentOrder(
  paymentRequest: CashfreePaymentRequest
): Promise<CashfreePaymentResponse> {
  const config = getCashfreeConfig();
  const path = '/orders';

  const body = JSON.stringify({
    order_id: paymentRequest.orderId,
    order_amount: paymentRequest.orderAmount,
    order_currency: paymentRequest.orderCurrency,
    customer_details: {
      customer_name: paymentRequest.customerName,
      customer_email: paymentRequest.customerEmail,
      customer_phone: paymentRequest.customerPhone,
    },
    order_meta: {
      return_url: paymentRequest.returnUrl,
      notify_url: paymentRequest.notifyUrl,
    },
    ...(paymentRequest.metadata && { order_tags: paymentRequest.metadata }),
  });

  const headers = {
    'X-API-VERSION': config.apiVersion,
    'Content-Type': 'application/json',
    ...generateCashfreeAuth('POST', path, body),
  };

  try {
    console.log(`Cashfree Request: POST ${config.baseUrl}${path}`);
    console.log('Request Headers:', { 'X-API-VERSION': config.apiVersion, 'Content-Type': 'application/json' });
    
    const response = await fetch(`${config.baseUrl}${path}`, {
      method: 'POST',
      headers,
      body,
    });

    console.log(`Cashfree Response Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      let errorData: any = {};
      try {
        errorData = await response.json();
      } catch (e) {
        console.error('Failed to parse error response as JSON');
        errorData = { statusText: response.statusText };
      }
      console.error('Cashfree API Error Response:', JSON.stringify(errorData));
      throw new Error(
        `Cashfree API Error (${response.status}): ${errorData.message || errorData.statusText || 'Unknown error'}`
      );
    }

    const responseData = await response.json();
    console.log('Cashfree Success Response:', { cf_order_id: responseData.cf_order_id, status: responseData.order_status });
    return responseData;
  } catch (error) {
    console.error('Error creating Cashfree payment order:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error;
  }
}

/**
 * Get payment order status from Cashfree
 */
export async function getCashfreeOrderStatus(
  orderId: string
): Promise<CashfreePaymentResponse> {
  const config = getCashfreeConfig();
  const path = `/orders/${orderId}`;

  const headers = {
    'X-API-VERSION': config.apiVersion,
    'Content-Type': 'application/json',
    ...generateCashfreeAuth('GET', path),
  };

  try {
    const response = await fetch(`${config.baseUrl}${path}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `Cashfree API Error: ${error.message || response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching Cashfree order status:', error);
    throw error;
  }
}

/**
 * Get payment session URL for redirect flow
 * This is the URL customer needs to visit to complete payment
 */
export function getCashfreePaymentUrl(
  cfOrderId: number,
  orderToken?: string
): string {
  const config = getCashfreeConfig();
  const baseUrl = config.baseUrl.replace('/pg', '');
  return `${baseUrl}/pay/${cfOrderId}${orderToken ? `?token=${orderToken}` : ''}`;
}

/**
 * Extract payment method from Cashfree payment data
 */
export function extractPaymentMethod(
  paymentData: any
): 'card' | 'upi' | 'netbanking' | 'wallet' | 'cod' {
  const method = paymentData?.payment_method;

  if (method?.card) return 'card';
  if (method?.upi) return 'upi';
  if (method?.netbanking) return 'netbanking';
  if (method?.wallet) return 'wallet';

  return 'cod';
}

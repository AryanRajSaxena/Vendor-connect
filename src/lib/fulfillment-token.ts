import crypto from 'crypto';

/**
 * Creates a cryptographically secure token for 1-click fulfillment magic link.
 */
export function generateFulfillmentToken(orderId: string): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.JWT_SECRET || 'agent-croww-secret';
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(16).toString('hex');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}:${timestamp}:${random}`)
    .digest('hex')
    .slice(0, 16);

  return `${timestamp}-${random}-${signature}`;
}

/**
 * Resolves the app origin with fallbacks.
 */
export function getAppUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, '')}`;
  }
  return 'https://agentcroww.com';
}

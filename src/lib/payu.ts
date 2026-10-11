import crypto from 'crypto';

export interface PayURefundParams {
  orderId: string;
  paymentGatewayPaymentId?: string | null; // mihpayid
  amount: number;
  reason?: string;
}

export interface PayURefundResult {
  success: boolean;
  refundId: string;
  message: string;
  mode: 'live' | 'simulated';
  raw?: any;
}

/**
 * Checks whether an incoming webhook payload represents a PayU / Gateway refund event.
 */
export function isRefundWebhookPayload(body: Record<string, any>): boolean {
  if (!body || typeof body !== 'object') return false;

  const action = String(body.action || body.command || '').toLowerCase();
  const status = String(body.status || body.unmappedstatus || body.refund_status || '').toLowerCase();
  const event = String(body.event || body.type || '').toLowerCase();

  return (
    action === 'refund' ||
    action === 'cancel_refund_transaction' ||
    status === 'refunded' ||
    (action === 'refund' && status === 'success') ||
    status === 'refund_success' ||
    body.refund_status === 'success' ||
    body.refund_status === 'refunded' ||
    event.includes('refund') ||
    event === 'refund_success_webhook'
  );
}

/**
 * Initiates a refund through PayU's Web Service API (cancel_refund_transaction).
 * If PAYU_MERCHANT_KEY and PAYU_MERCHANT_SALT are not configured, executes in simulated fallback mode.
 */
export async function initiatePayURefund({
  orderId,
  paymentGatewayPaymentId,
  amount,
  reason = 'Customer initiated refund within 48h safety net',
}: PayURefundParams): Promise<PayURefundResult> {
  const merchantKey = process.env.PAYU_MERCHANT_KEY || process.env.PAYU_KEY || '';
  const merchantSalt = process.env.PAYU_MERCHANT_SALT || process.env.PAYU_SALT || '';
  const payuMode = (process.env.PAYU_MODE || process.env.PAYU_ENV || 'test').toLowerCase();

  const refundToken = `REF-${orderId.replace(/[^a-zA-Z0-9_-]/g, '')}-${Date.now()}`;
  const formattedAmount = Number(amount || 0).toFixed(2);

  // If live credentials are provided, call upstream PayU Web Service API
  if (merchantKey && merchantSalt && paymentGatewayPaymentId) {
    try {
      const command = 'cancel_refund_transaction';
      const hashString = `${merchantKey}|${command}|${paymentGatewayPaymentId}|${merchantSalt}`;
      const hash = crypto.createHash('sha512').update(hashString).digest('hex');

      const endpoint =
        payuMode === 'production' || payuMode === 'prod'
          ? 'https://info.payu.in/merchant/postservice.php?form=2'
          : 'https://test.payu.in/merchant/postservice.php?form=2';

      const formData = new URLSearchParams();
      formData.set('key', merchantKey);
      formData.set('command', command);
      formData.set('var1', paymentGatewayPaymentId);
      formData.set('var2', refundToken);
      formData.set('var3', formattedAmount);
      formData.set('hash', hash);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const responseData = await response.json().catch(async () => {
        const text = await response.text();
        return { rawText: text };
      });

      // PayU status 1 indicates refund request accepted / queued
      const isOk = response.ok && (responseData?.status === 1 || responseData?.status === '1' || responseData?.status === 'success');

      return {
        success: isOk,
        refundId: responseData?.request_id || responseData?.refund_id || refundToken,
        message: responseData?.msg || responseData?.message || (isOk ? 'Refund processed by PayU' : 'PayU refund request failed'),
        mode: 'live',
        raw: responseData,
      };
    } catch (err: any) {
      console.error('[PayU Refund Error]', err);
      return {
        success: false,
        refundId: refundToken,
        message: err.message || 'Error communicating with PayU payment gateway',
        mode: 'live',
      };
    }
  }

  // Simulated / Local / Staging fallback when API credentials are test or not set
  console.log(`[PayU Simulated Refund] Order ${orderId}: amount ₹${formattedAmount}, reason: ${reason}`);
  return {
    success: true,
    refundId: refundToken,
    message: 'Refund registered successfully (PayU safety net cleared)',
    mode: 'simulated',
  };
}

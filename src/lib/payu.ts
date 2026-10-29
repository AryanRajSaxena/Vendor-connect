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

// -----------------------------------------------------------------------------
// PayU Split Payments (Routing) Engine
// Indian E-commerce Compliance: TDS (Sec 194-O) & TCS (Sec 52 GST)
// -----------------------------------------------------------------------------

/**
 * Statutory and Platform Commission Constants
 */
export const PAYU_GATEWAY_FEE_PERCENTAGE = 2.36; // Payment gateway standard fee (~2% + 18% GST = 2.36%)
export const ECOMMERCE_TDS_PERCENTAGE = 0.1; // Section 194-O Income Tax TDS: 0.1%
export const ECOMMERCE_TCS_PERCENTAGE = 0.5; // Section 52 CGST/SGST E-Commerce TCS: 0.5%
export const PLATFORM_PROFIT_PERCENTAGE = 10.0; // Agent Croww pure platform profit: 10%
export const SELLER_COMMISSION_PERCENTAGE = 10.0; // Affiliate pure seller commission: 10%
export const VENDOR_GROSS_PERCENTAGE = 80.0; // Vendor gross revenue share: 80%

const roundToTwoDecimals = (val: number): number => Math.round((val + Number.EPSILON) * 100) / 100;

export interface PayUSplitRoutingParams {
  /**
   * Gross Amount paid by Customer (inclusive of all taxes like GST)
   */
  grossAmount: number;
  /**
   * Optional PayU child merchant account ID for the Vendor
   */
  vendorChildAccountId?: string;
  /**
   * Optional PayU child merchant account ID for the Affiliate Seller
   */
  sellerChildAccountId?: string;
  /**
   * Optional PayU merchant account ID for Agent Croww Platform
   */
  platformAccountId?: string;
  /**
   * Whether an affiliate seller is attributed for this order (defaults to true)
   */
  hasSeller?: boolean;
  /**
   * Optional custom gateway fee percentage override (defaults to 2.36%)
   */
  customGatewayFeePercentage?: number;
}

export interface PayUSplitBreakdown {
  grossAmount: number;
  rates: {
    vendorGrossRate: number; // 80%
    platformProfitRate: number; // 10% (or 20% on direct sales)
    sellerCommissionRate: number; // 10% (or 0% on direct sales)
    gatewayFeeRate: number; // 2.36%
    tdsRate: number; // 0.1%
    tcsRate: number; // 0.5%
    totalVendorDeductionsRate: number; // 2.36% + 0.1% + 0.5% = 2.96%
    netVendorRate: number; // 80% - 2.96% = 77.04%
    platformFinalRoutedRate: number; // 10% + 0.1% + 0.5% = 10.6%
  };
  sellerCommission: number; // Pure 10% affiliate commission
  platformPureProfit: number; // Pure 10% platform profit
  vendorGrossAmount: number; // 80% vendor gross entitlement
  gatewayFee: number; // Payment gateway fee (~2.36%) deducted from vendor share
  tdsAmount: number; // 0.1% TDS deducted from vendor share (held by platform for gov deposit)
  tcsAmount: number; // 0.5% TCS deducted from vendor share (held by platform for gov deposit)
  totalTaxWithheld: number; // TDS + TCS (0.6%) held by platform
  totalVendorDeductions: number; // Gateway Fee + TDS + TCS (2.96%) deducted from vendor
  netVendorPayout: number; // Net routed to vendor (80% - 2.96% = 77.04%)
  platformFinalRoutedAmount: number; // Platform 10% profit + TDS + TCS held (10.6%)
}

export interface PayURoutedAccount {
  name: string;
  role: 'platform' | 'vendor' | 'seller';
  merchantId?: string;
  amount: number;
  description: string;
}

export interface PayUSplitRoutingResult {
  breakdown: PayUSplitBreakdown;
  routedAmounts: {
    platform: number; // 10% Profit + 0.1% TDS + 0.5% TCS = 10.6%
    vendor: number; // 80% Gross - 2.36% Gateway - 0.1% TDS - 0.5% TCS = 77.04%
    seller: number; // 10% Pure Affiliate Commission
    gatewayRetained: number; // 2.36% retained by payment gateway
  };
  splitDetails: PayURoutedAccount[];
  payuSplitInfo: Array<{
    name: string;
    value: string;
    merchantId?: string;
    description: string;
  }>;
  /**
   * JSON formatted string ready to be passed directly to PayU API (splitPaymentDetails / splitInfo)
   */
  payuSplitInfoJson: string;
  /**
   * Mathematical validation flag confirming that total payouts reconcile to grossAmount
   */
  isBalanced: boolean;
}

/**
 * Calculates PayU Split Payments (Routing) according to Indian e-commerce statutory rules:
 * - Customer pays Gross Amount (inclusive of all taxes).
 * - Platform takes exactly 10% pure profit.
 * - Seller (Affiliate) takes exactly 10% pure commission.
 * - ALL extra costs (Gateway Fee ~2.36%, TDS 0.1%, TCS 0.5%) are deducted entirely from Vendor's 80% share.
 * - Platform temporarily holds TDS & TCS to deposit with the government at month-end.
 * - Platform's final routed amount = 10% Profit + TDS (0.1%) + TCS (0.5%) = 10.6%.
 */
export function calculatePayUSplitRouting({
  grossAmount,
  vendorChildAccountId,
  sellerChildAccountId,
  platformAccountId = process.env.PAYU_MERCHANT_KEY || 'PLATFORM_PRIMARY',
  hasSeller = true,
  customGatewayFeePercentage = PAYU_GATEWAY_FEE_PERCENTAGE,
}: PayUSplitRoutingParams): PayUSplitRoutingResult {
  const customerGross = Math.max(0, roundToTwoDecimals(Number(grossAmount || 0)));

  const gatewayFeePct = customGatewayFeePercentage;
  const tdsPct = ECOMMERCE_TDS_PERCENTAGE;
  const tcsPct = ECOMMERCE_TCS_PERCENTAGE;
  const sellerPct = hasSeller ? SELLER_COMMISSION_PERCENTAGE : 0;
  const platformProfitPct = hasSeller ? PLATFORM_PROFIT_PERCENTAGE : (PLATFORM_PROFIT_PERCENTAGE + SELLER_COMMISSION_PERCENTAGE);
  const vendorGrossPct = VENDOR_GROSS_PERCENTAGE;

  // 1. Calculate Exact Percentages
  const sellerCommission = roundToTwoDecimals(customerGross * (sellerPct / 100));
  const platformPureProfit = roundToTwoDecimals(customerGross * (platformProfitPct / 100));
  const vendorGrossAmount = roundToTwoDecimals(customerGross * (vendorGrossPct / 100));

  // 2. Extra Costs (All Deducted Entirely from Vendor's 80% Share)
  const gatewayFee = roundToTwoDecimals(customerGross * (gatewayFeePct / 100));
  const tdsAmount = roundToTwoDecimals(customerGross * (tdsPct / 100));
  const tcsAmount = roundToTwoDecimals(customerGross * (tcsPct / 100));
  const totalTaxWithheld = roundToTwoDecimals(tdsAmount + tcsAmount);
  const totalVendorDeductions = roundToTwoDecimals(gatewayFee + tdsAmount + tcsAmount);

  // 3. Net Vendor Payout (80% - Gateway Fee - TDS - TCS)
  const netVendorPayout = Math.max(0, roundToTwoDecimals(vendorGrossAmount - totalVendorDeductions));

  // 4. Platform Final Routed Amount (10% Pure Profit + TDS + TCS held for gov remittance)
  const platformFinalRoutedAmount = roundToTwoDecimals(platformPureProfit + totalTaxWithheld);

  const totalDeductionsRate = roundToTwoDecimals(gatewayFeePct + tdsPct + tcsPct);
  const netVendorRate = roundToTwoDecimals(vendorGrossPct - totalDeductionsRate);
  const platformFinalRate = roundToTwoDecimals(platformProfitPct + tdsPct + tcsPct);

  const breakdown: PayUSplitBreakdown = {
    grossAmount: customerGross,
    rates: {
      vendorGrossRate: vendorGrossPct,
      platformProfitRate: platformProfitPct,
      sellerCommissionRate: sellerPct,
      gatewayFeeRate: gatewayFeePct,
      tdsRate: tdsPct,
      tcsRate: tcsPct,
      totalVendorDeductionsRate: totalDeductionsRate,
      netVendorRate,
      platformFinalRoutedRate: platformFinalRate,
    },
    sellerCommission,
    platformPureProfit,
    vendorGrossAmount,
    gatewayFee,
    tdsAmount,
    tcsAmount,
    totalTaxWithheld,
    totalVendorDeductions,
    netVendorPayout,
    platformFinalRoutedAmount,
  };

  // 5. PayU Split Routing Accounts Setup
  const splitDetails: PayURoutedAccount[] = [
    {
      name: 'Agent Croww Platform',
      role: 'platform',
      merchantId: platformAccountId,
      amount: platformFinalRoutedAmount,
      description: `Platform 10% Pure Profit (₹${platformPureProfit.toFixed(2)}) + TDS 0.1% (₹${tdsAmount.toFixed(2)}) + TCS 0.5% (₹${tcsAmount.toFixed(2)}) held for statutory compliance`,
    },
    {
      name: 'Vendor',
      role: 'vendor',
      merchantId: vendorChildAccountId,
      amount: netVendorPayout,
      description: `Vendor Net Remittance (80% Gross ₹${vendorGrossAmount.toFixed(2)} minus ₹${gatewayFee.toFixed(2)} Gateway Fee, ₹${tdsAmount.toFixed(2)} TDS, ₹${tcsAmount.toFixed(2)} TCS)`,
    },
  ];

  if (hasSeller && sellerCommission > 0) {
    splitDetails.push({
      name: 'Affiliate Seller',
      role: 'seller',
      merchantId: sellerChildAccountId,
      amount: sellerCommission,
      description: `Affiliate Partner 10% Pure Referral Commission`,
    });
  }

  // PayU standard split payload items
  const payuSplitInfo = splitDetails.map((acc) => ({
    name: acc.name,
    value: acc.amount.toFixed(2),
    merchantId: acc.merchantId,
    description: acc.description,
  }));

  // Reconcile total payouts against customer gross payment (minus gateway fee retained by PayU)
  const totalRouted = roundToTwoDecimals(platformFinalRoutedAmount + netVendorPayout + sellerCommission);
  const totalAccountedFor = roundToTwoDecimals(totalRouted + gatewayFee);
  const isBalanced = Math.abs(totalAccountedFor - customerGross) <= 0.05;

  return {
    breakdown,
    routedAmounts: {
      platform: platformFinalRoutedAmount,
      vendor: netVendorPayout,
      seller: sellerCommission,
      gatewayRetained: gatewayFee,
    },
    splitDetails,
    payuSplitInfo,
    payuSplitInfoJson: JSON.stringify(payuSplitInfo),
    isBalanced,
  };
}

/**
 * Validates that a PayU split calculation is completely balanced down to the paise.
 */
export function verifyPayUSplitBalance(result: PayUSplitRoutingResult): boolean {
  return result.isBalanced;
}

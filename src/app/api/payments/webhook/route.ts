import { NextRequest, NextResponse } from 'next/server';
import { verifyCashfreeWebhookSignature, extractPaymentMethod, CashfreeWebhookPayload } from '@/lib/cashfree';
import { supabase } from '@/lib/supabase';

/**
 * POST /api/payments/webhook
 * Handles Cashfree payment webhooks
 * 
 * This endpoint is called by Cashfree when payment status changes
 * Documentation: https://www.cashfree.com/docs/payments/online/web/webhooks
 */
export async function POST(request: NextRequest) {
  try {
    // Get signature from headers
    const signature = request.headers.get('x-cashfree-signature');
    if (!signature) {
      console.warn('Webhook request missing signature header');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 401 }
      );
    }

    // Get raw body for signature verification
    const bodyText = await request.text();

    // Verify webhook signature
    const isValidSignature = verifyCashfreeWebhookSignature(bodyText, signature);
    if (!isValidSignature) {
      console.warn('Webhook signature verification failed');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse webhook payload
    let payload: CashfreeWebhookPayload;
    try {
      payload = JSON.parse(bodyText);
    } catch (error) {
      console.error('Failed to parse webhook payload:', error);
      return NextResponse.json(
        { error: 'Invalid payload' },
        { status: 400 }
      );
    }

    // Extract payment details
    const { data } = payload;
    if (!data?.order?.order_id || !data?.payment) {
      console.error('Invalid webhook payload structure:', payload);
      return NextResponse.json(
        { error: 'Invalid payload structure' },
        { status: 400 }
      );
    }

    const orderId = data.order.order_id;
    const paymentStatus = data.payment.payment_status;
    const cfPaymentId = data.payment.cf_payment_id;
    const paymentMethod = extractPaymentMethod(data.payment);

    // Idempotency: Check if webhook already processed
    const { data: existingWebhook } = await supabase
      .from('payment_webhooks')
      .select('id')
      .eq('event_id', payload.event_id)
      .maybeSingle();

    if (existingWebhook) {
      console.log(`Webhook already processed: ${payload.event_id}`);
      return NextResponse.json({ success: true, idempotent: true });
    }

    // Store webhook for idempotency
    try {
      await supabase.from('payment_webhooks').insert([
        {
          event_id: payload.event_id,
          event_time: payload.event_time,
          order_id: orderId,
          payment_status: paymentStatus,
          payload: payload,
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      // Webhook already processed (idempotency)
      console.log(`Webhook already processed: ${payload.event_id}`);
    }

    // Handle payment status updates
    let orderStatus: string;
    let shouldCreditSeller = false;

    switch (paymentStatus.toLowerCase()) {
      case 'success':
      case 'paid':
        orderStatus = 'confirmed';
        shouldCreditSeller = true;
        break;

      case 'failed':
      case 'declined':
        orderStatus = 'pending';
        break;

      case 'user_dropped':
      case 'cancelled':
        orderStatus = 'cancelled';
        break;

      default:
        // Unknown status - don't update
        console.warn(`Unknown payment status: ${paymentStatus}`);
        return NextResponse.json({ success: true });
    }

    // Begin transaction - update order and payments
    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle();

    if (orderError || !order) {
      console.error('Order not found:', orderId, 'error:', orderError);
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Don't reprocess completed payments
    if (order.payment_status === 'completed') {
      console.log(`Order already paid: ${orderId}`);
      return NextResponse.json({ success: true });
    }

    // Update payment record
    const { error: paymentUpdateError } = await supabase
      .from('payments')
      .update({
        status: paymentStatus.toLowerCase() === 'paid' ? 'completed' : 'failed',
        payment_method: paymentMethod,
        transaction_id: cfPaymentId.toString(),
        gateway_response: data,
        updated_at: new Date().toISOString(),
      })
      .eq('order_id', orderId);

    if (paymentUpdateError) {
      console.error('Failed to update payment record:', paymentUpdateError);
      throw paymentUpdateError;
    }

    // If payment successful, update order and credit seller
    if (shouldCreditSeller && paymentStatus.toLowerCase() === 'paid') {
      // Update order status
      const { error: orderUpdateError } = await supabase
        .from('orders')
        .update({
          payment_status: 'completed',
          order_status: 'confirmed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (orderUpdateError) {
        console.error('Failed to update order:', orderUpdateError);
        throw orderUpdateError;
      }

      // Credit seller (if seller_id exists)
      if (order.seller_id) {
        await creditSellerWallet(order.seller_id, Number(order.seller_commission || 0), orderId);
      }

      // Log successful payment for analytics
      await supabase.from('payment_logs').insert([
        {
          order_id: orderId,
          customer_id: order.customer_id,
          vendor_id: order.vendor_id,
          seller_id: order.seller_id,
          payment_method: paymentMethod,
          amount: data.payment.payment_amount,
          status: 'completed',
          cf_payment_id: cfPaymentId,
          created_at: new Date().toISOString(),
        },
      ]).catch(err => console.warn('Failed to log payment:', err));
    }

    // If payment failed, update order
    if (paymentStatus.toLowerCase() === 'failed' || paymentStatus.toLowerCase() === 'declined') {
      const { error: orderUpdateError } = await supabase
        .from('orders')
        .update({
          payment_status: 'failed',
          order_status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (orderUpdateError) {
        console.error('Failed to update order on payment failure:', orderUpdateError);
      }
    }

    console.log(`Webhook processed successfully for order: ${orderId}, status: ${paymentStatus}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    // Return 200 to acknowledge receipt, but log the error
    // Cashfree will retry failed webhooks
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    );
  }
}

/**
 * Credit seller's wallet when payment is successful
 */
async function creditSellerWallet(
  sellerId: string,
  commissionAmount: number,
  orderId: string
): Promise<void> {
  try {
    if (commissionAmount <= 0) return;

    const roundedAmount = Math.round(commissionAmount * 100) / 100;

    // Check if seller account exists
    const { data: sellerAccount } = await supabase
      .from('seller_accounts')
      .select('id, total_earnings, available_balance')
      .eq('seller_id', sellerId)
      .maybeSingle();

    if (sellerAccount?.id) {
      // Update existing account
      const newTotalEarnings = Math.round(
        (Number(sellerAccount.total_earnings || 0) + roundedAmount) * 100
      ) / 100;
      const newAvailableBalance = Math.round(
        (Number(sellerAccount.available_balance || 0) + roundedAmount) * 100
      ) / 100;

      const { error: updateError } = await supabase
        .from('seller_accounts')
        .update({
          total_earnings: newTotalEarnings,
          available_balance: newAvailableBalance,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sellerAccount.id);

      if (updateError) throw updateError;
    } else {
      // Create new account
      const { error: insertError } = await supabase
        .from('seller_accounts')
        .insert([
          {
            seller_id: sellerId,
            total_earnings: roundedAmount,
            available_balance: roundedAmount,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);

      if (insertError) throw insertError;
    }

    // Log transaction
    await supabase
      .from('seller_transactions')
      .insert([
        {
          seller_id: sellerId,
          order_id: orderId,
          amount: roundedAmount,
          type: 'earning',
          description: `Commission from order ${orderId}`,
          status: 'completed',
          created_at: new Date().toISOString(),
        },
      ])
      .catch(err => console.warn('Failed to log seller transaction:', err));
  } catch (error) {
    console.error(`Error crediting seller wallet for seller ${sellerId}:`, error);
    throw error;
  }
}

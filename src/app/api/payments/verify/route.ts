import { NextRequest, NextResponse } from 'next/server';
import { getCashfreeOrderStatus } from '@/lib/cashfree';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/payments/verify
 * Verifies payment status after redirect from Cashfree
 * 
 * Query parameters:
 * - orderId: Internal order ID
 * - cfOrderId: Cashfree order ID (optional, for verification)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const orderId = searchParams.get('orderId');
    const cfOrderId = searchParams.get('cfOrderId');

    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid orderId parameter' },
        { status: 400 }
      );
    }

    // Get payment record from database
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })
      .maybeSingle();

    if (paymentError) {
      console.error('Database error fetching payment:', paymentError);
      return NextResponse.json(
        { error: 'Failed to fetch payment information' },
        { status: 500 }
      );
    }

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment record not found' },
        { status: 404 }
      );
    }

    // If payment already completed, return success
    if (payment.status === 'completed') {
      return NextResponse.json({
        success: true,
        paymentStatus: 'completed',
        orderId,
        message: 'Payment completed successfully',
      });
    }

    // Query Cashfree to verify current payment status
    try {
      const cashfreeStatus = await getCashfreeOrderStatus(payment.cf_order_id);

      if (cashfreeStatus.data?.order_status === 'PAID') {
        // Payment is confirmed - update database
        const { error: updateError } = await supabase
          .from('payments')
          .update({
            status: 'completed',
            updated_at: new Date().toISOString(),
          })
          .eq('order_id', orderId);

        if (!updateError) {
          // Update order
          await supabase
            .from('orders')
            .update({
              payment_status: 'completed',
              order_status: 'confirmed',
              updated_at: new Date().toISOString(),
            })
            .eq('id', orderId)
            .catch(err => console.warn('Failed to update order:', err));
        }

        return NextResponse.json({
          success: true,
          paymentStatus: 'completed',
          orderId,
          message: 'Payment verified successfully',
        });
      }

      if (cashfreeStatus.data?.order_status === 'ACTIVE') {
        return NextResponse.json({
          success: false,
          paymentStatus: 'pending',
          orderId,
          message: 'Payment is still pending',
        });
      }

      if (
        cashfreeStatus.data?.order_status === 'CANCELLED' ||
        cashfreeStatus.data?.order_status === 'EXPIRED'
      ) {
        return NextResponse.json({
          success: false,
          paymentStatus: 'failed',
          orderId,
          message: 'Payment failed or expired',
        });
      }
    } catch (error) {
      console.warn('Error verifying with Cashfree:', error);
      // Continue with database status if Cashfree API fails
    }

    // Return current payment status from database
    return NextResponse.json({
      success: payment.status === 'completed',
      paymentStatus: payment.status,
      orderId,
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/payments/verify
 * Performs server-side payment verification by querying Cashfree
 * Used when webhook might not have been received
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { orderId, customerId } = body;

    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid orderId' },
        { status: 400 }
      );
    }

    // Get order to verify customer authorization
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle();

    if (orderError || !order) {
      console.error('Order fetch error:', orderError, 'orderId:', orderId);
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Verify customer authorization (if customerId provided)
    if (customerId && order.customer_id !== customerId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // If already completed, return success
    if (order.payment_status === 'completed') {
      return NextResponse.json({
        success: true,
        paymentStatus: 'completed',
        message: 'Order already paid',
      });
    }

    // Get payment record
    const { data: payment } = await supabase
      .from('payments')
      .select('cf_order_id, status')
      .eq('order_id', orderId)
      .maybeSingle();

    if (!payment) {
      return NextResponse.json(
        { error: 'No payment initiated for this order' },
        { status: 400 }
      );
    }

    // Verify with Cashfree
    try {
      const cashfreeStatus = await getCashfreeOrderStatus(orderId);

      if (cashfreeStatus.data?.order_status === 'PAID') {
        // Mark payment as completed
        await supabase
          .from('payments')
          .update({
            status: 'completed',
            updated_at: new Date().toISOString(),
          })
          .eq('order_id', orderId);

        await supabase
          .from('orders')
          .update({
            payment_status: 'completed',
            order_status: 'confirmed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId);

        return NextResponse.json({
          success: true,
          paymentStatus: 'completed',
          message: 'Payment verified',
        });
      }

      return NextResponse.json({
        success: false,
        paymentStatus: cashfreeStatus.data?.order_status?.toLowerCase() || 'unknown',
        message: 'Payment not yet completed',
      });
    } catch (error) {
      console.error('Error verifying payment with Cashfree:', error);
      return NextResponse.json(
        { error: 'Failed to verify payment status' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

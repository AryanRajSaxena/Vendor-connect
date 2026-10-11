import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { initiatePayURefund } from '@/lib/payu';

const roundMoney = (val: number) => Math.round(val * 100) / 100;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { orderId, reason } = body;

    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json(
        { error: 'Order ID is required to initiate a refund' },
        { status: 400 }
      );
    }

    const cleanOrderId = orderId.trim();

    // 1. Fetch the Order from DB
    let { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .or(`id.eq.${cleanOrderId},payment_gateway_order_id.eq.${cleanOrderId}`)
      .maybeSingle();

    if (orderError || !order) {
      const { data: fallback } = await supabase
        .from('orders')
        .select('*')
        .eq('id', cleanOrderId)
        .maybeSingle();
      order = fallback;
    }

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.payment_status === 'refunded' || order.order_status === 'refunded') {
      return NextResponse.json({
        message: 'Order is already marked as refunded.',
        orderId: order.id,
        isRefunded: true,
      });
    }

    // 2. Check 48-Hour Safety Net Window
    const createdAt = new Date(order.created_at).getTime();
    const now = Date.now();
    const elapsedMs = now - createdAt;
    const isWithin48hSafetyNet = !isNaN(createdAt) && elapsedMs <= 48 * 3600 * 1000;
    const remainingHours = Math.max(0, Math.ceil((48 * 3600 * 1000 - elapsedMs) / (3600 * 1000)));

    const refundAmount = Number(order.final_price || order.base_price || 0);

    // 3. Initiate Refund via PayU Gateway Service
    const payuResult = await initiatePayURefund({
      orderId: order.id,
      paymentGatewayPaymentId: order.payment_gateway_payment_id,
      amount: refundAmount,
      reason: reason || (isWithin48hSafetyNet ? 'Refund within 48-hour safety net window' : 'Order refund'),
    });

    if (!payuResult.success) {
      return NextResponse.json(
        { error: `PayU refund initiation failed: ${payuResult.message}` },
        { status: 502 }
      );
    }

    // 4. Update the Order in Database:
    // Mark as refunded and clear commission status so pending fulfillment becomes 0
    const existingDetails =
      typeof order.customer_details === 'object' && order.customer_details !== null
        ? order.customer_details
        : {};

    const updatedDetails = {
      ...existingDetails,
      refund: {
        refund_id: payuResult.refundId,
        refunded_at: new Date().toISOString(),
        amount: refundAmount,
        reason: reason || 'Safety net refund',
        within_48h_window: isWithin48hSafetyNet,
        gateway_mode: payuResult.mode,
      },
    };

    const { error: updateError } = await supabase
      .from('orders')
      .update({
        payment_status: 'refunded',
        order_status: 'refunded',
        commission_status: 'refunded',
        customer_details: updatedDetails,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id);

    if (updateError) {
      console.error('[Refund Route] Database update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update order status in database: ' + updateError.message },
        { status: 500 }
      );
    }

    // 5. Revert Product Sold Count
    if (order.product_id) {
      const { data: prod } = await supabase
        .from('products')
        .select('sold_count')
        .eq('id', order.product_id)
        .maybeSingle();

      if (prod) {
        const newSoldCount = Math.max(0, (prod.sold_count || 1) - (order.quantity || 1));
        await supabase
          .from('products')
          .update({ sold_count: newSoldCount })
          .eq('id', order.product_id);
      }
    }

    // 6. Revert Seller Product Stats if applicable
    if (order.seller_id) {
      const { data: sp } = await supabase
        .from('seller_products')
        .select('id, sales, earnings')
        .eq('seller_id', order.seller_id)
        .eq('product_id', order.product_id)
        .maybeSingle();

      if (sp) {
        const newSales = Math.max(0, (sp.sales || 1) - (order.quantity || 1));
        const newEarnings = roundMoney(Math.max(0, (sp.earnings || 0) - Number(order.seller_commission || 0)));
        await supabase
          .from('seller_products')
          .update({
            sales: newSales,
            earnings: newEarnings,
          })
          .eq('id', sp.id);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: isWithin48hSafetyNet
          ? 'Refund processed within 48h safety net. Pending fulfillment balance cleared to ₹0.'
          : 'Refund processed successfully.',
        orderId: order.id,
        refundAmount,
        isWithin48hSafetyNet,
        remainingHours,
        pendingFulfillmentCleared: true,
        refundId: payuResult.refundId,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[Refund Route] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error while processing refund' },
      { status: 500 }
    );
  }
}

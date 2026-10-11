import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
import { isValidUuid } from '@/utils/auth';

const legacyPriceKey = ['final', 'price'].join('_');

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cleanId = id?.trim();

    if (!cleanId || cleanId === 'undefined' || cleanId === 'null') {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // 1. Fetch order by primary id or payment_gateway_order_id
    let { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .or(`id.eq.${cleanId},payment_gateway_order_id.eq.${cleanId}`)
      .maybeSingle();

    if (!order) {
      const { data: fallbackOrder } = await supabase
        .from('orders')
        .select('*')
        .eq('id', cleanId)
        .maybeSingle();
      order = fallbackOrder;
    }

    if (error || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // 2. Fetch associated product details
    let productDetails = null;
    if (order.product_id) {
      const { data: prod } = await supabase
        .from('products')
        .select('id, name, category, images, course_duration')
        .eq('id', order.product_id)
        .maybeSingle();
      productDetails = prod;
    }

    // 3. Fetch guest customer details if present
    let guestDetails = null;
    if (order.guest_customer_id) {
      const { data: guest } = await supabase
        .from('guest_customers')
        .select('id, email, name, phone')
        .eq('id', order.guest_customer_id)
        .maybeSingle();
      guestDetails = guest;
    }

    // 4. Resolve buyer information cleanly
    const buyerEmail =
      guestDetails?.email ||
      order.customer_details?.email ||
      '';
    const buyerName =
      guestDetails?.name ||
      order.customer_details?.name ||
      '';

    const normalizedOrder = {
      ...order,
      base_price: Number((order as any)?.base_price ?? (order as any)?.[legacyPriceKey] ?? 0),
      product: productDetails,
      guest_customer: guestDetails,
      buyer_email: buyerEmail,
      buyer_name: buyerName,
    };

    return NextResponse.json(normalizedOrder, { status: 200 });
  } catch (error) {
    console.error('Get order error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!isValidUuid(id)) {
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { orderStatus, commissionStatus, commissionReleaseDate, paymentStatus } = body;

    const { data: existingOrder } = await supabase
      .from('orders')
      .select('payment_method, payment_status, commission_release_date, commission_status')
      .eq('id', id)
      .maybeSingle();

    const updateData: any = {};
    if (orderStatus) updateData.order_status = orderStatus;
    if (commissionStatus) updateData.commission_status = commissionStatus;
    if (commissionReleaseDate)
      updateData.commission_release_date = commissionReleaseDate;
    if (paymentStatus) updateData.payment_status = paymentStatus;

    // COD orders are marked paid when they are delivered unless explicitly overridden
    if (
      !paymentStatus &&
      orderStatus === 'delivered' &&
      existingOrder?.payment_method === 'cod' &&
      existingOrder?.payment_status !== 'completed'
    ) {
      updateData.payment_status = 'completed';
    }

    const nextPaymentStatus = updateData.payment_status || existingOrder?.payment_status;
    const isRefunded = nextPaymentStatus === 'refunded' || orderStatus === 'refunded';

    if (isRefunded) {
      updateData.payment_status = 'refunded';
      updateData.commission_status = 'refunded';
    } else {
      const releaseDate = existingOrder?.commission_release_date
        ? new Date(existingOrder.commission_release_date)
        : null;
      const canReleaseCommission =
        nextPaymentStatus === 'completed' &&
        (!releaseDate || Number.isNaN(releaseDate.getTime()) || releaseDate <= new Date());

      if (
        canReleaseCommission &&
        existingOrder?.commission_status !== 'paid' &&
        !commissionStatus
      ) {
        updateData.commission_status = 'available';
      }
    }

    updateData.updated_at = new Date().toISOString();

    const { data: order, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update order' },
        { status: 500 }
      );
    }

    return NextResponse.json(order, { status: 200 });
  } catch (error) {
    console.error('Update order error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return PUT(request, context);
}

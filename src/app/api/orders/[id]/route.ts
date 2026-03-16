import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(order, { status: 200 });
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
    const body = await request.json();
    const { orderStatus, commissionStatus, commissionReleaseDate, paymentStatus } = body;

    const { data: existingOrder } = await supabase
      .from('orders')
      .select('payment_method, payment_status, commission_release_date, commission_status')
      .eq('id', id)
      .single();

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

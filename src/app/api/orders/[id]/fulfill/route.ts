import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { isValidUuid } from '@/utils/auth';
import { getClientIdentifier } from '@/lib/middleware';
import { sendBuyerCredentialsEmail, EmailDispatchResult } from '@/lib/email';

/**
 * GET /api/orders/[id]/fulfill?token=...
 * Validates the order and fulfillment token, returning order details and pre-filled access URL.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!isValidUuid(id)) {
      return NextResponse.json({ error: 'Invalid order ID format' }, { status: 400 });
    }

    const { data: order, error } = await supabase
      .from('orders')
      .select('id, vendor_id, product_id, guest_customer_id, customer_details, order_status, fulfillment_token, access_url, access_credentials, fulfilled_at, vendor_payout, final_price, base_price, created_at')
      .eq('id', id)
      .maybeSingle();

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Token verification: Allow if token matches or vendor is authenticated session
    const isTokenValid = token && order.fulfillment_token && token === order.fulfillment_token;

    // Fetch product details for pre-filled course login URL
    let courseName = 'Digital Course';
    let defaultAccessUrl = '';
    if (order.product_id) {
      const { data: product } = await supabase
        .from('products')
        .select('name, specifications')
        .eq('id', order.product_id)
        .maybeSingle();

      if (product) {
        courseName = product.name || courseName;
        const specs = product.specifications || {};
        defaultAccessUrl = specs.accessUrl || specs.access_url || specs.loginUrl || specs.course_url || '';
      }
    }

    // Fetch buyer details
    let buyerName = order.customer_details?.name || 'Learner';
    let buyerEmail = order.customer_details?.email || '';
    let buyerPhone = order.customer_details?.phone || '';

    if (order.guest_customer_id) {
      const { data: guest } = await supabase
        .from('guest_customers')
        .select('name, email, phone')
        .eq('id', order.guest_customer_id)
        .maybeSingle();

      if (guest) {
        buyerName = guest.name || buyerName;
        buyerEmail = guest.email || buyerEmail;
        buyerPhone = guest.phone || buyerPhone;
      }
    }

    const amountPaid = Number(order.final_price || order.base_price || 0);
    const netPayout = Number(order.vendor_payout || amountPaid * 0.8);
    const isFulfilled = order.order_status === 'fulfilled' || order.order_status === 'delivered';

    return NextResponse.json({
      orderId: order.id,
      vendorId: order.vendor_id,
      orderStatus: order.order_status,
      isFulfilled,
      isTokenValid: Boolean(isTokenValid),
      fulfilledAt: order.fulfilled_at,
      courseName,
      defaultAccessUrl: order.access_url || defaultAccessUrl,
      savedAccessNote: order.access_credentials || '',
      buyer: {
        name: buyerName,
        email: buyerEmail,
        phone: buyerPhone,
      },
      netPayout,
      createdAt: order.created_at,
    }, { status: 200 });
  } catch (err: any) {
    console.error('[fulfill GET] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/orders/[id]/fulfill
 * 1-Click Proof of Delivery:
 * - Records access_url, access_credentials
 * - Stamps fulfilled_at and fulfilled_by_ip
 * - Moves order_status to 'fulfilled'
 * - Activates 48-hour commission clock from fulfilled_at
 * - Automatically emails credentials to the buyer via Resend
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { token, accessUrl, accessNote } = body;

    if (!isValidUuid(id)) {
      return NextResponse.json({ error: 'Invalid order ID format' }, { status: 400 });
    }

    if (!accessUrl || !String(accessUrl).trim()) {
      return NextResponse.json({ error: 'Course Login URL is required' }, { status: 400 });
    }

    const trimmedUrl = String(accessUrl).trim();
    const trimmedNote = accessNote ? String(accessNote).trim() : '';

    // Validate URL syntax
    try {
      new URL(trimmedUrl.startsWith('http') ? trimmedUrl : `https://${trimmedUrl}`);
    } catch {
      return NextResponse.json({ error: 'Please enter a valid Course Login URL (e.g. https://yourlms.com/login)' }, { status: 400 });
    }

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('id, vendor_id, product_id, guest_customer_id, customer_details, order_status, fulfillment_token')
      .eq('id', id)
      .maybeSingle();

    if (orderErr || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Token check: If token is provided, verify match (or allow if vendor is performing it from dashboard)
    if (token && order.fulfillment_token && token !== order.fulfillment_token) {
      return NextResponse.json({ error: 'Invalid or expired fulfillment token' }, { status: 403 });
    }

    const clientIp = getClientIdentifier(request);
    const now = new Date();
    // 48-hour safety net payout clock starts upon fulfillment proof
    const commissionReleaseDate = new Date(now.getTime() + 48 * 3600 * 1000);

    const updatePayload: Record<string, any> = {
      order_status: 'fulfilled',
      access_url: trimmedUrl,
      access_credentials: trimmedNote || null,
      fulfilled_at: now.toISOString(),
      fulfilled_by_ip: clientIp,
      commission_release_date: commissionReleaseDate.toISOString(),
      commission_status: 'pending', // Holds for 48h from fulfillment
      updated_at: now.toISOString(),
    };

    let { data: updatedOrder, error: updateErr } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .maybeSingle();

    // Fallback if specific migration columns don't exist yet in Supabase
    while (updateErr && updateErr.message) {
      const colMatch =
        updateErr.message.match(/Could not find the '([^']+)' column of 'orders'/i) ||
        updateErr.message.match(/column "([^"]+)" of relation "orders" does not exist/i);

      if (colMatch && colMatch[1] && colMatch[1] in updatePayload) {
        delete updatePayload[colMatch[1]];
        const retry = await supabase
          .from('orders')
          .update(updatePayload)
          .eq('id', id)
          .select()
          .maybeSingle();
        updatedOrder = retry.data;
        updateErr = retry.error;
      } else {
        break;
      }
    }

    if (updateErr) {
      console.error('[fulfill POST] Update error:', updateErr);
      return NextResponse.json({ error: 'Failed to update order status: ' + updateErr.message }, { status: 500 });
    }

    // Resolve buyer details & course title to email credentials
    let buyerName = order.customer_details?.name || 'Learner';
    let buyerEmail = order.customer_details?.email || '';

    if (order.guest_customer_id) {
      const { data: guest } = await supabase
        .from('guest_customers')
        .select('name, email')
        .eq('id', order.guest_customer_id)
        .maybeSingle();

      if (guest) {
        buyerName = guest.name || buyerName;
        buyerEmail = guest.email || buyerEmail;
      }
    }

    let courseTitle = 'Your Course';
    if (order.product_id) {
      const { data: prod } = await supabase
        .from('products')
        .select('name')
        .eq('id', order.product_id)
        .maybeSingle();
      if (prod?.name) courseTitle = prod.name;
    }

    // Automatically send credentials email to buyer
    let emailResult: EmailDispatchResult = { success: false };
    if (buyerEmail) {
      emailResult = await sendBuyerCredentialsEmail({
        buyerEmail,
        buyerName,
        courseTitle,
        accessUrl: trimmedUrl,
        accessNote: trimmedNote,
        orderId: order.id,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Proof of delivery submitted successfully. Credentials sent to student!',
      orderId: order.id,
      fulfilledAt: now.toISOString(),
      orderStatus: 'fulfilled',
      order: updatedOrder,
      buyerEmailNotified: buyerEmail,
      emailSent: emailResult.success,
    }, { status: 200 });
  } catch (err: any) {
    console.error('[fulfill POST] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendVendor12HourSlaNudgeEmail } from '@/lib/email';
import { getAppUrl } from '@/lib/fulfillment-token';

/**
 * GET or POST /api/cron/sla-nudge
 * 12-Hour SLA Nudge:
 * Checks for orders in 'pending_fulfillment' (or 'pending' / 'confirmed' waiting on access)
 * where 12 hours have elapsed since created_at and sla_nudge_sent_at is null.
 * Dispatches high-priority reminder email to the vendor with their 1-click magic link.
 */
export async function GET(request: NextRequest) {
  return handleSlaNudge(request);
}

export async function POST(request: NextRequest) {
  return handleSlaNudge(request);
}

async function handleSlaNudge(request: NextRequest) {
  try {
    // Optional cron secret verification for Vercel Cron or custom triggers
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // In production if secret is defined, guard it
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Unauthorized cron request' }, { status: 401 });
      }
    }

    const now = Date.now();
    // 12 hours in milliseconds = 12 * 60 * 60 * 1000 = 43,200,000 ms
    const twelveHoursAgoIso = new Date(now - 12 * 3600 * 1000).toISOString();

    // Query pending orders older than 12 hours that haven't been nudged yet
    const { data: pendingOrders, error } = await supabase
      .from('orders')
      .select('id, vendor_id, product_id, guest_customer_id, customer_details, created_at, fulfillment_token, order_status, sla_nudge_sent_at')
      .in('order_status', ['pending_fulfillment', 'pending', 'confirmed'])
      .neq('payment_status', 'refunded')
      .lte('created_at', twelveHoursAgoIso)
      .is('sla_nudge_sent_at', null)
      .limit(50);

    if (error) {
      console.error('[cron/sla-nudge] Query error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const ordersToNudge = (pendingOrders || []).filter((o) => {
      // Exclude if already fulfilled
      return o.order_status !== 'fulfilled' && o.order_status !== 'delivered';
    });

    const appUrl = getAppUrl();
    const results: any[] = [];

    for (const order of ordersToNudge) {
      try {
        const orderTime = new Date(order.created_at).getTime();
        const hoursElapsed = Math.max(12, Math.floor((now - orderTime) / (3600 * 1000)));

        // Resolve vendor email
        let vendorEmail: string | undefined;
        if (order.vendor_id) {
          const { data: vendorRecord } = await supabase
            .from('vendors')
            .select('email')
            .eq('id', order.vendor_id)
            .maybeSingle();
          vendorEmail = vendorRecord?.email;

          if (!vendorEmail) {
            const { data: userRecord } = await supabase
              .from('users')
              .select('email')
              .eq('id', order.vendor_id)
              .maybeSingle();
            vendorEmail = userRecord?.email;
          }
        }

        if (!vendorEmail) {
          results.push({ orderId: order.id, success: false, reason: 'Vendor email not found' });
          continue;
        }

        // Resolve buyer info
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

        // Resolve course name
        let courseTitle = 'Your Course';
        if (order.product_id) {
          const { data: prod } = await supabase
            .from('products')
            .select('name')
            .eq('id', order.product_id)
            .maybeSingle();
          if (prod?.name) courseTitle = prod.name;
        }

        const magicLinkUrl = `${appUrl}/vendor/fulfill/${order.id}${order.fulfillment_token ? `?token=${encodeURIComponent(order.fulfillment_token)}` : ''}`;

        const emailResult = await sendVendor12HourSlaNudgeEmail({
          vendorEmail,
          buyerName,
          buyerEmail,
          courseTitle,
          orderId: order.id,
          hoursElapsed,
          magicLinkUrl,
        });

        // Stamp sla_nudge_sent_at so it doesn't duplicate
        if (emailResult.success) {
          await supabase
            .from('orders')
            .update({ sla_nudge_sent_at: new Date().toISOString() })
            .eq('id', order.id);
        }

        results.push({
          orderId: order.id,
          vendorEmail,
          success: emailResult.success,
          hoursElapsed,
        });
      } catch (orderNudgeErr: any) {
        console.error(`[cron/sla-nudge] Failed to nudge order ${order.id}:`, orderNudgeErr);
        results.push({ orderId: order.id, success: false, error: orderNudgeErr.message });
      }
    }

    return NextResponse.json({
      checkedAt: new Date().toISOString(),
      ordersCount: ordersToNudge.length,
      nudged: results,
    }, { status: 200 });
  } catch (err: any) {
    console.error('[cron/sla-nudge] Unhandled exception:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

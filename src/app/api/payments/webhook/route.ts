import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import crypto from 'crypto';
import { notifyVendorOfSale } from '@/lib/email';
import { isRefundWebhookPayload } from '@/lib/payu';

export interface WebhookPayload {
  // Generic / Unified payment event fields
  event?: string;
  type?: string;
  status?: string;

  // Buyer / Guest details
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;

  // Product & tracking
  productId?: string;
  sellerId?: string; // from ?ref= parameter
  ref?: string;      // alternate key for sellerId / referral
  referralCode?: string;
  quantity?: number;

  // Gateway IDs
  paymentGatewayOrderId?: string;
  paymentGatewayPaymentId?: string;
  orderId?: string;
  paymentMethod?: string;
  amount?: number;

  // PayU specific fields
  txnid?: string;
  mihpayid?: string;
  productinfo?: string;
  firstname?: string;
  email?: string;
  phone?: string;
  mode?: string;
  udf1?: string;
  udf2?: string;
  udf3?: string;
  udf4?: string;
  udf5?: string;

  // Raw payload wrapper (e.g. from Razorpay or Cashfree)
  payload?: any;
  data?: any;
}

const roundMoney = (val: number) => Math.round(val * 100) / 100;

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    let body: WebhookPayload & Record<string, any> = {};

    try {
      body = JSON.parse(rawBody);
    } catch {
      // Parse form-urlencoded / URLSearchParams (standard PayU webhook & callback format)
      try {
        const params = new URLSearchParams(rawBody);
        body = Object.fromEntries(params.entries());
      } catch {
        return NextResponse.json({ error: 'Invalid payload format' }, { status: 400 });
      }
    }

    // -------------------------------------------------------------------------
    // PayU & Payment Gateway Refund Indication Handler
    // -------------------------------------------------------------------------
    if (isRefundWebhookPayload(body)) {
      const refundTxnId = String(body.txnid || body.merchantTxnId || body.orderId || body.paymentGatewayOrderId || '').trim();
      const refundPaymentId = String(body.mihpayid || body.paymentGatewayPaymentId || body.bank_ref_num || '').trim();
      const refundAmt = Number(body.amt || body.amount || 0);
      const refundId = String(body.request_id || body.refund_id || body.refundId || `REF-${Date.now()}`);

      console.log(`[PayU Webhook] Refund indication received for txn: "${refundTxnId || refundPaymentId}", amount: ₹${refundAmt}`);

      let matchedOrder: any = null;

      if (refundTxnId) {
        const { data: o } = await supabase
          .from('orders')
          .select('id, product_id, quantity, seller_id, seller_commission, customer_details, payment_status')
          .or(`id.eq.${refundTxnId},payment_gateway_order_id.eq.${refundTxnId}`)
          .maybeSingle();
        matchedOrder = o;
      }

      if (!matchedOrder && refundPaymentId) {
        const { data: o } = await supabase
          .from('orders')
          .select('id, product_id, quantity, seller_id, seller_commission, customer_details, payment_status')
          .eq('payment_gateway_payment_id', refundPaymentId)
          .maybeSingle();
        matchedOrder = o;
      }

      if (matchedOrder?.id) {
        const existingDetails =
          typeof matchedOrder.customer_details === 'object' && matchedOrder.customer_details !== null
            ? matchedOrder.customer_details
            : {};

        await supabase
          .from('orders')
          .update({
            payment_status: 'refunded',
            order_status: 'refunded',
            commission_status: 'refunded',
            customer_details: {
              ...existingDetails,
              refund: {
                refund_id: refundId,
                amount: refundAmt,
                refunded_at: new Date().toISOString(),
                source: 'payu_webhook',
              },
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', matchedOrder.id);

        // Revert product sold count
        if (matchedOrder.product_id) {
          const { data: prod } = await supabase
            .from('products')
            .select('sold_count')
            .eq('id', matchedOrder.product_id)
            .maybeSingle();
          if (prod) {
            await supabase
              .from('products')
              .update({ sold_count: Math.max(0, (prod.sold_count || 1) - (matchedOrder.quantity || 1)) })
              .eq('id', matchedOrder.product_id);
          }
        }

        // Revert seller commission
        if (matchedOrder.seller_id) {
          const { data: sp } = await supabase
            .from('seller_products')
            .select('id, sales, earnings')
            .eq('seller_id', matchedOrder.seller_id)
            .eq('product_id', matchedOrder.product_id)
            .maybeSingle();
          if (sp) {
            await supabase
              .from('seller_products')
              .update({
                sales: Math.max(0, (sp.sales || 1) - (matchedOrder.quantity || 1)),
                earnings: roundMoney(Math.max(0, (sp.earnings || 0) - Number(matchedOrder.seller_commission || 0))),
              })
              .eq('id', sp.id);
          }
        }

        return NextResponse.json(
          {
            message: 'PayU refund indication processed. Order marked as refunded and pending fulfillment balance cleared.',
            orderId: matchedOrder.id,
            status: 'refunded',
          },
          { status: 200 }
        );
      }

      return NextResponse.json(
        {
          message: 'PayU refund webhook received but matching order was not found in database.',
          refundTxnId,
          refundPaymentId,
        },
        { status: 200 }
      );
    }

    // -------------------------------------------------------------------------
    // Normalize Gateway-Specific Payloads (PayU, Razorpay, Cashfree, or Direct)
    // -------------------------------------------------------------------------
    let buyerEmail = body.buyerEmail || body.email || '';
    let buyerName = body.buyerName || body.firstname || body.name || '';
    let buyerPhone = body.buyerPhone || body.phone || '';
    let productId = body.productId || body.productinfo || body.udf1 || '';
    let sellerId = body.sellerId || body.ref || body.udf2 || '';
    let referralCode = body.referralCode || body.ref || body.udf3 || '';
    let paymentGatewayOrderId = body.paymentGatewayOrderId || body.orderId || body.txnid || '';
    let paymentGatewayPaymentId = body.paymentGatewayPaymentId || body.mihpayid || body.bank_ref_num || '';
    let paymentMethod = body.paymentMethod || body.mode || 'upi';
    let quantity = Number(body.quantity || 1);

    // Support PayU Webhook format: status === 'success' or unmappedstatus === 'captured'
    if (body.status === 'success' || body.unmappedstatus === 'captured' || body.mihpayid || body.txnid) {
      paymentGatewayPaymentId = String(body.mihpayid || body.bank_ref_num || paymentGatewayPaymentId);
      paymentGatewayOrderId = String(body.txnid || paymentGatewayOrderId);
      buyerEmail = buyerEmail || body.email || '';
      buyerName = buyerName || body.firstname || body.name || 'Guest Buyer';
      buyerPhone = buyerPhone || body.phone || '';
      paymentMethod = body.mode || paymentMethod;
      productId = productId || body.productinfo || body.udf1 || '';
      sellerId = sellerId || body.udf2 || '';
      referralCode = referralCode || body.udf3 || '';
    }

    // Support Razorpay Webhook format: event === 'payment.captured' or 'order.paid'
    if (body.event?.startsWith('payment.') || body.event?.startsWith('order.')) {
      const paymentEntity = body.payload?.payment?.entity || body.data?.payment?.entity;
      const orderEntity = body.payload?.order?.entity || body.data?.order?.entity;

      if (paymentEntity) {
        paymentGatewayPaymentId = paymentEntity.id || paymentGatewayPaymentId;
        paymentGatewayOrderId = paymentEntity.order_id || paymentGatewayOrderId;
        buyerEmail = buyerEmail || paymentEntity.email || '';
        buyerPhone = buyerPhone || paymentEntity.contact || '';
        paymentMethod = paymentEntity.method || paymentMethod;

        // Notes metadata passed during checkout
        const notes = paymentEntity.notes || orderEntity?.notes || {};
        productId = productId || notes.productId || notes.product_id || '';
        sellerId = sellerId || notes.sellerId || notes.ref || notes.seller_id || '';
        referralCode = referralCode || notes.referralCode || notes.referral_code || '';
        buyerName = buyerName || notes.buyerName || notes.name || 'Guest Buyer';
      }
    }

    // Support Cashfree Webhook format: type === 'PAYMENT_SUCCESS_WEBHOOK'
    if (body.type === 'PAYMENT_SUCCESS_WEBHOOK' || body.data?.payment) {
      const paymentData = body.data?.payment;
      const orderData = body.data?.order;
      const customerData = body.data?.customer_details;

      if (paymentData) {
        paymentGatewayPaymentId = String(paymentData.cf_payment_id || paymentGatewayPaymentId);
        paymentMethod = paymentData.payment_method || paymentMethod;
      }
      if (orderData) {
        paymentGatewayOrderId = String(orderData.order_id || paymentGatewayOrderId);
        const tags = orderData.order_tags || {};
        productId = productId || tags.productId || tags.product_id || '';
        sellerId = sellerId || tags.sellerId || tags.ref || tags.seller_id || '';
        referralCode = referralCode || tags.referralCode || '';
      }
      if (customerData) {
        buyerEmail = buyerEmail || customerData.customer_email || '';
        buyerPhone = buyerPhone || customerData.customer_phone || '';
        buyerName = buyerName || customerData.customer_name || 'Guest Buyer';
      }
    }

    // Validation
    buyerEmail = buyerEmail.trim().toLowerCase();
    buyerName = (buyerName || 'Guest Student').trim();
    buyerPhone = (buyerPhone || '').trim();

    if (!buyerEmail || !productId) {
      return NextResponse.json(
        { error: 'Missing required checkout information (buyerEmail, productId)' },
        { status: 400 }
      );
    }

    const orderId = paymentGatewayOrderId 
      ? `ORD-${paymentGatewayOrderId}` 
      : `ORD-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

    // -------------------------------------------------------------------------
    // Method A: Execute via Postgres Transaction Function (RPC) if available
    // -------------------------------------------------------------------------
    try {
      const { data: rpcResult, error: rpcError } = await supabase.rpc(
        'process_guest_checkout_order',
        {
          p_order_id: orderId,
          p_buyer_email: buyerEmail,
          p_buyer_name: buyerName,
          p_buyer_phone: buyerPhone,
          p_product_id: productId,
          p_seller_id: sellerId || null,
          p_referral_code: referralCode || null,
          p_payment_gateway_order_id: paymentGatewayOrderId || null,
          p_payment_gateway_payment_id: paymentGatewayPaymentId || null,
          p_payment_method: paymentMethod,
          p_quantity: quantity,
        }
      );

      if (!rpcError && rpcResult?.success) {
        const { triggerVendorSaleNotification } = await import('@/lib/email');
        await triggerVendorSaleNotification(orderId);

        return NextResponse.json({
          message: 'Order processed successfully via database transaction',
          order: rpcResult,
        }, { status: 200 });
      }
    } catch {
      // If RPC is not created yet, proceed to robust fallback
    }

    // Check if order was already registered (e.g. pre-checkout) and now marked as completed by PayU
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id, payment_status, vendor_id, product_id, guest_customer_id, customer_details')
      .or(`id.eq.${orderId},payment_gateway_order_id.eq.${paymentGatewayOrderId || orderId}`)
      .maybeSingle();

    if (existingOrder?.id) {
      await supabase
        .from('orders')
        .update({
          payment_status: 'completed',
          order_status: 'confirmed',
          payment_gateway_payment_id: paymentGatewayPaymentId || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingOrder.id);

      const { triggerVendorSaleNotification } = await import('@/lib/email');
      await triggerVendorSaleNotification(existingOrder.id);

      return NextResponse.json({
        message: 'Order confirmed and vendor notified',
        orderId: existingOrder.id,
      }, { status: 200 });
    }

    // -------------------------------------------------------------------------
    // Method B: Step-by-Step Server-Side Logic with Fallback Handling
    // -------------------------------------------------------------------------

    // Step 1: Find or Create Guest Customer
    let guestCustomerId: string | null = null;
    const { data: existingGuest } = await supabase
      .from('guest_customers')
      .select('id')
      .eq('email', buyerEmail)
      .maybeSingle();

    if (existingGuest?.id) {
      guestCustomerId = existingGuest.id;
      // Keep name/phone up to date
      await supabase
        .from('guest_customers')
        .update({
          name: buyerName,
          phone: buyerPhone || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', guestCustomerId);
    } else {
      const { data: newGuest, error: guestError } = await supabase
        .from('guest_customers')
        .insert([
          {
            email: buyerEmail,
            name: buyerName,
            phone: buyerPhone || null,
          },
        ])
        .select('id')
        .maybeSingle();

      if (guestError || !newGuest?.id) {
        console.error('[Webhook] Failed to insert guest customer:', guestError);
        // Fallback: If table doesn't exist yet, generate ID
        guestCustomerId = crypto.randomUUID();
      } else {
        guestCustomerId = newGuest.id;
      }
    }

    // Step 2: Fetch Product & Calculate Splits
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name, vendor_id, base_price, final_price, sold_count, is_active')
      .eq('id', productId)
      .maybeSingle();

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const { data: adminSettings } = await supabase
      .from('admin_settings')
      .select('seller_commission_percentage, platform_commission_percentage, commission_cooling_period_days')
      .limit(1)
      .maybeSingle();

    const sellerPct = Number(adminSettings?.seller_commission_percentage ?? 10);
    const platformPct = Number(adminSettings?.platform_commission_percentage ?? 10);

    const unitPrice = Number(product.final_price || product.base_price || 0);
    const totalAmount = roundMoney(unitPrice * quantity);

    // Resolve seller ID if passed as referral code or ref
    let resolvedSellerId: string | null = sellerId || null;
    let sellerProductRow: any = null;

    if (resolvedSellerId) {
      const { data: sp } = await supabase
        .from('seller_products')
        .select('id, seller_id, sales, earnings')
        .eq('seller_id', resolvedSellerId)
        .eq('product_id', productId)
        .maybeSingle();
      sellerProductRow = sp;
    } else if (referralCode) {
      const { data: sp } = await supabase
        .from('seller_products')
        .select('id, seller_id, sales, earnings')
        .eq('referral_code', referralCode)
        .eq('product_id', productId)
        .maybeSingle();

      if (sp?.seller_id) {
        resolvedSellerId = sp.seller_id;
        sellerProductRow = sp;
      } else {
        // Direct seller check
        const { data: sellerUser } = await supabase
          .from('sellers')
          .select('id')
          .eq('id', referralCode)
          .maybeSingle();
        if (sellerUser?.id) {
          resolvedSellerId = sellerUser.id;
        }
      }
    }

    const sellerCommission = resolvedSellerId
      ? roundMoney(totalAmount * (sellerPct / 100))
      : 0;
    const platformCommission = roundMoney(totalAmount * (platformPct / 100));
    const vendorPayout = roundMoney(totalAmount - sellerCommission - platformCommission);

    // 48-Hour PayU Safety Net Holding Window
    const releaseDate = new Date(Date.now() + 48 * 3600 * 1000);

    const customerDetails = {
      name: buyerName,
      email: buyerEmail,
      phone: buyerPhone,
    };

    // Step 3: Insert the Order
    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert([
        {
          id: orderId,
          customer_id: null,
          guest_customer_id: guestCustomerId,
          seller_id: resolvedSellerId,
          vendor_id: product.vendor_id,
          product_id: productId,
          quantity,
          final_price: totalAmount,
          seller_commission: sellerCommission,
          platform_commission: platformCommission,
          vendor_payout: vendorPayout,
          referral_code: referralCode || null,
          customer_details: customerDetails,
          payment_method: paymentMethod,
          payment_status: 'completed',
          order_status: 'confirmed',
          commission_status: 'pending',
          commission_release_date: releaseDate.toISOString(),
          payment_gateway_order_id: paymentGatewayOrderId || null,
          payment_gateway_payment_id: paymentGatewayPaymentId || null,
        },
      ])
      .select()
      .maybeSingle();

    if (orderError) {
      console.error('[Webhook] Failed to insert order:', orderError);
      return NextResponse.json({ error: 'Failed to create order: ' + orderError.message }, { status: 500 });
    }

    // Step 4: Update Seller Stats in seller_products
    if (resolvedSellerId) {
      if (sellerProductRow?.id) {
        await supabase
          .from('seller_products')
          .update({
            sales: Number(sellerProductRow.sales || 0) + quantity,
            earnings: roundMoney(Number(sellerProductRow.earnings || 0) + sellerCommission),
          })
          .eq('id', sellerProductRow.id);
      } else {
        await supabase
          .from('seller_products')
          .insert([
            {
              seller_id: resolvedSellerId,
              product_id: productId,
              referral_code: referralCode || resolvedSellerId.slice(0, 8),
              sales: quantity,
              earnings: sellerCommission,
            },
          ]);
      }
    }

    // Update Product sold count
    await supabase
      .from('products')
      .update({ sold_count: Number(product.sold_count || 0) + quantity })
      .eq('id', productId);

    // Step 5: Notify Vendor of New Sale (24-Hour Fulfillment SLA)
    try {
      let vendorEmail: string | undefined;
      const { data: vendorRecord } = await supabase
        .from('vendors')
        .select('email')
        .eq('id', product.vendor_id)
        .maybeSingle();

      vendorEmail = vendorRecord?.email;
      if (!vendorEmail) {
        const { data: userRecord } = await supabase
          .from('users')
          .select('email')
          .eq('id', product.vendor_id)
          .maybeSingle();
        vendorEmail = userRecord?.email;
      }

      // Resolve buyer details from guest_customers table
      let finalBuyerName = buyerName;
      let finalBuyerEmail = buyerEmail;

      if (guestCustomerId) {
        const { data: guestRow } = await supabase
          .from('guest_customers')
          .select('name, email, phone')
          .eq('id', guestCustomerId)
          .maybeSingle();

        if (guestRow?.email) finalBuyerEmail = guestRow.email;
        if (guestRow?.name) finalBuyerName = guestRow.name;
      }

      const courseName = product.name || 'Course';

      if (vendorEmail) {
        await notifyVendorOfSale(
          vendorEmail,
          finalBuyerName,
          finalBuyerEmail,
          courseName,
          newOrder?.id || orderId
        );
      } else {
        console.warn(`[Webhook] No vendor email found for vendor_id: ${product.vendor_id}`);
      }
    } catch (emailErr) {
      console.error('[Webhook] Failed to dispatch vendor notification email:', emailErr);
    }

    return NextResponse.json(
      {
        message: 'Order created and processed successfully',
        order: newOrder,
        guestCustomerId,
        splits: {
          totalAmount,
          vendorPayout,
          sellerCommission,
          platformCommission,
        },
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('[Webhook Error]:', err);
    return NextResponse.json({ error: 'Internal server error: ' + err.message }, { status: 500 });
  }
}

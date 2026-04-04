import { NextRequest, NextResponse } from 'next/server';
import { createCashfreePaymentOrder } from '@/lib/cashfree';
import { supabase } from '@/lib/supabase';

/**
 * POST /api/payments/initiate
 * Initiates a Cashfree payment order
 * 
 * Request body:
 * {
 *   orderId: string;
 *   orderAmount: number;
 *   customerName: string;
 *   customerEmail: string;
 *   customerPhone: string;
 * }
 */
export async function POST(request: NextRequest) {
  try {
    console.log('=== PAYMENT INITIATE ENDPOINT CALLED ===');
    console.log('Env vars check:');
    console.log('  CASHFREE_APP_ID:', process.env.CASHFREE_APP_ID ? '✓ SET' : '✗ NOT SET');
    console.log('  CASHFREE_APP_SECRET:', process.env.CASHFREE_APP_SECRET ? '✓ SET' : '✗ NOT SET');
    console.log('  CASHFREE_RETURN_URL:', process.env.CASHFREE_RETURN_URL ? '✓ SET' : '✗ NOT SET');
    console.log('  CASHFREE_NOTIFY_URL:', process.env.CASHFREE_NOTIFY_URL ? '✓ SET' : '✗ NOT SET');
    console.log('  SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓ SET' : '✗ NOT SET');
    console.log('========================================');

    // Validate request method and content type
    if (request.method !== 'POST') {
      return NextResponse.json(
        { error: 'Method not allowed' },
        { status: 405 }
      );
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error('Failed to parse request body:', error);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Validate required fields
    const { orderId, orderAmount, customerName, customerEmail, customerPhone } = body;

    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid orderId' },
        { status: 400 }
      );
    }

    if (!orderAmount || typeof orderAmount !== 'number' || orderAmount <= 0) {
      return NextResponse.json(
        { error: 'Invalid orderAmount' },
        { status: 400 }
      );
    }

    // Validate amount is not more than 10 lakhs (production limit)
    if (orderAmount > 1000000) {
      return NextResponse.json(
        { error: 'Order amount exceeds maximum limit of ₹10,00,000' },
        { status: 400 }
      );
    }

    if (!customerName || typeof customerName !== 'string' || customerName.trim().length === 0) {
      return NextResponse.json(
        { error: 'Invalid customerName' },
        { status: 400 }
      );
    }

    if (!customerEmail || typeof customerEmail !== 'string' || !isValidEmail(customerEmail)) {
      return NextResponse.json(
        { error: 'Invalid customerEmail' },
        { status: 400 }
      );
    }

    if (!customerPhone || !isValidPhoneNumber(customerPhone)) {
      return NextResponse.json(
        { error: 'Invalid customerPhone' },
        { status: 400 }
      );
    }

    // Check if order already has a payment initiated
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id, status')
      .eq('order_id', orderId)
      .eq('status', 'initiated')
      .maybeSingle();

    if (existingPayment) {
      return NextResponse.json(
        { error: 'Payment already initiated for this order' },
        { status: 409 }
      );
    }

    // Verify order exists and get details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle();

    if (orderError) {
      console.error('Order fetch error:', orderError, 'orderId:', orderId);
      return NextResponse.json(
        { error: 'Failed to fetch order details: ' + orderError.message },
        { status: 500 }
      );
    }

    if (!order) {
      console.error('Order not found:', orderId);
      // List orders for debugging
      const { data: allOrders } = await supabase
        .from('orders')
        .select('id')
        .limit(5);
      console.error('Sample order IDs in DB:', allOrders?.map(o => o.id));
      
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Don't allow payment initiation for already paid orders
    if (order.payment_status === 'completed') {
      return NextResponse.json(
        { error: 'Order already paid' },
        { status: 409 }
      );
    }

    // Calculate order amount (server-side verification against stored order)
    // Try multiple field names for backward compatibility
    const storedAmount = Number(
      order.final_price || 
      order.base_price || 
      order['final_price'] || 
      order['base_price'] || 
      0
    );
    
    if (storedAmount <= 0) {
      console.error('Invalid stored amount for order:', orderId, 'order fields:', Object.keys(order), 'values:', { 
        final_price: order.final_price, 
        base_price: order.base_price
      });
      return NextResponse.json(
        { error: 'Order has no price information' },
        { status: 400 }
      );
    }
    if (Math.abs(storedAmount - orderAmount) > 0.01) {
      console.error('Amount mismatch for order:', orderId, 'stored:', storedAmount, 'requested:', orderAmount);
      return NextResponse.json(
        { error: 'Order amount mismatch' },
        { status: 400 }
      );
    }

    // Create Cashfree payment order
    const cashfreePaymentRequest = {
      orderId,
      orderAmount,
      orderCurrency: 'INR',
      customerName: customerName.trim(),
      customerEmail: customerEmail.toLowerCase().trim(),
      customerPhone: customerPhone.replace(/[^0-9]/g, ''),
      returnUrl: `${process.env.CASHFREE_RETURN_URL}?order_id=${orderId}`,
      notifyUrl: process.env.CASHFREE_NOTIFY_URL || '',
      metadata: {
        customer_id: order.customer_id,
        order_type: 'marketplace',
      },
    };

    console.log('Creating Cashfree payment order:', cashfreePaymentRequest);
    
    let cashfreeResponse;
    try {
      cashfreeResponse = await createCashfreePaymentOrder(cashfreePaymentRequest);
      console.log('Cashfree response:', cashfreeResponse);
    } catch (cfError) {
      console.error('ERROR creating Cashfree order:', cfError);
      if (cfError instanceof Error) {
        console.error('Cashfree error message:', cfError.message);
        console.error('Cashfree error stack:', cfError.stack);
      }
      throw cfError; // Re-throw to be caught by outer catch
    }

    if (cashfreeResponse.status !== 200 || !cashfreeResponse.data) {
      console.error('Cashfree API Error:', cashfreeResponse);
      return NextResponse.json(
        { error: 'Failed to initiate payment with payment gateway: ' + (cashfreeResponse.data?.message || 'Unknown error') },
        { status: 500 }
      );
    }

    // Store payment record in database
    const paymentData = {
      order_id: orderId,
      customer_id: order.customer_id,
      cf_order_id: cashfreeResponse.data.cf_order_id,
      amount: orderAmount,
      currency: 'INR',
      status: 'initiated',
      payment_method: null,
      transaction_id: null,
      gateway_response: cashfreeResponse.data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log('Storing payment in database:', { order_id: orderId, cf_order_id: cashfreeResponse.data.cf_order_id });
    const { error: paymentError } = await supabase
      .from('payments')
      .insert([paymentData]);

    if (paymentError) {
      console.error('Database error storing payment:', paymentError);
      return NextResponse.json(
        { error: 'Failed to store payment information: ' + paymentError.message },
        { status: 500 }
      );
    }

    // Return payment URL and order details
    console.log('Payment successfully created, generating redirect URL');
    const paymentUrl = getPaymentRedirectUrl(cashfreeResponse.data.cf_order_id);

    return NextResponse.json({
      success: true,
      orderToken: cashfreeResponse.data, // Contains payment session details
      paymentUrl,
      cfOrderId: cashfreeResponse.data.cf_order_id,
      orderId,
    });
  } catch (error) {
    console.error('==================== PAYMENT ERROR ====================');
    console.error('Payment initiation error (caught exception):', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error name:', error.name);
      console.error('Error stack:', error.stack);
    }
    console.error('=========================================================');
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        error: 'Internal server error while initiating payment',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * Helper: Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Helper: Validate Indian phone number format
 */
function isValidPhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/[^0-9]/g, '');
  return cleaned.length === 10 && cleaned[0] !== '0';
}

/**
 * Helper: Get payment redirect URL
 */
function getPaymentRedirectUrl(cfOrderId: number): string {
  const baseUrl =
    process.env.NODE_ENV === 'development'
      ? 'https://sandbox.cashfree.com/pg'
      : 'https://api.cashfree.com/pg';

  return `${baseUrl.replace('/pg', '')}/pay/${cfOrderId}`;
}

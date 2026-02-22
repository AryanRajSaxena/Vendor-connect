import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get('customerId');
    const vendorId = searchParams.get('vendorId');
    const sellerId = searchParams.get('sellerId');

    let query = supabase.from('orders').select('*');

    if (customerId) {
      query = query.eq('customer_id', customerId);
    }
    if (vendorId) {
      query = query.eq('vendor_id', vendorId);
    }
    if (sellerId) {
      query = query.eq('seller_id', sellerId);
    }

    const { data: orders, error } = await query.order('created_at', {
      ascending: false,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(orders, { status: 200 });
  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      customerId,
      sellerId,
      vendorId,
      productId,
      quantity,
      finalPrice,
      sellerCommission,
      platformCommission,
      vendorPayout,
      referralCode,
      customerDetails,
      deliveryAddress,
      paymentMethod,
      paymentStatus,
      orderStatus,
      commissionStatus,
      commissionReleaseDate,
    } = body;

    if (
      !id ||
      !customerId ||
      !vendorId ||
      !productId ||
      !quantity ||
      !finalPrice
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create order
    const { data: order, error } = await supabase
      .from('orders')
      .insert([
        {
          id,
          customer_id: customerId,
          seller_id: sellerId,
          vendor_id: vendorId,
          product_id: productId,
          quantity,
          final_price: finalPrice,
          seller_commission: sellerCommission || 0,
          platform_commission: platformCommission || 0,
          vendor_payout: vendorPayout || finalPrice,
          referral_code: referralCode,
          customer_details: customerDetails,
          delivery_address: deliveryAddress,
          payment_method: paymentMethod,
          payment_status: paymentStatus || 'pending',
          order_status: orderStatus || 'pending',
          commission_status: commissionStatus || 'pending',
          commission_release_date: commissionReleaseDate,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Create order error:', error);
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      );
    }

    // Update product sold count
    const { data: product } = await supabase
      .from('products')
      .select('sold_count')
      .eq('id', productId)
      .single();

    if (product) {
      await supabase
        .from('products')
        .update({ sold_count: (product.sold_count || 0) + quantity })
        .eq('id', productId);
    }

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

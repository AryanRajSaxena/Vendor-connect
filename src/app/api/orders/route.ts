import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

const roundMoney = (value: number) => Math.round(value * 100) / 100;

async function resolveSellerFromReferral(productId: string, referralCode?: string | null) {
  const normalized = (referralCode || '').trim();
  if (!normalized) return null;

  const { data: exactMatch } = await supabase
    .from('seller_products')
    .select('id, seller_id, sales, earnings, referral_code')
    .eq('product_id', productId)
    .eq('referral_code', normalized)
    .maybeSingle();

  if (exactMatch?.seller_id) {
    return exactMatch;
  }

  const { data: ciMatch } = await supabase
    .from('seller_products')
    .select('id, seller_id, sales, earnings, referral_code')
    .eq('product_id', productId)
    .ilike('referral_code', normalized)
    .maybeSingle();

  return ciMatch || null;
}

async function creditSellerAccount(sellerId: string, sellerCommission: number) {
  const creditAmount = roundMoney(sellerCommission);
  if (creditAmount <= 0) return;

  const { data: existingAccount } = await supabase
    .from('seller_accounts')
    .select('id, total_earnings, available_balance')
    .eq('seller_id', sellerId)
    .maybeSingle();

  if (existingAccount?.id) {
    await supabase
      .from('seller_accounts')
      .update({
        total_earnings: roundMoney(Number(existingAccount.total_earnings || 0) + creditAmount),
        available_balance: roundMoney(Number(existingAccount.available_balance || 0) + creditAmount),
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingAccount.id);
    return;
  }

  await supabase
    .from('seller_accounts')
    .insert([
      {
        seller_id: sellerId,
        total_earnings: creditAmount,
        available_balance: creditAmount,
      },
    ]);
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get('customerId');
    const vendorId = searchParams.get('vendorId');
    const sellerId = searchParams.get('sellerId');

    let query = supabase.from('orders').select(
      '*, product:products!product_id(name)'
    );

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
      referralCode,
      customerDetails,
      deliveryAddress,
      paymentMethod,
      orderStatus,
      commissionReleaseDate,
    } = body;

    const normalizedPaymentMethod = String(paymentMethod || '').toLowerCase();
    const resolvedPaymentStatus = normalizedPaymentMethod === 'cod' ? 'pending' : 'completed';

    if (
      !id ||
      !customerId ||
      !vendorId ||
      !productId ||
      !quantity
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const parsedQuantity = Number(quantity);
    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0 || !Number.isInteger(parsedQuantity)) {
      return NextResponse.json(
        { error: 'Quantity must be a positive integer' },
        { status: 400 }
      );
    }

    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, final_price, sold_count')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    let resolvedSellerId: string | null = sellerId || null;
    let sellerProductMatch = await resolveSellerFromReferral(productId, referralCode);
    if (!resolvedSellerId && sellerProductMatch?.seller_id) {
      resolvedSellerId = sellerProductMatch.seller_id;
    }

    const { data: settings } = await supabase
      .from('admin_settings')
      .select('seller_commission_percentage, platform_commission_percentage, commission_cooling_period_days')
      .limit(1)
      .single();

    const sellerCommissionPct = Number(settings?.seller_commission_percentage ?? 10);
    const platformCommissionPct = Number(settings?.platform_commission_percentage ?? 10);
    if (sellerCommissionPct < 0 || platformCommissionPct < 0 || sellerCommissionPct + platformCommissionPct > 100) {
      return NextResponse.json(
        { error: 'Invalid admin commission configuration' },
        { status: 400 }
      );
    }
    const baseLineTotal = Number(product.final_price ?? 0) * parsedQuantity;
    const sellerCommissionCalculated = roundMoney(baseLineTotal * (sellerCommissionPct / 100));
    const platformCommissionCalculated = roundMoney(baseLineTotal * (platformCommissionPct / 100));
    const vendorPayoutCalculated =
      roundMoney(baseLineTotal - sellerCommissionCalculated - platformCommissionCalculated);

    if (vendorPayoutCalculated < 0) {
      return NextResponse.json(
        { error: 'Invalid commission setup: vendor payout cannot be negative' },
        { status: 400 }
      );
    }

    const coolingDays = Number(settings?.commission_cooling_period_days ?? 15);
    const computedCommissionReleaseDate = new Date();
    computedCommissionReleaseDate.setDate(computedCommissionReleaseDate.getDate() + Math.max(0, coolingDays));
    const autoCommissionAvailable =
      coolingDays <= 0 && resolvedPaymentStatus === 'completed';
    const resolvedCommissionStatus = autoCommissionAvailable ? 'available' : 'pending';

    // Create order
    const { data: order, error } = await supabase
      .from('orders')
      .insert([
        {
          id,
          customer_id: customerId,
          seller_id: resolvedSellerId,
          vendor_id: vendorId,
          product_id: productId,
          quantity: parsedQuantity,
          final_price: roundMoney(baseLineTotal),
          seller_commission: sellerCommissionCalculated,
          platform_commission: platformCommissionCalculated,
          vendor_payout: vendorPayoutCalculated,
          referral_code: referralCode,
          customer_details: customerDetails,
          delivery_address: deliveryAddress,
          payment_method: paymentMethod,
          payment_status: resolvedPaymentStatus,
          order_status: orderStatus || 'pending',
          commission_status: resolvedCommissionStatus,
          commission_release_date: commissionReleaseDate || computedCommissionReleaseDate.toISOString(),
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
    await supabase
      .from('products')
      .update({ sold_count: (product.sold_count || 0) + parsedQuantity })
      .eq('id', productId);

    if (!sellerProductMatch && order?.referral_code) {
      sellerProductMatch = await resolveSellerFromReferral(productId, order.referral_code);
      if (!resolvedSellerId && sellerProductMatch?.seller_id) {
        resolvedSellerId = sellerProductMatch.seller_id;
      }
    }

    if (resolvedSellerId && order?.seller_id !== resolvedSellerId) {
      await supabase
        .from('orders')
        .update({ seller_id: resolvedSellerId })
        .eq('id', order.id);
    }

    if (sellerProductMatch?.id) {
      await supabase
        .from('seller_products')
        .update({
          sales: Number(sellerProductMatch.sales || 0) + parsedQuantity,
          earnings: roundMoney(Number(sellerProductMatch.earnings || 0) + sellerCommissionCalculated),
        })
        .eq('id', sellerProductMatch.id);
    } else if (resolvedSellerId) {
      const { data: fallbackSellerProduct } = await supabase
        .from('seller_products')
        .select('id, sales, earnings')
        .eq('seller_id', resolvedSellerId)
        .eq('product_id', productId)
        .maybeSingle();

      if (fallbackSellerProduct?.id) {
        await supabase
          .from('seller_products')
          .update({
            sales: Number(fallbackSellerProduct.sales || 0) + parsedQuantity,
            earnings: roundMoney(Number(fallbackSellerProduct.earnings || 0) + sellerCommissionCalculated),
          })
          .eq('id', fallbackSellerProduct.id);
      }
    }

    if (resolvedSellerId) {
      await creditSellerAccount(resolvedSellerId, sellerCommissionCalculated);
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

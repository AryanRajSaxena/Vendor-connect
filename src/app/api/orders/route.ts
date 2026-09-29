import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
import { hashPassword } from '@/utils/password';

const roundMoney = (value: number) => Math.round(value * 100) / 100;
const legacyPriceKey = ['final', 'price'].join('_');

async function resolveSellerFromReferral(productId: string, referralCode?: string | null) {
  const normalized = (referralCode || '').trim();
  if (!normalized) return null;

  // 1. Exact match by referral_code
  const { data: exactMatch } = await supabase
    .from('seller_products')
    .select('id, seller_id, sales, earnings, referral_code')
    .eq('product_id', productId)
    .eq('referral_code', normalized)
    .maybeSingle();

  if (exactMatch?.seller_id) {
    return exactMatch;
  }

  // 2. Case-insensitive referral code match
  const { data: ciMatch } = await supabase
    .from('seller_products')
    .select('id, seller_id, sales, earnings, referral_code')
    .eq('product_id', productId)
    .ilike('referral_code', normalized)
    .maybeSingle();

  if (ciMatch?.seller_id) {
    return ciMatch;
  }

  // 3. Match if normalized is a UUID (sellerId)
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(normalized);
  if (isUuid) {
    const { data: bySellerId } = await supabase
      .from('seller_products')
      .select('id, seller_id, sales, earnings, referral_code')
      .eq('product_id', productId)
      .eq('seller_id', normalized)
      .maybeSingle();

    if (bySellerId?.seller_id) {
      return bySellerId;
    }

    const { data: sellerUser } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', normalized)
      .eq('role', 'seller')
      .maybeSingle();

    if (sellerUser?.id) {
      return { id: null, seller_id: sellerUser.id, sales: 0, earnings: 0, referral_code: normalized };
    }
  }

  return null;
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

    const normalizedOrders = (orders || []).map((order: any) => ({
      ...order,
      base_price: Number(order?.base_price ?? order?.[legacyPriceKey] ?? 0),
    }));

    return NextResponse.json(normalizedOrders, { status: 200 });
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
    let {
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

    // Auto-resolve or create customer record for guest checkout if customerId is not provided
    if (!customerId && customerDetails?.email) {
      const email = String(customerDetails.email).trim().toLowerCase();
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (existingUser?.id) {
        customerId = existingUser.id;
      } else {
        const dummyPassword = await hashPassword(Math.random().toString(36).slice(-10) + 'A1!guestPass');
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert([
            {
              email,
              name: customerDetails.name || 'Student',
              phone: customerDetails.phone || null,
              role: 'customer',
              password_hash: dummyPassword,
              is_verified: true,
            },
          ])
          .select('id')
          .single();

        if (createError) {
          console.error('[API] Failed to create guest customer record:', createError);
        } else if (newUser?.id) {
          customerId = newUser.id;
        }
      }
    }

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
      .select('id, base_price, sold_count, is_active')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    if (product.is_active === false) {
      return NextResponse.json(
        { error: 'This course is paused and cannot be sold right now' },
        { status: 400 }
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
    const baseLineTotal = Number(product.base_price ?? 0) * parsedQuantity;
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
          [legacyPriceKey]: roundMoney(baseLineTotal),
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

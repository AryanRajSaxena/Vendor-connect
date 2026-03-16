import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

function parseArrayField(value: unknown): any[] {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function buildSellerReferralCode(sellerId: string) {
  const clean = sellerId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return `SEL${clean.slice(0, 9)}`.slice(0, 20);
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sellerId = searchParams.get('sellerId');

    if (!sellerId) {
      return NextResponse.json(
        { error: 'sellerId is required' },
        { status: 400 }
      );
    }

    console.log(`[API] Fetching seller products for seller: ${sellerId}`);

    // Get seller products - use correct column names from schema
    const { data: sellerProducts, error: sellError } = await supabase
      .from('seller_products')
      .select('id, seller_id, product_id, referral_code, clicks, sales, earnings, added_at')
      .eq('seller_id', sellerId)
      .order('added_at', { ascending: false });

    if (sellError) {
      console.error('[API] Seller products query error:', sellError);
      return NextResponse.json(
        { error: sellError.message || 'Failed to fetch seller products' },
        { status: 500 }
      );
    }

    console.log(`[API] Found ${sellerProducts?.length || 0} seller products`);

    if (!sellerProducts || sellerProducts.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    // Try to get product details for enrichment
    try {
      const productIds = sellerProducts.map((sp: any) => sp.product_id);
      console.log(`[API] Fetching details for products: ${productIds.join(', ')}`);

      const { data: products, error: prodError } = await supabase
        .from('products')
        .select('id, name, description, base_price, final_price, stock, images, category, vendor_id, specifications, course_duration, prerequisites, learning_outcomes, curriculum')
        .in('id', productIds);

      if (prodError) {
        console.warn('[API] Product details fetch failed, returning basic data:', prodError);
        return NextResponse.json(sellerProducts, { status: 200 });
      }

      console.log(`[API] Got details for ${products?.length || 0} products`);

      // Merge the data
      const enrichedProducts = sellerProducts.map((sp: any) => {
        const product = products?.find((p: any) => p.id === sp.product_id);
        const specifications = (product?.specifications || {}) as Record<string, any>;
        const normalizedLearningOutcomes = parseArrayField(
          product?.learning_outcomes ?? specifications.learning_outcomes ?? specifications.learningOutcomes
        );
        const normalizedCurriculum = parseArrayField(
          product?.curriculum ?? specifications.curriculum
        );
        return {
          id: sp.id,
          productId: sp.product_id,
          sellerId: sp.seller_id,
          product_name: product?.name || 'Unknown',
          description: product?.description || '',
          base_price: product?.base_price || 0,
          final_price: product?.final_price || 0,
          stock: product?.stock || 0,
          seller_markup_percentage: 0,
          sold_count: sp.sales || 0,
          clicks: sp.clicks || 0,
          earnings: sp.earnings || 0,
          images: product?.images || [],
          category: product?.category || '',
          specifications,
          course_duration: product?.course_duration || specifications.course_duration || specifications.courseDuration || '',
          prerequisites: parseArrayField(product?.prerequisites ?? specifications.prerequisites),
          learning_outcomes: normalizedLearningOutcomes,
          learningOutcomes: normalizedLearningOutcomes,
          curriculum: normalizedCurriculum,
          referral_code: sp.referral_code,
          vendor_id: product?.vendor_id,
          created_at: sp.added_at,
        };
      });

      console.log(`[API] Returning ${enrichedProducts.length} enriched products`);
      return NextResponse.json(enrichedProducts, { status: 200 });
    } catch (enrichError) {
      console.warn('[API] Enrichment failed, returning seller products only:', enrichError);
      return NextResponse.json(sellerProducts, { status: 200 });
    }
  } catch (error) {
    console.error('[API] Get seller products error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sellerId, productId, referralCode } = body;

    if (!sellerId || !productId) {
      return NextResponse.json(
        { error: 'sellerId and productId are required' },
        { status: 400 }
      );
    }

    // Check if already added
    const { data: existing, error: checkError } = await supabase
      .from('seller_products')
      .select('id')
      .eq('seller_id', sellerId)
      .eq('product_id', productId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 means no rows found, which is what we expect
      console.error('Check duplicate error:', checkError);
    }

    if (existing) {
      return NextResponse.json(
        { error: 'Product already added to store' },
        { status: 409 }
      );
    }

    // One referral code per seller across all courses/products.
    // Reuse an existing code if seller already has one.
    let finalReferralCode = '';

    const { data: existingSellerCode } = await supabase
      .from('seller_products')
      .select('referral_code')
      .eq('seller_id', sellerId)
      .not('referral_code', 'is', null)
      .order('added_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (existingSellerCode?.referral_code) {
      finalReferralCode = String(existingSellerCode.referral_code).trim();
    } else {
      finalReferralCode = (referralCode ? String(referralCode).trim().toUpperCase() : '') || buildSellerReferralCode(sellerId);

      // In case referral_code has global unique constraint in DB, avoid collisions.
      const { data: collision } = await supabase
        .from('seller_products')
        .select('id, seller_id')
        .eq('referral_code', finalReferralCode)
        .neq('seller_id', sellerId)
        .limit(1)
        .maybeSingle();

      if (collision?.id) {
        const suffix = Math.random().toString(36).substring(2, 5).toUpperCase();
        finalReferralCode = `${buildSellerReferralCode(sellerId).slice(0, 16)}${suffix}`.slice(0, 20);
      }
    }

    const insertData: any = {
      seller_id: sellerId,
      product_id: productId,
      referral_code: finalReferralCode,
    };

    const { data: sellerProduct, error } = await supabase
      .from('seller_products')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('Create seller product error:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to add product to store', details: error },
        { status: 500 }
      );
    }

    // Backfill older rows for this seller to keep one code across all products.
    await supabase
      .from('seller_products')
      .update({ referral_code: finalReferralCode })
      .eq('seller_id', sellerId)
      .neq('referral_code', finalReferralCode);

    return NextResponse.json(sellerProduct, { status: 201 });
  } catch (error) {
    console.error('Create seller product error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

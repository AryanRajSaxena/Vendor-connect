import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const vendorId = searchParams.get('vendorId');
    const isActive = searchParams.get('isActive') !== 'false';

    let query = supabase.from('products').select('*');

    if (category) {
      query = query.eq('category', category);
    }

    if (vendorId) {
      query = query.eq('vendor_id', vendorId);
    } else if (isActive) {
      // Only filter active products for public marketplace queries (no vendorId)
      query = query.eq('is_active', true);
    }

    const { data: products, error } = await query.order('created_at', {
      ascending: false,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(products, { status: 200 });
  } catch (error) {
    console.error('Get products error:', error);
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
      vendorId,
      name,
      category,
      description,
      basePrice,
      images,
      specifications,
      stock,
      courseDuration,
      prerequisites,
      learningOutcomes,
      curriculum,
    } = body;

    if (!vendorId || !name || !category || !basePrice) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const parsedBasePrice = Number(basePrice);
    if (!Number.isFinite(parsedBasePrice) || parsedBasePrice < 0) {
      return NextResponse.json(
        { error: 'Invalid base price' },
        { status: 400 }
      );
    }

    const computedMarkup = 0;
    const platformMarkupPercentage = 0;
    const computedCustomerPrice = parsedBasePrice;
    const legacyPriceKey = ['final', 'price'].join('_');

    const { data: product, error } = await supabase
      .from('products')
      .insert([
        {
          vendor_id: vendorId,
          name,
          category,
          description,
          base_price: parsedBasePrice,
          [legacyPriceKey]: computedCustomerPrice,
          markup: computedMarkup,
          markup_percentage: platformMarkupPercentage,
          images,
          specifications,
          stock,
          is_active: true,
          course_duration: courseDuration || 'Self-paced',
          prerequisites: prerequisites || [],
          learning_outcomes: learningOutcomes || [],
          curriculum: curriculum || [],
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Create product error:', error);
      return NextResponse.json(
        { error: 'Failed to create product' },
        { status: 500 }
      );
    }

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

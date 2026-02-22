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
    }

    if (isActive) {
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
      finalPrice,
      markup,
      markupPercentage,
      images,
      specifications,
      stock,
    } = body;

    if (!vendorId || !name || !category || !basePrice) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data: product, error } = await supabase
      .from('products')
      .insert([
        {
          vendor_id: vendorId,
          name,
          category,
          description,
          base_price: basePrice,
          final_price: finalPrice,
          markup,
          markup_percentage: markupPercentage,
          images,
          specifications,
          stock,
          is_active: true,
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

import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
import { generateSalesKitForProduct } from '@/lib/sales-kit-generator';

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
      pdfPath,
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

    const { data: product, error } = await supabase
      .from('products')
      .insert([
        {
          vendor_id: vendorId,
          name,
          category,
          description,
          base_price: parsedBasePrice,
          final_price: parsedBasePrice,
          images,
          specifications,
          stock,
          is_active: true,
          course_duration: courseDuration || 'Self-paced',
          prerequisites: prerequisites || [],
          learning_outcomes: learningOutcomes || [],
          curriculum: curriculum || [],
          pdf_path: pdfPath || null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Create product error:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to create product', details: error },
        { status: 500 }
      );
    }

    // Automatically trigger Sales Kit & Syllabus generation in the background
    try {
      await generateSalesKitForProduct(product.id);
    } catch (kitErr) {
      console.warn('Initial sales kit generation warning:', kitErr);
    }

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

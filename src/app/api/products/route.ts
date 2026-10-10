import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
import { isValidUuid } from '@/utils/auth';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const vendorId = searchParams.get('vendorId');
    const vendorEmail = searchParams.get('vendorEmail');
    const isActive = searchParams.get('isActive') !== 'false';

    let resolvedVendorId: string | null = isValidUuid(vendorId) ? vendorId!.trim() : null;

    if (!resolvedVendorId && vendorEmail && vendorEmail.trim() !== 'undefined' && vendorEmail.trim() !== 'null') {
      const cleanEmail = vendorEmail.toLowerCase().trim();
      const { data: vendorRecord } = await supabase
        .from('vendors')
        .select('id')
        .eq('email', cleanEmail)
        .maybeSingle();
      if (vendorRecord?.id) {
        resolvedVendorId = vendorRecord.id;
      }
    }

    // If caller explicitly asked for a vendor's products, but the vendor cannot be resolved,
    // return an empty array with 200 OK instead of throwing a Postgres UUID syntax error (500).
    const isVendorQuery = Boolean(vendorId || vendorEmail);
    if (isVendorQuery && !resolvedVendorId) {
      return NextResponse.json([], { status: 200 });
    }

    let query = supabase.from('products').select('*');

    if (category) {
      query = query.eq('category', category);
    }

    if (resolvedVendorId) {
      query = query.eq('vendor_id', resolvedVendorId);
    } else if (isActive) {
      // Only filter active products for public marketplace queries (no vendorId)
      query = query.eq('is_active', true);
    }

    const { data: products, error } = await query.order('created_at', {
      ascending: false,
    });

    if (error) {
      console.error('Get products database error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(products || [], { status: 200 });
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
      vendorEmail,
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

    let finalVendorId = isValidUuid(vendorId) ? vendorId.trim() : null;

    if (!finalVendorId && vendorEmail) {
      const cleanEmail = String(vendorEmail).toLowerCase().trim();
      const { data: vRecord } = await supabase
        .from('vendors')
        .select('id')
        .eq('email', cleanEmail)
        .maybeSingle();
      if (vRecord?.id) {
        finalVendorId = vRecord.id;
      }
    }

    if (!finalVendorId || !name || !category || !basePrice) {
      return NextResponse.json(
        { error: 'Missing required fields or invalid vendor ID' },
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
          vendor_id: finalVendorId,
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
      const { generateSalesKitForProduct } = await import('@/lib/sales-kit-generator');
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

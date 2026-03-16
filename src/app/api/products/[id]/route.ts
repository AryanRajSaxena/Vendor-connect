import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(product, { status: 200 });
  } catch (error) {
    console.error('Get product error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let body;
    try {
      body = await request.json();
    } catch (parseErr) {
      console.error('JSON parse error:', parseErr);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    console.log('Update request for product:', id);
    console.log('Update data:', body);

    const { data: existingProduct, error: existingError } = await supabase
      .from('products')
      .select('id, base_price')
      .eq('id', id)
      .single();

    if (existingError || !existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Convert camelCase to snake_case for database columns
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.basePrice !== undefined) updateData.base_price = Number(body.basePrice);
    if (body.images !== undefined) updateData.images = body.images;
    if (body.specifications !== undefined) updateData.specifications = body.specifications;
    if (body.stock !== undefined) updateData.stock = body.stock;
    if (body.isActive !== undefined) updateData.is_active = body.isActive;
    
    // Course-specific fields
    if (body.courseDuration !== undefined) updateData.course_duration = body.courseDuration;
    if (body.prerequisites !== undefined) updateData.prerequisites = body.prerequisites;
    if (body.learningOutcomes !== undefined) updateData.learning_outcomes = body.learningOutcomes;
    if (body.curriculum !== undefined) updateData.curriculum = body.curriculum;

    if (
      body.basePrice !== undefined ||
      body.finalPrice !== undefined ||
      body.markup !== undefined ||
      body.markupPercentage !== undefined
    ) {
      const effectiveBasePrice = Number(
        body.basePrice !== undefined ? body.basePrice : existingProduct.base_price
      );
      if (!Number.isFinite(effectiveBasePrice) || effectiveBasePrice < 0) {
        return NextResponse.json(
          { error: 'Invalid base price' },
          { status: 400 }
        );
      }

      const { data: settings } = await supabase
        .from('admin_settings')
        .select('platform_markup_percentage')
        .limit(1)
        .single();

      const platformMarkupPercentage = Number(settings?.platform_markup_percentage ?? 25);
      const computedMarkup =
        Math.round(effectiveBasePrice * (platformMarkupPercentage / 100) * 100) / 100;
      const computedFinalPrice = Math.round((effectiveBasePrice + computedMarkup) * 100) / 100;

      updateData.base_price = effectiveBasePrice;
      updateData.markup_percentage = platformMarkupPercentage;
      updateData.markup = computedMarkup;
      updateData.final_price = computedFinalPrice;
    }
    updateData.updated_at = new Date().toISOString();

    console.log('Converted update data:', updateData);

    console.log('Before Supabase update call');
    const { data: product, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    console.log('After Supabase update call, error:', error, 'product:', product);

    if (error) {
      console.error('Supabase update error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      return NextResponse.json(
        { 
          error: error.message || 'Failed to update product',
          code: error.code,
          details: error.details,
          hint: error.hint
        },
        { status: 500 }
      );
    }

    if (!product) {
      console.error('Product not found after update');
      return NextResponse.json(
        { error: 'Product not found or update failed' },
        { status: 404 }
      );
    }

    console.log('Product updated successfully:', product.id);
    return NextResponse.json(product, { status: 200 });
  } catch (error) {
    console.error('Update product error caught:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete product' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Product deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete product error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

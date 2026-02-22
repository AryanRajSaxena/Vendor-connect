import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    console.log(`[API] Fetching seller product: ${id}`);

    // Get seller product
    const { data: sellerProduct, error: sellError } = await supabase
      .from('seller_products')
      .select('id, seller_id, product_id, referral_code, clicks, sales, earnings, added_at')
      .eq('id', id)
      .single();

    if (sellError) {
      console.error('[API] Seller product query error:', sellError);
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    if (!sellerProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Get product details
    const { data: product, error: prodError } = await supabase
      .from('products')
      .select('id, name, description, base_price, final_price, stock, images, category, vendor_id')
      .eq('id', sellerProduct.product_id)
      .single();

    if (prodError) {
      console.warn('[API] Product details fetch failed:', prodError);
      // Return seller product without enrichment
      return NextResponse.json({
        id: sellerProduct.id,
        productId: sellerProduct.product_id,
        sellerId: sellerProduct.seller_id,
        product_name: 'Unknown Product',
        description: '',
        base_price: 0,
        final_price: 0,
        stock: 0,
        seller_markup_percentage: 0,
        sold_count: sellerProduct.sales || 0,
        clicks: sellerProduct.clicks || 0,
        earnings: sellerProduct.earnings || 0,
        images: [],
        category: '',
        referral_code: sellerProduct.referral_code,
        vendor_id: '',
        created_at: sellerProduct.added_at,
      }, { status: 200 });
    }

    // Return enriched data
    const enrichedProduct = {
      id: sellerProduct.id,
      productId: sellerProduct.product_id,
      sellerId: sellerProduct.seller_id,
      product_name: product.name || 'Unknown Product',
      description: product.description || '',
      base_price: product.base_price || 0,
      final_price: product.final_price || 0,
      stock: product.stock || 0,
      seller_markup_percentage: 0,
      sold_count: sellerProduct.sales || 0,
      clicks: sellerProduct.clicks || 0,
      earnings: sellerProduct.earnings || 0,
      images: product.images || [],
      category: product.category || '',
      referral_code: sellerProduct.referral_code,
      vendor_id: product.vendor_id,
      created_at: sellerProduct.added_at,
    };

    console.log(`[API] Returning enriched seller product`);
    return NextResponse.json(enrichedProduct, { status: 200 });
  } catch (error) {
    console.error('[API] Get seller product error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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
      .from('seller_products')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to remove product from store' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Product removed from store' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete seller product error:', error);
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
    const body = await request.json();
    const { clicks, sales, earnings } = body;

    const updateData: any = {};
    if (clicks !== undefined) updateData.clicks = clicks;
    if (sales !== undefined) updateData.sales = sales;
    if (earnings !== undefined) updateData.earnings = earnings;

    const { data: sellerProduct, error } = await supabase
      .from('seller_products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update product stats' },
        { status: 500 }
      );
    }

    return NextResponse.json(sellerProduct, { status: 200 });
  } catch (error) {
    console.error('Update seller product error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

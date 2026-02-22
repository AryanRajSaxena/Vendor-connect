import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const vendorId = searchParams.get('vendorId');
    const isActive = searchParams.get('isActive') !== 'false';
    const sellerId = searchParams.get('sellerId');

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

    // Get seller count for each product
    const productsWithSellerCount = await Promise.all(
      (products || []).map(async (product) => {
        const { count, error: countError } = await supabase
          .from('seller_products')
          .select('id', { count: 'exact' })
          .eq('product_id', product.id);

        const sellerCount = countError ? 0 : (count || 0);

        // Check if current seller already has this product
        let isSellerProduct = false;
        if (sellerId) {
          const { data: existingProduct } = await supabase
            .from('seller_products')
            .select('id')
            .eq('product_id', product.id)
            .eq('seller_id', sellerId)
            .single();
          isSellerProduct = !!existingProduct;
        }

        return {
          ...product,
          sellerCount,
          isSellerProduct,
        };
      })
    );

    return NextResponse.json(productsWithSellerCount, { status: 200 });
  } catch (error) {
    console.error('Get products with seller count error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

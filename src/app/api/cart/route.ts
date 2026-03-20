import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

function toPositiveInt(value: unknown) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0 || !Number.isInteger(parsed)) {
    return null;
  }
  return parsed;
}

async function fetchCartItems(customerId: string) {
  const { data: cartRows, error: cartError } = await supabase
    .from('cart_items')
    .select('id, customer_id, product_id, quantity, created_at, updated_at')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });

  if (cartError) {
    throw new Error(cartError.message);
  }

  const rows = cartRows || [];
  if (rows.length === 0) {
    return [];
  }

  const productIds = rows
    .map((row: any) => row.product_id)
    .filter((id: any) => Boolean(id));

  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name, base_price, images, vendor_id, stock, is_active')
    .in('id', productIds);

  if (productsError) {
    throw new Error(productsError.message);
  }

  const productMap = new Map((products || []).map((product: any) => [product.id, product]));

  const items = rows
    .map((row: any) => {
      const product = productMap.get(row.product_id);
      if (!product) return null;

      return {
        id: product.id,
        productId: product.id,
        name: product.name,
        price: Number(product.base_price || 0),
        quantity: Number(row.quantity || 0),
        image: product.images?.[0] || '📦',
        vendorId: product.vendor_id,
        stock: Number(product.stock || 0),
        isActive: Boolean(product.is_active),
        cartItemId: row.id,
      };
    })
    .filter((item: any) => item && item.quantity > 0);

  return items;
}

export async function GET(request: NextRequest) {
  try {
    const customerId = request.nextUrl.searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json({ error: 'customerId is required' }, { status: 400 });
    }

    const items = await fetchCartItems(customerId);
    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    console.error('Get cart error:', error);
    return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const customerId = body?.customerId;
    const productId = body?.productId;
    const quantity = toPositiveInt(body?.quantity ?? 1);

    if (!customerId || !productId || !quantity) {
      return NextResponse.json(
        { error: 'customerId, productId and positive quantity are required' },
        { status: 400 }
      );
    }

    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, stock, is_active')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (!product.is_active) {
      return NextResponse.json({ error: 'Product is not active' }, { status: 400 });
    }

    const { data: existing, error: existingError } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('customer_id', customerId)
      .eq('product_id', productId)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 500 });
    }

    const nextQty = Math.min(Number(product.stock || 0), Number(existing?.quantity || 0) + quantity);
    if (nextQty <= 0) {
      return NextResponse.json({ error: 'Product is out of stock' }, { status: 400 });
    }

    if (existing?.id) {
      const { error: updateError } = await supabase
        .from('cart_items')
        .update({ quantity: nextQty, updated_at: new Date().toISOString() })
        .eq('id', existing.id);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
    } else {
      const { error: insertError } = await supabase
        .from('cart_items')
        .insert([{ customer_id: customerId, product_id: productId, quantity: nextQty }]);

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
    }

    const items = await fetchCartItems(customerId);
    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    console.error('Add to cart error:', error);
    return NextResponse.json({ error: 'Failed to add item to cart' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const customerId = body?.customerId;
    const productId = body?.productId;
    const quantity = Number(body?.quantity);

    if (!customerId || !productId || !Number.isFinite(quantity) || !Number.isInteger(quantity)) {
      return NextResponse.json(
        { error: 'customerId, productId and integer quantity are required' },
        { status: 400 }
      );
    }

    if (quantity <= 0) {
      const { error: deleteError } = await supabase
        .from('cart_items')
        .delete()
        .eq('customer_id', customerId)
        .eq('product_id', productId);

      if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 500 });
      }

      const items = await fetchCartItems(customerId);
      return NextResponse.json({ items }, { status: 200 });
    }

    const { data: product, error: productError } = await supabase
      .from('products')
      .select('stock, is_active')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (!product.is_active) {
      return NextResponse.json({ error: 'Product is not active' }, { status: 400 });
    }

    const nextQty = Math.min(Number(product.stock || 0), quantity);
    if (nextQty <= 0) {
      return NextResponse.json({ error: 'Product is out of stock' }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from('cart_items')
      .update({ quantity: nextQty, updated_at: new Date().toISOString() })
      .eq('customer_id', customerId)
      .eq('product_id', productId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    const items = await fetchCartItems(customerId);
    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    console.error('Update cart error:', error);
    return NextResponse.json({ error: 'Failed to update cart item' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const customerIdFromQuery = request.nextUrl.searchParams.get('customerId');
    const productIdFromQuery = request.nextUrl.searchParams.get('productId');
    const cartItemIdFromQuery = request.nextUrl.searchParams.get('cartItemId');

    let customerId = customerIdFromQuery;
    let productId = productIdFromQuery;
    let cartItemId = cartItemIdFromQuery;

    if (!customerId) {
      const body = await request.json().catch(() => ({}));
      customerId = body?.customerId || customerId;
      productId = body?.productId || productId;
      cartItemId = body?.cartItemId || cartItemId;
    }

    if (!customerId) {
      return NextResponse.json({ error: 'customerId is required' }, { status: 400 });
    }

    let deleted = false;

    // 1) Prefer precise delete using cart row id
    if (cartItemId) {
      const { data, error } = await supabase
        .from('cart_items')
        .delete()
        .eq('customer_id', customerId)
        .eq('id', cartItemId)
        .select('id');

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      deleted = Boolean(data && data.length > 0);
    }

    // 2) Fallback delete by product id
    if (!deleted && productId) {
      const { data, error } = await supabase
        .from('cart_items')
        .delete()
        .eq('customer_id', customerId)
        .eq('product_id', productId)
        .select('id');

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      deleted = Boolean(data && data.length > 0);
    }

    // 3) Final fallback: if productId actually contains cart row id
    if (!deleted && productId) {
      const { data, error } = await supabase
        .from('cart_items')
        .delete()
        .eq('customer_id', customerId)
        .eq('id', productId)
        .select('id');

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      deleted = Boolean(data && data.length > 0);
    }

    const items = await fetchCartItems(customerId);
    return NextResponse.json({ items, deleted }, { status: 200 });
  } catch (error) {
    console.error('Delete cart item error:', error);
    return NextResponse.json({ error: 'Failed to delete cart item' }, { status: 500 });
  }
}

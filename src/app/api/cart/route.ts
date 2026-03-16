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
  const { data, error } = await supabase
    .from('cart_items')
    .select('id, customer_id, product_id, quantity, created_at, updated_at, product:products!product_id(id, name, final_price, images, vendor_id, stock, is_active)')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const items = (data || [])
    .filter((row: any) => row.product)
    .map((row: any) => ({
      id: row.product.id,
      name: row.product.name,
      price: Number(row.product.final_price || 0),
      quantity: Number(row.quantity || 0),
      image: row.product.images?.[0] || '📦',
      vendorId: row.product.vendor_id,
      stock: Number(row.product.stock || 0),
      isActive: Boolean(row.product.is_active),
      cartItemId: row.id,
    }))
    .filter((item: any) => item.quantity > 0);

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
      .select('stock')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
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

    let customerId = customerIdFromQuery;
    let productId = productIdFromQuery;

    if (!customerId) {
      const body = await request.json().catch(() => ({}));
      customerId = body?.customerId || customerId;
      productId = body?.productId || productId;
    }

    if (!customerId) {
      return NextResponse.json({ error: 'customerId is required' }, { status: 400 });
    }

    let deleteQuery = supabase.from('cart_items').delete().eq('customer_id', customerId);
    if (productId) {
      deleteQuery = deleteQuery.eq('product_id', productId);
    }

    const { error: deleteError } = await deleteQuery;

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    const items = await fetchCartItems(customerId);
    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    console.error('Delete cart item error:', error);
    return NextResponse.json({ error: 'Failed to delete cart item' }, { status: 500 });
  }
}

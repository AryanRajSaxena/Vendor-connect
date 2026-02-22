import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const vendorId = searchParams.get('vendorId');
    const sellerId = searchParams.get('sellerId');
    const status = searchParams.get('status');

    let query = supabase.from('leads').select('*');

    if (vendorId) {
      query = query.eq('vendor_id', vendorId);
    }

    if (sellerId) {
      query = query.eq('seller_id', sellerId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: leads, error } = await query.order('created_at', {
      ascending: false,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(leads, { status: 200 });
  } catch (error) {
    console.error('Get leads error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vendorId, sellerId, name, phone, email, productId, status } = body;

    if (!vendorId || !name || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data: lead, error } = await supabase
      .from('leads')
      .insert([
        {
          vendor_id: vendorId,
          seller_id: sellerId,
          name,
          phone,
          email,
          product_id: productId,
          status: status || 'not_contacted',
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Create lead error:', error);
      return NextResponse.json(
        { error: 'Failed to create lead' },
        { status: 500 }
      );
    }

    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    console.error('Create lead error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

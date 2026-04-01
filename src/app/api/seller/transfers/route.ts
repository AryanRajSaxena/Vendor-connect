import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sellerId = searchParams.get('sellerId');

    if (!sellerId) {
      return NextResponse.json({ error: 'Seller ID required' }, { status: 400 });
    }

    const { data: transfers, error } = await supabase
      .from('seller_transfers')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(
      (transfers || []).map((t) => ({
        id: t.id,
        amount: t.amount,
        status: t.status,
        createdAt: t.created_at,
        accountNumber: t.account_number,
      })),
      { status: 200 }
    );
  } catch (error) {
    console.error('Transfers fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch transfers' }, { status: 500 });
  }
}

import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sellerId = searchParams.get('sellerId');

    if (!sellerId) {
      return NextResponse.json({ error: 'Seller ID required' }, { status: 400 });
    }

    // Get all orders for this seller and calculate earnings
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('seller_commission, commission_status')
      .eq('seller_id', sellerId);

    if (ordersError) throw ordersError;

    const allTimeEarnings = (orders || []).reduce((sum, o) => sum + (o.seller_commission || 0), 0);

    // Get all completed transfers
    const { data: transfers, error: transfersError } = await supabase
      .from('seller_transfers')
      .select('amount, status')
      .eq('seller_id', sellerId);

    if (transfersError) throw transfersError;

    const totalWithdrawn = (transfers || [])
      .filter((t) => t.status === 'completed')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const currentBalance = allTimeEarnings - totalWithdrawn;

    return NextResponse.json(
      {
        allTimeEarnings,
        currentBalance: Math.max(0, currentBalance),
        totalWithdrawn,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Wallet fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch wallet data' }, { status: 500 });
  }
}

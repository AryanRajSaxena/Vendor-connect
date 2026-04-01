import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sellerId, amount, accountNumber } = body;

    if (!sellerId || !amount || !accountNumber) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Get seller's current balance
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('seller_commission')
      .eq('seller_id', sellerId);

    if (ordersError) throw ordersError;

    const allTimeEarnings = (orders || []).reduce((sum, o) => sum + (o.seller_commission || 0), 0);

    const { data: transfers, error: transfersError } = await supabase
      .from('seller_transfers')
      .select('amount')
      .eq('seller_id', sellerId)
      .eq('status', 'completed');

    if (transfersError) throw transfersError;

    const totalWithdrawn = (transfers || []).reduce((sum, t) => sum + (t.amount || 0), 0);
    const currentBalance = allTimeEarnings - totalWithdrawn;

    if (amount > currentBalance) {
      return NextResponse.json(
        { error: 'Amount exceeds available balance' },
        { status: 400 }
      );
    }

    // Create transfer record
    const { data: transfer, error } = await supabase
      .from('seller_transfers')
      .insert([
        {
          seller_id: sellerId,
          amount,
          account_number: accountNumber,
          status: 'pending',
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // TODO: Integrate with payment gateway to process actual bank transfer
    // For now, just mark as pending

    return NextResponse.json(
      {
        id: transfer.id,
        amount: transfer.amount,
        status: transfer.status,
        message: 'Transfer initiated successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Transfer error:', error);
    return NextResponse.json(
      { error: 'Failed to process transfer' },
      { status: 500 }
    );
  }
}

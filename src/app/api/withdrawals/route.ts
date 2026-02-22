import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sellerId = searchParams.get('sellerId');
    const status = searchParams.get('status');

    let query = supabase.from('withdrawal_requests').select('*');

    if (sellerId) {
      query = query.eq('seller_id', sellerId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: withdrawals, error } = await query.order('created_at', {
      ascending: false,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(withdrawals, { status: 200 });
  } catch (error) {
    console.error('Get withdrawals error:', error);
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
      sellerId,
      amount,
      withdrawalMethod,
      upiId,
      bankAccount,
      bankIfsc,
      bankName,
    } = body;

    if (!sellerId || !amount || !withdrawalMethod) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (withdrawalMethod === 'upi' && !upiId) {
      return NextResponse.json(
        { error: 'UPI ID required for UPI withdrawals' },
        { status: 400 }
      );
    }

    if (withdrawalMethod === 'bank' && !bankAccount) {
      return NextResponse.json(
        { error: 'Bank account details required for bank withdrawals' },
        { status: 400 }
      );
    }

    const { data: withdrawal, error } = await supabase
      .from('withdrawal_requests')
      .insert([
        {
          seller_id: sellerId,
          amount,
          withdrawal_method: withdrawalMethod,
          upi_id: upiId,
          bank_account: bankAccount,
          bank_ifsc: bankIfsc,
          bank_name: bankName,
          status: 'pending',
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Create withdrawal error:', error);
      return NextResponse.json(
        { error: 'Failed to create withdrawal request' },
        { status: 500 }
      );
    }

    return NextResponse.json(withdrawal, { status: 201 });
  } catch (error) {
    console.error('Create withdrawal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, transactionRef, notes } = body;

    const updateData: any = {};
    if (status) updateData.status = status;
    if (transactionRef) updateData.transaction_ref = transactionRef;
    if (notes) updateData.notes = notes;
    updateData.updated_at = new Date().toISOString();

    const { data: withdrawal, error } = await supabase
      .from('withdrawal_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update withdrawal' },
        { status: 500 }
      );
    }

    return NextResponse.json(withdrawal, { status: 200 });
  } catch (error) {
    console.error('Update withdrawal error:', error);
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
      .from('withdrawal_requests')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to cancel withdrawal' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Withdrawal cancelled' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete withdrawal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

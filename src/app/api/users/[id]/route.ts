import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Don't return password hash
    const { password_hash, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword, { status: 200 });
  } catch (error) {
    console.error('Get user error:', error);
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

    // Map and filter updates to actual public.users columns
    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (body.name !== undefined) updates.name = body.name;
    if (body.phone !== undefined) updates.phone = body.phone;
    if (body.business_name !== undefined) updates.business_name = body.business_name;
    else if (body.businessName !== undefined) updates.business_name = body.businessName;

    if (body.account_number !== undefined) updates.account_number = body.account_number;
    else if (body.accountNumber !== undefined) updates.account_number = body.accountNumber;

    if (body.ifsc_code !== undefined) updates.ifsc_code = body.ifsc_code;
    else if (body.ifscCode !== undefined) updates.ifsc_code = body.ifscCode;

    if (body.upi_id !== undefined) updates.upi_id = body.upi_id;
    else if (body.upiId !== undefined) updates.upi_id = body.upiId;

    if (body.is_verified !== undefined) updates.is_verified = body.is_verified;
    else if (body.isVerified !== undefined) updates.is_verified = body.isVerified;

    let { data: user, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    // If upi_id column is not yet added in PostgreSQL, retry without it so other updates succeed
    if (error && error.message?.toLowerCase().includes('upi_id')) {
      delete updates.upi_id;
      const retry = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      user = retry.data;
      error = retry.error;
    }

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      );
    }

    // Don't return password hash
    const { password_hash, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword, { status: 200 });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

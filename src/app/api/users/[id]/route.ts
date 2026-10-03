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

    // If role is vendor, merge data from dedicated vendors table if it exists
    if (user.role === 'vendor') {
      try {
        const { data: vendor } = await supabase
          .from('vendors')
          .select('*')
          .eq('user_id', id)
          .maybeSingle();

        if (vendor) {
          user.business_name = vendor.business_name || user.business_name;
          user.support_email = vendor.support_email;
          user.gst_number = vendor.gst_number;
          user.pan_number = vendor.pan_number;
          user.bank_account_holder = vendor.bank_account_holder;
          user.account_number = vendor.account_number || user.account_number;
          user.ifsc_code = vendor.ifsc_code || user.ifsc_code;
          if (typeof vendor.is_locked === 'boolean') {
            user.is_locked = vendor.is_locked;
          }
        }
      } catch {
        // vendors table may not be created yet, fallback gracefully
      }
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

    if (body.account_number !== undefined) updates.account_number = body.account_number;
    else if (body.accountNumber !== undefined) updates.account_number = body.accountNumber;

    if (body.ifsc_code !== undefined) updates.ifsc_code = body.ifsc_code;
    else if (body.ifscCode !== undefined) updates.ifsc_code = body.ifscCode;

    if (body.upi_id !== undefined) updates.upi_id = body.upi_id;
    else if (body.upiId !== undefined) updates.upi_id = body.upiId;

    if (body.is_verified !== undefined) updates.is_verified = body.is_verified;
    else if (body.isVerified !== undefined) updates.is_verified = body.isVerified;

    if (body.is_locked !== undefined) updates.is_locked = body.is_locked;
    else if (body.isLocked !== undefined) updates.is_locked = body.isLocked;

    let { data: user, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    // Resilient schema fallback: If any column is not in public.users, strip it and retry
    while (error && error.message) {
      const colMatch =
        error.message.match(/Could not find the '([^']+)' column of 'users'/i) ||
        error.message.match(/column "([^"]+)" of relation "users" does not exist/i);

      if (colMatch && colMatch[1] && colMatch[1] in updates) {
        delete updates[colMatch[1]];
        const retry = await supabase
          .from('users')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        user = retry.data;
        error = retry.error;
      } else {
        break;
      }
    }

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update user: ' + error.message },
        { status: 500 }
      );
    }

    // Sync vendor-specific details to dedicated public.vendors table if applicable
    const isVendorRole = user?.role === 'vendor' || body.role === 'vendor';
    const hasVendorFields = Boolean(
      body.business_name || body.businessName ||
      body.gst_number || body.gstNumber ||
      body.pan_number || body.panNumber ||
      body.support_email || body.supportEmail ||
      body.bank_account_holder || body.bankAccountHolder
    );

    if (isVendorRole || hasVendorFields) {
      try {
        const vendorUpdates: Record<string, any> = {
          user_id: id,
          business_name: body.business_name || body.businessName || user.business_name || user.name || 'Vendor',
          updated_at: new Date().toISOString(),
        };

        if (body.support_email !== undefined) vendorUpdates.support_email = body.support_email;
        else if (body.supportEmail !== undefined) vendorUpdates.support_email = body.supportEmail;

        if (body.phone !== undefined) vendorUpdates.phone = body.phone;
        else if (user.phone) vendorUpdates.phone = user.phone;

        if (body.gst_number !== undefined) vendorUpdates.gst_number = body.gst_number;
        else if (body.gstNumber !== undefined) vendorUpdates.gst_number = body.gstNumber;

        if (body.pan_number !== undefined) vendorUpdates.pan_number = body.pan_number;
        else if (body.panNumber !== undefined) vendorUpdates.pan_number = body.panNumber;

        if (body.bank_account_holder !== undefined) vendorUpdates.bank_account_holder = body.bank_account_holder;
        else if (body.bankAccountHolder !== undefined) vendorUpdates.bank_account_holder = body.bankAccountHolder;

        if (body.account_number !== undefined) vendorUpdates.account_number = body.account_number;
        else if (body.accountNumber !== undefined) vendorUpdates.account_number = body.accountNumber;
        else if (user.account_number) vendorUpdates.account_number = user.account_number;

        if (body.ifsc_code !== undefined) vendorUpdates.ifsc_code = body.ifsc_code;
        else if (body.ifscCode !== undefined) vendorUpdates.ifsc_code = body.ifscCode;
        else if (user.ifsc_code) vendorUpdates.ifsc_code = user.ifsc_code;

        if (body.is_locked !== undefined) vendorUpdates.is_locked = body.is_locked;
        else if (body.isLocked !== undefined) vendorUpdates.is_locked = body.isLocked;

        const { data: vendorData, error: vErr } = await supabase
          .from('vendors')
          .upsert(vendorUpdates, { onConflict: 'user_id' })
          .select()
          .maybeSingle();

        if (vErr) {
          console.warn('Upsert to vendors table warning:', vErr.message);
        } else if (vendorData) {
          Object.assign(user, vendorData);
        }
      } catch (vErr) {
        console.warn('Upsert to vendors table skipped (table might not exist yet):', vErr);
      }
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

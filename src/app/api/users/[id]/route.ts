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
      .maybeSingle();

    if (error) {
      console.error('Get user error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch user: ' + error.message },
        { status: 500 }
      );
    }

    if (!user) {
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

    // First check if user exists in public.users
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    let user: Record<string, any> | null = existingUser;

    if (existingUser) {
      // User exists -> update
      let { data: updatedUser, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .maybeSingle();

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
            .maybeSingle();
          updatedUser = retry.data;
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

      user = updatedUser || existingUser;
    } else {
      // User row does NOT exist in public.users -> auto-provision/insert
      const insertPayload: Record<string, any> = {
        id,
        email: body.email || `user_${id.slice(0, 8)}@agentcroww.com`,
        password_hash: body.password_hash || `AUTH_${Date.now()}`,
        name: body.name || 'User',
        role: body.role || 'vendor',
        phone: updates.phone || null,
        account_number: updates.account_number || null,
        ifsc_code: updates.ifsc_code || null,
        upi_id: updates.upi_id || null,
        is_locked: updates.is_locked ?? false,
        is_verified: true,
        updated_at: new Date().toISOString(),
      };

      let { data: insertedUser, error } = await supabase
        .from('users')
        .insert([insertPayload])
        .select()
        .maybeSingle();

      // Resilient fallback for columns not existing in public.users
      while (error && error.message) {
        const colMatch =
          error.message.match(/Could not find the '([^']+)' column of 'users'/i) ||
          error.message.match(/column "([^"]+)" of relation "users" does not exist/i);

        if (colMatch && colMatch[1] && colMatch[1] in insertPayload) {
          delete insertPayload[colMatch[1]];
          const retry = await supabase
            .from('users')
            .insert([insertPayload])
            .select()
            .maybeSingle();
          insertedUser = retry.data;
          error = retry.error;
        } else {
          break;
        }
      }

      if (error) {
        return NextResponse.json(
          { error: 'Failed to create user: ' + error.message },
          { status: 500 }
        );
      }

      user = insertedUser || insertPayload;
    }

    const safeUser: Record<string, any> = user || {};

    // Sync vendor-specific details to dedicated public.vendors table if applicable
    const isVendorRole = safeUser.role === 'vendor' || body.role === 'vendor';
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
          business_name: body.business_name || body.businessName || safeUser.business_name || safeUser.name || 'Vendor',
          updated_at: new Date().toISOString(),
        };

        if (body.support_email !== undefined) vendorUpdates.support_email = body.support_email;
        else if (body.supportEmail !== undefined) vendorUpdates.support_email = body.supportEmail;

        if (body.phone !== undefined) vendorUpdates.phone = body.phone;
        else if (safeUser.phone) vendorUpdates.phone = safeUser.phone;

        if (body.gst_number !== undefined) vendorUpdates.gst_number = body.gst_number;
        else if (body.gstNumber !== undefined) vendorUpdates.gst_number = body.gstNumber;

        if (body.pan_number !== undefined) vendorUpdates.pan_number = body.pan_number;
        else if (body.panNumber !== undefined) vendorUpdates.pan_number = body.panNumber;

        if (body.bank_account_holder !== undefined) vendorUpdates.bank_account_holder = body.bank_account_holder;
        else if (body.bankAccountHolder !== undefined) vendorUpdates.bank_account_holder = body.bankAccountHolder;

        if (body.account_number !== undefined) vendorUpdates.account_number = body.account_number;
        else if (body.accountNumber !== undefined) vendorUpdates.account_number = body.accountNumber;
        else if (safeUser.account_number) vendorUpdates.account_number = safeUser.account_number;

        if (body.ifsc_code !== undefined) vendorUpdates.ifsc_code = body.ifsc_code;
        else if (body.ifscCode !== undefined) vendorUpdates.ifsc_code = body.ifscCode;
        else if (safeUser.ifsc_code) vendorUpdates.ifsc_code = safeUser.ifsc_code;

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
          Object.assign(safeUser, vendorData);
        }
      } catch (vErr) {
        console.warn('Upsert to vendors table skipped (table might not exist yet):', vErr);
      }
    }

    // Don't return password hash
    const { password_hash, ...userWithoutPassword } = safeUser;
    return NextResponse.json(userWithoutPassword, { status: 200 });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

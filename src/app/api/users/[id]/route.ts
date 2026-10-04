import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
import { isValidUuid } from '@/utils/auth';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!isValidUuid(id)) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // 1. Check vendors table
    const { data: vendor, error: vErr } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (vErr) {
      console.warn('Error querying vendors table:', vErr.message);
    }

    if (vendor) {
      vendor.role = 'vendor';
      const { password_hash, ...vendorWithoutPassword } = vendor;
      return NextResponse.json(vendorWithoutPassword, { status: 200 });
    }

    // 2. Check sellers table
    const { data: seller, error: sErr } = await supabase
      .from('sellers')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (sErr) {
      console.warn('Error querying sellers table:', sErr.message);
    }

    if (seller) {
      seller.role = 'seller';
      seller.business_name = seller.business_name || seller.store_name;
      seller.store_name = seller.store_name || seller.business_name;
      const { password_hash, ...sellerWithoutPassword } = seller;
      return NextResponse.json(sellerWithoutPassword, { status: 200 });
    }

    return NextResponse.json(
      { error: 'Account not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Get account error:', error);
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

    if (!isValidUuid(id)) {
      return NextResponse.json(
        { error: 'Invalid account ID' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Determine target role: check payload role or look up in tables
    let isVendor = body.role === 'vendor';
    let isSeller = body.role === 'seller';

    if (!isVendor && !isSeller) {
      const { data: v } = await supabase.from('vendors').select('id').eq('id', id).maybeSingle();
      if (v) {
        isVendor = true;
      } else {
        const { data: s } = await supabase.from('sellers').select('id').eq('id', id).maybeSingle();
        if (s) isSeller = true;
      }
    }

    // If still undecided, check vendor-specific vs seller-specific fields
    if (!isVendor && !isSeller) {
      if (body.gst_number || body.gstNumber || body.support_email || body.supportEmail) {
        isVendor = true;
      } else if (body.upi_id || body.upiId || body.store_name || body.storeName) {
        isSeller = true;
      } else {
        isVendor = true; // Default fallback
      }
    }

    if (isVendor) {
      // ----------------------------------------------------
      // UPDATE VENDORS TABLE
      // ----------------------------------------------------
      const vendorUpdates: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };

      if (body.name !== undefined) vendorUpdates.name = body.name;
      if (body.phone !== undefined) vendorUpdates.phone = body.phone;

      if (body.business_name !== undefined) vendorUpdates.business_name = body.business_name;
      else if (body.businessName !== undefined) vendorUpdates.business_name = body.businessName;

      if (body.support_email !== undefined) vendorUpdates.support_email = body.support_email;
      else if (body.supportEmail !== undefined) vendorUpdates.support_email = body.supportEmail;

      if (body.gst_number !== undefined) vendorUpdates.gst_number = body.gst_number;
      else if (body.gstNumber !== undefined) vendorUpdates.gst_number = body.gstNumber;

      if (body.pan_number !== undefined) vendorUpdates.pan_number = body.pan_number;
      else if (body.panNumber !== undefined) vendorUpdates.pan_number = body.panNumber;

      if (body.bank_account_holder !== undefined) vendorUpdates.bank_account_holder = body.bank_account_holder;
      else if (body.bankAccountHolder !== undefined) vendorUpdates.bank_account_holder = body.bankAccountHolder;

      if (body.account_number !== undefined) vendorUpdates.account_number = body.account_number;
      else if (body.accountNumber !== undefined) vendorUpdates.account_number = body.accountNumber;

      if (body.ifsc_code !== undefined) vendorUpdates.ifsc_code = body.ifsc_code;
      else if (body.ifscCode !== undefined) vendorUpdates.ifsc_code = body.ifscCode;

      if (body.is_locked !== undefined) vendorUpdates.is_locked = body.is_locked;
      else if (body.isLocked !== undefined) vendorUpdates.is_locked = body.isLocked;

      const { data: existingVendor } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      let resultVendor: any = null;

      if (existingVendor) {
        const { data, error } = await supabase
          .from('vendors')
          .update(vendorUpdates)
          .eq('id', id)
          .select()
          .maybeSingle();

        if (error) {
          return NextResponse.json(
            { error: 'Failed to update vendor settings: ' + error.message },
            { status: 500 }
          );
        }
        resultVendor = data || { ...existingVendor, ...vendorUpdates };
      } else {
        // Auto-provision in vendors table if row does not exist yet
        const insertPayload = {
          id,
          email: body.email || `vendor_${id.slice(0, 8)}@agentcroww.com`,
          password_hash: `AUTH_${Date.now()}`,
          name: body.name || 'Vendor',
          role: 'vendor',
          business_name: vendorUpdates.business_name || body.name || 'Vendor',
          is_verified: true,
          ...vendorUpdates,
        };

        const { data, error } = await supabase
          .from('vendors')
          .insert([insertPayload])
          .select()
          .maybeSingle();

        if (error) {
          return NextResponse.json(
            { error: 'Failed to create vendor account: ' + error.message },
            { status: 500 }
          );
        }
        resultVendor = data || insertPayload;
      }

      resultVendor.role = 'vendor';
      const { password_hash, ...cleanVendor } = resultVendor;
      return NextResponse.json(cleanVendor, { status: 200 });
    }

    // ----------------------------------------------------
    // UPDATE SELLERS TABLE
    // ----------------------------------------------------
    const sellerUpdates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (body.name !== undefined) sellerUpdates.name = body.name;
    if (body.phone !== undefined) sellerUpdates.phone = body.phone;

    const sName = body.store_name || body.storeName || body.business_name || body.businessName;
    if (sName !== undefined) {
      sellerUpdates.store_name = sName;
      sellerUpdates.business_name = sName;
    }

    if (body.upi_id !== undefined) sellerUpdates.upi_id = body.upi_id;
    else if (body.upiId !== undefined) sellerUpdates.upi_id = body.upiId;

    if (body.bank_account_holder !== undefined) sellerUpdates.bank_account_holder = body.bank_account_holder;
    else if (body.bankAccountHolder !== undefined) sellerUpdates.bank_account_holder = body.bankAccountHolder;

    if (body.account_number !== undefined) sellerUpdates.account_number = body.account_number;
    else if (body.accountNumber !== undefined) sellerUpdates.account_number = body.accountNumber;

    if (body.ifsc_code !== undefined) sellerUpdates.ifsc_code = body.ifsc_code;
    else if (body.ifscCode !== undefined) sellerUpdates.ifsc_code = body.ifscCode;

    if (body.is_locked !== undefined) sellerUpdates.is_locked = body.is_locked;
    else if (body.isLocked !== undefined) sellerUpdates.is_locked = body.isLocked;

    const { data: existingSeller } = await supabase
      .from('sellers')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    let resultSeller: any = null;

    if (existingSeller) {
      const { data, error } = await supabase
        .from('sellers')
        .update(sellerUpdates)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) {
        return NextResponse.json(
          { error: 'Failed to update seller settings: ' + error.message },
          { status: 500 }
        );
      }
      resultSeller = data || { ...existingSeller, ...sellerUpdates };
    } else {
      // Auto-provision in sellers table
      const insertPayload = {
        id,
        email: body.email || `seller_${id.slice(0, 8)}@agentcroww.com`,
        password_hash: `AUTH_${Date.now()}`,
        name: body.name || 'Seller',
        role: 'seller',
        store_name: sName || body.name || 'Seller Store',
        business_name: sName || body.name || 'Seller Store',
        is_verified: true,
        ...sellerUpdates,
      };

      const { data, error } = await supabase
        .from('sellers')
        .insert([insertPayload])
        .select()
        .maybeSingle();

      if (error) {
        return NextResponse.json(
          { error: 'Failed to create seller account: ' + error.message },
          { status: 500 }
        );
      }
      resultSeller = data || insertPayload;
    }

    resultSeller.role = 'seller';
    const { password_hash, ...cleanSeller } = resultSeller;
    return NextResponse.json(cleanSeller, { status: 200 });
  } catch (error) {
    console.error('Update account error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

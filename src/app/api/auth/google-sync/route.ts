import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
import { isValidEmail } from '@/utils/auth';
import { withRateLimit, logSecurityEvent } from '@/lib/middleware';

export async function POST(request: NextRequest) {
  const rateLimitResponse = withRateLimit('oauth')(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body = await request.json();
    const { email, name, avatar, role, supabaseUid } = body;

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: 'A valid email is required' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    const formatUserResponse = (u: any, accountRole: 'vendor' | 'seller') => ({
      id: String(u.id),
      email: u.email,
      name: u.name || name || u.email.split('@')[0],
      role: accountRole,
      phone: u.phone || '',
      isVerified: u.is_verified ?? true,
      createdAt: u.created_at || new Date().toISOString(),
      updatedAt: u.updated_at || new Date().toISOString(),
      avatar: avatar || undefined,
      businessName: u.business_name || u.store_name,
      business_name: u.business_name || u.store_name,
      storeName: u.store_name || u.business_name,
      is_locked: u.is_locked ?? false,
      isLocked: u.is_locked ?? false,
    });

    // Check if user already exists in vendors or sellers
    const { data: existingVendor } = await supabase
      .from('vendors')
      .select('*')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (existingVendor) {
      return NextResponse.json(formatUserResponse(existingVendor, 'vendor'), { status: 200 });
    }

    const { data: existingSeller } = await supabase
      .from('sellers')
      .select('*')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (existingSeller) {
      return NextResponse.json(formatUserResponse(existingSeller, 'seller'), { status: 200 });
    }

    // New user -> provision in dedicated vendors or sellers table
    const targetRole: 'vendor' | 'seller' = role === 'seller' ? 'seller' : 'vendor';
    const displayName = (name || cleanEmail.split('@')[0]).trim();
    const table = targetRole === 'vendor' ? 'vendors' : 'sellers';

    const insertPayload: Record<string, any> = {
      email: cleanEmail,
      password_hash: `OAUTH_GOOGLE_${supabaseUid || Date.now()}`,
      name: displayName,
      role: targetRole,
      phone: null,
      is_verified: true,
      is_locked: false,
    };

    if (targetRole === 'vendor') {
      insertPayload.business_name = displayName;
    } else {
      insertPayload.store_name = displayName;
      insertPayload.business_name = displayName;
    }

    let insertResult = null;
    let insertError = null;

    if (supabaseUid) {
      const { data, error } = await supabase
        .from(table)
        .insert([{ ...insertPayload, id: supabaseUid }])
        .select()
        .maybeSingle();
      insertResult = data;
      insertError = error;
    }

    if (!insertResult) {
      const { data, error } = await supabase
        .from(table)
        .insert([insertPayload])
        .select()
        .maybeSingle();
      insertResult = data;
      insertError = error;
    }

    if (insertError || !insertResult) {
      console.error(`Failed to create new ${targetRole} record in google-sync:`, insertError);
      return NextResponse.json(
        { error: `Failed to create account record: ${insertError?.message || 'Database error'}` },
        { status: 500 }
      );
    }

    logSecurityEvent('google_signup_success', { email: cleanEmail, role: targetRole }, request);
    return NextResponse.json(formatUserResponse(insertResult, targetRole), { status: 201 });
  } catch (error) {
    console.error('Google sync error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

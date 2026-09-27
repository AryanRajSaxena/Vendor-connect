import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
import { isValidEmail } from '@/utils/auth';
import { withRateLimit, logSecurityEvent } from '@/lib/middleware';

export async function POST(request: NextRequest) {
  const rateLimitResponse = withRateLimit('auth')(request);
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

    // Check if user already exists in public.users
    const { data: existingUser, error: queryError } = await supabase
      .from('users')
      .select('*')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (queryError) {
      console.error('Database query error during google-sync:', queryError);
      return NextResponse.json(
        { error: 'Failed to query database user' },
        { status: 500 }
      );
    }

    const formatUserResponse = (u: any) => ({
      id: String(u.id),
      email: u.email,
      name: u.name || name || u.email.split('@')[0],
      role: u.role || 'customer',
      phone: u.phone || '',
      isVerified: u.is_verified ?? true,
      is_verified: u.is_verified ?? true,
      createdAt: u.created_at || new Date().toISOString(),
      updatedAt: u.updated_at || new Date().toISOString(),
      avatar: u.avatar || avatar,
      businessName: u.business_name,
      business_name: u.business_name,
      gstNumber: u.gst_number,
      gst_number: u.gst_number,
      panNumber: u.pan_number,
      pan_number: u.pan_number,
    });

    if (existingUser) {
      // If user exists as 'customer', but signs up with a specific role ('vendor' | 'seller'), upgrade role
      let currentRole = existingUser.role;
      if (role && (role === 'vendor' || role === 'seller') && (!currentRole || currentRole === 'customer')) {
        currentRole = role;
      }

      try {
        await supabase
          .from('users')
          .update({
            role: currentRole,
            last_login: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            ...(avatar && !existingUser.avatar ? { avatar } : {}),
          })
          .eq('id', existingUser.id);
      } catch (err) {
        console.warn('Failed to update user for existing user:', err);
      }

      return NextResponse.json(formatUserResponse({ ...existingUser, role: currentRole }), { status: 200 });
    }

    // New user -> provision in public.users
    const validRoles = ['vendor', 'seller', 'customer'];
    const assignedRole = validRoles.includes(role) ? role : 'customer';
    const displayName = (name || cleanEmail.split('@')[0]).trim();

    const insertPayload: Record<string, any> = {
      email: cleanEmail,
      name: displayName,
      role: assignedRole,
      phone: '',
      is_verified: true,
      last_login: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (avatar) {
      insertPayload.avatar = avatar;
    }

    // Attempt insertion with supabaseUid if provided
    let insertResult = null;
    let insertError = null;

    if (supabaseUid) {
      const { data, error } = await supabase
        .from('users')
        .insert([{ ...insertPayload, id: supabaseUid }])
        .select()
        .single();
      insertResult = data;
      insertError = error;
    }

    // If no supabaseUid or if inserting with custom ID failed (e.g. integer id sequence), insert without custom ID
    if (!insertResult) {
      const { data, error } = await supabase
        .from('users')
        .insert([insertPayload])
        .select()
        .single();
      insertResult = data;
      insertError = error;
    }

    if (insertError || !insertResult) {
      console.error('Failed to create new user record in google-sync:', insertError);
      return NextResponse.json(
        { error: 'Failed to create user record. Please try again.' },
        { status: 500 }
      );
    }

    logSecurityEvent('google_signup_success', { email: cleanEmail, role: assignedRole }, request);
    return NextResponse.json(formatUserResponse(insertResult), { status: 201 });
  } catch (error) {
    console.error('Google sync error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

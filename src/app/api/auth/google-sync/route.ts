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

    // Check if user already exists in public.users
    const { data: existingUser, error: queryError } = await supabase
      .from('users')
      .select('*')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (queryError) {
      console.error('Database query error during google-sync:', queryError);
      return NextResponse.json(
        { error: `Database query failed: ${queryError.message}` },
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
      createdAt: u.created_at || new Date().toISOString(),
      updatedAt: u.updated_at || new Date().toISOString(),
      avatar: avatar || undefined,
      businessName: u.business_name,
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
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingUser.id);
      } catch (err) {
        console.warn('Failed to update user for existing user:', err);
      }

      return NextResponse.json(formatUserResponse({ ...existingUser, role: currentRole }), { status: 200 });
    }

    // New user -> provision in public.users matching exact table schema:
    // id (uuid), email (varchar NOT NULL), password_hash (varchar NOT NULL), name (varchar NOT NULL),
    // role (varchar NOT NULL), phone (varchar), business_name (varchar), is_verified (boolean)
    const validRoles = ['vendor', 'seller', 'customer'];
    const assignedRole = validRoles.includes(role) ? role : 'customer';
    const displayName = (name || cleanEmail.split('@')[0]).trim();

    const insertPayload: Record<string, any> = {
      email: cleanEmail,
      password_hash: `OAUTH_GOOGLE_${supabaseUid || Date.now()}`,
      name: displayName,
      role: assignedRole,
      phone: null,
      business_name: null,
      is_verified: true,
    };

    let insertResult = null;
    let insertError = null;

    // First attempt: insert with supabaseUid as id (if valid UUID from Supabase)
    if (supabaseUid) {
      const { data, error } = await supabase
        .from('users')
        .insert([{ ...insertPayload, id: supabaseUid }])
        .select()
        .single();
      insertResult = data;
      insertError = error;
    }

    // Fallback: insert without custom id (allows database gen_random_uuid() to assign id)
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
        { error: `Failed to create user record: ${insertError?.message || 'Database error'}` },
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

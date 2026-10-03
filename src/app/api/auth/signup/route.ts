import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
import { hashPassword, validatePasswordStrength } from '@/utils/password';
import { withRateLimit, logSecurityEvent } from '@/lib/middleware';

export async function POST(request: NextRequest) {
  const rateLimitResponse = withRateLimit('auth')(request);
  if (rateLimitResponse) {
    logSecurityEvent('signup_rate_limit_exceeded', {}, request);
    return rateLimitResponse;
  }

  try {
    const body = await request.json();
    const { email, password, name, role, businessName, gstNumber, panNumber, phone } = body;

    // Validate input
    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['vendor', 'seller', 'customer'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role specified' },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: passwordValidation.message },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Role-specific validation
    if (role === 'vendor') {
      if (!businessName || !businessName.trim()) {
        return NextResponse.json(
          { error: 'Business name is required for vendors' },
          { status: 400 }
        );
      }
      if (!gstNumber || !gstNumber.trim()) {
        return NextResponse.json(
          { error: 'GST number is required for vendors' },
          { status: 400 }
        );
      }
      // Basic GST format validation (Indian GST: 15 characters)
      const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstRegex.test(gstNumber.toUpperCase())) {
        return NextResponse.json(
          { error: 'Invalid GST number format' },
          { status: 400 }
        );
      }
    }

    if (role === 'seller') {
      if (!panNumber || !panNumber.trim()) {
        return NextResponse.json(
          { error: 'PAN number is required for sellers' },
          { status: 400 }
        );
      }
      // Basic PAN format validation (Indian PAN: 10 characters)
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!panRegex.test(panNumber.toUpperCase())) {
        return NextResponse.json(
          { error: 'Invalid PAN number format' },
          { status: 400 }
        );
      }
    }

    // Validate phone (Indian format)
    if (phone) {
      const phoneRegex = /^[6-9][0-9]{9}$/;
      if (!phoneRegex.test(phone)) {
        return NextResponse.json(
          { error: 'Invalid phone number format (must be 10 digits starting with 6-9)' },
          { status: 400 }
        );
      }
    }

    // Hash password with bcrypt
    const passwordHash = await hashPassword(password);

    // Create user in public.users
    const userPayload: Record<string, any> = {
      email: email.toLowerCase().trim(),
      password_hash: passwordHash,
      name: name.trim(),
      role,
      phone: phone?.trim() || null,
      is_verified: false,
    };

    let { data: newUser, error } = await supabase
      .from('users')
      .insert([userPayload])
      .select()
      .maybeSingle();

    while (error && error.message) {
      const colMatch =
        error.message.match(/Could not find the '([^']+)' column of 'users'/i) ||
        error.message.match(/column "([^"]+)" of relation "users" does not exist/i);

      if (colMatch && colMatch[1] && colMatch[1] in userPayload) {
        delete userPayload[colMatch[1]];
        const retry = await supabase
          .from('users')
          .insert([userPayload])
          .select()
          .maybeSingle();
        newUser = retry.data;
        error = retry.error;
      } else {
        break;
      }
    }

    if (error || !newUser) {
      console.error('Signup error:', error);
      return NextResponse.json(
        { error: 'Failed to create account: ' + (error?.message || 'Database error') },
        { status: 500 }
      );
    }

    // If vendor, sync to public.vendors
    if (role === 'vendor' && newUser.id) {
      try {
        await supabase
          .from('vendors')
          .upsert({
            user_id: newUser.id,
            business_name: businessName?.trim() || name.trim(),
            phone: phone?.trim() || null,
            gst_number: gstNumber?.toUpperCase().trim() || null,
            pan_number: panNumber?.toUpperCase().trim() || null,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });
      } catch (vErr) {
        console.warn('Vendor table sync warning:', vErr);
      }
    }

    // Return user without password
    const { password_hash, ...userWithoutPassword } = newUser;
    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

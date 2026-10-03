import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword } from '@/utils/password';
import { isValidEmail } from '@/utils/auth';
import { withRateLimit, logSecurityEvent } from '@/lib/middleware';

export async function POST(request: NextRequest) {
  const rateLimitResponse = withRateLimit('auth')(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check vendors table first
    let account: any = null;
    let accountType: 'vendor' | 'seller' | null = null;

    const { data: vendorUser, error: vErr } = await supabase
      .from('vendors')
      .select('*')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (vErr) {
      console.error('Database error checking vendors during login:', vErr);
    }

    if (vendorUser) {
      account = vendorUser;
      accountType = 'vendor';
    } else {
      // Check sellers table
      const { data: sellerUser, error: sErr } = await supabase
        .from('sellers')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (sErr) {
        console.error('Database error checking sellers during login:', sErr);
      }

      if (sellerUser) {
        account = sellerUser;
        accountType = 'seller';
      }
    }

    if (!account) {
      logSecurityEvent('login_failed_user_not_found', { email: cleanEmail }, request);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password using bcrypt
    const isValidPassword = await verifyPassword(password, account.password_hash);

    if (!isValidPassword) {
      logSecurityEvent('login_failed_invalid_password', { email: cleanEmail, userId: account.id }, request);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Update last activity timestamp in corresponding table
    const tableToUpdate = accountType === 'vendor' ? 'vendors' : 'sellers';
    await supabase
      .from(tableToUpdate)
      .update({ updated_at: new Date().toISOString() })
      .eq('id', account.id);

    // Ensure role property is set
    account.role = accountType;

    // Return account without password
    const { password_hash, ...accountWithoutPassword } = account;
    return NextResponse.json(accountWithoutPassword, { status: 200 });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

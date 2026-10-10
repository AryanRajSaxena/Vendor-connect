import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ref = (searchParams.get('ref') || searchParams.get('referral') || searchParams.get('code') || '').trim();

    if (!ref) {
      return NextResponse.json({ error: 'Missing referral code' }, { status: 400 });
    }

    // 1. Look up seller_products by referral_code (case-insensitive)
    const { data: spRecord, error: spErr } = await supabase
      .from('seller_products')
      .select('id, product_id, seller_id, referral_code')
      .ilike('referral_code', ref)
      .maybeSingle();

    if (spErr) {
      console.warn('[Resolve Ref] Error querying seller_products:', spErr);
    }

    if (spRecord?.product_id) {
      return NextResponse.json({
        found: true,
        productId: spRecord.product_id,
        sellerId: spRecord.seller_id,
        referralCode: spRecord.referral_code,
      });
    }

    // 2. Fallback: check if ref is a seller UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ref);
    if (isUuid) {
      const { data: spBySeller } = await supabase
        .from('seller_products')
        .select('id, product_id, seller_id, referral_code')
        .eq('seller_id', ref)
        .order('added_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (spBySeller?.product_id) {
        return NextResponse.json({
          found: true,
          productId: spBySeller.product_id,
          sellerId: spBySeller.seller_id,
          referralCode: spBySeller.referral_code,
        });
      }
    }

    return NextResponse.json({ found: false });
  } catch (error) {
    console.error('[Resolve Ref] Server error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to resolve referral code' },
      { status: 500 }
    );
  }
}

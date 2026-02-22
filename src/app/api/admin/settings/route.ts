import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { data: settings, error } = await supabase
      .from('admin_settings')
      .select('*')
      .single();

    if (error || !settings) {
      // Return defaults if not found
      return NextResponse.json(
        {
          id: null,
          platform_markup_percentage: 25,
          seller_commission_percentage: 10,
          platform_commission_percentage: 15,
          min_withdrawal_amount: 500,
          commission_cooling_period_days: 15,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(settings, { status: 200 });
  } catch (error) {
    console.error('Get admin settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      platformMarkupPercentage,
      sellerCommissionPercentage,
      platformCommissionPercentage,
      minWithdrawalAmount,
      commissionCoolingPeriodDays,
    } = body;

    // Get the first (should be only) settings record
    const { data: existingSettings } = await supabase
      .from('admin_settings')
      .select('id')
      .limit(1)
      .single();

    if (!existingSettings) {
      // Insert if doesn't exist
      const { data: settings, error } = await supabase
        .from('admin_settings')
        .insert([
          {
            platform_markup_percentage: platformMarkupPercentage || 25,
            seller_commission_percentage: sellerCommissionPercentage || 10,
            platform_commission_percentage: platformCommissionPercentage || 15,
            min_withdrawal_amount: minWithdrawalAmount || 500,
            commission_cooling_period_days: commissionCoolingPeriodDays || 15,
          },
        ])
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { error: 'Failed to create settings' },
          { status: 500 }
        );
      }

      return NextResponse.json(settings, { status: 201 });
    }

    // Update existing
    const { data: settings, error } = await supabase
      .from('admin_settings')
      .update({
        platform_markup_percentage: platformMarkupPercentage,
        seller_commission_percentage: sellerCommissionPercentage,
        platform_commission_percentage: platformCommissionPercentage,
        min_withdrawal_amount: minWithdrawalAmount,
        commission_cooling_period_days: commissionCoolingPeriodDays,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingSettings.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update settings' },
        { status: 500 }
      );
    }

    return NextResponse.json(settings, { status: 200 });
  } catch (error) {
    console.error('Update admin settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

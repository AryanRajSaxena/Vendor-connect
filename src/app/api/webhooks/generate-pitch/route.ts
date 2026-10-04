import { NextRequest, NextResponse } from 'next/server';
import { generateSalesKitForProduct } from '@/lib/sales-kit-generator';

// Prevent timeout on Netlify/Vercel for long-running LLM generation
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    // 1. Parse incoming webhook payload
    const body = await req.json().catch(() => ({}));
    const record = body?.record || body;
    const productId = record?.id;

    if (!productId) {
      return NextResponse.json(
        { error: 'Bad Request: Missing product id in payload' },
        { status: 400 }
      );
    }

    // 2. Generate sales kit using the unified engine
    const salesKit = await generateSalesKitForProduct(productId);

    // 3. Return success
    return NextResponse.json({
      success: true,
      productId,
      sales_kit: salesKit,
    });
  } catch (error) {
    console.error('Unhandled error in generate-pitch webhook:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate pitch',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

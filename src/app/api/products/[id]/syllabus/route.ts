import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateSyllabusPdfBytes } from '@/lib/syllabus-pdf';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Supabase configuration is missing on the server' },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // 1. Fetch product record
    const { data: product, error: prodError } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (prodError || !product) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    const specifications = (product.specifications || {}) as Record<string, any>;
    const highlights = typeof specifications.highlights === 'string'
      ? specifications.highlights.split('|||').filter(Boolean)
      : [];

    const sanitizedName = (product.name || 'Course')
      .replace(/[^a-zA-Z0-9_\-\s]/g, '')
      .trim()
      .replace(/\s+/g, '_');
    const filename = `${sanitizedName}_Syllabus.pdf`;

    // 2. Generate PDF strictly on-the-fly in memory (no storage / no persistence)
    const generatedBytes = await generateSyllabusPdfBytes({
      name: product.name,
      category: product.category,
      description: product.description,
      courseDuration: product.course_duration,
      basePrice: product.base_price,
      highlights,
      prerequisites: Array.isArray(product.prerequisites) ? product.prerequisites : [],
      learningOutcomes: Array.isArray(product.learning_outcomes) ? product.learning_outcomes : [],
      curriculum: Array.isArray(product.curriculum) ? product.curriculum : [],
    });

    // 3. Stream the generated PDF directly to the client
    return new NextResponse(Buffer.from(generatedBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('[API] On-the-fly syllabus generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error while generating syllabus PDF' },
      { status: 500 }
    );
  }
}

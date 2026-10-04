import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
      .select('id, name, pdf_path, specifications')
      .eq('id', id)
      .single();

    if (prodError || !product) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    const specifications = (product.specifications || {}) as Record<string, any>;
    const pdfPath = product.pdf_path || specifications?.pdf_path || specifications?.syllabus_url;

    if (!pdfPath) {
      return NextResponse.json(
        { error: 'No syllabus PDF uploaded for this course yet.' },
        { status: 404 }
      );
    }

    const sanitizedName = (product.name || 'Course')
      .replace(/[^a-zA-Z0-9_\-\s]/g, '')
      .trim()
      .replace(/\s+/g, '_');
    const filename = `${sanitizedName}_Syllabus.pdf`;

    // 2. If it is an external URL, redirect or stream
    if (pdfPath.startsWith('http://') || pdfPath.startsWith('https://')) {
      return NextResponse.redirect(pdfPath);
    }

    // 3. Otherwise download from Supabase Storage 'syllabuses' bucket
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from('syllabuses')
      .download(pdfPath);

    if (downloadError || !fileData) {
      console.error('[API] Storage download error:', downloadError);
      return NextResponse.json(
        { error: 'Failed to download syllabus from storage', details: downloadError?.message },
        { status: 502 }
      );
    }

    const arrayBuffer = await fileData.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('[API] Syllabus download error:', error);
    return NextResponse.json(
      { error: 'Internal server error while downloading syllabus' },
      { status: 500 }
    );
  }
}

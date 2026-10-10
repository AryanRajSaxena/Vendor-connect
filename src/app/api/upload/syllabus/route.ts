import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No syllabus PDF file provided' }, { status: 400 });
    }

    const filename = file.name || 'syllabus.pdf';
    const isPdf =
      file.type === 'application/pdf' ||
      filename.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      return NextResponse.json(
        { error: 'Invalid file format. Only PDF files are supported.' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Supabase server configuration is missing' },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Generate safe unique filename
    const cleanBaseName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${Date.now()}_${cleanBaseName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabaseAdmin.storage
      .from('syllabuses')
      .upload(storagePath, buffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.error('[API Syllabus Upload] Supabase storage upload error:', uploadError);
      return NextResponse.json(
        { error: uploadError.message || 'Failed to upload PDF to storage' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      pdfPath: storagePath,
      fileName: filename,
      fileSize: buffer.length,
    });
  } catch (error) {
    console.error('[API Syllabus Upload] Server error:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Internal server error uploading syllabus' },
      { status: 500 }
    );
  }
}


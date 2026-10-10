import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { generateSyllabusPdfBytes } from '@/lib/syllabus-pdf';
import { PDFDocument } from 'pdf-lib';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = params ? await Promise.resolve(params) : null;
    const id = resolvedParams?.id?.trim();

    if (!id || id === 'undefined' || id === 'null') {
      return NextResponse.json(
        { error: 'Invalid or missing course identifier' },
        { status: 400 }
      );
    }

    // Prepare trusted Supabase client (service role to bypass RLS when reading products/seller_products)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const dbClient = (supabaseUrl && serviceRoleKey)
      ? createClient(supabaseUrl, serviceRoleKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        })
      : supabase;

    // 1. Fetch product record by id
    let { data: product, error: prodErr } = await dbClient
      .from('products')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (prodErr) {
      console.warn('[API Syllabus] Query by products.id warning:', prodErr);
    }

    // 2. If not found in products, check if id is a seller_products record id
    if (!product) {
      const { data: sellerProd, error: spErr } = await dbClient
        .from('seller_products')
        .select('product_id')
        .eq('id', id)
        .maybeSingle();

      if (spErr) {
        console.warn('[API Syllabus] Query by seller_products.id warning:', spErr);
      }

      if (sellerProd?.product_id) {
        const { data: linkedProd } = await dbClient
          .from('products')
          .select('*')
          .eq('id', sellerProd.product_id)
          .maybeSingle();
        product = linkedProd;
      }
    }

    // 3. If still not found, check if id matches a seller_products product_id
    if (!product) {
      const { data: spByProd } = await dbClient
        .from('seller_products')
        .select('product_id')
        .eq('product_id', id)
        .maybeSingle();

      if (spByProd?.product_id) {
        const { data: linkedProd } = await dbClient
          .from('products')
          .select('*')
          .eq('id', spByProd.product_id)
          .maybeSingle();
        product = linkedProd;
      }
    }

    if (!product) {
      return NextResponse.json(
        { error: 'Course not found', requestedId: id },
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
      .replace(/\s+/g, '_') || 'Course';
    const filename = `${sanitizedName}_Syllabus.pdf`;

    // 1. Generate comprehensive course overview & curriculum breakdown PDF
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

    let finalBytes: Uint8Array = generatedBytes;

    // 2. If vendor uploaded an original PDF syllabus document, merge it right into the PDF!
    const pdfPath = product.pdf_path || specifications.pdf_path || specifications.syllabus_url;
    if (pdfPath && typeof pdfPath === 'string') {
      try {
        let vendorBuffer: ArrayBuffer | null = null;
        if (pdfPath.startsWith('http://') || pdfPath.startsWith('https://')) {
          const extRes = await fetch(pdfPath);
          if (extRes.ok) {
            vendorBuffer = await extRes.arrayBuffer();
          }
        } else {
          const { data: fileData, error: dlErr } = await dbClient.storage
            .from('syllabuses')
            .download(pdfPath);
          if (!dlErr && fileData) {
            vendorBuffer = await fileData.arrayBuffer();
          }
        }

        if (vendorBuffer) {
          const mainDoc = await PDFDocument.load(generatedBytes);
          const vendorDoc = await PDFDocument.load(vendorBuffer, { ignoreEncryption: true });
          const pages = await mainDoc.copyPages(vendorDoc, vendorDoc.getPageIndices());
          pages.forEach((p) => mainDoc.addPage(p));
          finalBytes = await mainDoc.save();
        }
      } catch (mergeErr) {
        console.warn('[API Syllabus] Failed to merge vendor uploaded PDF, serving generated overview:', mergeErr);
      }
    }

    // Stream the unified PDF directly to the client as an attachment using standard Web API Response
    return new Response(finalBytes as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(finalBytes.byteLength),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('[API] On-the-fly syllabus generation error:', error);
    return NextResponse.json(
      {
        error: (error as Error).message || 'Failed to generate syllabus PDF',
        details: (error as Error).stack || String(error),
      },
      { status: 500 }
    );
  }
}

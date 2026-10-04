import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createOpenAI } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { PDFParse } from 'pdf-parse';

// Prevent timeout on Netlify/Vercel for long-running LLM generation
export const maxDuration = 60;

// Setup OpenRouter provider with OpenAI compatibility
const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Zod schema enforcing the strict JSON structure for the Sales Kit
const SalesKitSchema = z.object({
  target_audience: z
    .string()
    .describe('2 short sentences on exactly who the seller should target for this specific course.'),
  where_to_find: z
    .string()
    .describe(
      'Specific platforms or groups to find these buyers (e.g., college placement WhatsApp groups, LinkedIn).'
    ),
  whatsapp_scripts: z
    .array(
      z.object({
        title: z.string(),
        body: z
          .string()
          .describe(
            "The script text. ALWAYS include the exact string '[SELLER_REFERRAL_LINK]' where the link should go."
          ),
      })
    )
    .length(3)
    .describe('Provide exactly 3 scripts: A casual intro, a detailed value pitch, and a guarantee/urgency closer.'),
  objections: z
    .array(
      z.object({
        question: z.string(),
        answer: z.string(),
      })
    )
    .length(3)
    .describe(
      'Provide exactly 3 common objections a buyer might have about this specific course, and the counter-arguments.'
    ),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Verify required environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const openrouterKey = process.env.OPENROUTER_API_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Supabase admin configuration missing (NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)');
      return NextResponse.json(
        { error: 'Server configuration error: Supabase admin credentials not set' },
        { status: 500 }
      );
    }

    if (!openrouterKey) {
      console.error('OPENROUTER_API_KEY is not configured');
      return NextResponse.json(
        { error: 'Server configuration error: OPENROUTER_API_KEY is missing' },
        { status: 500 }
      );
    }

    // 2. Parse incoming webhook payload
    const body = await req.json();
    const record = body?.record || body;

    const productId = record?.id;
    const pdfPath = record?.pdf_path;

    if (!productId) {
      return NextResponse.json(
        { error: 'Bad Request: Missing product id in webhook payload' },
        { status: 400 }
      );
    }

    if (!pdfPath) {
      return NextResponse.json(
        { error: 'Bad Request: Missing pdf_path in product record' },
        { status: 400 }
      );
    }

    // 3. Initialize Supabase Admin client with service role key (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // 4. Download syllabus PDF from Supabase Storage
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from('syllabuses')
      .download(pdfPath);

    if (downloadError || !fileData) {
      console.error('Failed to download PDF from storage:', downloadError);
      return NextResponse.json(
        {
          error: 'Failed to download syllabus PDF from storage',
          details: downloadError?.message,
        },
        { status: 502 }
      );
    }

    // 5. Extract text from PDF buffer
    const arrayBuffer = await fileData.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);
    const parser = new PDFParse({ data: pdfBuffer });
    const parsedPdf = await parser.getText();
    const syllabusText = parsedPdf.text?.trim() || '';
    await parser.destroy();

    if (!syllabusText) {
      console.warn('PDF parsed but returned empty text content');
    }

    // 6. Call Nvidia Nemotron model via OpenRouter using Vercel AI SDK generateObject
    const prompt = `You are a world-class marketing strategist and copywriter creating a complete Sales Kit for sellers/affiliates to promote this digital course.

Course Details:
- Name: ${record.name || record.product_name || 'Online Course'}
- Category: ${record.category || 'Education'}
- Description: ${record.description || 'Not provided'}
- Base Price: ${record.base_price ?? 'N/A'}

Syllabus Content Extracted from Uploaded PDF:
"""
${syllabusText ? syllabusText.slice(0, 25000) : 'Syllabus text unavailable; use course title, category, and description.'}
"""

Generate the sales kit strictly according to the schema:
1. target_audience: 2 concise sentences describing who should buy this course.
2. where_to_find: Concrete communities, platforms, and groups where sellers can reach these prospective students.
3. whatsapp_scripts: Exactly 3 scripts (Casual Intro, Value Pitch, Urgency/Guaranty Closer). Every script must contain the exact placeholder '[SELLER_REFERRAL_LINK]'.
4. objections: Exactly 3 practical objection Q&A pairs buyers will ask before purchasing.`;

    const { object: salesKit } = await generateObject({
      model: openrouter('nvidia/llama-3.1-nemotron-70b-instruct'),
      schema: SalesKitSchema,
      prompt,
    });

    // 7. Update products table with generated sales_kit JSON
    const { error: updateError } = await supabaseAdmin
      .from('products')
      .update({
        sales_kit: salesKit,
        updated_at: new Date().toISOString(),
      })
      .eq('id', productId);

    if (updateError) {
      console.error('Failed to update product sales_kit:', updateError);
      return NextResponse.json(
        {
          error: 'Failed to save sales_kit to database',
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    // 8. Return success response
    return NextResponse.json({
      success: true,
      productId,
      sales_kit: salesKit,
    });
  } catch (error) {
    console.error('Unhandled error in generate-pitch webhook:', error);
    return NextResponse.json(
      {
        error: 'Internal server error while generating sales kit',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

import { createClient } from '@supabase/supabase-js';
import { createOpenAI } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

export const SalesKitSchema = z.object({
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

export type SalesKitData = z.infer<typeof SalesKitSchema>;

export async function generateSalesKitForProduct(productId: string): Promise<SalesKitData | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase configuration missing');
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1. Fetch product
  const { data: product, error: fetchError } = await supabaseAdmin
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();

  if (fetchError || !product) {
    throw new Error(`Product not found: ${productId}`);
  }

  const specifications = (product.specifications || {}) as Record<string, any>;
  const pdfPath = product.pdf_path || specifications?.pdf_path || specifications?.syllabus_url;
  let syllabusText = '';

  // 2. If a vendor uploaded a PDF file, extract text from it
  if (pdfPath && !pdfPath.startsWith('http')) {
    try {
      const { data: fileData, error: dlErr } = await supabaseAdmin.storage
        .from('syllabuses')
        .download(pdfPath);

      if (!dlErr && fileData) {
        try {
          const arrayBuffer = await fileData.arrayBuffer();
          const pdfParseModule = await import('pdf-parse');
          const PDFParser = (pdfParseModule as any).PDFParse;
          if (PDFParser) {
            const parser = new PDFParser({ data: Buffer.from(arrayBuffer) });
            const parsed = await parser.getText();
            syllabusText = parsed.text?.trim() || '';
            if (typeof parser.destroy === 'function') await parser.destroy();
          } else {
            const parseFn = (pdfParseModule as any).default || pdfParseModule;
            if (typeof parseFn === 'function') {
              const parsed = await parseFn(Buffer.from(arrayBuffer));
              syllabusText = parsed.text?.trim() || '';
            }
          }
        } catch (pdfErr) {
          console.warn('[SalesKit] PDF text extraction error:', pdfErr);
        }
      }
    } catch (parseErr) {
      console.warn('[SalesKit] PDF text extraction error:', parseErr);
    }
  }

  // 3. If no uploaded PDF, build comprehensive syllabus text directly from course data (no PDF saved)
  if (!syllabusText) {
    const modulesSummary = Array.isArray(product.curriculum)
      ? product.curriculum.map((m: any, i: number) => `Module ${i + 1}: ${m.title || ''} (${m.lessons || 0} lessons${m.duration ? `, ${m.duration}` : ''})`).join('\n')
      : '';
    const outcomesSummary = Array.isArray(product.learning_outcomes) && product.learning_outcomes.length > 0
      ? `\nLearning Outcomes:\n${product.learning_outcomes.map((o: string) => `• ${o}`).join('\n')}`
      : '';
    const prereqSummary = Array.isArray(product.prerequisites) && product.prerequisites.length > 0
      ? `\nPrerequisites:\n${product.prerequisites.map((p: string) => `• ${p}`).join('\n')}`
      : '';

    syllabusText = `
Course Name: ${product.name}
Category: ${product.category}
Description: ${product.description || ''}
Duration: ${product.course_duration || 'Self-paced'}
Price: ₹${product.base_price || 0}
Highlights: ${specifications?.highlights || ''}
${outcomesSummary}
${prereqSummary}

Curriculum Modules:
${modulesSummary || 'Comprehensive curriculum with practical lessons and assignments.'}
    `.trim();
  }

  const openrouterKey = process.env.OPENROUTER_API_KEY;

  let salesKit: SalesKitData;

  function buildFallback(p: any): SalesKitData {
    const cName = p.name || 'this course';
    const cat = p.category || 'tech skills';
    return {
      target_audience: `Professionals, freelancers, and students eager to master ${cName} and upgrade their practical career skills. Target individuals seeking high-ROI skills that produce immediate income or job advancement.`,
      where_to_find: `LinkedIn job boards, WhatsApp batch groups for graduates and interns, Telegram career channels, and tech/marketing Discord servers.`,
      whatsapp_scripts: [
        {
          title: 'Script 1: The Cold Intro',
          body: `Hey [Name]! Saw you were looking to master ${cName}. This practical cohort breaks down step-by-step frameworks with hands-on exercises. Check out the verified syllabus here: [SELLER_REFERRAL_LINK]`,
        },
        {
          title: 'Script 2: The High-ROI Value Pitch',
          body: `Hey [Name]! If you want an industry-tested roadmap for ${cat} without spending months on random videos, I highly recommend ${cName}. You can inspect the module breakdown and outcomes here: [SELLER_REFERRAL_LINK]`,
        },
        {
          title: 'Script 3: Limited Seats / Urgency Closer',
          body: `Quick heads up! Seats for ${cName} are filling up fast for this batch. If you want lifetime access and structured materials before pricing updates, grab your spot here: [SELLER_REFERRAL_LINK]`,
        },
      ],
      objections: [
        {
          question: 'Is this course suitable for beginners or only experienced professionals?',
          answer: `It is built to take learners from foundational concepts all the way to advanced execution, complete with structured module milestones.`,
        },
        {
          question: 'Do I get lifetime access to all learning materials?',
          answer: `Yes, buyers receive immediate lifetime access to all lesson modules, future updates, and resource downloads.`,
        },
        {
          question: 'How quickly can I apply these skills to make money or land jobs?',
          answer: `The curriculum is heavily project-driven, meaning you build portfolio assets and campaign assets during the modules to showcase directly to employers and clients.`,
        },
      ],
    };
  }

  // 4. Generate via LLM if OPENROUTER_API_KEY is available
  if (openrouterKey && openrouterKey.trim().length > 5) {
    try {
      const openrouter = createOpenAI({
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey: openrouterKey.trim(),
      });

      const prompt = `You are a high-performing digital marketing and affiliate sales copywriter.
Generate a high-converting Sales Kit for sellers and affiliates to pitch this course.

Course Details:
- Title: ${product.name}
- Category: ${product.category}
- Price: ₹${product.base_price}
- Duration: ${product.course_duration || 'Self-paced'}

Syllabus Content:
"""
${syllabusText.slice(0, 25000)}
"""

Generate the sales kit strictly according to the schema:
1. target_audience: 2 concise sentences describing who needs this exact course.
2. where_to_find: Specific communities, forums, WhatsApp/Telegram groups, and LinkedIn platforms to find these buyers.
3. whatsapp_scripts: Exactly 3 scripts (Casual Intro, Value Pitch, Urgency Closer). Every script must contain '[SELLER_REFERRAL_LINK]'.
4. objections: Exactly 3 common buyer objections and the convincing answers.`;

      const { object } = await generateObject({
        model: openrouter('nvidia/llama-3.1-nemotron-70b-instruct'),
        schema: SalesKitSchema,
        prompt,
      });

      salesKit = object;
    } catch (llmErr) {
      console.warn('[SalesKit] Nemotron generation failed, falling back to smart template:', llmErr);
      salesKit = buildFallback(product);
    }
  } else {
    // Contextual fallback when API key is not yet set
    salesKit = buildFallback(product);
  }

  // 5. Update database record with sales_kit JSON only
  await supabaseAdmin
    .from('products')
    .update({
      sales_kit: salesKit,
      updated_at: new Date().toISOString(),
    })
    .eq('id', productId);

  return salesKit;
}

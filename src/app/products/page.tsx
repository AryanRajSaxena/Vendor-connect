import { redirect } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

interface ProductsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const resolvedParams = await searchParams;
  const rawRef = (resolvedParams?.ref || resolvedParams?.referral || resolvedParams?.code || '') as string;
  const cleanRef = (Array.isArray(rawRef) ? rawRef[0] : rawRef || '').trim();

  if (cleanRef) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && serviceRoleKey) {
      const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      // 1. Look up by referral_code (case-insensitive) in seller_products
      const { data: spRecord } = await supabase
        .from('seller_products')
        .select('product_id, referral_code')
        .ilike('referral_code', cleanRef)
        .maybeSingle();

      if (spRecord?.product_id) {
        redirect(`/products/${spRecord.product_id}?ref=${encodeURIComponent(cleanRef)}`);
      }

      // 2. Check if cleanRef is a seller UUID
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanRef);
      if (isUuid) {
        const { data: spBySeller } = await supabase
          .from('seller_products')
          .select('product_id')
          .eq('seller_id', cleanRef)
          .order('added_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (spBySeller?.product_id) {
          redirect(`/products/${spBySeller.product_id}?ref=${encodeURIComponent(cleanRef)}`);
        }
      }
    }
  }

  // Customers should never access the raw products catalog grid with Add to Cart.
  // Redirect directly to home page or marketplace.
  redirect('/');
}

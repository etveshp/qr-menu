import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

import { mapCafeInfo, mapCategory, mapProduct } from '@/lib/supabase';

// Server-side read of the public menu data via Supabase.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function adminClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_URL.startsWith('YOUR')) return null;
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

export async function GET(): Promise<NextResponse> {
  const supabase = adminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  try {
    const [cafeRes, catsRes, prodsRes, bannerRes, adRes] = await Promise.all([
      supabase.from('cafe_info').select('*').eq('id', 1).single(),
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('products').select('*').order('sort_order'),
      supabase.from('text_banner').select('*').eq('id', 1).single(),
      supabase.from('advertising').select('*').eq('id', 1).single(),
    ]);

    const cafeInfo = cafeRes.data ? mapCafeInfo(cafeRes.data) : null;

    const categories = (catsRes.data ?? []).map(mapCategory);

    const products = (prodsRes.data ?? []).map(mapProduct);

    // Single-row settings for the photo banner and the text banner. These are
    // tiny (one row each) and ride along with the menu JSON so the client can
    // skip its own initial Supabase queries when the page is server-rendered.
    const textBanner = {
      text: bannerRes.data?.text ?? '',
      categoryId: bannerRes.data?.category_id ?? '',
      productId: bannerRes.data?.product_id ?? '',
      enabled: bannerRes.data?.enabled ?? false,
    };

    const advertising = {
      photo: adRes.data?.photo ?? '',
      photoOriginal: adRes.data?.photo_original ?? '',
      delaySeconds: adRes.data?.delay_seconds ?? 5,
      enabled: adRes.data?.enabled ?? false,
      showUntil: adRes.data?.show_until ?? '',
      categoryId: adRes.data?.category_id ?? '',
      productId: adRes.data?.product_id ?? '',
    };

    return NextResponse.json(
      { cafeInfo, categories, products, textBanner, advertising },
      {
        // Cached by the menu page's SSR fetch (ISR + on-demand revalidation),
        // so this handler itself stays uncached to keep regenerations fresh.
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  } catch (e) {
    console.error('Menu API error:', e);
    return NextResponse.json({ error: 'Failed to load menu' }, { status: 500 });
  }
}

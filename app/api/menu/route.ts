import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
    const [cafeRes, catsRes, prodsRes] = await Promise.all([
      supabase.from('cafe_info').select('*').eq('id', 1).single(),
      supabase.from('categories').select('*'),
      supabase.from('products').select('*'),
    ]);

    const cafeRow = cafeRes.data;
    const cafeInfo = cafeRow
      ? {
          ownerNameUk: cafeRow.owner_name_uk ?? '', ownerNameHu: cafeRow.owner_name_hu ?? '', ownerNameEn: cafeRow.owner_name_en ?? '',
          nameUk: cafeRow.name_uk ?? '', nameHu: cafeRow.name_hu ?? '', nameEn: cafeRow.name_en ?? '',
          descriptionUk: cafeRow.description_uk ?? '', descriptionHu: cafeRow.description_hu ?? '', descriptionEn: cafeRow.description_en ?? '',
          banner: cafeRow.banner,
          logo: cafeRow.logo,
          instagram: cafeRow.instagram,
          bannerScale: cafeRow.banner_scale,
          bannerX: cafeRow.banner_x,
          bannerY: cafeRow.banner_y,
          logoScale: cafeRow.logo_scale,
          logoX: cafeRow.logo_x,
          logoY: cafeRow.logo_y,
        }
      : null;

    const categories = (catsRes.data ?? []).map((r: any) => ({
      id: r.id, nameUk: r.name_uk, nameHu: r.name_hu, nameEn: r.name_en, photo: r.photo,
    }));

    const products = (prodsRes.data ?? []).map((r: any) => ({
      id: r.id, categoryId: r.category_id,
      nameUk: r.name_uk, nameHu: r.name_hu, nameEn: r.name_en,
      descriptionUk: r.description_uk, descriptionHu: r.description_hu, descriptionEn: r.description_en,
      ingredientsUk: r.ingredients_uk, ingredientsHu: r.ingredients_hu, ingredientsEn: r.ingredients_en,
      price: Number(r.price), photo: r.photo,
    }));

    return NextResponse.json({ cafeInfo, categories, products }, {
      headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' },
    });
  } catch (e) {
    console.error('Menu API error:', e);
    return NextResponse.json({ error: 'Failed to load menu' }, { status: 500 });
  }
}

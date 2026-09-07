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
    const [cafeRes, catsRes, prodsRes, bannerRes, adRes] = await Promise.all([
      supabase.from('cafe_info').select('*').eq('id', 1).single(),
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('products').select('*').order('sort_order'),
      supabase.from('text_banner').select('*').eq('id', 1).single(),
      supabase.from('advertising').select('*').eq('id', 1).single(),
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
          greetingCustomerUk: cafeRow.greeting_customer_uk ?? '', greetingCustomerHu: cafeRow.greeting_customer_hu ?? '', greetingCustomerEn: cafeRow.greeting_customer_en ?? '',
          greetingCustomerEnabled: cafeRow.greeting_customer_enabled ?? false,
          greetingAdminUk: cafeRow.greeting_admin_uk ?? '', greetingAdminHu: cafeRow.greeting_admin_hu ?? '', greetingAdminEn: cafeRow.greeting_admin_en ?? '',
          greetingAdminEnabled: cafeRow.greeting_admin_enabled ?? false,
          showTableNumber: cafeRow.show_table_number ?? false,
        }
      : null;

    const categories = (catsRes.data ?? []).map((r: any) => ({
      id: r.id, nameUk: r.name_uk, nameHu: r.name_hu, nameEn: r.name_en, photo: r.photo, sortOrder: r.sort_order ?? 0,
    }));

    const products = (prodsRes.data ?? []).map((r: any) => ({
      id: r.id, categoryId: r.category_id,
      nameUk: r.name_uk, nameHu: r.name_hu, nameEn: r.name_en,
      descriptionUk: r.description_uk, descriptionHu: r.description_hu, descriptionEn: r.description_en,
      ingredientsUk: r.ingredients_uk, ingredientsHu: r.ingredients_hu, ingredientsEn: r.ingredients_en,
      price: Number(r.price), photo: r.photo, badge: r.badge ?? '', sortOrder: r.sort_order ?? 0,
    }));

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

import { Suspense } from 'react';
import { headers } from 'next/headers';
import { MenuContainer, type MenuContainerProps } from '@/components/menu/MenuContainer';

// ISR: revalidate the menu page at most every 30 seconds.
export const revalidate = 30;

async function fetchMenuData(): Promise<MenuContainerProps['initialData']> {
  // Build the site URL dynamically from the incoming request so SSR self-fetch
  // works on any domain (Cloud Run, custom domain, localhost) without env config.
  const headersList = await headers();
  const host = headersList.get('x-forwarded-host') || headersList.get('host');
  const proto = headersList.get('x-forwarded-proto') || 'https';
  const baseUrl = host
    ? `${proto}://${host}`
    : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';

  try {
    const res = await fetch(`${baseUrl}/api/menu`, {
      next: { revalidate: 30, tags: ['menu'] },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      cafeInfo: data.cafeInfo ?? null,
      categories: Array.isArray(data.categories) ? data.categories : [],
      products: Array.isArray(data.products) ? data.products : [],
      textBanner: data.textBanner ?? null,
      advertising: data.advertising ?? null,
    };
  } catch (e) {
    console.error('Failed to fetch menu data for SSR:', e);
    return null;
  }
}

export default async function MenuPage() {
  const initialData = await fetchMenuData();

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF6EE] text-[#4A3B32]">
          <div className="w-12 h-12 border-2 border-[#C09E6D] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="font-display tracking-widest text-sm uppercase">Світ Кави QR Меню</p>
        </div>
      }
    >
      <MenuContainer initialData={initialData} />
    </Suspense>
  );
}

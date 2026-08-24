import { Suspense } from 'react';
import { MenuContainer, type MenuContainerProps } from '@/components/menu/MenuContainer';

// ISR: revalidate the menu page at most every 30 seconds.
export const revalidate = 30;

async function fetchMenuData(): Promise<MenuContainerProps['initialData']> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';
  try {
    const res = await fetch(`${baseUrl}/api/menu`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      cafeInfo: data.cafeInfo ?? null,
      categories: Array.isArray(data.categories) ? data.categories : [],
      products: Array.isArray(data.products) ? data.products : [],
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
          <p className="font-display tracking-widest text-sm uppercase">Aura Premium Menu</p>
        </div>
      }
    >
      <MenuContainer initialData={initialData} />
    </Suspense>
  );
}

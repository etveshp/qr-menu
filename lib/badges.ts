// Product badge catalog (single badge per dish, chosen with radio buttons in
// the admin cabinet). Colors stay inside the app palette; labels live in the
// translations dictionary (see PRODUCT_BADGE_KEYS).

export type ProductBadgeId = 'new' | 'sale' | 'no-sugar' | 'lent';

export interface ProductBadgeDef {
  id: ProductBadgeId;
  /** Tailwind classes for the chip (background + text). */
  className: string;
}

export const PRODUCT_BADGES: ProductBadgeDef[] = [
  { id: 'new', className: 'bg-[#C09E6D] text-white' },
  { id: 'sale', className: 'bg-[#3E2F26] text-[#E9C78E]' },
  { id: 'no-sugar', className: 'bg-[#8E7A68] text-white' },
  { id: 'lent', className: 'bg-[#231913] text-[#C09E6D]' },
];

export const PRODUCT_BADGE_KEYS: Record<ProductBadgeId, 'badgeNew' | 'badgeSale' | 'badgeNoSugar' | 'badgeLent'> = {
  new: 'badgeNew',
  sale: 'badgeSale',
  'no-sugar': 'badgeNoSugar',
  lent: 'badgeLent',
};

export const productBadgeById = (id: string | undefined): ProductBadgeDef | undefined =>
  PRODUCT_BADGES.find((b) => b.id === id);

import { describe, it, expect } from 'vitest';
import {
  validateCafeInfo,
  validateCategory,
  validateProduct,
  validateAdvertising,
  validateTextBanner,
} from '../validation';
import type { Advertising, CafeInfo, Category, Product, TextBanner } from '../supabase';

const baseCafe: CafeInfo = {
  ownerNameUk: '',
  ownerNameHu: '',
  ownerNameEn: '',
  nameUk: 'Світ Кави',
  nameHu: 'Svit Kavy',
  nameEn: 'Svit Kavy',
  descriptionUk: 'Затишна кав’ярня',
  descriptionHu: '',
  descriptionEn: '',
  banner: 'data:image/webp;base64,...',
  logo: 'data:image/webp;base64,...',
  instagram: 'https://instagram.com/svit.kavy',
};

const baseCategory: Category = {
  id: 'cat-1',
  nameUk: 'Еспресо бар',
  nameHu: 'Eszpresszó bár',
  nameEn: 'Espresso Bar',
  photo: 'data:image/webp;base64,...',
};

const baseProduct: Product = {
  id: 'prod-1',
  categoryId: 'cat-1',
  nameUk: 'Подвійне еспресо',
  nameHu: 'Dupla Eszpresszó',
  nameEn: 'Double Espresso',
  descriptionUk: 'Насичений смак',
  descriptionHu: 'Intenzív íz',
  descriptionEn: 'Rich taste',
  ingredientsUk: 'кава, вода',
  ingredientsHu: 'kávé, víz',
  ingredientsEn: 'coffee, water',
  price: 65,
  photo: 'data:image/webp;base64,...',
  recommendedIds: [],
};

describe('validateCafeInfo', () => {
  it('accepts a valid cafe info', () => {
    expect(validateCafeInfo(baseCafe)).toEqual({ ok: true });
  });

  it('rejects empty name', () => {
    expect(validateCafeInfo({ ...baseCafe, nameUk: '' })).toMatchObject({ ok: false });
  });

  it('rejects too long name', () => {
    expect(validateCafeInfo({ ...baseCafe, nameUk: 'x'.repeat(201) })).toMatchObject({ ok: false });
  });

  it('rejects oversized banner original', () => {
    expect(validateCafeInfo({ ...baseCafe, bannerOriginal: 'x'.repeat(1000001) })).toMatchObject({ ok: false });
  });

  it('rejects oversized logo original', () => {
    expect(validateCafeInfo({ ...baseCafe, logoOriginal: 'x'.repeat(1000001) })).toMatchObject({ ok: false });
  });

  it('accepts originals within size limit', () => {
    expect(validateCafeInfo({ ...baseCafe, bannerOriginal: 'data:image/webp;base64,...', logoOriginal: 'data:image/webp;base64,...' })).toEqual({ ok: true });
  });

  it('accepts greetings and toggles', () => {
    expect(validateCafeInfo({
      ...baseCafe,
      greetingCustomerUk: 'Ласкаво просимо! ☕', greetingCustomerEnabled: true,
      greetingAdminUk: 'Гарного дня!', greetingAdminEnabled: true,
    })).toEqual({ ok: true });
  });

  it('rejects too long customer greeting', () => {
    expect(validateCafeInfo({ ...baseCafe, greetingCustomerUk: 'x'.repeat(2001) })).toMatchObject({ ok: false });
  });

  it('rejects too long admin greeting', () => {
    expect(validateCafeInfo({ ...baseCafe, greetingAdminHu: 'x'.repeat(2001) })).toMatchObject({ ok: false });
  });
});

describe('validateCategory', () => {
  it('accepts a valid category', () => {
    expect(validateCategory(baseCategory)).toEqual({ ok: true });
  });

  it('rejects empty uk name', () => {
    expect(validateCategory({ ...baseCategory, nameUk: '' })).toMatchObject({ ok: false });
  });

  it('accepts missing photo', () => {
    expect(validateCategory({ ...baseCategory, photo: '' })).toMatchObject({ ok: true });
  });

  it('rejects oversized photo', () => {
    expect(validateCategory({ ...baseCategory, photo: 'x'.repeat(1000001) })).toMatchObject({ ok: false });
  });

  it('rejects oversized photo original', () => {
    expect(validateCategory({ ...baseCategory, photoOriginal: 'x'.repeat(1000001) })).toMatchObject({ ok: false });
  });

  it('accepts photo original', () => {
    expect(validateCategory({ ...baseCategory, photoOriginal: 'data:image/webp;base64,...' })).toEqual({ ok: true });
  });
});

describe('validateProduct', () => {
  it('accepts a valid product', () => {
    expect(validateProduct(baseProduct)).toEqual({ ok: true });
  });

  it('rejects empty name', () => {
    expect(validateProduct({ ...baseProduct, nameUk: '' })).toMatchObject({ ok: false });
  });

  it('rejects missing category', () => {
    expect(validateProduct({ ...baseProduct, categoryId: '' })).toMatchObject({ ok: false });
  });

  it('rejects negative price', () => {
    expect(validateProduct({ ...baseProduct, price: -1 })).toMatchObject({ ok: false });
  });

  it('rejects non-number price', () => {
    expect(validateProduct({ ...baseProduct, price: Number.NaN })).toMatchObject({ ok: false });
  });

  it('accepts missing photo', () => {
    expect(validateProduct({ ...baseProduct, photo: '' })).toMatchObject({ ok: true });
  });

  it('rejects oversized photo original', () => {
    expect(validateProduct({ ...baseProduct, photoOriginal: 'x'.repeat(1000001) })).toMatchObject({ ok: false });
  });

  it('accepts photo original', () => {
    expect(validateProduct({ ...baseProduct, photoOriginal: 'data:image/webp;base64,...' })).toEqual({ ok: true });
  });
});

describe('validateAdvertising', () => {
  const baseAd: Advertising = { photo: 'data:image/webp;base64,...', delaySeconds: 5, enabled: true };

  it('accepts a valid advertising config', () => {
    expect(validateAdvertising(baseAd)).toEqual({ ok: true });
  });

  it('accepts empty photo when disabled', () => {
    expect(validateAdvertising({ photo: '', delaySeconds: 5, enabled: false })).toEqual({ ok: true });
  });

  it('rejects oversized photo', () => {
    expect(validateAdvertising({ ...baseAd, photo: 'x'.repeat(1000001) })).toMatchObject({ ok: false });
  });

  it('rejects negative delay', () => {
    expect(validateAdvertising({ ...baseAd, delaySeconds: -1 })).toMatchObject({ ok: false });
  });

  it('rejects non-number delay', () => {
    expect(validateAdvertising({ ...baseAd, delaySeconds: Number.NaN })).toMatchObject({ ok: false });
  });

  it('rejects too large delay', () => {
    expect(validateAdvertising({ ...baseAd, delaySeconds: 3601 })).toMatchObject({ ok: false });
  });

  it('accepts zero delay', () => {
    expect(validateAdvertising({ ...baseAd, delaySeconds: 0 })).toEqual({ ok: true });
  });

  it('accepts a valid show until date', () => {
    expect(validateAdvertising({ ...baseAd, showUntil: '2026-12-31' })).toEqual({ ok: true });
  });

  it('accepts empty show until (no limit)', () => {
    expect(validateAdvertising({ ...baseAd, showUntil: '' })).toEqual({ ok: true });
  });

  it('rejects an invalid show until date', () => {
    expect(validateAdvertising({ ...baseAd, showUntil: '31/12/2026' })).toMatchObject({ ok: false });
  });
});

describe('validateTextBanner', () => {
  const baseBanner: TextBanner = { text: '🔥 Акція на каву', enabled: true };

  it('accepts a valid text banner', () => {
    expect(validateTextBanner(baseBanner)).toEqual({ ok: true });
  });

  it('rejects empty text', () => {
    expect(validateTextBanner({ ...baseBanner, text: '' })).toMatchObject({ ok: false });
  });

  it('rejects text over 40 chars', () => {
    expect(validateTextBanner({ ...baseBanner, text: 'x'.repeat(41) })).toMatchObject({ ok: false });
  });

  it('accepts a category and product link', () => {
    expect(validateTextBanner({ ...baseBanner, categoryId: 'cat-1', productId: 'prod-1' })).toEqual({ ok: true });
  });

  it('accepts an enabled banner without link', () => {
    expect(validateTextBanner({ text: 'hello', categoryId: '', productId: '', enabled: false })).toEqual({ ok: true });
  });
});

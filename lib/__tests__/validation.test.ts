import { describe, it, expect } from 'vitest';
import {
  validateCafeInfo,
  validateCategory,
  validateProduct,
} from '../validation';
import type { CafeInfo, Category, Product } from '../supabase';

const baseCafe: CafeInfo = {
  name: 'Світ Кави',
  description: 'Затишна кав’ярня',
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
};

describe('validateCafeInfo', () => {
  it('accepts a valid cafe info', () => {
    expect(validateCafeInfo(baseCafe)).toEqual({ ok: true });
  });

  it('rejects empty name', () => {
    expect(validateCafeInfo({ ...baseCafe, name: '' })).toMatchObject({ ok: false });
  });

  it('rejects too long name', () => {
    expect(validateCafeInfo({ ...baseCafe, name: 'x'.repeat(201) })).toMatchObject({ ok: false });
  });
});

describe('validateCategory', () => {
  it('accepts a valid category', () => {
    expect(validateCategory(baseCategory)).toEqual({ ok: true });
  });

  it('rejects empty uk name', () => {
    expect(validateCategory({ ...baseCategory, nameUk: '' })).toMatchObject({ ok: false });
  });

  it('rejects missing photo', () => {
    expect(validateCategory({ ...baseCategory, photo: '' })).toMatchObject({ ok: false });
  });

  it('rejects oversized photo', () => {
    expect(validateCategory({ ...baseCategory, photo: 'x'.repeat(1000001) })).toMatchObject({ ok: false });
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

  it('rejects missing photo', () => {
    expect(validateProduct({ ...baseProduct, photo: '' })).toMatchObject({ ok: false });
  });
});

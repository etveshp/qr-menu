import type { CafeInfo, Category, Product } from './firebase';

export type ValidationResult = { ok: true } | { ok: false; error: string };

const MAX_NAME = 200;
const MAX_DESC = 2000;
const MAX_INGREDIENTS = 2000;
const MAX_PHOTO = 1000000;

const isNonEmptyString = (v: unknown): v is string =>
  typeof v === 'string' && v.trim().length > 0;

const isBoundedString = (v: unknown, max: number): boolean =>
  typeof v === 'string' && v.length <= max;

const isOptionalString = (v: unknown, max: number): boolean =>
  v === undefined || (typeof v === 'string' && v.length <= max);

export const validateCafeInfo = (info: CafeInfo): ValidationResult => {
  if (!isNonEmptyString(info.name)) return { ok: false, error: 'Вкажіть назву кав\'ярні' };
  if (!isBoundedString(info.name, 200)) return { ok: false, error: 'Назва занадто довга' };
  if (!isBoundedString(info.description, 200)) return { ok: false, error: 'Опис занадто довгий' };
  if (!isOptionalString(info.instagram, 500)) return { ok: false, error: 'Instagram занадто довгий' };
  if (!isOptionalString(info.banner, MAX_PHOTO)) return { ok: false, error: 'Банер занадто великий' };
  if (!isOptionalString(info.logo, MAX_PHOTO)) return { ok: false, error: 'Логотип занадто великий' };
  return { ok: true };
};

export const validateCategory = (category: Category): ValidationResult => {
  if (!isNonEmptyString(category.nameUk)) return { ok: false, error: 'Вкажіть назву категорії українською' };
  if (!isBoundedString(category.nameUk, MAX_NAME)) return { ok: false, error: 'Назва категорії занадто довга' };
  if (!isBoundedString(category.nameHu, MAX_NAME)) return { ok: false, error: 'Назва категорії (HU) занадто довга' };
  if (!isBoundedString(category.nameEn, MAX_NAME)) return { ok: false, error: 'Назва категорії (EN) занадто довга' };
  if (!isNonEmptyString(category.photo)) return { ok: false, error: 'Додайте фото категорії' };
  if (!isBoundedString(category.photo, MAX_PHOTO)) return { ok: false, error: 'Фото категорії занадто велике' };
  return { ok: true };
};

export const validateProduct = (product: Product): ValidationResult => {
  if (!isNonEmptyString(product.nameUk)) return { ok: false, error: 'Вкажіть назву товару українською' };
  if (!isBoundedString(product.nameUk, MAX_NAME)) return { ok: false, error: 'Назва товару занадто довга' };
  if (!isNonEmptyString(product.categoryId)) return { ok: false, error: 'Оберіть категорію товару' };
  if (typeof product.price !== 'number' || !Number.isFinite(product.price) || product.price < 0 || product.price > 1000000) {
    return { ok: false, error: 'Ціна товару некоректна' };
  }
  if (!isBoundedString(product.nameHu, MAX_NAME)) return { ok: false, error: 'Назва товару (HU) занадто довга' };
  if (!isBoundedString(product.nameEn, MAX_NAME)) return { ok: false, error: 'Назва товару (EN) занадто довга' };
  if (!isBoundedString(product.descriptionUk, MAX_DESC)) return { ok: false, error: 'Опис (UA) занадто довгий' };
  if (!isBoundedString(product.descriptionHu, MAX_DESC)) return { ok: false, error: 'Опис (HU) занадто довгий' };
  if (!isBoundedString(product.descriptionEn, MAX_DESC)) return { ok: false, error: 'Опис (EN) занадто довгий' };
  if (!isBoundedString(product.ingredientsUk, MAX_INGREDIENTS)) return { ok: false, error: 'Інгредієнти (UA) занадто довгі' };
  if (!isBoundedString(product.ingredientsHu, MAX_INGREDIENTS)) return { ok: false, error: 'Інгредієнти (HU) занадто довгі' };
  if (!isBoundedString(product.ingredientsEn, MAX_INGREDIENTS)) return { ok: false, error: 'Інгредієнти (EN) занадто довгі' };
  if (!isNonEmptyString(product.photo)) return { ok: false, error: 'Додайте фото товару' };
  if (!isBoundedString(product.photo, MAX_PHOTO)) return { ok: false, error: 'Фото товару занадто велике' };
  return { ok: true };
};

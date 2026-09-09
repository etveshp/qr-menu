import type { Advertising, CafeInfo, Category, Product, TextBanner } from './supabase';

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
  if (!isBoundedString(info.ownerNameUk ?? '', 200)) return { ok: false, error: 'Ім\'я власника занадто довге' };
  if (!isBoundedString(info.ownerNameHu ?? '', 200)) return { ok: false, error: 'Ім\'я власника (HU) занадто довге' };
  if (!isBoundedString(info.ownerNameEn ?? '', 200)) return { ok: false, error: 'Ім\'я власника (EN) занадто довге' };
  if (!isNonEmptyString(info.nameUk)) return { ok: false, error: 'Вкажіть назву кав\'ярні українською' };
  if (!isBoundedString(info.nameUk, 200)) return { ok: false, error: 'Назва занадто довга' };
  if (!isBoundedString(info.nameHu, 200)) return { ok: false, error: 'Назва (HU) занадто довга' };
  if (!isBoundedString(info.nameEn, 200)) return { ok: false, error: 'Назва (EN) занадто довга' };
  if (!isBoundedString(info.descriptionUk, 200)) return { ok: false, error: 'Опис занадто довгий' };
  if (!isBoundedString(info.descriptionHu, 200)) return { ok: false, error: 'Опис (HU) занадто довгий' };
  if (!isBoundedString(info.descriptionEn, 200)) return { ok: false, error: 'Опис (EN) занадто довгий' };
  if (!isOptionalString(info.instagram, 500)) return { ok: false, error: 'Instagram занадто довгий' };
  if (!isOptionalString(info.banner, MAX_PHOTO)) return { ok: false, error: 'Банер занадто великий' };
  if (!isOptionalString(info.logo, MAX_PHOTO)) return { ok: false, error: 'Логотип занадто великий' };
  if (!isOptionalString(info.bannerOriginal, MAX_PHOTO)) return { ok: false, error: 'Оригінал банеру занадто великий' };
  if (!isOptionalString(info.logoOriginal, MAX_PHOTO)) return { ok: false, error: 'Оригінал логотипу занадто великий' };
  if (!isBoundedString(info.greetingCustomerUk ?? '', 2000)) return { ok: false, error: 'Привітання клієнтів (UK) занадто довге' };
  if (!isBoundedString(info.greetingCustomerHu ?? '', 2000)) return { ok: false, error: 'Привітання клієнтів (HU) занадто довге' };
  if (!isBoundedString(info.greetingCustomerEn ?? '', 2000)) return { ok: false, error: 'Привітання клієнтів (EN) занадто довге' };
  if (!isBoundedString(info.greetingAdminUk ?? '', 2000)) return { ok: false, error: 'Привітання адміна (UK) занадто довге' };
  if (!isBoundedString(info.greetingAdminHu ?? '', 2000)) return { ok: false, error: 'Привітання адміна (HU) занадто довге' };
  if (!isBoundedString(info.greetingAdminEn ?? '', 2000)) return { ok: false, error: 'Привітання адміна (EN) занадто довге' };
  if (info.defaultLang && !['uk', 'hu', 'en'].includes(info.defaultLang)) return { ok: false, error: 'Мова за замовчуванням некоректна' };
  return { ok: true };
};

export const validateCategory = (category: Category): ValidationResult => {
  if (!isNonEmptyString(category.nameUk)) return { ok: false, error: 'Вкажіть назву категорії українською' };
  if (!isBoundedString(category.nameUk, MAX_NAME)) return { ok: false, error: 'Назва категорії занадто довга' };
  if (!isBoundedString(category.nameHu, MAX_NAME)) return { ok: false, error: 'Назва категорії (HU) занадто довга' };
  if (!isBoundedString(category.nameEn, MAX_NAME)) return { ok: false, error: 'Назва категорії (EN) занадто довга' };
  if (!isOptionalString(category.photo, MAX_PHOTO)) return { ok: false, error: 'Фото категорії занадто велике' };
  if (!isOptionalString(category.photoOriginal, MAX_PHOTO)) return { ok: false, error: 'Оригінал фото категорії занадто великий' };
  return { ok: true };
};

export const validateProduct = (product: Product): ValidationResult => {
  if (!isNonEmptyString(product.nameUk)) return { ok: false, error: 'Вкажіть назву страви українською' };
  if (!isBoundedString(product.nameUk, MAX_NAME)) return { ok: false, error: 'Назва страви занадто довга' };
  if (!isNonEmptyString(product.categoryId)) return { ok: false, error: 'Оберіть категорію страви' };
  if (typeof product.price !== 'number' || !Number.isFinite(product.price) || product.price < 0 || product.price > 1000000) {
    return { ok: false, error: 'Ціна страви некоректна' };
  }
  if (!isBoundedString(product.nameHu, MAX_NAME)) return { ok: false, error: 'Назва страви (HU) занадто довга' };
  if (!isBoundedString(product.nameEn, MAX_NAME)) return { ok: false, error: 'Назва страви (EN) занадто довга' };
  if (!isBoundedString(product.descriptionUk, MAX_DESC)) return { ok: false, error: 'Опис (UA) занадто довгий' };
  if (!isBoundedString(product.descriptionHu, MAX_DESC)) return { ok: false, error: 'Опис (HU) занадто довгий' };
  if (!isBoundedString(product.descriptionEn, MAX_DESC)) return { ok: false, error: 'Опис (EN) занадто довгий' };
  if (!isBoundedString(product.ingredientsUk, MAX_INGREDIENTS)) return { ok: false, error: 'Інгредієнти (UA) занадто довгі' };
  if (!isBoundedString(product.ingredientsHu, MAX_INGREDIENTS)) return { ok: false, error: 'Інгредієнти (HU) занадто довгі' };
  if (!isBoundedString(product.ingredientsEn, MAX_INGREDIENTS)) return { ok: false, error: 'Інгредієнти (EN) занадто довгі' };
  if (!isOptionalString(product.photo, MAX_PHOTO)) return { ok: false, error: 'Фото страви занадто велике' };
  if (!isOptionalString(product.photoOriginal, MAX_PHOTO)) return { ok: false, error: 'Оригінал фото страви занадто великий' };
  return { ok: true };
};

export const validateAdvertising = (ad: Advertising): ValidationResult => {
  if (!isOptionalString(ad.photo, MAX_PHOTO)) return { ok: false, error: 'Фото реклами занадто велике' };
  if (typeof ad.delaySeconds !== 'number' || !Number.isFinite(ad.delaySeconds) || ad.delaySeconds < 0 || ad.delaySeconds > 3600) {
    return { ok: false, error: 'Затримка має бути від 0 до 3600 секунд' };
  }
  if (ad.showUntil && !/^\d{4}-\d{2}-\d{2}$/.test(ad.showUntil)) {
    return { ok: false, error: 'Дата закінчення показу некоректна' };
  }
  return { ok: true };
};

export const validateTextBanner = (banner: TextBanner): ValidationResult => {
  if (!isNonEmptyString(banner.text)) return { ok: false, error: 'Вкажіть текст банера' };
  if (!isBoundedString(banner.text, 40)) return { ok: false, error: 'Текст банера занадто довгий (максимум 40 символів)' };
  if (banner.categoryId && !isBoundedString(banner.categoryId, 100)) return { ok: false, error: 'Категорія некоректна' };
  if (banner.productId && !isBoundedString(banner.productId, 100)) return { ok: false, error: 'Страва некоректна' };
  return { ok: true };
};

import type { TRANSLATIONS } from '@/lib/translations';

export type Translator = (key: keyof typeof TRANSLATIONS['uk']) => string;

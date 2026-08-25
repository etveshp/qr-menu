import type { Language } from './translations';

const MESSAGES: Record<string, Record<Language, string>> = {
  'auth/invalid-email': {
    uk: 'Некоректна адреса електронної пошти',
    hu: 'Érvénytelen e-mail cím',
    en: 'Invalid email address',
  },
  'auth/user-disabled': {
    uk: 'Цей обліковий запис вимкнено',
    hu: 'Ez a fiók le van tiltva',
    en: 'This account has been disabled',
  },
  'auth/user-not-found': {
    uk: 'Користувача з такою адресою не знайдено',
    hu: 'Nem található felhasználó ezzel az e-mail címmel',
    en: 'No user found with this email address',
  },
  'auth/wrong-password': {
    uk: 'Неправильний пароль',
    hu: 'Hibás jelszó',
    en: 'Incorrect password',
  },
  'auth/invalid-credential': {
    uk: 'Неправильна електронна адреса або пароль',
    hu: 'Helytelen e-mail cím vagy jelszó',
    en: 'Invalid email or password',
  },
  'auth/email-already-in-use': {
    uk: 'Ця електронна адреса вже використовується',
    hu: 'Ez az e-mail cím már használatban van',
    en: 'This email is already in use',
  },
  'auth/weak-password': {
    uk: 'Пароль занадто слабкий (мінімум 6 символів)',
    hu: 'A jelszó túl gyenge (minimum 6 karakter)',
    en: 'Password is too weak (minimum 6 characters)',
  },
  'auth/popup-closed-by-user': {
    uk: 'Вхід через Google було скасовано',
    hu: 'A Google bejelentkezés meg lett szakítva',
    en: 'Google sign-in was cancelled',
  },
  'auth/cancelled-popup-request': {
    uk: 'Запит входу скасовано',
    hu: 'A bejelentkezési kérelem megszakítva',
    en: 'Sign-in request was cancelled',
  },
  'auth/too-many-requests': {
    uk: 'Забагато невдалих спроб. Спробуйте пізніше',
    hu: 'Túl sok próbálkozás. Próbálja újra később',
    en: 'Too many attempts. Please try again later',
  },
  'auth/network-request-failed': {
    uk: 'Помилка мережі. Перевірте з\'єднання',
    hu: 'Hálózati hiba. Ellenőrizze a kapcsolatot',
    en: 'Network error. Please check your connection',
  },
  'permission-denied': {
    uk: 'Недостатньо прав для виконання операції',
    hu: 'Nincs jogosultság a művelet végrehajtásához',
    en: 'Insufficient permissions to perform this operation',
  },
  'unavailable': {
    uk: 'Служба тимчасово недоступна. Спробуйте пізніше',
    hu: 'A szolgáltatás átmenetileg nem elérhető. Próbálja újra később',
    en: 'Service temporarily unavailable. Please try again later',
  },
};

const FALLBACK: Record<Language, string> = {
  uk: 'Сталася помилка при вході',
  hu: 'Hiba történt a bejelentkezéskor',
  en: 'An error occurred during authentication',
};

export const getFriendlyErrorMessage = (error: unknown, lang: Language = 'uk'): string => {
  if (!error) return FALLBACK[lang];
  const err = error as { code?: string; message?: string };
  const code = err.code || '';
  const localized = MESSAGES[code];
  if (localized) return localized[lang];
  return err?.message || FALLBACK[lang];
};

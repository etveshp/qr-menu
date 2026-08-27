import type { Language } from './translations';

const MESSAGES: Record<string, Record<Language, string>> = {
  // Firebase error codes (legacy, harmless to keep)
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
  'auth/network-request-failed': {
    uk: 'Помилка мережі. Перевірте з\'єднання',
    hu: 'Hálózati hiba. Ellenőrizze a kapcsolatot',
    en: 'Network error. Please check your connection',
  },

  // Supabase auth error codes
  'invalid_credentials': {
    uk: 'Неправильна електронна адреса або пароль',
    hu: 'Helytelen e-mail cím vagy jelszó',
    en: 'Invalid email or password',
  },
  'email_not_confirmed': {
    uk: 'Email не підтверджено. Перевірте пошту',
    hu: 'Az e-mail nincs megerősítve. Ellenőrizze a postaládáját',
    en: 'Email not confirmed. Please check your inbox',
  },
  'email_exists': {
    uk: 'Ця електронна адреса вже використовується',
    hu: 'Ez az e-mail cím már használatban van',
    en: 'This email is already in use',
  },
  'user_already_exists': {
    uk: 'Користувач з таким email вже існує',
    hu: 'Már létezik felhasználó ezzel az e-mail címmel',
    en: 'A user with this email already exists',
  },
  'weak_password': {
    uk: 'Пароль занадто слабкий (мінімум 6 символів)',
    hu: 'A jelszó túl gyenge (minimum 6 karakter)',
    en: 'Password is too weak (minimum 6 characters)',
  },
  'over_email_send_rate_limit': {
    uk: 'Забагато запитів. Спробуйте пізніше',
    hu: 'Túl sok próbálkozás. Próbálja újra később',
    en: 'Too many requests. Please try again later',
  },
  'signup_disabled': {
    uk: 'Реєстрація вимкнена адміністратором',
    hu: 'A regisztráció le van tiltva',
    en: 'Sign-up is disabled by the administrator',
  },
  'session_not_found': {
    uk: 'Сесію не знайдено. Увійдіть знову',
    hu: 'A munkamenet nem található. Jelentkezzen be újra',
    en: 'Session not found. Please sign in again',
  },
  'user_not_found': {
    uk: 'Користувача не знайдено',
    hu: 'Felhasználó nem található',
    en: 'User not found',
  },
  'refresh_token_not_found': {
    uk: 'Токен оновлення не знайдено. Увійдіть знову',
    hu: 'Frissítő token nem található. Jelentkezzen be újra',
    en: 'Refresh token not found. Please sign in again',
  },

  // Shared codes
  'auth/invalid-credential': {
    uk: 'Неправильна електронна адреса або пароль',
    hu: 'Helytelen e-mail cím vagy jelszó',
    en: 'Invalid email or password',
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
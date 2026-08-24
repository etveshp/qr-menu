import { describe, it, expect } from 'vitest';
import { getFriendlyErrorMessage } from '../errors';

describe('getFriendlyErrorMessage', () => {
  it('returns fallback for null', () => {
    expect(getFriendlyErrorMessage(null)).toBe('Сталася помилка при вході');
  });

  it('maps auth/invalid-credential', () => {
    expect(getFriendlyErrorMessage({ code: 'auth/invalid-credential' }, 'uk')).toBe('Неправильна електронна адреса або пароль');
  });

  it('maps auth/invalid-credential in hu', () => {
    expect(getFriendlyErrorMessage({ code: 'auth/invalid-credential' }, 'hu')).toBe('Helytelen e-mail cím vagy jelszó');
  });

  it('maps auth/invalid-credential in en', () => {
    expect(getFriendlyErrorMessage({ code: 'auth/invalid-credential' }, 'en')).toBe('Invalid email or password');
  });

  it('maps auth/popup-closed-by-user', () => {
    expect(getFriendlyErrorMessage({ code: 'auth/popup-closed-by-user' }, 'uk')).toBe('Вхід через Google було скасовано');
  });

  it('maps auth/too-many-requests', () => {
    expect(getFriendlyErrorMessage({ code: 'auth/too-many-requests' }, 'en')).toBe('Too many attempts. Please try again later');
  });

  it('falls back to error message for unknown code', () => {
    expect(getFriendlyErrorMessage({ code: 'unknown', message: 'Something went wrong' }, 'en')).toBe('Something went wrong');
  });

  it('falls back to default message for unknown code without message', () => {
    expect(getFriendlyErrorMessage({ code: 'unknown' }, 'en')).toBe('An error occurred during authentication');
  });
});
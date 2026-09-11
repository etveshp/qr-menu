import { describe, it, expect } from 'vitest';
import { getFriendlyErrorMessage } from '../errors';

describe('getFriendlyErrorMessage', () => {
  it('returns fallback for null', () => {
    expect(getFriendlyErrorMessage(null)).toBe('Сталася помилка при вході');
  });

  it('maps invalid_credentials', () => {
    expect(getFriendlyErrorMessage({ code: 'invalid_credentials' }, 'uk')).toBe('Неправильна електронна адреса або пароль');
  });

  it('maps invalid_credentials in hu', () => {
    expect(getFriendlyErrorMessage({ code: 'invalid_credentials' }, 'hu')).toBe('Helytelen e-mail cím vagy jelszó');
  });

  it('maps invalid_credentials in en', () => {
    expect(getFriendlyErrorMessage({ code: 'invalid_credentials' }, 'en')).toBe('Invalid email or password');
  });

  it('maps email_not_confirmed', () => {
    expect(getFriendlyErrorMessage({ code: 'email_not_confirmed' }, 'uk')).toBe('Email не підтверджено. Перевірте пошту');
  });

  it('maps over_email_send_rate_limit', () => {
    expect(getFriendlyErrorMessage({ code: 'over_email_send_rate_limit' }, 'en')).toBe('Too many requests. Please try again later');
  });

  it('falls back to error message for unknown code', () => {
    expect(getFriendlyErrorMessage({ code: 'unknown', message: 'Something went wrong' }, 'en')).toBe('Something went wrong');
  });

  it('falls back to default message for unknown code without message', () => {
    expect(getFriendlyErrorMessage({ code: 'unknown' }, 'en')).toBe('An error occurred during authentication');
  });
});

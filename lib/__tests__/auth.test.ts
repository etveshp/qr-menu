import { describe, it, expect } from 'vitest';
import { isUserAdmin, hasAdminAccess } from '../supabase';
import type { User } from '@supabase/supabase-js';

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'uid-1',
    email: 'svitkavyvisk@gmail.com',
    ...overrides,
  } as unknown as User;
}

describe('isUserAdmin', () => {
  it('returns true for admin email', () => {
    expect(isUserAdmin(makeUser())).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(isUserAdmin(makeUser({ email: 'SVITKAVYVISK@GMAIL.COM' }))).toBe(true);
  });

  it('returns false for non-admin email', () => {
    expect(isUserAdmin(makeUser({ email: 'guest@mail.com' }))).toBe(false);
  });

  it('returns false for null user', () => {
    expect(isUserAdmin(null)).toBe(false);
  });

  it('returns false for user without email', () => {
    expect(isUserAdmin(makeUser({ email: undefined }))).toBe(false);
  });
});

describe('hasAdminAccess', () => {
  it('returns true for admin email', async () => {
    expect(await hasAdminAccess(makeUser())).toBe(true);
  });

  it('returns true for admin email case-insensitive', async () => {
    expect(await hasAdminAccess(makeUser({ email: 'SVITKAVYVISK@GMAIL.COM' }))).toBe(true);
  });

  it('returns false for non-admin (no Supabase configured)', async () => {
    const user = makeUser({ email: 'guest@mail.com' });
    expect(await hasAdminAccess(user)).toBe(false);
  });

  it('returns false for null user', async () => {
    expect(await hasAdminAccess(null)).toBe(false);
  });
});
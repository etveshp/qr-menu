import { describe, it, expect } from 'vitest';
import { isUserAdmin, hasAdminAccess } from '../firebase';
import type { User } from 'firebase/auth';

function makeUser(overrides: Partial<User> = {}): User {
  return {
    uid: 'uid-1',
    email: 'etvesh.p@gmail.com',
    emailVerified: true,
    getIdTokenResult: async () => ({ claims: {} }) as any,
    ...overrides,
  } as unknown as User;
}

describe('isUserAdmin', () => {
  it('returns true for admin email', () => {
    expect(isUserAdmin(makeUser())).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(isUserAdmin(makeUser({ email: 'ETVESH.P@GMAIL.COM' }))).toBe(true);
  });

  it('returns false for non-admin email', () => {
    expect(isUserAdmin(makeUser({ email: 'guest@mail.com' }))).toBe(false);
  });

  it('returns false for null user', () => {
    expect(isUserAdmin(null)).toBe(false);
  });

  it('returns false for user without email', () => {
    expect(isUserAdmin(makeUser({ email: null }))).toBe(false);
  });
});

describe('hasAdminAccess', () => {
  it('returns true for admin email without claims', async () => {
    expect(await hasAdminAccess(makeUser())).toBe(true);
  });

  it('returns true for admin claim', async () => {
    const user = makeUser({
      email: 'some-other@mail.com',
      getIdTokenResult: async () => ({ claims: { admin: true } }) as any,
    });
    expect(await hasAdminAccess(user)).toBe(true);
  });

  it('returns false for non-admin without claim', async () => {
    const user = makeUser({
      email: 'guest@mail.com',
      getIdTokenResult: async () => ({ claims: {} }) as any,
    });
    expect(await hasAdminAccess(user)).toBe(false);
  });

  it('returns false for null user', async () => {
    expect(await hasAdminAccess(null)).toBe(false);
  });
});
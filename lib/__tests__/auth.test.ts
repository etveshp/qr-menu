import { describe, it, expect } from 'vitest';
import { hasAdminAccess } from '../supabase';
import type { User } from '@supabase/supabase-js';

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'uid-1',
    email: 'guest@mail.com',
    ...overrides,
  } as unknown as User;
}

describe('hasAdminAccess', () => {
  it('returns false for null user', async () => {
    expect(await hasAdminAccess(null)).toBe(false);
  });

  it('returns false when Supabase is not configured', async () => {
    expect(await hasAdminAccess(makeUser())).toBe(false);
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, cleanup } from '@testing-library/react';
import { useAuth } from '../use-auth';

const mocks = vi.hoisted(() => ({
  subscribeToAuth: vi.fn(),
  hasAdminAccess: vi.fn(),
  logoutUser: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  subscribeToAuth: mocks.subscribeToAuth,
  hasAdminAccess: mocks.hasAdminAccess,
  logoutUser: mocks.logoutUser,
}));

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  vi.clearAllMocks();
});

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe('useAuth', () => {
  it('starts not-admin on first render (hydration-safe)', () => {
    localStorage.setItem('aura_admin_auth', 'true');
    mocks.subscribeToAuth.mockReturnValue(vi.fn());
    const { result } = renderHook(() => useAuth());
    // First (hydration) render must match SSR: no admin yet.
    expect(result.current.isAdmin).toBe(false);
  });

  it('subscribes to auth on mount', async () => {
    mocks.subscribeToAuth.mockImplementation((cb: (u: unknown) => void) => {
      cb(null);
      return vi.fn();
    });
    const { result } = renderHook(() => useAuth());
    expect(mocks.subscribeToAuth).toHaveBeenCalled();
    expect(result.current.currentUser).toBeNull();
  });

  it('sets admin when user has access', async () => {
    const user = { uid: 'u1', email: 'admin@x.com' };
    mocks.subscribeToAuth.mockImplementation((cb: (u: unknown) => void) => {
      cb(user);
      return vi.fn();
    });
    mocks.hasAdminAccess.mockResolvedValue(true);

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.currentUser).toEqual(user));
    await waitFor(() => expect(result.current.isAdmin).toBe(true));
    expect(localStorage.getItem('aura_admin_auth')).toBe('true');
  });

  it('does not grant admin for non-admin user, signs them out and notifies', async () => {
    const user = { uid: 'u2', email: 'guest@x.com' };
    mocks.subscribeToAuth.mockImplementation((cb: (u: unknown) => void) => {
      cb(user);
      return vi.fn();
    });
    mocks.hasAdminAccess.mockResolvedValue(false);
    const onNonAdmin = vi.fn();

    const { result } = renderHook(() => useAuth(onNonAdmin));
    await waitFor(() => expect(result.current.currentUser).toEqual(user));
    await waitFor(() => expect(result.current.isAdmin).toBe(false));
    expect(mocks.logoutUser).toHaveBeenCalled();
    expect(onNonAdmin).toHaveBeenCalled();
  });

  it('unsubscribes on unmount', () => {
    const unsubscribe = vi.fn();
    mocks.subscribeToAuth.mockReturnValue(unsubscribe);
    const { unmount } = renderHook(() => useAuth());
    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });
});
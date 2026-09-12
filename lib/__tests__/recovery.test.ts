import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const authMock = {
  getSession: vi.fn(),
  verifyOtp: vi.fn(),
  exchangeCodeForSession: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  onAuthStateChange: vi.fn(),
  signOut: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key');
  window.history.replaceState({}, '', '/admin');
  authMock.getSession.mockResolvedValue({ data: { session: null }, error: null });
  authMock.verifyOtp.mockResolvedValue({ error: null });
  authMock.exchangeCodeForSession.mockResolvedValue({ error: null });
  authMock.resetPasswordForEmail.mockResolvedValue({ error: null });
  vi.doMock('@supabase/supabase-js', () => ({
    createClient: () => ({ auth: authMock }),
  }));
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.doUnmock('@supabase/supabase-js');
  vi.resetModules();
});

describe('handleRecoveryToken', () => {
  it('verifies a token_hash recovery link and cleans the URL', async () => {
    window.history.replaceState({}, '', '/admin?token_hash=abc&type=recovery');
    const { handleRecoveryToken } = await import('../supabase');

    expect(await handleRecoveryToken()).toBe(true);
    expect(authMock.verifyOtp).toHaveBeenCalledWith({ type: 'recovery', token_hash: 'abc' });
    expect(window.location.search).toBe('');
  });

  it('detects a marker-based recovery when the session is already established', async () => {
    window.history.replaceState({}, '', '/admin?flow=recovery');
    authMock.getSession.mockResolvedValue({
      data: { session: { user: { id: 'u1' } } },
      error: null,
    });
    const { handleRecoveryToken } = await import('../supabase');

    expect(await handleRecoveryToken()).toBe(true);
    expect(authMock.exchangeCodeForSession).not.toHaveBeenCalled();
  });

  it('exchanges a pending PKCE code on a recovery redirect', async () => {
    window.history.replaceState({}, '', '/admin?flow=recovery&code=XYZ');
    const { handleRecoveryToken } = await import('../supabase');

    expect(await handleRecoveryToken()).toBe(true);
    expect(authMock.exchangeCodeForSession).toHaveBeenCalledWith('XYZ');
  });

  it('detects recovery from the implicit-flow hash type', async () => {
    window.history.replaceState({}, '', '/admin#access_token=abc&type=recovery');
    const { handleRecoveryToken } = await import('../supabase');

    expect(await handleRecoveryToken()).toBe(true);
    expect(authMock.verifyOtp).not.toHaveBeenCalled();
    expect(authMock.exchangeCodeForSession).not.toHaveBeenCalled();
  });

  it('ignores a non-recovery URL', async () => {
    window.history.replaceState({}, '', '/admin?foo=bar');
    const { handleRecoveryToken } = await import('../supabase');

    expect(await handleRecoveryToken()).toBe(false);
    expect(authMock.verifyOtp).not.toHaveBeenCalled();
    expect(authMock.exchangeCodeForSession).not.toHaveBeenCalled();
  });

  it('returns false when token verification fails', async () => {
    window.history.replaceState({}, '', '/admin?token_hash=bad&type=recovery');
    authMock.verifyOtp.mockResolvedValue({ error: { message: 'expired' } });
    const { handleRecoveryToken } = await import('../supabase');

    expect(await handleRecoveryToken()).toBe(false);
  });
});

describe('resetUserPassword', () => {
  it('adds the recovery marker to the redirect URL', async () => {
    const { resetUserPassword } = await import('../supabase');

    await resetUserPassword('admin@example.com');
    expect(authMock.resetPasswordForEmail).toHaveBeenCalledWith('admin@example.com', {
      redirectTo: expect.stringContaining('flow=recovery'),
    });
  });
});

describe('subscribeToAuth', () => {
  it('forwards the auth event to the callback', async () => {
    const unsubscribe = vi.fn();
    authMock.onAuthStateChange.mockImplementation((cb: (event: string, session: unknown) => void) => {
      cb('PASSWORD_RECOVERY', { user: { id: 'u1' } });
      return { data: { subscription: { unsubscribe } } };
    });
    const callback = vi.fn();
    const { subscribeToAuth } = await import('../supabase');

    const off = subscribeToAuth(callback as never);
    expect(callback).toHaveBeenCalledWith({ id: 'u1' }, 'PASSWORD_RECOVERY');
    off();
    expect(unsubscribe).toHaveBeenCalled();
  });
});

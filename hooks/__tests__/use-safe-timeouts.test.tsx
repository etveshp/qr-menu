import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { useSafeTimeouts } from '../use-safe-timeouts';

describe('useSafeTimeouts', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it('runs the handler after the delay', () => {
    const spy = vi.fn();
    const { result } = renderHook(() => useSafeTimeouts());

    act(() => {
      result.current(spy, 300);
    });
    expect(spy).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('clears pending timers on unmount', () => {
    const spy = vi.fn();
    const { result, unmount } = renderHook(() => useSafeTimeouts());

    act(() => {
      result.current(spy, 300);
      result.current(spy, 1400);
    });

    unmount();

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(spy).not.toHaveBeenCalled();
  });

  it('does not run a handler again after it has fired', () => {
    const spy = vi.fn();
    const { result } = renderHook(() => useSafeTimeouts());

    act(() => {
      result.current(spy, 100);
    });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { useRafThrottle } from '../use-raf-throttle';

describe('useRafThrottle', () => {
  let frames: Array<() => void>;

  beforeEach(() => {
    frames = [];
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      frames.push(() => cb(0));
      return frames.length;
    });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('coalesces rapid calls into a single frame callback', () => {
    const spy = vi.fn();
    const { result } = renderHook(() => useRafThrottle(spy));

    act(() => {
      result.current();
      result.current();
      result.current();
    });

    expect(spy).not.toHaveBeenCalled();
    expect(frames).toHaveLength(1);

    act(() => {
      frames[0]();
    });
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('schedules a new frame after the previous one has run', () => {
    const spy = vi.fn();
    const { result } = renderHook(() => useRafThrottle(spy));

    act(() => { result.current(); });
    act(() => { frames[0](); });
    act(() => { result.current(); });

    expect(frames).toHaveLength(2);
    act(() => { frames[1](); });
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('always invokes the latest callback', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { result, rerender } = renderHook(({ cb }) => useRafThrottle(cb), {
      initialProps: { cb: first },
    });

    act(() => { result.current(); });
    rerender({ cb: second });
    act(() => { frames[0](); });

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('cancels a pending frame on unmount', () => {
    const spy = vi.fn();
    const { result, unmount } = renderHook(() => useRafThrottle(spy));

    act(() => { result.current(); });
    unmount();

    expect(cancelAnimationFrame).toHaveBeenCalled();
  });
});

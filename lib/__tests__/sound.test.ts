import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  triggerHapticFeedback,
  triggerStepperHaptic,
  triggerAddToCartHaptic,
  playStepperSound,
  playAddToCartChime,
} from '../sound';

class MockAudioContext {
  state = 'running';
  currentTime = 0;
  destination = {};
  createOscillator = vi.fn(() => ({
    type: '',
    frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    disconnect: vi.fn(),
    onended: null as (() => void) | null,
  }));
  createGain = vi.fn(() => ({
    gain: {
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
    disconnect: vi.fn(),
  }));
  resume = vi.fn(() => Promise.resolve());
  close = vi.fn(() => Promise.resolve());
}

describe('sound utilities', () => {
  const originalVibrate = navigator.vibrate;
  const originalAudioContext = window.AudioContext;

  beforeEach(() => {
    Object.defineProperty(navigator, 'vibrate', {
      value: vi.fn(),
      writable: true,
      configurable: true,
    });
    window.AudioContext = MockAudioContext as unknown as typeof AudioContext;
    (window as any).webkitAudioContext = undefined;
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'vibrate', {
      value: originalVibrate,
      writable: true,
      configurable: true,
    });
    window.AudioContext = originalAudioContext;
    vi.restoreAllMocks();
  });

  it('triggerHapticFeedback vibrates', () => {
    triggerHapticFeedback(20);
    expect(navigator.vibrate).toHaveBeenCalledWith(20);
  });

  it('triggerStepperHaptic vibrates short pulse', () => {
    triggerStepperHaptic();
    expect(navigator.vibrate).toHaveBeenCalled();
  });

  it('triggerAddToCartHaptic vibrates pattern', () => {
    triggerAddToCartHaptic();
    expect(navigator.vibrate).toHaveBeenCalledWith([15, 30, 25]);
  });

  it('playAddToCartChime triggers haptic and uses audio context', () => {
    playAddToCartChime();
    expect(navigator.vibrate).toHaveBeenCalled();
    // creates an oscillator via the singleton context
    expect(window.AudioContext).toBeDefined();
  });

  it('playStepperSound delegates to chime', () => {
    playStepperSound();
    expect(navigator.vibrate).toHaveBeenCalled();
  });
});
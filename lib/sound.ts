// Sound effects & Haptic Feedback using Web Audio API and Navigator Vibrate API

// Helper for Haptic Feedback (vibration)
export function triggerHapticFeedback(pattern: number | number[] = 12) {
  if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignore vibration errors on unsupported or restricted user agents
    }
  }
}

// Crisp, subtle tactile tick for Stepper (+ / -) buttons
export function triggerStepperHaptic() {
  triggerHapticFeedback(12);
}

// Rich double pulse tactile feedback for Add to Cart button
export function triggerAddToCartHaptic() {
  triggerHapticFeedback([15, 30, 25]);
}

// Singleton AudioContext to avoid exceeding browser context limits
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioContext || audioContext.state === 'closed') {
    audioContext = new AudioContextClass();
  }
  return audioContext;
}

// Helper to play a crisp chime tone for stepper clicks / taps (same as add to cart)
export function playStepperSound() {
  playAddToCartChime();
}

// Helper to reliably play a short chime using Web Audio API on adding to cart
export function playAddToCartChime() {
  triggerAddToCartHaptic();

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const triggerAudio = () => {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      // Швидка гармонійна зміна частоти
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.06); // A5

      // Обвідна гучності
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.13);

      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch {}
      };
    };

    if (ctx.state === 'suspended') {
      ctx.resume().then(triggerAudio).catch(triggerAudio);
    } else {
      triggerAudio();
    }
  } catch (err) {
    console.error('Audio play error:', err);
  }
}

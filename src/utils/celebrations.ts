import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';

// Celebration messages for variable rewards
const CELEBRATION_MESSAGES = [
  "You're on fire!",
  "Crushing it!",
  "Unstoppable!",
  "Task master!",
  "Keep it up!",
  "Nailed it!",
  "Fantastic!",
  "Brilliant!",
];

// Audio context for sound generation
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  return audioContext;
}

// Generate a pleasant completion sound using Web Audio API
function playCompletionSound(isBigCelebration: boolean) {
  const ctx = getAudioContext();
  if (!ctx) return;

  // Resume context if suspended (required for some browsers)
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const now = ctx.currentTime;

  if (isBigCelebration) {
    // Big celebration: ascending arpeggio with harmonics
    const frequencies = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);

      gain.gain.setValueAtTime(0, now + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.15, now + i * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.35);
    });
  } else {
    // Small celebration: single pleasant "pop" sound
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now); // A5
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.05); // Slide up

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  }
}

// Haptic feedback for mobile
function triggerHaptic(isBigCelebration: boolean) {
  if ('vibrate' in navigator) {
    if (isBigCelebration) {
      navigator.vibrate([50, 30, 50]); // Double buzz for big celebration
    } else {
      navigator.vibrate(50);
    }
  }
}

// Trigger confetti from element position
function triggerConfetti(element: HTMLElement | null, isBigCelebration: boolean) {
  let x = 0.5;
  let y = 0.5;

  if (element) {
    const rect = element.getBoundingClientRect();
    x = (rect.left + rect.width / 2) / window.innerWidth;
    y = (rect.top + rect.height / 2) / window.innerHeight;
  }

  if (isBigCelebration) {
    // Big celebration - more confetti, wider spread, multiple bursts
    confetti({
      particleCount: 100,
      spread: 120,
      origin: { x, y },
      colors: ['#22c55e', '#4ade80', '#86efac', '#fbbf24', '#f472b6', '#a78bfa'],
      startVelocity: 35,
      gravity: 0.8,
      scalar: 1,
      ticks: 200,
    });

    // Second burst
    setTimeout(() => {
      confetti({
        particleCount: 50,
        spread: 80,
        origin: { x, y: y - 0.1 },
        colors: ['#22c55e', '#4ade80', '#86efac'],
        startVelocity: 25,
        gravity: 1,
        scalar: 0.8,
        ticks: 120,
      });
    }, 150);

    // Third burst for extra flair
    setTimeout(() => {
      confetti({
        particleCount: 30,
        spread: 60,
        origin: { x: x - 0.1, y },
        colors: ['#fbbf24', '#f472b6'],
        startVelocity: 20,
        gravity: 1.2,
        scalar: 0.6,
        ticks: 80,
      });
      confetti({
        particleCount: 30,
        spread: 60,
        origin: { x: x + 0.1, y },
        colors: ['#a78bfa', '#22c55e'],
        startVelocity: 20,
        gravity: 1.2,
        scalar: 0.6,
        ticks: 80,
      });
    }, 300);
  } else {
    // Small celebration - subtle confetti
    confetti({
      particleCount: 30,
      spread: 55,
      origin: { x, y },
      colors: ['#22c55e', '#4ade80', '#86efac'],
      startVelocity: 20,
      gravity: 0.9,
      scalar: 0.65,
      ticks: 90,
    });
  }
}

// Show celebration toast
function showCelebrationToast() {
  const message = CELEBRATION_MESSAGES[Math.floor(Math.random() * CELEBRATION_MESSAGES.length)];
  toast.success(message, {
    icon: '🎉',
    duration: 2500,
    style: {
      background: 'var(--bg-card)',
      color: 'var(--text-primary)',
      border: '1px solid var(--status-success)',
    },
  });
}

export interface CelebrationOptions {
  element?: HTMLElement | null;
  forceBigCelebration?: boolean;
}

/**
 * Trigger a completion celebration with confetti, sound, and haptics.
 * Has a 15% chance of triggering a big celebration (unless forced).
 */
export function celebrate(options: CelebrationOptions = {}) {
  const { element = null, forceBigCelebration = false } = options;

  // Variable reward: 15% chance of big celebration
  const isBigCelebration = forceBigCelebration || Math.random() < 0.15;

  // Trigger all celebration effects
  triggerHaptic(isBigCelebration);
  playCompletionSound(isBigCelebration);
  triggerConfetti(element, isBigCelebration);

  // Big celebration gets a toast message
  if (isBigCelebration) {
    showCelebrationToast();
  }

  return isBigCelebration;
}

/**
 * Trigger a big celebration (for special moments like completing all tasks)
 */
export function celebrateBig(element?: HTMLElement | null) {
  celebrate({ element, forceBigCelebration: true });
}

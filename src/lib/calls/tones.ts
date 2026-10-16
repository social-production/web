/**
 * Ring and ringback sounds made with Web Audio, so no audio files ship.
 * Browsers may block sound until the page has been tapped; then the tone is
 * silent and only the screen (and vibration, where supported) signals the call.
 */
export type CallTone = { stop(): void };

type Pattern = {
  frequencies: number[];
  bursts: Array<[number, number]>;
  periodMs: number;
  gain: number;
};

const PATTERNS: Record<'ring' | 'ringback', Pattern> = {
  // Two short bursts, like a phone ringing.
  ring: {
    frequencies: [660, 880],
    bursts: [
      [0, 400],
      [600, 1000],
    ],
    periodMs: 3000,
    gain: 0.12,
  },
  // One long, quiet tone while the other phone rings.
  ringback: { frequencies: [440, 480], bursts: [[0, 2000]], periodMs: 4000, gain: 0.05 },
};

export function startCallTone(kind: 'ring' | 'ringback'): CallTone {
  if (typeof window === 'undefined') {
    return { stop() {} };
  }
  const pattern = PATTERNS[kind];
  const AudioCtor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  let context: AudioContext | null = null;
  try {
    context = AudioCtor ? new AudioCtor() : null;
    void context?.resume().catch(() => {});
  } catch {
    context = null;
  }

  const playOnce = () => {
    if (kind === 'ring') {
      navigator.vibrate?.([400, 200, 400]);
    }
    if (!context || context.state === 'closed') return;
    const start = context.currentTime;
    for (const [fromMs, toMs] of pattern.bursts) {
      const gain = context.createGain();
      gain.gain.setValueAtTime(0, start + fromMs / 1000);
      gain.gain.linearRampToValueAtTime(pattern.gain, start + fromMs / 1000 + 0.02);
      gain.gain.setValueAtTime(pattern.gain, start + toMs / 1000 - 0.02);
      gain.gain.linearRampToValueAtTime(0, start + toMs / 1000);
      gain.connect(context.destination);
      for (const frequency of pattern.frequencies) {
        const oscillator = context.createOscillator();
        oscillator.frequency.value = frequency;
        oscillator.connect(gain);
        oscillator.start(start + fromMs / 1000);
        oscillator.stop(start + toMs / 1000);
      }
    }
  };

  playOnce();
  const interval = window.setInterval(playOnce, pattern.periodMs);

  return {
    stop() {
      window.clearInterval(interval);
      navigator.vibrate?.(0);
      void context?.close().catch(() => {});
      context = null;
    },
  };
}

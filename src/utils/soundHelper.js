// Audio notification utility for Somphea Reak Studio Admin Panel
// Plays a luxury cash-register / bell chime using the Web Audio API (0 dependencies)

export function playOrderAlertSound() {
  try {
    if (typeof window === 'undefined') return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    // Pleasant 4-note ascending luxury cash-register / boutique chime (C5 -> E5 -> G5 -> C6)
    const notes = [
      { freq: 523.25, start: 0.00, dur: 0.35, gain: 0.28 },
      { freq: 659.25, start: 0.10, dur: 0.40, gain: 0.30 },
      { freq: 783.99, start: 0.20, dur: 0.45, gain: 0.32 },
      { freq: 1046.50, start: 0.32, dur: 0.75, gain: 0.35 },
    ];

    notes.forEach(({ freq, start, dur, gain: noteGain }) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'triangle'; // Smooth, warm chime tone
      osc.frequency.setValueAtTime(freq, now + start);

      gainNode.gain.setValueAtTime(0.001, now + start);
      gainNode.gain.exponentialRampToValueAtTime(noteGain, now + start + 0.03);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + start + dur);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now + start);
      osc.stop(now + start + dur);
    });

    // Auto-close audio context after sound completes to save resources
    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 1500);
  } catch (err) {
    console.warn('Could not play order chime:', err);
  }
}

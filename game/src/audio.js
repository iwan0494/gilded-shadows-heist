// GILDED SHADOWS — sound, synthesized with WebAudio only. No audio files:
// footsteps are soft ticks, pickups chime, the alarm is a low pulse, and
// getting caught is a short dissonant sting. Mute silences everything.

export function makeAudio() {
  return { ctx: null, muted: false, alarmOn: false, alarmTimer: null };
}

function ensure(a) {
  if (!a.ctx) {
    try {
      a.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      return null;
    }
  }
  if (a.ctx.state === 'suspended') a.ctx.resume();
  return a.ctx;
}

function tone(a, freq, dur, type, vol, when = 0) {
  if (a.muted) return;
  const ctx = ensure(a);
  if (!ctx) return;
  const t0 = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(vol, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export function sfxStep(a, sneaking) {
  tone(a, sneaking ? 160 : 110, 0.06, 'triangle', sneaking ? 0.02 : 0.05);
}

export function sfxPickup(a) {
  tone(a, 660, 0.12, 'sine', 0.12);
  tone(a, 990, 0.18, 'sine', 0.1, 0.08);
}

export function sfxPebble(a) {
  tone(a, 420, 0.07, 'square', 0.05);
  tone(a, 220, 0.1, 'square', 0.05, 0.12);
}

export function sfxSmoke(a) {
  tone(a, 300, 0.4, 'sine', 0.06);
}

export function sfxCaught(a) {
  tone(a, 220, 0.3, 'sawtooth', 0.14);
  tone(a, 233, 0.3, 'sawtooth', 0.14, 0.02);
  tone(a, 110, 0.6, 'sawtooth', 0.12, 0.25);
}

export function sfxWin(a) {
  [523, 659, 784, 1047].forEach((f, i) => tone(a, f, 0.25, 'sine', 0.1, i * 0.12));
}

export function sfxDoor(a) {
  tone(a, 180, 0.25, 'triangle', 0.08);
  tone(a, 360, 0.2, 'triangle', 0.06, 0.1);
}

// A slow alarm pulse while the meter is high; call once per frame.
export function alarmPulse(a, level) {
  if (a.muted || level < 45) return;
  const ctx = ensure(a);
  if (!ctx) return;
  const now = performance.now();
  if (!a._lastPulse || now - a._lastPulse > (level > 80 ? 450 : 900)) {
    a._lastPulse = now;
    tone(a, level > 80 ? 880 : 620, 0.12, 'square', 0.045);
  }
}

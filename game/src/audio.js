// GILDED SHADOWS — audio. One job: WebAudio synth only, no files.
// Everything is guarded: headless Chromium has no speakers, and the game
// must never crash for want of an AudioContext.
let ctx = null;
let muted = false;

export function initAudio() {
  try {
    if (!ctx && typeof window !== 'undefined' && window.AudioContext) {
      ctx = new window.AudioContext();
    }
  } catch { ctx = null; }
  return ctx;
}

export function setMuted(m) { muted = m; }
export function isMuted() { return muted; }

export function blip(freq, dur = 0.12, type = 'sine', vol = 0.08) {
  if (muted || !ctx) return;
  try {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + dur);
  } catch { /* silence is fine */ }
}

export function pickup() {
  blip(660, 0.1);
  setTimeout(() => blip(880, 0.12), 90);
  setTimeout(() => blip(1320, 0.16), 180);
}

export function alarmSwell() {
  if (muted || !ctx) return;
  try {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(220, ctx.currentTime);
    o.frequency.linearRampToValueAtTime(440, ctx.currentTime + 0.6);
    g.gain.setValueAtTime(0.05, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.7);
  } catch { /* silence is fine */ }
}

// audio.js — WebAudio synth only, no files. All sounds are guarded: the game
// plays fine with no audio context at all.
let ac = null;
let muted = false;

export function initAudio() {
  try {
    if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
    if (ac.state === 'suspended') ac.resume();
  } catch (e) { /* no audio — the game still plays */ }
}

export function toggleMute() { muted = !muted; return muted; }
export function isMuted() { return muted; }

function tone(freq, dur, type = 'sine', gain = 0.05, when = 0) {
  if (muted || !ac) return;
  try {
    const t0 = ac.currentTime + when;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(ac.destination);
    o.start(t0);
    o.stop(t0 + dur);
  } catch (e) { /* ignore */ }
}

export const sfx = {
  pickup() { tone(660, 0.12, 'sine', 0.06); tone(990, 0.18, 'sine', 0.05, 0.09); },
  alert() { tone(220, 0.25, 'square', 0.05); tone(180, 0.3, 'square', 0.05, 0.18); },
  laser() { tone(1400, 0.15, 'sawtooth', 0.04); },
  caught() { tone(160, 0.5, 'sawtooth', 0.06); tone(110, 0.7, 'sawtooth', 0.06, 0.2); },
  win() { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.25, 'sine', 0.06, i * 0.12)); },
  pebble() { tone(300, 0.08, 'triangle', 0.05); },
  smoke() { tone(180, 0.3, 'sine', 0.04); },
};

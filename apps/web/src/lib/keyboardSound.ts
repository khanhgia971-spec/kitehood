/**
 * Deep mechanical switch sound (tactile/thock)
 * Low body thock + short noise transient — not game/beep style.
 */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = false; // default OFF — tiet kiem CPU
let volume = 2.4; // ~240%

function ensureCtx() {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = volume;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

export function setKeyboardSoundEnabled(v: boolean) {
  enabled = v;
  try {
    localStorage.setItem('mhc-kb-sound', v ? '1' : '0');
  } catch {
    /* */
  }
}

export function isKeyboardSoundEnabled() {
  try {
    const s = localStorage.getItem('mhc-kb-sound');
    if (s === '1') return true;
    if (s === '0') return false;
  } catch {
    /* */
  }
  return false; // default off
}

export function setKeyboardVolume(pct: number) {
  volume = Math.min(3.2, Math.max(0.4, pct / 100));
  if (master) master.gain.value = volume;
  try {
    localStorage.setItem('mhc-kb-vol', String(Math.round(volume * 100)));
  } catch {
    /* */
  }
}

export function getKeyboardVolume() {
  try {
    const s = localStorage.getItem('mhc-kb-vol');
    if (s) return parseInt(s, 10) || 240;
  } catch {
    /* */
  }
  return Math.round(volume * 100);
}

/** Deep switch thock */
export function playKeySound(key?: string) {
  if (!isKeyboardSoundEnabled()) return;
  const ac = ensureCtx();
  if (!ac || !master) return;

  const now = ac.currentTime + 0.001;
  const isSpecial = key === 'Enter' || key === ' ' || key === 'Backspace';
  const isMod = key === 'Shift' || key === 'Control' || key === 'Meta' || key === 'Alt';

  // 1) Soft noise transient (switch housing)
  const dur = isSpecial ? 0.055 : isMod ? 0.04 : 0.032;
  const bufLen = Math.max(1, Math.floor(ac.sampleRate * dur));
  const buffer = ac.createBuffer(1, bufLen, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufLen; i++) {
    const env = Math.exp(-i / (bufLen * (isSpecial ? 0.14 : 0.09)));
    data[i] = (Math.random() * 2 - 1) * env;
  }
  const noise = ac.createBufferSource();
  noise.buffer = buffer;
  const bp = ac.createBiquadFilter();
  bp.type = 'bandpass';
  // lower band = deeper, less "gamey"
  bp.frequency.value = isSpecial ? 900 + Math.random() * 200 : 1200 + Math.random() * 400;
  bp.Q.value = 1.2;
  const ng = ac.createGain();
  ng.gain.value = isSpecial ? 0.55 : 0.38;
  noise.connect(bp);
  bp.connect(ng);
  ng.connect(master);
  noise.start(now);
  noise.stop(now + dur);

  // 2) Deep thock body (sine + slight triangle)
  const osc = ac.createOscillator();
  const osc2 = ac.createOscillator();
  const og = ac.createGain();
  osc.type = 'sine';
  osc2.type = 'triangle';
  const base = isSpecial ? 95 + Math.random() * 15 : isMod ? 110 : 140 + Math.random() * 25;
  osc.frequency.setValueAtTime(base, now);
  osc.frequency.exponentialRampToValueAtTime(base * 0.7, now + dur * 1.4);
  osc2.frequency.value = base * 1.5;
  og.gain.setValueAtTime(isSpecial ? 0.45 : 0.28, now);
  og.gain.exponentialRampToValueAtTime(0.001, now + dur * 1.8);
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 800;
  osc.connect(og);
  osc2.connect(og);
  og.connect(lp);
  lp.connect(master);
  osc.start(now);
  osc2.start(now);
  osc.stop(now + 0.12);
  osc2.stop(now + 0.1);
}

let attached = false;

export function attachGlobalKeyboardSound() {
  if (attached || typeof window === 'undefined') return;
  attached = true;
  enabled = isKeyboardSoundEnabled();
  try {
    const s = localStorage.getItem('mhc-kb-vol');
    if (s) volume = Math.min(3.2, Math.max(0.4, parseInt(s, 10) / 100));
  } catch {
    /* */
  }

  window.addEventListener(
    'keydown',
    (e) => {
      if (e.repeat) return;
      playKeySound(e.key);
    },
    true
  );
}

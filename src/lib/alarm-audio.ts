// Pure Web Audio API Fire Siren & Haptic Vibration Synthesizer
// Zero external MP3 files required — works reliably across desktop & mobile browsers.

let audioCtx: AudioContext | null = null;
let sirenInterval: ReturnType<typeof setInterval> | null = null;
let vibrateInterval: ReturnType<typeof setInterval> | null = null;
let activeOscA: OscillatorNode | null = null;
let activeOscB: OscillatorNode | null = null;
let activeGain: GainNode | null = null;
let sirenPlaying = false;

function getOrCreateContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) {
    audioCtx = new Ctx();
  }
  return audioCtx;
}

export async function unlockAudio(withChirp = false): Promise<boolean> {
  const ctx = getOrCreateContext();
  if (!ctx) return false;

  try {
    if (ctx.state === "suspended") {
      await ctx.resume();
    }

    if (withChirp && ctx.state === "running") {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.085);
    }

    return ctx.state === "running";
  } catch {
    return false;
  }
}

export function isSirenActive(): boolean {
  return sirenPlaying;
}

export function startFireSiren(): boolean {
  if (sirenPlaying) return true;
  const ctx = getOrCreateContext();
  if (!ctx || ctx.state !== "running") {
    return false;
  }

  try {
    const now = ctx.currentTime;
    const oscA = ctx.createOscillator();
    const oscB = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    oscA.type = "triangle";
    oscB.type = "sawtooth";
    oscA.frequency.setValueAtTime(880, now);
    oscB.frequency.setValueAtTime(880, now);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(2400, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.28, now + 0.04);

    oscA.connect(filter);
    oscB.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    oscA.start(now);
    oscB.start(now);

    activeOscA = oscA;
    activeOscB = oscB;
    activeGain = gain;
    sirenPlaying = true;

    let highTone = true;
    sirenInterval = setInterval(() => {
      if (!audioCtx || !activeOscA || !activeOscB) return;
      highTone = !highTone;
      const freq = highTone ? 1320 : 880;
      const t = audioCtx.currentTime;
      activeOscA.frequency.setTargetAtTime(freq, t, 0.02);
      activeOscB.frequency.setTargetAtTime(freq, t, 0.02);
    }, 320);

    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate([400, 150, 400, 150, 600]);
      vibrateInterval = setInterval(() => {
        navigator.vibrate?.([400, 150, 400, 150, 600]);
      }, 2200);
    }

    return true;
  } catch {
    stopFireSiren();
    return false;
  }
}

export function stopFireSiren(): void {
  if (sirenInterval) {
    clearInterval(sirenInterval);
    sirenInterval = null;
  }
  if (vibrateInterval) {
    clearInterval(vibrateInterval);
    vibrateInterval = null;
  }
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    navigator.vibrate(0);
  }

  try {
    if (activeGain && audioCtx) {
      const t = audioCtx.currentTime;
      activeGain.gain.setTargetAtTime(0.0001, t, 0.02);
    }
    if (activeOscA) {
      activeOscA.stop(audioCtx ? audioCtx.currentTime + 0.06 : 0);
      activeOscA.disconnect();
    }
    if (activeOscB) {
      activeOscB.stop(audioCtx ? audioCtx.currentTime + 0.06 : 0);
      activeOscB.disconnect();
    }
  } catch {
    // Ignore stop errors if already ended
  }

  activeOscA = null;
  activeOscB = null;
  activeGain = null;
  sirenPlaying = false;
}

export async function playTestSiren(durationMs = 1800): Promise<boolean> {
  const ok = await unlockAudio(false);
  if (!ok) return false;
  stopFireSiren();
  const started = startFireSiren();
  if (started) {
    setTimeout(() => {
      stopFireSiren();
    }, durationMs);
  }
  return started;
}

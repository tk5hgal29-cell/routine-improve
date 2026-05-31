let audioCtx = null;

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

/**
 * 癒し系の短いチャイム（マイクロウィン用）
 * @param {'micro' | 'return'} type
 */
export function playSoftChime(type = 'micro') {
  try {
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume();

    const now = ctx.currentTime;
    const freq = type === 'return' ? 523.25 : 659.25;
    const duration = type === 'return' ? 0.18 : 0.1;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.92, now + duration);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.07, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.05);
  } catch {
    /* 音が鳴らなくても体験は続行 */
  }
}

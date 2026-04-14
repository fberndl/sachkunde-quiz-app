// Synthetic sound effects using Web Audio API
// No external dependencies needed

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      return null;
    }
  }
  // Resume if suspended (browser autoplay policy)
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playTone(frequency, duration, type = 'sine', volume = 0.3) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime);
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

const SoundService = {
  // Richtige Antwort - aufsteigender Doppelton
  correct() {
    const ctx = getAudioContext();
    if (!ctx) return;
    playTone(523, 0.12, 'sine', 0.25); // C5
    setTimeout(() => playTone(659, 0.18, 'sine', 0.25), 100); // E5
  },

  // Falsche Antwort - tiefer Buzz
  wrong() {
    playTone(200, 0.25, 'square', 0.15);
  },

  // Button Click - subtiler Klick
  click() {
    playTone(800, 0.05, 'sine', 0.1);
  },

  // Level geschafft / Quiz beendet - kleine Fanfare
  success() {
    const ctx = getAudioContext();
    if (!ctx) return;
    playTone(523, 0.15, 'sine', 0.2);  // C5
    setTimeout(() => playTone(659, 0.15, 'sine', 0.2), 120);  // E5
    setTimeout(() => playTone(784, 0.15, 'sine', 0.2), 240);  // G5
    setTimeout(() => playTone(1047, 0.3, 'sine', 0.25), 360); // C6
  },

  // Streak / Combo - aufsteigender Ton
  streak() {
    playTone(880, 0.15, 'triangle', 0.2);
    setTimeout(() => playTone(1100, 0.2, 'triangle', 0.2), 100);
  },

  // Timeout - absteigender Ton
  timeout() {
    playTone(440, 0.15, 'sine', 0.15);
    setTimeout(() => playTone(330, 0.25, 'sine', 0.15), 120);
  },

  // Memory Karte umdrehen
  flip() {
    playTone(600, 0.06, 'sine', 0.12);
  },

  // Memory Match gefunden
  match() {
    playTone(660, 0.1, 'sine', 0.2);
    setTimeout(() => playTone(880, 0.15, 'sine', 0.2), 80);
  },

  coinEarn() {
    const ctx = getAudioContext();
    if (!ctx) return;
    // Ascending coin chime: two quick high notes
    playTone(1200, 0.08, 'sine', 0.25);
    setTimeout(() => playTone(1500, 0.1, 'sine', 0.25), 80);
  },
};

export default SoundService;

// Audio & Text-to-Speech Utilities

// Find best matching voice for desired accent
export function getEnglishVoice(accent: 'US' | 'UK' | 'AU' = 'US'): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  const targetLang = accent === 'UK' ? 'en-GB' : accent === 'AU' ? 'en-AU' : 'en-US';

  // 1. Exact match
  const exact = voices.find(v => v.lang === targetLang || v.lang.replace('_', '-') === targetLang);
  if (exact) return exact;

  // 2. Starts with target prefix
  const prefix = voices.find(v => v.lang.startsWith(targetLang.slice(0, 2)));
  if (prefix) return prefix;

  // 3. Any English voice
  const anyEnglish = voices.find(v => v.lang.toLowerCase().includes('en'));
  return anyEnglish || voices[0] || null;
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

export function speakText(
  text: string,
  options: {
    accent?: 'US' | 'UK' | 'AU';
    rate?: number;
    pitch?: number;
    onEnd?: () => void;
  } = {}
) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (options.onEnd) options.onEnd();
    return;
  }

  stopSpeaking();

  // Strip markdown, asterisks, brackets for clean TTS
  const cleanText = text
    .replace(/[*_#`~]/g, '')
    .replace(/\[.*?\]/g, '')
    .trim();

  if (!cleanText) {
    if (options.onEnd) options.onEnd();
    return;
  }

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.rate = options.rate ?? 0.95;
  utterance.pitch = options.pitch ?? 1.0;

  const voice = getEnglishVoice(options.accent ?? 'US');
  if (voice) {
    utterance.voice = voice;
  }

  utterance.onend = () => {
    if (options.onEnd) options.onEnd();
  };

  utterance.onerror = () => {
    if (options.onEnd) options.onEnd();
  };

  window.speechSynthesis.speak(utterance);
}

// Synthesized audio feedback sounds using Web Audio API
export function playChime(type: 'success' | 'tap' | 'streak' | 'error') {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === 'tap') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } else if (type === 'success') {
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.12, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.2);
      });
    } else if (type === 'streak') {
      const now = ctx.currentTime;
      [440, 554.37, 659.25, 880].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.09);
        gain.gain.setValueAtTime(0.14, now + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 0.3);
      });
    }
  } catch {
    // Ignore audio context autoplay limitations
  }
}

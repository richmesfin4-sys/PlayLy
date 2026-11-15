export type TactilePattern = 'tap' | 'confirm' | 'error' | 'step' | 'pulse';

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!sharedAudioCtx) {
    try {
      sharedAudioCtx = new Ctor();
    } catch {
      return null;
    }
  }
  return sharedAudioCtx;
}

export function triggerTactileFeedback(
  pattern: TactilePattern,
  options: { hapticEnabled: boolean; audioEnabled: boolean; onVisualPulse?: (label: string) => void }
): void {
  const vibrationPatterns: Record<TactilePattern, number | number[]> = {
    tap: 25,
    step: [35, 30, 35],
    confirm: [50, 40, 90],
    error: [110, 60, 110, 60, 110],
    pulse: [40, 60, 40],
  };

  const labels: Record<TactilePattern, string> = {
    tap: 'Short pulse (25ms)',
    step: 'Double step pulse (35-35ms)',
    confirm: 'Confirmation cadence (50-90ms)',
    error: 'Triple alert pulse (110ms x3)',
    pulse: 'Rhythmic ping',
  };

  if (options.hapticEnabled && typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(vibrationPatterns[pattern]);
    } catch {
      // Ignore browser permission restrictions
    }
  }

  if (options.audioEnabled) {
    const ctx = getAudioContext();
    if (ctx) {
      try {
        if (ctx.state === 'suspended') {
          void ctx.resume();
        }
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const freqMap: Record<TactilePattern, number> = {
          tap: 440,
          step: 523.25,
          confirm: 659.25,
          error: 220,
          pulse: 392,
        };
        osc.type = pattern === 'error' ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freqMap[pattern], now);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
      } catch {
        // Ignore audio errors
      }
    }
  }

  if (options.onVisualPulse) {
    options.onVisualPulse(labels[pattern]);
  }
}

export type SupportedSpeechLang = 'en' | 'am' | 'ti' | 'om' | 'ar' | 'so';

export function getSpeechLocale(lang: SupportedSpeechLang): string {
  const map: Record<SupportedSpeechLang, string> = {
    en: 'en-US',
    am: 'am-ET',
    ti: 'ti-ET',
    om: 'om-ET',
    ar: 'ar-SA',
    so: 'so-SO',
  };
  return map[lang] || 'en-US';
}

export function speakText(
  text: string,
  lang: SupportedSpeechLang = 'en',
  rate = 0.96
): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return false;
  }
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const locale = getSpeechLocale(lang);
    utterance.lang = locale;
    utterance.rate = rate;
    const prefix = locale.split('-')[0].toLowerCase();
    const voices = window.speechSynthesis.getVoices();
    const matched = voices.find((v) => v.lang.toLowerCase().startsWith(prefix));
    if (matched) utterance.voice = matched;
    window.speechSynthesis.speak(utterance);
    return true;
  } catch {
    return false;
  }
}

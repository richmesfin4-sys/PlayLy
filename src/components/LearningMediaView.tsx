import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Captions,
  Hand,
  FileText,
  Maximize2,
  Minimize2,
  HelpCircle,
  Download,
  WifiOff,
  Check,
  Volume2,
  Edit3,
  ExternalLink,
  Mic,
  X,
} from 'lucide-react';
import {
  AUDIO_DESCRIPTIONS,
  LESSON_DOCUMENT_SECTIONS,
  LESSON_METADATA,
  LESSON_VTT_BY_LANG,
} from '../data/lessonMedia';
import {
  exportToBrf,
  exportToPlainText,
  exportToVtt,
  findActiveCue,
  formatDisplayTime,
  parseVtt,
  type VttCue,
} from '../utils/vttParser';
import { getSpeechLocale, speakText, type TactilePattern } from '../utils/tactileFeedback';
import { SUPPORTED_LANGUAGES, UI_TRANSLATIONS, type AppLang } from '../i18n/translations';

interface LearningMediaViewProps {
  lang: AppLang;
  onFeedback: (pattern: TactilePattern, announce?: string) => void;
}

type HostMode = 'savanna' | 'standalone' | 'webcomponent';
type SignCorner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
type CaptionTheme = 'charcoal' | 'amber' | 'cream';
type AdMode = 'off' | 'speech' | 'text';

interface PlayerPrefs {
  captionLang: 'off' | AppLang;
  captionSizeRem: number;
  captionTheme: CaptionTheme;
  captionPos: 'bottom' | 'top';
  signCorner: SignCorner;
  signScale: number;
  textOnly: boolean;
  adMode: AdMode;
  adRate: number;
}

const PREFS_KEY = 'db_player_prefs_v3';
const OFFLINE_PACK_KEY = 'db_offline_lesson_v1';

const DEFAULT_PREFS: PlayerPrefs = {
  captionLang: 'en',
  captionSizeRem: 1.15,
  captionTheme: 'charcoal',
  captionPos: 'bottom',
  signCorner: 'bottom-right',
  signScale: 1,
  textOnly: false,
  adMode: 'off',
  adRate: 0.96,
};

function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export const LearningMediaView: React.FC<LearningMediaViewProps> = ({ lang, onFeedback }) => {
  const t = UI_TRANSLATIONS[lang].media;
  const [hostMode, setHostMode] = useState<HostMode>('savanna');
  const [prefs, setPrefs] = useState<PlayerPrefs>(() => {
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : { ...DEFAULT_PREFS, captionLang: lang };
    } catch {
      return { ...DEFAULT_PREFS, captionLang: lang };
    }
  });

  const [cuesByLang, setCuesByLang] = useState<Record<AppLang, VttCue[]>>(() => ({
    en: parseVtt(LESSON_VTT_BY_LANG.en),
    am: parseVtt(LESSON_VTT_BY_LANG.am),
    ti: parseVtt(LESSON_VTT_BY_LANG.ti),
    om: parseVtt(LESSON_VTT_BY_LANG.om),
    ar: parseVtt(LESSON_VTT_BY_LANG.ar),
    so: parseVtt(LESSON_VTT_BY_LANG.so),
  }));

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(LESSON_METADATA.durationSeconds);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSign, setShowSign] = useState(true);
  const [showTranscript, setShowTranscript] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [panelTab, setPanelTab] = useState<'transcript' | 'editor' | 'offline'>('transcript');
  const [editorLang, setEditorLang] = useState<AppLang>(lang);
  const [editorStatus, setEditorStatus] = useState('');
  const [activeAdText, setActiveAdText] = useState('');
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState('');
  const [activePresetLabel, setActivePresetLabel] = useState('');
  const [offlineSaved, setOfflineSaved] = useState(() => {
    try {
      return Boolean(localStorage.getItem(OFFLINE_PACK_KEY));
    } catch {
      return false;
    }
  });
  const [signOffset, setSignOffset] = useState({ x: 0, y: 0 });
  const [draggingSign, setDraggingSign] = useState<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  const mainVideoRef = useRef<HTMLVideoElement | null>(null);
  const signVideoRef = useRef<HTMLVideoElement | null>(null);
  const playerShellRef = useRef<HTMLDivElement | null>(null);
  const helpDialogRef = useRef<HTMLDialogElement | null>(null);
  const lastSpokenAdRef = useRef<number>(-1);
  const lastCueIdRef = useRef<string | null>(null);

  // Sync caption language when top-level app language changes
  useEffect(() => {
    setPrefs((p) => (p.captionLang === 'off' ? p : { ...p, captionLang: lang }));
    setEditorLang(lang);
  }, [lang]);

  useEffect(() => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch {
      // Ignore storage quota errors
    }
  }, [prefs]);

  useEffect(() => {
    if (hostMode !== 'webcomponent') return;
    if (!document.querySelector('script[src="/module/db-player.js"]')) {
      const s = document.createElement('script');
      s.src = '/module/db-player.js';
      s.defer = true;
      document.head.appendChild(s);
    }
  }, [hostMode]);

  // Synchronize HTML5 <video> and EthSL <video>
  useEffect(() => {
    const mv = mainVideoRef.current;
    const sv = signVideoRef.current;
    if (!mv) return;
    mv.playbackRate = playbackRate;
    if (sv) sv.playbackRate = playbackRate;

    if (playing && !prefs.textOnly) {
      mv.play().catch(() => {});
      if (sv && showSign) {
        sv.currentTime = mv.currentTime;
        sv.play().catch(() => {});
      }
    } else {
      mv.pause();
      sv?.pause();
    }
  }, [playing, playbackRate, prefs.textOnly, showSign]);

  // 1s drift correction between main video and EthSL interpreter video
  useEffect(() => {
    if (!playing || prefs.textOnly || !showSign) return;
    const id = window.setInterval(() => {
      const mv = mainVideoRef.current;
      const sv = signVideoRef.current;
      if (mv && sv && Math.abs(mv.currentTime - sv.currentTime) > 0.3) {
        sv.currentTime = mv.currentTime;
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [playing, prefs.textOnly, showSign]);

  // Fallback progression timer when Text-Only mode hides video elements
  useEffect(() => {
    if (!playing || !prefs.textOnly) return;
    const interval = window.setInterval(() => {
      setCurrentTime((prev) => {
        const next = prev + 0.25 * playbackRate;
        return next >= duration ? duration : next;
      });
    }, 250);
    return () => window.clearInterval(interval);
  }, [playing, prefs.textOnly, playbackRate, duration]);

  useEffect(() => {
    if (playing && currentTime >= duration) {
      setPlaying(false);
      onFeedback('confirm', 'Lesson playback complete');
    }
  }, [playing, currentTime, duration, onFeedback]);

  const effectiveLang: AppLang = prefs.captionLang === 'off' ? lang : prefs.captionLang;
  const activeCues = cuesByLang[effectiveLang] || cuesByLang.en;
  const activeCue = findActiveCue(activeCues, currentTime);

  // Sound-cue & Audio Description synchronization
  useEffect(() => {
    if (activeCue && activeCue.id !== lastCueIdRef.current) {
      lastCueIdRef.current = activeCue.id;
      if (activeCue.isSoundCue) {
        onFeedback('pulse');
      }
    }

    const matchAd = AUDIO_DESCRIPTIONS.find(
      (ad) => Math.abs(currentTime - ad.start) < 0.45 && lastSpokenAdRef.current !== ad.start
    );
    if (matchAd && prefs.adMode !== 'off') {
      lastSpokenAdRef.current = matchAd.start;
      const text = matchAd.textByLang[effectiveLang] || matchAd.textByLang.en;
      setActiveAdText(text);
      if (prefs.adMode === 'speech' && playing) {
        speakText(text, effectiveLang, prefs.adRate);
      }
    }
  }, [activeCue, prefs.adMode, prefs.adRate, playing, currentTime, effectiveLang, onFeedback]);

  // Pointer drag support for Sign Language window
  useEffect(() => {
    if (!draggingSign) return;
    const onMove = (e: PointerEvent) => {
      setSignOffset({
        x: draggingSign.origX + (e.clientX - draggingSign.startX),
        y: draggingSign.origY + (e.clientY - draggingSign.startY),
      });
    };
    const onUp = () => setDraggingSign(null);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [draggingSign]);

  const seekTo = (targetSec: number) => {
    const clamped = Math.max(0, Math.min(duration, targetSec));
    setCurrentTime(clamped);
    if (mainVideoRef.current) mainVideoRef.current.currentTime = clamped;
    if (signVideoRef.current) signVideoRef.current.currentTime = clamped;
    onFeedback('tap', `Seeked to ${formatDisplayTime(clamped)}`);
  };

  const togglePlay = () => {
    const next = !playing;
    if (next && currentTime >= duration) {
      seekTo(0);
    }
    setPlaying(next);
    onFeedback('tap', next ? 'Playing lesson' : 'Paused lesson');
  };

  const cycleCaptions = () => {
    const order: Array<AppLang | 'off'> = ['en', 'am', 'ti', 'om', 'ar', 'so', 'off'];
    const next = order[(order.indexOf(prefs.captionLang) + 1) % order.length];
    setPrefs((p) => ({ ...p, captionLang: next }));
    onFeedback('step', `Captions set to ${next === 'off' ? 'Off' : next.toUpperCase()}`);
  };

  const applyAccessPreset = (
    preset: 'blind-deaf' | 'blind-half-deaf' | 'blind-no-hands' | 'deaf-no-hands'
  ) => {
    if (preset === 'blind-deaf') {
      setPrefs((p) => ({ ...p, captionLang: lang, adMode: 'text', textOnly: true }));
      setShowSign(false);
      setShowTranscript(true);
      setPanelTab('transcript');
      setActivePresetLabel('Blind + Deaf: Braille (.brf) & Tactile Text Mode Active');
      onFeedback('confirm', 'Applied Blind + Deaf solution: Braille and tactile text-only mode');
    } else if (preset === 'blind-half-deaf') {
      setPrefs((p) => ({
        ...p,
        captionLang: lang,
        captionSizeRem: 1.5,
        captionTheme: 'amber',
        adMode: 'speech',
        adRate: 0.82,
        textOnly: false,
      }));
      setShowSign(false);
      setShowTranscript(true);
      setPanelTab('transcript');
      setActivePresetLabel('Blind + Half Deaf: Clear 0.82x Voice + Braille Export Active');
      const title = LESSON_METADATA.lessonTitles[lang] || LESSON_METADATA.lessonTitleEn;
      speakText(title, lang, 0.82);
      onFeedback('confirm', 'Applied Blind + Half Deaf solution: Voice plus Braille');
    } else if (preset === 'blind-no-hands') {
      setPrefs((p) => ({ ...p, adMode: 'speech', adRate: 0.96, textOnly: false }));
      setShowSign(false);
      setActivePresetLabel('Blind + Unable to Use Hands: Hands-Free Voice Plus Control Active');
      const title = LESSON_METADATA.lessonTitles[lang] || LESSON_METADATA.lessonTitleEn;
      speakText(title, lang, 0.96);
      onFeedback('confirm', 'Applied Blind + No Hands solution: Voice Plus control');
    } else {
      setPrefs((p) => ({
        ...p,
        captionLang: lang,
        captionSizeRem: 1.4,
        captionTheme: 'amber',
        adMode: 'off',
        signScale: 1.3,
        textOnly: false,
      }));
      setShowSign(true);
      setActivePresetLabel('Deaf + Unable to Use Hands: Large EthSL Sign Language Window Active');
      onFeedback('confirm', 'Applied Deaf + No Hands solution: Large Sign Language window');
    }
  };

  const handleVoiceCommand = () => {
    const SpeechRec =
      (window as unknown as { SpeechRecognition?: new () => unknown; webkitSpeechRecognition?: new () => unknown })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => unknown }).webkitSpeechRecognition;

    if (!SpeechRec) {
      setVoiceFeedback('Voice recognition not available in this browser environment; keyboard shortcuts (Space, K, C, S) active.');
      speakText(LESSON_METADATA.lessonTitles[lang] || LESSON_METADATA.lessonTitleEn, lang, prefs.adRate);
      return;
    }

    try {
      const rec = new SpeechRec() as {
        lang: string;
        interimResults: boolean;
        onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
        onerror: () => void;
        onend: () => void;
        start: () => void;
      };
      rec.lang = getSpeechLocale(lang);
      rec.interimResults = false;
      setVoiceActive(true);
      rec.onresult = (e) => {
        const spoken = (e.results[0]?.[0]?.transcript || '').toLowerCase();
        setVoiceFeedback(`Heard voice command: "${spoken}"`);
        if (spoken.includes('play') || spoken.includes('start')) {
          setPlaying(true);
        } else if (spoken.includes('pause') || spoken.includes('stop')) {
          setPlaying(false);
        } else if (spoken.includes('back')) {
          seekTo(currentTime - 10);
        } else if (spoken.includes('caption')) {
          cycleCaptions();
        }
      };
      rec.onerror = () => {
        setVoiceActive(false);
        setVoiceFeedback('Microphone idle; spoken audio description & keyboard controls remain active.');
      };
      rec.onend = () => setVoiceActive(false);
      rec.start();
    } catch {
      setVoiceActive(false);
    }
  };

  const toggleFullscreen = async () => {
    if (!playerShellRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await playerShellRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      setIsFullscreen((v) => !v);
    }
  };

  const handlePlayerKeyDown = (e: React.KeyboardEvent) => {
    const tag = (e.target as HTMLElement).tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (e.key === ' ' || e.key.toLowerCase() === 'k') {
      e.preventDefault();
      togglePlay();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      seekTo(currentTime - 10);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      seekTo(currentTime + 10);
    } else if (e.key.toLowerCase() === 'c') {
      e.preventDefault();
      cycleCaptions();
    } else if (e.key.toLowerCase() === 's') {
      e.preventDefault();
      setShowSign((v) => !v);
      onFeedback('step', 'Toggled sign language window');
    } else if (e.key === '?') {
      e.preventDefault();
      helpDialogRef.current?.showModal();
    }
  };

  const handleSaveOfflinePack = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/module/sw.js').catch(() => {});
    }
    const title = LESSON_METADATA.lessonTitles[lang] || LESSON_METADATA.lessonTitleEn;
    const htmlContent = `<!doctype html>
<html lang="${lang}" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
<head><meta charset="utf-8"><title>${title}</title></head>
<body style="font-family:system-ui,sans-serif;max-width:720px;margin:2rem auto;padding:0 1rem;line-height:1.6">
<h1>${title}</h1>
<p>Offline 3G Pack (${LESSON_METADATA.offlineSizeKb} KB low-bitrate audio + transcripts)</p>
<p><audio controls src="${window.location.origin}${LESSON_METADATA.audioOnlyUrl}"></audio></p>
<h2>Transcript (${lang.toUpperCase()})</h2>
<pre style="white-space:pre-wrap">${exportToPlainText(cuesByLang[lang], title)}</pre>
<h2>Transcript (English)</h2>
<pre style="white-space:pre-wrap">${exportToPlainText(cuesByLang.en, LESSON_METADATA.lessonTitleEn)}</pre>
</body>
</html>`;
    try {
      localStorage.setItem(
        OFFLINE_PACK_KEY,
        JSON.stringify({
          lessonId: LESSON_METADATA.id,
          savedAt: new Date().toISOString(),
          sizeKb: LESSON_METADATA.offlineSizeKb,
        })
      );
    } catch {
      // Ignore
    }
    setOfflineSaved(true);
    downloadFile('savanna-offline-lesson.html', htmlContent, 'text/html;charset=utf-8');
    onFeedback('confirm', `Offline lesson pack (${LESSON_METADATA.offlineSizeKb} KB) cached and downloaded.`);
  };

  const handleSaveEditedCaptions = async () => {
    const targetCues = cuesByLang[editorLang];
    const vttString = exportToVtt(targetCues);
    try {
      const res = await fetch(`/api/v1/lessons/${LESSON_METADATA.id}/captions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lang: editorLang, vtt: vttString }),
      });
      if (res.ok) {
        setEditorStatus(`Saved ${editorLang.toUpperCase()} WebVTT cues to server.`);
        onFeedback('confirm', 'Saved edited captions.');
      } else {
        setEditorStatus('Saved locally in session.');
      }
    } catch {
      setEditorStatus('Saved locally in session.');
    }
  };

  const captionThemeClasses: Record<CaptionTheme, string> = {
    charcoal: 'bg-slate-950/92 text-white border-slate-700',
    amber: 'bg-black/95 text-amber-300 border-amber-500',
    cream: 'bg-amber-50/95 text-slate-950 border-slate-400',
  };

  const signCornerPosition: Record<SignCorner, string> = {
    'top-left': 'top-4 start-4',
    'top-right': 'top-4 end-4',
    'bottom-left': 'bottom-16 start-4',
    'bottom-right': 'bottom-16 end-4',
  };

  const editableCues = cuesByLang[editorLang];
  const progressPct = Math.round((currentTime / Math.max(1, duration)) * 100);
  const currentLessonTitle = LESSON_METADATA.lessonTitles[lang] || LESSON_METADATA.lessonTitleEn;

  return (
    <div className="space-y-8">
      {/* Header & Host Switcher */}
      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-400">
              {LESSON_METADATA.courseTitle}
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold text-slate-950 dark:text-white">
              {currentLessonTitle}
            </h1>
          </div>

          <div
            role="group"
            aria-label="Host environment preview"
            className="flex flex-wrap gap-1.5 rounded-lg bg-slate-100 p-1 dark:bg-slate-950"
          >
            {(
              [
                { id: 'savanna', label: 'Savanna Host' },
                { id: 'standalone', label: 'Blank Host' },
                { id: 'webcomponent', label: '<db-player> Tag' },
              ] as const
            ).map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setHostMode(mode.id)}
                aria-pressed={hostMode === mode.id}
                className={`min-h-[40px] rounded-md px-3 text-xs font-semibold whitespace-nowrap ${
                  hostMode === mode.id
                    ? 'bg-white text-slate-950 shadow-sm dark:bg-slate-800 dark:text-white'
                    : 'text-slate-600 hover:text-slate-950 dark:text-slate-300'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dual-Disability Quick Presets */}
        {hostMode !== 'webcomponent' && (
          <div className="space-y-2 border-t border-slate-100 pt-3 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                {t.presetsLabel}
              </span>
              {(
                [
                  { id: 'blind-deaf', label: t.presetBlindDeaf },
                  { id: 'blind-half-deaf', label: t.presetBlindHalfDeaf },
                  { id: 'blind-no-hands', label: t.presetBlindNoHands },
                  { id: 'deaf-no-hands', label: t.presetDeafNoHands },
                ] as const
              ).map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyAccessPreset(preset.id)}
                  className="min-h-[38px] rounded-md border border-slate-300 bg-slate-50 px-3 text-xs font-semibold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {preset.label}
                </button>
              ))}
              <button
                type="button"
                onClick={handleVoiceCommand}
                className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-md border px-3 text-xs font-semibold ${
                  voiceActive
                    ? 'border-emerald-700 bg-emerald-700 text-white'
                    : 'border-emerald-700 bg-emerald-50 text-emerald-950 dark:border-emerald-500 dark:bg-emerald-950 dark:text-emerald-200'
                }`}
              >
                <Mic className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{voiceActive ? t.voiceCommandListening : t.voiceCommandBtn}</span>
              </button>
            </div>
            {(activePresetLabel || voiceFeedback) && (
              <p role="status" className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                {activePresetLabel} {voiceFeedback ? `· ${voiceFeedback}` : ''}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
              <span className="font-semibold text-slate-600 dark:text-slate-400">
                Savanna Static Pages:
              </span>
              <a
                href="/savanna/pages/concept-with-navigation.html"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[34px] items-center gap-1 font-semibold text-[#0b2239] underline-offset-4 hover:underline dark:text-emerald-400"
              >
                <span>Savanna Lesson Host</span>
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
              <a
                href="/savanna/pages/live-session-viewer.html"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[34px] items-center gap-1 font-semibold text-[#0b2239] underline-offset-4 hover:underline dark:text-emerald-400"
              >
                <span>Live Session Viewer</span>
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
              <a
                href="/savanna/pages/admin-upload.html"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[34px] items-center gap-1 font-semibold text-[#0b2239] underline-offset-4 hover:underline dark:text-emerald-400"
              >
                <span>Dual-Video Upload Studio</span>
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
              <a
                href="/documents/lesson-document.html"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[34px] items-center gap-1 font-semibold text-[#0b2239] underline-offset-4 hover:underline dark:text-emerald-400"
              >
                <span>Text-First HTML</span>
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
              <a
                href="/documents/lesson-document.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[34px] items-center gap-1 font-semibold text-[#0b2239] underline-offset-4 hover:underline dark:text-emerald-400"
              >
                <span>Tagged PDF</span>
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </div>
          </div>
        )}
      </section>

      {hostMode === 'webcomponent' ? (
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-lg font-bold">
                Live Shadow-DOM Web Component (&lt;db-player&gt;)
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Loaded directly from <code>/module/db-player.js</code> with your repository&apos;s real MP4, EthSL MP4, and WebVTT files.
              </p>
            </div>
            <a
              href="/demo/blank.html"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-300 px-3 text-xs font-semibold dark:border-slate-700"
            >
              <span>Open Standalone /demo/blank.html</span>
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>
          {React.createElement('db-player', {
            src: LESSON_METADATA.videoUrl,
            captions: '/assets/media/demo-lesson.vtt,/assets/media/demo-lesson.am.vtt',
            sign: LESSON_METADATA.signVideoUrl,
            describe: '/assets/media/demo-lesson.ad.vtt',
            'lesson-id': LESSON_METADATA.id,
            lang: lang === 'am' ? 'am' : 'en',
            api: '/api/v1',
          })}
        </section>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Main Player & Controls */}
          <section
            ref={playerShellRef}
            onKeyDown={handlePlayerKeyDown}
            tabIndex={0}
            aria-label="Accessible lesson media player"
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white lg:col-span-8 dark:border-slate-800 dark:bg-slate-900"
          >
            {/* Stage */}
            <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
              {!prefs.textOnly ? (
                <video
                  ref={mainVideoRef}
                  src={LESSON_METADATA.videoUrl}
                  poster={LESSON_METADATA.posterUrl}
                  playsInline
                  preload="metadata"
                  onLoadedMetadata={(e) => {
                    const d = e.currentTarget.duration;
                    if (Number.isFinite(d) && d > 0) setDuration(d);
                  }}
                  onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                  onEnded={() => setPlaying(false)}
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center p-6 text-center text-white">
                  <p className="text-sm font-bold text-emerald-300">
                    Text &amp; Braille-Only Mode Active (Blind + Deaf / 3G)
                  </p>
                  <p className="mt-2 max-w-md text-xs text-slate-300">
                    Video is hidden. Use the interactive transcript, Grade-1 Braille (.brf) export, or live caption feed below.
                  </p>
                </div>
              )}

              {/* Top Lesson Bar */}
              <div className="pointer-events-none absolute inset-x-4 top-4 flex items-center justify-between gap-4 text-xs font-medium text-white">
                <span className="rounded-md bg-slate-950/80 px-2.5 py-1">
                  {playing ? t.pause : t.play} · {playbackRate}x
                </span>
                {activeCue?.isSoundCue && (
                  <span
                    role="status"
                    className="rounded-md bg-amber-400 px-2.5 py-1 font-bold text-slate-950"
                  >
                    Sound cue active
                  </span>
                )}
              </div>

              {/* Movable & Resizable EthSL Sign Language Window */}
              {showSign && !prefs.textOnly && (
                <div
                  role="region"
                  aria-label="Ethiopian Sign Language interpreter window"
                  style={{
                    transform: `translate(${signOffset.x}px, ${signOffset.y}px) scale(${prefs.signScale})`,
                    transformOrigin: prefs.signCorner.includes('right') ? 'bottom right' : 'bottom left',
                  }}
                  className={`absolute z-20 w-44 sm:w-52 rounded-xl border-2 border-emerald-500 bg-slate-900/95 p-2 text-white shadow-xl ${signCornerPosition[prefs.signCorner]}`}
                >
                  <div
                    onPointerDown={(e) =>
                      setDraggingSign({
                        startX: e.clientX,
                        startY: e.clientY,
                        origX: signOffset.x,
                        origY: signOffset.y,
                      })
                    }
                    className="flex cursor-grab items-center justify-between gap-2 pb-1 text-[11px] font-semibold text-emerald-300 active:cursor-grabbing"
                  >
                    <span className="inline-flex items-center gap-1">
                      <Hand className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>EthSL Video</span>
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">Synced</span>
                  </div>

                  <video
                    ref={signVideoRef}
                    src={LESSON_METADATA.signVideoUrl}
                    muted
                    playsInline
                    preload="metadata"
                    className="aspect-video w-full rounded-md bg-black object-cover"
                  />

                  {/* WCAG 2.2 Non-Dragging Button Alternatives */}
                  <div className="mt-1.5 grid grid-cols-3 gap-1">
                    {(
                      [
                        ['top-left', 'TL'],
                        ['top-right', 'TR'],
                        ['bottom-left', 'BL'],
                        ['bottom-right', 'BR'],
                      ] as const
                    ).map(([corner, label]) => (
                      <button
                        key={corner}
                        type="button"
                        aria-label={`Move sign window to ${corner.replace('-', ' ')}`}
                        onClick={() => {
                          setSignOffset({ x: 0, y: 0 });
                          setPrefs((p) => ({ ...p, signCorner: corner }));
                        }}
                        className={`min-h-[26px] rounded border px-1 text-[10px] font-semibold ${
                          prefs.signCorner === corner
                            ? 'border-emerald-400 bg-emerald-700 text-white'
                            : 'border-slate-700 bg-slate-800 text-slate-200'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                    <button
                      type="button"
                      aria-label="Make sign window larger"
                      onClick={() =>
                        setPrefs((p) => ({
                          ...p,
                          signScale: Math.min(1.45, Number((p.signScale + 0.15).toFixed(2))),
                        }))
                      }
                      className="min-h-[26px] rounded border border-slate-700 bg-slate-800 px-1 text-[10px] font-semibold text-slate-200"
                    >
                      Larger
                    </button>
                    <button
                      type="button"
                      aria-label="Make sign window smaller"
                      onClick={() =>
                        setPrefs((p) => ({
                          ...p,
                          signScale: Math.max(0.85, Number((p.signScale - 0.15).toFixed(2))),
                        }))
                      }
                      className="min-h-[26px] rounded border border-slate-700 bg-slate-800 px-1 text-[10px] font-semibold text-slate-200"
                    >
                      Smaller
                    </button>
                  </div>
                </div>
              )}

              {/* Custom Restyleable WebVTT Caption Overlay */}
              {prefs.captionLang !== 'off' && activeCue && (
                <div
                  role="region"
                  aria-label="Lesson captions"
                  aria-live="off"
                  lang={effectiveLang}
                  dir={effectiveLang === 'ar' ? 'rtl' : 'ltr'}
                  style={{ fontSize: `${prefs.captionSizeRem}rem` }}
                  className={`absolute z-10 rounded-lg border px-4 py-2 text-center font-medium leading-relaxed shadow-lg ${
                    showSign && !prefs.textOnly ? 'start-4 end-52 sm:end-60' : 'inset-x-4 mx-auto max-w-2xl'
                  } ${
                    prefs.captionPos === 'top' ? 'top-14' : 'bottom-4'
                  } ${captionThemeClasses[prefs.captionTheme]}`}
                >
                  {activeCue.text}
                </div>
              )}
            </div>

            {/* Screen-Reader Audio Description Live Banner */}
            {prefs.adMode !== 'off' && activeAdText && (
              <div
                role="status"
                aria-live="polite"
                className="border-t border-slate-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-950 dark:border-slate-800 dark:bg-emerald-950/60 dark:text-emerald-100"
              >
                Audio description ({prefs.adRate}x): {activeAdText}
              </div>
            )}

            {/* Scrubber */}
            <div className="border-t border-slate-200 bg-slate-50 px-4 pt-3 pb-2 dark:border-slate-800 dark:bg-slate-950">
              <label htmlFor="media-scrubber" className="sr-only">
                Lesson playback timeline
              </label>
              <input
                id="media-scrubber"
                type="range"
                min={0}
                max={duration}
                step={0.25}
                value={currentTime}
                onChange={(e) => seekTo(Number(e.target.value))}
                className="w-full accent-[#0b2239] dark:accent-emerald-500"
              />
              <div className="mt-1 flex items-center justify-between text-xs font-mono tabular-nums text-slate-600 dark:text-slate-400">
                <span>{formatDisplayTime(currentTime)}</span>
                <span>{progressPct}% complete</span>
                <span>{formatDisplayTime(duration)}</span>
              </div>
            </div>

            {/* Required Native <button> Controls */}
            <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 p-4 dark:border-slate-800">
              <button
                type="button"
                onClick={togglePlay}
                aria-pressed={playing}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-[#0b2239] px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-emerald-700"
              >
                {playing ? (
                  <>
                    <Pause className="h-4 w-4" aria-hidden="true" />
                    <span>{t.pause}</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" aria-hidden="true" />
                    <span>{t.play}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => seekTo(currentTime - 10)}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                <span>{t.back10}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const rates = [0.75, 1, 1.25, 1.5];
                  const next = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
                  setPlaybackRate(next);
                  onFeedback('tap', `Playback speed ${next}x`);
                }}
                className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold tabular-nums text-slate-900 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                Speed: {playbackRate}x
              </button>

              <button
                type="button"
                onClick={cycleCaptions}
                aria-pressed={prefs.captionLang !== 'off'}
                className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border px-3.5 py-2 text-sm font-semibold ${
                  prefs.captionLang !== 'off'
                    ? 'border-emerald-700 bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200'
                    : 'border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white'
                }`}
              >
                <Captions className="h-4 w-4" aria-hidden="true" />
                <span>
                  {t.captions}: {prefs.captionLang === 'off' ? 'Off' : prefs.captionLang.toUpperCase()}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setShowSign((v) => !v)}
                aria-pressed={showSign}
                className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border px-3.5 py-2 text-sm font-semibold ${
                  showSign
                    ? 'border-emerald-700 bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200'
                    : 'border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white'
                }`}
              >
                <Hand className="h-4 w-4" aria-hidden="true" />
                <span>{t.signLanguage}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const modes: AdMode[] = ['off', 'speech', 'text'];
                  const next = modes[(modes.indexOf(prefs.adMode) + 1) % modes.length];
                  setPrefs((p) => ({ ...p, adMode: next }));
                  onFeedback('step', `Audio description: ${next}`);
                }}
                aria-pressed={prefs.adMode !== 'off'}
                className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border px-3.5 py-2 text-sm font-semibold ${
                  prefs.adMode !== 'off'
                    ? 'border-[#0b2239] bg-[#0b2239] text-white'
                    : 'border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white'
                }`}
              >
                <Volume2 className="h-4 w-4" aria-hidden="true" />
                <span>AD: {prefs.adMode}</span>
              </button>

              <button
                type="button"
                onClick={() => setPrefs((p) => ({ ...p, textOnly: !p.textOnly }))}
                aria-pressed={prefs.textOnly}
                className={`min-h-[44px] rounded-lg border px-3.5 py-2 text-sm font-semibold ${
                  prefs.textOnly
                    ? 'border-amber-600 bg-amber-50 text-amber-950 dark:bg-amber-950 dark:text-amber-200'
                    : 'border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white'
                }`}
              >
                {t.textOnly}
              </button>

              <button
                type="button"
                onClick={() => setShowTranscript((v) => !v)}
                aria-pressed={showTranscript}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <FileText className="h-4 w-4" aria-hidden="true" />
                <span>{t.transcript}</span>
              </button>

              <button
                type="button"
                onClick={toggleFullscreen}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Maximize2 className="h-4 w-4" aria-hidden="true" />
                )}
                <span>{t.fullScreen}</span>
              </button>

              <button
                type="button"
                onClick={() => helpDialogRef.current?.showModal()}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <HelpCircle className="h-4 w-4" aria-hidden="true" />
                <span>{t.kbHelp}</span>
              </button>
            </div>

            {/* Caption Appearance Preferences */}
            <div className="flex flex-wrap items-center gap-4 border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-center gap-2">
                <label htmlFor="cap-track" className="font-semibold">
                  Subtitle language
                </label>
                <select
                  id="cap-track"
                  value={prefs.captionLang}
                  onChange={(e) =>
                    setPrefs((p) => ({ ...p, captionLang: e.target.value as 'off' | AppLang }))
                  }
                  className="min-h-[36px] rounded border border-slate-300 bg-white px-2 dark:border-slate-700 dark:bg-slate-900"
                >
                  {SUPPORTED_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.nativeLabel} ({l.englishName})
                    </option>
                  ))}
                  <option value="off">Off</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label htmlFor="cap-size" className="font-semibold">
                  Caption size
                </label>
                <select
                  id="cap-size"
                  value={prefs.captionSizeRem}
                  onChange={(e) => setPrefs((p) => ({ ...p, captionSizeRem: Number(e.target.value) }))}
                  className="min-h-[36px] rounded border border-slate-300 bg-white px-2 dark:border-slate-700 dark:bg-slate-900"
                >
                  <option value={1}>Standard (1rem)</option>
                  <option value={1.15}>Medium (1.15rem)</option>
                  <option value={1.4}>Large (1.4rem)</option>
                  <option value={1.75}>Extra Large (1.75rem)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label htmlFor="cap-theme" className="font-semibold">
                  Caption color
                </label>
                <select
                  id="cap-theme"
                  value={prefs.captionTheme}
                  onChange={(e) => setPrefs((p) => ({ ...p, captionTheme: e.target.value as CaptionTheme }))}
                  className="min-h-[36px] rounded border border-slate-300 bg-white px-2 dark:border-slate-700 dark:bg-slate-900"
                >
                  <option value="charcoal">White on Charcoal</option>
                  <option value="amber">Yellow on Black</option>
                  <option value="cream">Navy on Cream</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label htmlFor="cap-pos" className="font-semibold">
                  Position
                </label>
                <select
                  id="cap-pos"
                  value={prefs.captionPos}
                  onChange={(e) => setPrefs((p) => ({ ...p, captionPos: e.target.value as 'bottom' | 'top' }))}
                  className="min-h-[36px] rounded border border-slate-300 bg-white px-2 dark:border-slate-700 dark:bg-slate-900"
                >
                  <option value="bottom">Bottom</option>
                  <option value="top">Top</option>
                </select>
              </div>
            </div>
          </section>

          {/* Right Panel: Interactive Transcript / Caption Pipeline / 3G Offline Pack */}
          {showTranscript && (
            <aside
              aria-label="Transcript, caption editor, and offline tools"
              className="flex flex-col rounded-2xl border border-slate-200 bg-white lg:col-span-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex border-b border-slate-200 p-1.5 dark:border-slate-800">
                {(
                  [
                    { id: 'transcript', label: t.transcript },
                    { id: 'editor', label: 'Caption Editor' },
                    { id: 'offline', label: `Offline (${LESSON_METADATA.offlineSizeKb} KB)` },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setPanelTab(tab.id)}
                    aria-pressed={panelTab === tab.id}
                    className={`min-h-[40px] flex-1 rounded-md px-2 text-xs font-semibold ${
                      panelTab === tab.id
                        ? 'bg-[#0b2239] text-white dark:bg-emerald-700'
                        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {panelTab === 'transcript' && (
                <div className="flex flex-1 flex-col justify-between p-4">
                  <div className="max-h-[360px] space-y-2 overflow-y-auto pe-1">
                    {activeCues.map((cue) => {
                      const isActive = activeCue?.id === cue.id;
                      return (
                        <button
                          key={cue.id}
                          type="button"
                          onClick={() => seekTo(cue.start)}
                          className={`w-full rounded-lg border p-2.5 text-start text-xs leading-relaxed transition-colors ${
                            isActive
                              ? 'border-amber-500 bg-amber-50 font-semibold text-slate-950 dark:bg-amber-950/60 dark:text-amber-100'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300'
                          }`}
                        >
                          <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                            {formatDisplayTime(cue.start)}
                          </span>{' '}
                          <span lang={effectiveLang}>{cue.text}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-200 pt-3 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() =>
                        downloadFile(
                          `lesson-${effectiveLang}.txt`,
                          exportToPlainText(activeCues, currentLessonTitle),
                          'text/plain;charset=utf-8'
                        )
                      }
                      className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-300 px-3 text-xs font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                    >
                      <Download className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Download .txt</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        downloadFile(
                          'lesson-braille.brf',
                          exportToBrf(cuesByLang.en, LESSON_METADATA.lessonTitleEn),
                          'text/plain;charset=ascii'
                        )
                      }
                      className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#0b2239] px-3 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-emerald-700"
                    >
                      <Download className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Braille .brf</span>
                    </button>
                  </div>
                </div>
              )}

              {panelTab === 'editor' && (
                <div className="space-y-3 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="inline-flex items-center gap-1.5 text-xs font-bold">
                      <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>ASR Draft Correction</span>
                    </p>
                    <select
                      aria-label="Edit language track"
                      value={editorLang}
                      onChange={(e) => setEditorLang(e.target.value as AppLang)}
                      className="min-h-[34px] rounded border border-slate-300 bg-white px-2 text-xs dark:border-slate-700 dark:bg-slate-950"
                    >
                      {SUPPORTED_LANGUAGES.map((l) => (
                        <option key={l.code} value={l.code}>
                          {l.nativeLabel} (.vtt)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="max-h-[280px] space-y-2.5 overflow-y-auto pe-1">
                    {editableCues.slice(0, 6).map((cue, idx) => (
                      <div
                        key={cue.id}
                        className="space-y-1.5 rounded-lg border border-slate-200 p-2.5 dark:border-slate-800"
                      >
                        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
                          <span>Cue {idx + 1}</span>
                          <span>
                            {formatDisplayTime(cue.start)} → {formatDisplayTime(cue.end)}
                          </span>
                        </div>
                        <label htmlFor={`cue-edit-${cue.id}`} className="sr-only">
                          Edit text for cue {idx + 1}
                        </label>
                        <textarea
                          id={`cue-edit-${cue.id}`}
                          rows={2}
                          lang={editorLang}
                          dir={editorLang === 'ar' ? 'rtl' : 'ltr'}
                          value={cue.text}
                          onChange={(e) => {
                            const updated = editableCues.map((c) =>
                              c.id === cue.id ? { ...c, text: e.target.value } : c
                            );
                            setCuesByLang((prev) => ({ ...prev, [editorLang]: updated }));
                          }}
                          className="w-full rounded border border-slate-300 bg-white p-1.5 text-xs dark:border-slate-700 dark:bg-slate-950"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleSaveEditedCaptions}
                      className="min-h-[40px] flex-1 rounded-lg bg-[#0b2239] px-3 text-xs font-semibold text-white dark:bg-emerald-700"
                    >
                      Save Corrections
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        downloadFile(
                          `lesson.${editorLang}.vtt`,
                          exportToVtt(editableCues),
                          'text/vtt;charset=utf-8'
                        )
                      }
                      className="min-h-[40px] rounded-lg border border-slate-300 px-3 text-xs font-semibold dark:border-slate-700"
                    >
                      Export .vtt
                    </button>
                  </div>
                  <a
                    href="/module/caption-editor.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#0b2239] hover:underline dark:text-emerald-400"
                  >
                    <span>Open Full Standalone Caption Pipeline Editor</span>
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                  {editorStatus && (
                    <p role="status" className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      {editorStatus}
                    </p>
                  )}
                </div>
              )}

              {panelTab === 'offline' && (
                <div className="space-y-4 p-4">
                  <div className="flex items-start gap-3">
                    <WifiOff className="mt-0.5 h-5 w-5 text-slate-700 dark:text-slate-300" aria-hidden="true" />
                    <div className="space-y-1 text-sm">
                      <h3 className="font-bold">3G Offline Lesson Pack</h3>
                      <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                        Registers Service Worker (<code>/module/sw.js</code>) and downloads the low-bitrate{' '}
                        <code>.m4a</code> audio track ({LESSON_METADATA.offlineSizeKb} KB) plus all 6 language transcripts.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveOfflinePack}
                    className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-[#0b2239] px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-emerald-700"
                  >
                    {offlineSaved ? <Check className="h-4 w-4" aria-hidden="true" /> : <Download className="h-4 w-4" aria-hidden="true" />}
                    <span>
                      {offlineSaved
                        ? `Offline Pack Ready (${LESSON_METADATA.offlineSizeKb} KB)`
                        : `Download for Offline (${LESSON_METADATA.offlineSizeKb} KB)`}
                    </span>
                  </button>
                </div>
              )}
            </aside>
          )}
        </div>
      )}

      {/* Semantic Accessible Lesson Document */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="font-display text-xl font-bold text-slate-950 dark:text-white">
          {t.docHeading}
        </h2>
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
          {LESSON_DOCUMENT_SECTIONS.map((sec) => (
            <article key={sec.id} id={sec.id} className="space-y-2">
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
                {sec.headingByLang[lang] || sec.headingByLang.en}
              </h3>
              <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {sec.bodyByLang[lang] || sec.bodyByLang.en}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Accessible Keyboard Help <dialog> */}
      <dialog
        ref={helpDialogRef}
        aria-labelledby="kb-help-title"
        className="m-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl backdrop:bg-slate-950/60 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
      >
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
          <h2 id="kb-help-title" className="font-display text-lg font-bold">
            Media Player Keyboard Shortcuts
          </h2>
          <button
            type="button"
            onClick={() => helpDialogRef.current?.close()}
            aria-label="Close keyboard help"
            className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-slate-300 dark:border-slate-700"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <dl className="mt-4 space-y-2.5 text-sm">
          <div className="flex justify-between">
            <dt className="font-mono font-semibold">Space / K</dt>
            <dd>Play or Pause lesson</dd>
          </div>
          <div className="flex justify-between">
            <dt className="font-mono font-semibold">Left / Right Arrow</dt>
            <dd>Seek back or forward 10 seconds</dd>
          </div>
          <div className="flex justify-between">
            <dt className="font-mono font-semibold">C</dt>
            <dd>Cycle 6 subtitle languages / Off</dd>
          </div>
          <div className="flex justify-between">
            <dt className="font-mono font-semibold">S</dt>
            <dd>Toggle EthSL sign language window</dd>
          </div>
          <div className="flex justify-between">
            <dt className="font-mono font-semibold">?</dt>
            <dd>Open keyboard help</dd>
          </div>
        </dl>
      </dialog>
    </div>
  );
};

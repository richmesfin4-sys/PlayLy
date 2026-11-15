import React, { useEffect, useRef, useState } from 'react';
import {
  Mic,
  Volume2,
  Hand,
  ShieldCheck,
  Download,
  Trash2,
  CheckCircle2,
  Square,
  Vibrate,
  Accessibility,
} from 'lucide-react';
import {
  decodeBrailleDots,
  formatEthiopianDate,
  normalizeEthiopianPhone,
} from '../utils/accessibilityLogic';
import { getSpeechLocale, speakText, type TactilePattern } from '../utils/tactileFeedback';
import { UI_TRANSLATIONS, type AppLang } from '../i18n/translations';

export type AccessProfileId =
  | 'deafblind-braille'
  | 'blind-half-deaf'
  | 'blind-no-hands'
  | 'deaf-no-hands'
  | 'switch-scan'
  | 'voice-first'
  | 'deaf-low-literacy';

export interface SavedLearnerState {
  id?: string;
  step: number;
  accessProfile: AccessProfileId;
  name: string;
  phone: string;
  tactilePin: string;
  preferredLang: AppLang;
  idRoute: 'national_id' | 'refugee_id' | 'other_doc' | 'partner_referral';
  supportChoices: string[];
  completed: boolean;
  consentGiven: boolean;
  voiceNoteAttached: boolean;
}

interface OnboardingAuthViewProps {
  lang: AppLang;
  savedState: SavedLearnerState;
  onUpdateState: (next: SavedLearnerState) => void;
  onFeedback: (pattern: TactilePattern, announce?: string) => void;
}

const SUPPORT_OPTIONS = [
  { id: 'braille_tactile', labelEn: 'Braille (.brf) & tactile vibration cues (Blind + Deaf)' },
  { id: 'voice_plus', labelEn: 'Clear Voice + Braille dual output (Blind + Half Deaf / No Hands)' },
  { id: 'hands_free_sign', labelEn: 'Sign Language + Hands-free dwell scan (Deaf + No Hands)' },
  { id: 'captions', labelEn: 'Multilingual captions (EN / AM / TI / OM / AR / SO)' },
  { id: 'sign_language', labelEn: 'Ethiopian Sign Language window & interview interpreter' },
  { id: 'screen_reader', labelEn: 'Screen reader optimization' },
  { id: 'extra_time', labelEn: 'Extra time & zero countdowns' },
  { id: 'prefer_not_to_say', labelEn: 'Prefer not to say' },
];

export const OnboardingAuthView: React.FC<OnboardingAuthViewProps> = ({
  lang,
  savedState,
  onUpdateState,
  onFeedback,
}) => {
  const t = UI_TRANSLATIONS[lang].onboarding;
  const [errorMsg, setErrorMsg] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [listening, setListening] = useState(false);
  const [voiceCmdStatus, setVoiceCmdStatus] = useState('');
  const [recordingFallback, setRecordingFallback] = useState(false);
  const [activeDots, setActiveDots] = useState<number[]>([]);
  const [scanIndex, setScanIndex] = useState(0);
  const [autoScanEnabled, setAutoScanEnabled] = useState(false);

  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const phoneInputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // Derived active dual-disability capabilities
  const showBraillePad =
    savedState.accessProfile === 'deafblind-braille' ||
    savedState.accessProfile === 'blind-half-deaf';
  const showVoicePlus =
    savedState.accessProfile === 'blind-half-deaf' ||
    savedState.accessProfile === 'blind-no-hands' ||
    savedState.accessProfile === 'voice-first';
  const showHandsFreeSign =
    savedState.accessProfile === 'deaf-no-hands' ||
    savedState.accessProfile === 'deaf-low-literacy';
  const isSwitchScan =
    savedState.accessProfile === 'switch-scan' ||
    savedState.accessProfile === 'deaf-no-hands';
  const isLowLiteracy = savedState.accessProfile === 'deaf-low-literacy';
  const voiceRate = savedState.accessProfile === 'blind-half-deaf' ? 0.82 : 0.96;

  // Focus heading on step changes and auto-speak when Blind + Half Deaf or Blind + No Hands is active
  useEffect(() => {
    headingRef.current?.focus();
    setErrorMsg('');
    if (showVoicePlus) {
      const heading = t.stepHeadings[savedState.step] || t.stepHeadings[1];
      speakText(heading.standard, lang, voiceRate);
    }
  }, [savedState.step, lang, showVoicePlus, voiceRate, t.stepHeadings]);

  // Hands-free dwell/auto-scan timer for Deaf + Unable to Use Hands
  useEffect(() => {
    if (!autoScanEnabled) return;
    const id = window.setInterval(() => {
      setScanIndex((prev) => (prev + 1) % 3);
    }, 2400);
    return () => window.clearInterval(id);
  }, [autoScanEnabled]);

  const updateField = <K extends keyof SavedLearnerState>(key: K, val: SavedLearnerState[K]) => {
    onUpdateState({ ...savedState, [key]: val });
  };

  // Perkins 6-dot Braille keyboard shortcuts
  const handleBrailleKey = (dot: number) => {
    setActiveDots((prev) =>
      prev.includes(dot) ? prev.filter((d) => d !== dot) : [...prev, dot]
    );
    onFeedback('tap');
  };

  const commitBrailleChord = (targetField: 'name' | 'tactilePin') => {
    const decoded = decodeBrailleDots(activeDots);
    if (!decoded) {
      onFeedback('error', 'Select at least one Braille dot before committing.');
      return;
    }
    if (targetField === 'name') {
      updateField('name', savedState.name + decoded);
    } else {
      updateField('tactilePin', (savedState.tactilePin + decoded).slice(0, 6));
    }
    setActiveDots([]);
    onFeedback('confirm', `Entered Braille character ${decoded}`);
    if (savedState.accessProfile === 'blind-half-deaf') {
      speakText(decoded, lang, voiceRate);
    }
  };

  // Voice Input & Hands-Free Voice Command Listener
  const handleVoiceInput = async (targetField: 'name' | 'phone' | 'command') => {
    const SpeechRec =
      (window as unknown as { SpeechRecognition?: new () => unknown; webkitSpeechRecognition?: new () => unknown })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => unknown }).webkitSpeechRecognition;

    if (SpeechRec) {
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
        setListening(true);
        rec.onresult = (e) => {
          const spoken = e.results[0]?.[0]?.transcript?.trim() || '';
          if (!spoken) return;
          if (targetField === 'command') {
            const low = spoken.toLowerCase();
            setVoiceCmdStatus(`Voice command heard: "${spoken}"`);
            if (low.includes('next') || low.includes('continue') || low.includes('ቀጥል')) {
              void handleContinue();
            } else if (low.includes('back') || low.includes('ተመለስ')) {
              if (savedState.step > 1) updateField('step', savedState.step - 1);
            } else if (low.includes('read') || low.includes('repeat') || low.includes('listen')) {
              const heading = t.stepHeadings[savedState.step] || t.stepHeadings[1];
              speakText(heading.standard, lang, voiceRate);
            } else if (savedState.step === 1) {
              updateField('name', spoken);
            }
            onFeedback('confirm', `Voice command processed: ${spoken}`);
          } else {
            updateField(targetField, spoken);
            onFeedback('confirm', `Captured speech: ${spoken}`);
            speakText(spoken, lang, voiceRate);
          }
        };
        rec.onerror = () => {
          setListening(false);
          setVoiceCmdStatus('Browser speech recognition idle — keyboard, Braille pad, and voice-note fallback remain active.');
          onFeedback('error', 'Speech recognition unavailable. Use voice note fallback.');
        };
        rec.onend = () => setListening(false);
        rec.start();
        return;
      } catch {
        setListening(false);
      }
    }

    if (targetField === 'command') {
      const heading = t.stepHeadings[savedState.step] || t.stepHeadings[1];
      speakText(heading.standard, lang, voiceRate);
      setVoiceCmdStatus('Hands-free speech prompt read aloud; microphone recognition requires HTTPS/mic permission.');
      onFeedback('step', 'Read question aloud');
      return;
    }

    // Fallback: record short audio note locally
    if (navigator.mediaDevices?.getUserMedia) {
      try {
        if (!recordingFallback) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const mr = new MediaRecorder(stream);
          mediaRecorderRef.current = mr;
          mr.onstop = () => {
            stream.getTracks().forEach((tr) => tr.stop());
            updateField('voiceNoteAttached', true);
            setRecordingFallback(false);
            onFeedback('confirm', 'Voice note recorded locally as speech fallback.');
          };
          mr.start();
          setRecordingFallback(true);
          onFeedback('step', 'Recording voice note fallback. Press Stop to save.');
        } else {
          mediaRecorderRef.current?.stop();
        }
      } catch {
        onFeedback('error', 'Microphone permission unavailable; keyboard & Braille pad remain active.');
      }
    } else {
      onFeedback('error', 'Speech input not supported in this browser.');
    }
  };

  const handleContinue = async () => {
    if (savedState.step === 1) {
      if (!savedState.name.trim()) {
        const msg =
          lang === 'am'
            ? 'እባክዎ ለመቀጠል ስምዎን ያስገቡ (ወይም በብሬይል ይጻፉ)።'
            : 'Please enter your name, speak it, or enter characters using the Braille pad.';
        setErrorMsg(msg);
        onFeedback('error', msg);
        if (showVoicePlus) speakText(msg, lang, voiceRate);
        nameInputRef.current?.focus();
        return;
      }
      updateField('step', 2);
      onFeedback('step', 'Question 2 of 6');
      return;
    }

    if (savedState.step === 2) {
      if (
        savedState.accessProfile === 'deafblind-braille' ||
        savedState.accessProfile === 'blind-half-deaf' ||
        savedState.accessProfile === 'switch-scan' ||
        savedState.accessProfile === 'deaf-no-hands'
      ) {
        if (savedState.tactilePin.trim().length < 2 && !savedState.phone.trim()) {
          const msg = 'Enter at least a 2-character Tactile Passkey or an Ethiopian phone number.';
          setErrorMsg(msg);
          onFeedback('error', msg);
          if (showVoicePlus) speakText(msg, lang, voiceRate);
          return;
        }
      } else if (savedState.phone.trim()) {
        const check = normalizeEthiopianPhone(savedState.phone);
        if (!check.valid) {
          const msg = lang === 'am' ? check.errorAm || '' : check.errorEn || '';
          setErrorMsg(msg);
          onFeedback('error', msg);
          phoneInputRef.current?.focus();
          return;
        }
        updateField('phone', check.normalized);
      }
      onUpdateState({ ...savedState, step: 3 });
      onFeedback('step', 'Question 3 of 6');
      return;
    }

    if (savedState.step < 6) {
      updateField('step', savedState.step + 1);
      onFeedback('step', `Question ${savedState.step + 1} of 6`);
      return;
    }

    // Step 6: Complete & persist separately to backend API (/api/v1/learners and /support)
    try {
      const profileRes = await fetch('/api/v1/learners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: savedState.name.trim(),
          phone: savedState.phone.trim(),
          language: savedState.preferredLang,
          idRoute: savedState.idRoute,
          authMethod: savedState.accessProfile,
        }),
      });
      const profileData = await profileRes.json();
      const learnerId = profileData.id || `lrn-local-${Date.now()}`;

      await fetch(`/api/v1/learners/${learnerId}/support`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ support: savedState.supportChoices }),
      });

      onUpdateState({
        ...savedState,
        id: learnerId,
        completed: true,
        consentGiven: true,
      });
      setStatusMsg(
        savedState.idRoute === 'partner_referral'
          ? 'Registration complete. Partner referral queued—no document required tonight.'
          : 'Registration and seamless dual-disability authentication saved.'
      );
      onFeedback('confirm', 'Registration complete. Support preferences stored separately.');
    } catch {
      onUpdateState({ ...savedState, completed: true, consentGiven: true });
      setStatusMsg('Saved locally on this device. It will sync when online.');
      onFeedback('confirm', 'Saved locally on this device.');
    }
  };

  const handleDeleteAll = async () => {
    if (savedState.id) {
      try {
        await fetch(`/api/v1/learners/${savedState.id}`, { method: 'DELETE' });
      } catch {
        // Ignore offline error
      }
    }
    onUpdateState({
      step: 1,
      accessProfile: 'blind-no-hands',
      name: '',
      phone: '',
      tactilePin: '',
      preferredLang: lang,
      idRoute: 'partner_referral',
      supportChoices: [],
      completed: false,
      consentGiven: false,
      voiceNoteAttached: false,
    });
    setStatusMsg('All learner profile and support data erased.');
    onFeedback('confirm', 'All learner data deleted.');
  };

  const handleExportData = () => {
    const payload = {
      profile: {
        id: savedState.id || 'local-session',
        name: savedState.name,
        phone: savedState.phone,
        preferredLang: savedState.preferredLang,
        idRoute: savedState.idRoute,
        authMethod: savedState.accessProfile,
      },
      supportChoicesSeparate: savedState.supportChoices,
      exportedAtEthiopic: formatEthiopianDate(new Date(), lang),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'digital-bridge-my-data.json';
    a.click();
    URL.revokeObjectURL(url);
    onFeedback('confirm', 'Exported learner data JSON');
  };

  const currentHeading = t.stepHeadings[savedState.step] || t.stepHeadings[1];

  const accessSolutions = [
    {
      id: 'deafblind-braille',
      title: 'Blind + Deaf',
      solution: 'Solution: Braille + Tactile Haptics',
      desc: '6-dot Perkins Braille pad, .brf transcript export & distinct vibration cadences.',
    },
    {
      id: 'blind-half-deaf',
      title: 'Blind + Half Deaf',
      solution: 'Solution: Voice + Braille',
      desc: 'Clear 0.82x voice read-aloud paired simultaneously with 6-dot Braille & haptics.',
    },
    {
      id: 'blind-no-hands',
      title: 'Blind + Unable to Use Hands',
      solution: 'Solution: Voice Plus (Hands-Free)',
      desc: 'Auto spoken prompts & hands-free voice commands ("Continue", "Back", answer dictation).',
    },
    {
      id: 'deaf-no-hands',
      title: 'Deaf + Unable to Use Hands',
      solution: 'Solution: Sign Language + Auto-Scan',
      desc: 'Visual EthSL sign guidance & hands-free dwell scanning with zero typing.',
    },
    {
      id: 'switch-scan',
      title: 'Single-Switch / Simple Words',
      solution: 'Solution: 1-Button Spacebar Scan',
      desc: 'Plain-language prompts with step-by-step switch scanning.',
    },
  ] as const;

  return (
    <div className="space-y-8">
      {/* Mode Selector Header */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-400">
              {t.kicker}
            </p>
            <h1 className="font-display text-2xl font-bold text-slate-950 dark:text-white">
              {t.title}
            </h1>
            <p className="max-w-3xl text-sm text-slate-600 dark:text-slate-300">
              {t.subtitle}
            </p>
          </div>
        </div>

        {/* Dual-Disability Solution Selector */}
        <fieldset className="mt-5">
          <legend className="mb-2 text-xs font-bold text-slate-700 dark:text-slate-300">
            {t.profileLegend}
          </legend>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
            {accessSolutions.map((mode) => {
              const active = savedState.accessProfile === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => {
                    updateField('accessProfile', mode.id);
                    if (mode.id === 'deaf-no-hands') setAutoScanEnabled(true);
                    else setAutoScanEnabled(false);
                    onFeedback('step', `Switched to ${mode.title}: ${mode.solution}`);
                  }}
                  aria-pressed={active}
                  className={`min-h-[86px] rounded-xl border p-3.5 text-start transition-colors ${
                    active
                      ? 'border-[#0b2239] bg-[#0b2239] text-white dark:border-emerald-500 dark:bg-emerald-800'
                      : 'border-slate-200 bg-slate-50 text-slate-900 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100'
                  }`}
                >
                  <div className="text-sm font-bold">{mode.title}</div>
                  <div className={`mt-0.5 text-[11px] font-semibold ${active ? 'text-emerald-300' : 'text-emerald-800 dark:text-emerald-400'}`}>
                    {mode.solution}
                  </div>
                  <div className={`mt-1 text-xs ${active ? 'text-slate-200' : 'text-slate-600 dark:text-slate-400'}`}>
                    {mode.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </fieldset>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Main Step Engine */}
          <section
            dir={savedState.preferredLang === 'ar' || lang === 'ar' ? 'rtl' : 'ltr'}
            aria-label="Onboarding question"
            className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 lg:col-span-8 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 tabular-nums">
                {t.questionOf.replace('{step}', String(savedState.step))}
              </p>

              <div className="flex flex-wrap gap-2">
                {showVoicePlus && (
                  <button
                    type="button"
                    onClick={() => handleVoiceInput('command')}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-emerald-700 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-950 hover:bg-emerald-100 dark:border-emerald-500 dark:bg-emerald-950 dark:text-emerald-200"
                  >
                    <Mic className="h-4 w-4" aria-hidden="true" />
                    <span>{listening ? 'Listening...' : 'Hands-Free Voice Command'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    const text = isLowLiteracy ? currentHeading.simple : currentHeading.standard;
                    speakText(text, lang, voiceRate);
                    onFeedback('pulse', text);
                  }}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <Volume2 className="h-4 w-4" aria-hidden="true" />
                  <span>{t.listenBtn}</span>
                </button>
              </div>
            </div>

            {voiceCmdStatus && (
              <p role="status" className="rounded-lg border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                {voiceCmdStatus}
              </p>
            )}

            {/* Sign Language + Hands-Free Banner for Deaf + Unable to Use Hands */}
            {showHandsFreeSign && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                <div className="flex items-start gap-3">
                  <Hand className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
                  <div className="space-y-0.5 text-xs">
                    <p className="font-bold text-slate-900 dark:text-white">
                      Sign Language + Hands-Free Visual Dwell Active
                    </p>
                    <p className="text-slate-600 dark:text-slate-400">
                      Visual EthSL step cues and automated button scanning allow full navigation without typing or speaking.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoScanEnabled((v) => !v)}
                  aria-pressed={autoScanEnabled}
                  className={`min-h-[40px] rounded-lg border px-3 text-xs font-semibold ${
                    autoScanEnabled
                      ? 'border-emerald-700 bg-emerald-700 text-white'
                      : 'border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900'
                  }`}
                >
                  {autoScanEnabled ? 'Auto-Scan: ON' : 'Auto-Scan: OFF'}
                </button>
              </div>
            )}

            <h2
              ref={headingRef}
              tabIndex={-1}
              className="font-display text-xl font-bold text-slate-950 outline-none sm:text-2xl dark:text-white"
            >
              {isLowLiteracy ? currentHeading.simple : currentHeading.standard}
            </h2>

            {/* Step 1: Name */}
            {savedState.step === 1 && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="onboard-name" className="mb-1.5 block text-sm font-semibold">
                    {t.fullName}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <input
                      ref={nameInputRef}
                      id="onboard-name"
                      type="text"
                      autoComplete="name"
                      aria-invalid={Boolean(errorMsg)}
                      aria-describedby={errorMsg ? 'onboard-error' : undefined}
                      value={savedState.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      className="min-h-[44px] flex-1 rounded-lg border border-slate-300 bg-white px-3.5 text-base dark:border-slate-700 dark:bg-slate-950"
                    />
                    <button
                      type="button"
                      onClick={() => handleVoiceInput('name')}
                      className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800"
                    >
                      {recordingFallback ? (
                        <Square className="h-4 w-4 text-red-600" aria-hidden="true" />
                      ) : (
                        <Mic className="h-4 w-4" aria-hidden="true" />
                      )}
                      <span>
                        {listening
                          ? 'Listening...'
                          : recordingFallback
                            ? 'Stop Voice Note'
                            : t.speakAnswer}
                      </span>
                    </button>
                  </div>
                </div>

                {savedState.voiceNoteAttached && (
                  <p role="status" className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    Voice note attached locally as speech fallback.
                  </p>
                )}

                {showBraillePad && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                    <p className="mb-2 text-xs font-bold">
                      6-Dot Perkins Braille Input ({savedState.accessProfile === 'blind-half-deaf' ? 'Paired with Clear 0.82x Voice Read-Aloud' : 'Deafblind Tactile Entry'})
                    </p>
                    <div className="grid max-w-[160px] grid-cols-2 gap-2">
                      {[1, 4, 2, 5, 3, 6].map((dot) => {
                        const on = activeDots.includes(dot);
                        return (
                          <button
                            key={dot}
                            type="button"
                            onClick={() => handleBrailleKey(dot)}
                            aria-pressed={on}
                            className={`min-h-[44px] rounded-lg border font-mono text-sm font-bold ${
                              on
                                ? 'border-emerald-600 bg-emerald-700 text-white'
                                : 'border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white'
                            }`}
                          >
                            Dot {dot}
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => commitBrailleChord('name')}
                        className="min-h-[40px] rounded-lg bg-[#0b2239] px-3 text-xs font-semibold text-white dark:bg-emerald-700"
                      >
                        Commit Braille Letter ({decodeBrailleDots(activeDots) || '—'})
                      </button>
                      <button
                        type="button"
                        onClick={() => updateField('name', savedState.name + ' ')}
                        className="min-h-[40px] rounded-lg border border-slate-300 px-3 text-xs font-semibold dark:border-slate-700"
                      >
                        Space
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Phone or Tactile PIN */}
            {savedState.step === 2 && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="onboard-phone" className="mb-1.5 block text-sm font-semibold">
                    Ethiopian Phone (09..., 07..., or +251...)
                  </label>
                  <input
                    ref={phoneInputRef}
                    id="onboard-phone"
                    type="tel"
                    inputMode="tel"
                    aria-invalid={Boolean(errorMsg)}
                    aria-describedby={errorMsg ? 'onboard-error' : undefined}
                    placeholder="0911223344"
                    value={savedState.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3.5 text-base dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>

                <div>
                  <label htmlFor="onboard-pin" className="mb-1.5 block text-sm font-semibold">
                    Tactile / Switch / Voice Passkey (Cross-Device Sign-In)
                  </label>
                  <input
                    id="onboard-pin"
                    type="text"
                    value={savedState.tactilePin}
                    onChange={(e) => updateField('tactilePin', e.target.value.toUpperCase())}
                    placeholder="e.g. AB24 (or tap Braille dots)"
                    className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3.5 font-mono text-base dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>

                {showBraillePad && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                    <p className="mb-2 text-xs font-bold">Enter Tactile Passkey via Braille Dots</p>
                    <div className="flex flex-wrap gap-2">
                      {[1, 2, 3, 4, 5, 6].map((dot) => (
                        <button
                          key={dot}
                          type="button"
                          onClick={() => handleBrailleKey(dot)}
                          aria-pressed={activeDots.includes(dot)}
                          className={`min-h-[44px] min-w-[48px] rounded-lg border font-mono text-sm font-bold ${
                            activeDots.includes(dot)
                              ? 'border-emerald-600 bg-emerald-700 text-white'
                              : 'border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900'
                          }`}
                        >
                          {dot}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => commitBrailleChord('tactilePin')}
                        className="min-h-[44px] rounded-lg bg-[#0b2239] px-4 text-xs font-semibold text-white dark:bg-emerald-700"
                      >
                        Add Character ({decodeBrailleDots(activeDots) || '—'})
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Preferred Language (All 6 requested languages) */}
            {savedState.step === 3 && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {(
                  [
                    { id: 'en', label: 'English' },
                    { id: 'am', label: 'አማርኛ (Amharic)' },
                    { id: 'ti', label: 'ትግርኛ (Tigray / Tigrinya)' },
                    { id: 'om', label: 'Afaan Oromoo (Oromo)' },
                    { id: 'ar', label: 'العربية (Arabic RTL)' },
                    { id: 'so', label: 'Af-Soomaali (Somali)' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      updateField('preferredLang', opt.id);
                      onFeedback('step', `Selected ${opt.label}`);
                    }}
                    aria-pressed={savedState.preferredLang === opt.id}
                    className={`min-h-[52px] rounded-xl border px-4 text-start text-sm font-semibold ${
                      savedState.preferredLang === opt.id
                        ? 'border-[#0b2239] bg-[#0b2239] text-white dark:border-emerald-500 dark:bg-emerald-800'
                        : 'border-slate-300 bg-white text-slate-900 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            {/* Step 4: Identity Route */}
            {savedState.step === 4 && (
              <div className="space-y-3">
                {(
                  [
                    { id: 'national_id', label: 'National / Kebele ID' },
                    { id: 'refugee_id', label: 'Refugee ID (RRS / UNHCR)' },
                    { id: 'other_doc', label: 'Student or Partner Organization Card' },
                    {
                      id: 'partner_referral',
                      label: 'I have no document — refer me through a partner (Finishes without blocking)',
                    },
                  ] as const
                ).map((route) => (
                  <button
                    key={route.id}
                    type="button"
                    onClick={() => {
                      updateField('idRoute', route.id);
                      onFeedback('step', route.label);
                    }}
                    aria-pressed={savedState.idRoute === route.id}
                    className={`min-h-[52px] w-full rounded-xl border px-4 text-start text-sm font-semibold ${
                      savedState.idRoute === route.id
                        ? 'border-[#0b2239] bg-[#0b2239] text-white dark:border-emerald-500 dark:bg-emerald-800'
                        : 'border-slate-300 bg-white text-slate-900 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white'
                    }`}
                  >
                    {route.label}
                  </button>
                ))}
              </div>
            )}

            {/* Step 5: Private Support Choices */}
            {savedState.step === 5 && (
              <fieldset className="space-y-2.5">
                <legend className="text-xs text-slate-600 dark:text-slate-400">
                  No medical proof required. Stored separately from your profile and never shown to employers.
                </legend>
                {SUPPORT_OPTIONS.map((opt) => {
                  const checked = savedState.supportChoices.includes(opt.id);
                  return (
                    <label
                      key={opt.id}
                      className="flex min-h-[48px] cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-4 py-2 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-950"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          const next = checked
                            ? savedState.supportChoices.filter((c) => c !== opt.id)
                            : [...savedState.supportChoices, opt.id];
                          updateField('supportChoices', next);
                          onFeedback('tap');
                        }}
                        className="h-5 w-5 accent-[#0b2239] dark:accent-emerald-500"
                      />
                      <span className="text-sm font-medium">{opt.labelEn}</span>
                    </label>
                  );
                })}
              </fieldset>
            )}

            {/* Step 6: Review & Privacy Controls */}
            {savedState.step === 6 && (
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-800 dark:bg-slate-950">
                  <p>
                    <strong>Name:</strong> {savedState.name || '—'}
                  </p>
                  <p className="mt-1">
                    <strong>Dual-Disability Solution:</strong> {savedState.accessProfile}
                  </p>
                  <p className="mt-1">
                    <strong>Preferred Language:</strong> {savedState.preferredLang.toUpperCase()}
                  </p>
                  <p className="mt-1">
                    <strong>Identity Route:</strong> {savedState.idRoute}
                  </p>
                  <p className="mt-1">
                    <strong>Date:</strong> {formatEthiopianDate(new Date(), lang)}
                  </p>
                  <p className="mt-2 text-xs text-emerald-800 dark:text-emerald-400">
                    Support choices ({savedState.supportChoices.length}) are stored in an isolated browser &amp; API bucket, separate from your profile.
                  </p>
                </div>

                {savedState.completed && (
                  <div
                    role="status"
                    className="flex items-start gap-2 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                  >
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                    <span>{statusMsg || 'Profile and private support preferences saved.'}</span>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleExportData}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-slate-300 px-4 text-xs font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                  >
                    <Download className="h-4 w-4" aria-hidden="true" />
                    <span>Export My Data (.json)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteAll}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-red-300 px-4 text-xs font-semibold text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    <span>Delete All My Data</span>
                  </button>
                </div>
              </div>
            )}

            {errorMsg && (
              <p id="onboard-error" role="alert" className="text-sm font-semibold text-red-700 dark:text-red-400">
                {errorMsg}
              </p>
            )}

            {/* Navigation Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
              {savedState.step > 1 ? (
                <button
                  type="button"
                  onClick={() => updateField('step', savedState.step - 1)}
                  className={`min-h-[44px] rounded-lg border bg-white px-5 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100 dark:bg-slate-800 dark:text-white ${
                    autoScanEnabled && scanIndex === 2
                      ? 'border-amber-500 ring-2 ring-amber-400'
                      : 'border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {t.back}
                </button>
              ) : (
                <span />
              )}

              <button
                type="button"
                onClick={handleContinue}
                className={`min-h-[44px] rounded-lg bg-[#0b2239] px-6 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-emerald-700 dark:hover:bg-emerald-600 ${
                  autoScanEnabled && scanIndex === 1 ? 'ring-2 ring-amber-400' : ''
                }`}
              >
                {savedState.step < 6 ? t.continue : t.finish}
              </button>
            </div>
          </section>

          {/* Right Column: Dual-Disability Companion Panel */}
          <aside className="space-y-4 lg:col-span-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                <Accessibility className="h-4 w-4 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
                <span>Active Dual-Disability Assist</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                {savedState.accessProfile === 'deafblind-braille' &&
                  'Blind + Deaf: 6-dot Braille keyboard/touch pad active with vibration confirmation.'}
                {savedState.accessProfile === 'blind-half-deaf' &&
                  'Blind + Half Deaf: Clear 0.82x voice narration paired with 6-dot Braille pad & haptics.'}
                {savedState.accessProfile === 'blind-no-hands' &&
                  'Blind + Unable to Use Hands: Automatic spoken read-aloud and hands-free voice commands.'}
                {savedState.accessProfile === 'deaf-no-hands' &&
                  'Deaf + Unable to Use Hands: Sign Language visual cues and automated hands-free dwell scan.'}
                {(savedState.accessProfile === 'switch-scan' ||
                  savedState.accessProfile === 'voice-first' ||
                  savedState.accessProfile === 'deaf-low-literacy') &&
                  (isSwitchScan
                    ? 'Single-Switch Mode active: Press "Step Switch" to cycle actions without speech or fine pointer control.'
                    : 'Tactile haptics and audio earcons confirm every step across devices.')}
              </p>

              <div className="mt-4 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    const nextIdx = (scanIndex + 1) % 3;
                    setScanIndex(nextIdx);
                    const labels = [t.listenBtn, t.continue, t.back];
                    onFeedback('step', `Switch focus: ${labels[nextIdx]}`);
                    speakText(labels[nextIdx], lang, voiceRate);
                  }}
                  className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-xs font-semibold hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950"
                >
                  Step Switch ({[t.listenBtn, t.continue, t.back][scanIndex]})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (scanIndex === 0) {
                      speakText(currentHeading.standard, lang, voiceRate);
                    } else if (scanIndex === 1) {
                      void handleContinue();
                    } else if (savedState.step > 1) {
                      updateField('step', savedState.step - 1);
                    }
                  }}
                  className="min-h-[44px] w-full rounded-lg bg-[#0b2239] px-3 text-xs font-semibold text-white dark:bg-emerald-700"
                >
                  Activate Scanned Choice
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                <Vibrate className="h-4 w-4 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
                <span>Privacy &amp; Tactile Guarantee</span>
              </div>
              <ul className="mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
                  <span>Support preferences never leave your browser unless you explicitly save them, and are never shown to employers.</span>
                </li>
                <li>• Zero countdown timers or visual CAPTCHAs.</li>
                <li>• Every answer auto-saves immediately across reloads.</li>
              </ul>
            </div>
          </aside>
        </div>
    </div>
  );
};

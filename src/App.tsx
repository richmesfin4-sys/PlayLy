/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useCallback, useEffect, useState } from 'react';
import { Navbar, type AppSection } from './components/Navbar';
import { MarketplaceView } from './components/MarketplaceView';
import { LearningMediaView } from './components/LearningMediaView';
import {
  OnboardingAuthView,
  type SavedLearnerState,
} from './components/OnboardingAuthView';
import { CareerGatewayView } from './components/CareerGatewayView';
import { INITIAL_PLUGINS } from './data/plugins';
import type { MarketplacePlugin } from './utils/accessibilityLogic';
import { triggerTactileFeedback, type TactilePattern } from './utils/tactileFeedback';
import { getLanguageMeta, type AppLang } from './i18n/translations';

const ONBOARDING_STORAGE_KEY = 'db_onboarding_state_v1';

const DEFAULT_LEARNER_STATE: SavedLearnerState = {
  step: 1,
  accessProfile: 'blind-no-hands',
  name: '',
  phone: '',
  tactilePin: '',
  preferredLang: 'en',
  idRoute: 'partner_referral',
  supportChoices: [],
  completed: false,
  consentGiven: false,
  voiceNoteAttached: false,
};

export default function App() {
  const [activeSection, setActiveSection] = useState<AppSection>('marketplace');
  const [lang, setLang] = useState<AppLang>('en');
  const [darkMode, setDarkMode] = useState(false);
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [audioCueEnabled, setAudioCueEnabled] = useState(false);
  const [liveAnnouncement, setLiveAnnouncement] = useState('');
  const [tactilePulseLabel, setTactilePulseLabel] = useState('');

  const [plugins, setPlugins] = useState<MarketplacePlugin[]>(INITIAL_PLUGINS);
  const [learnerState, setLearnerState] = useState<SavedLearnerState>(() => {
    try {
      const raw = localStorage.getItem(ONBOARDING_STORAGE_KEY);
      return raw ? { ...DEFAULT_LEARNER_STATE, ...JSON.parse(raw) } : DEFAULT_LEARNER_STATE;
    } catch {
      return DEFAULT_LEARNER_STATE;
    }
  });

  // Sync dark mode class on <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // Sync HTML lang & RTL/LTR direction dynamically for all 6 languages
  useEffect(() => {
    const meta = getLanguageMeta(lang);
    document.documentElement.lang = meta.code;
    document.documentElement.dir = meta.dir;
  }, [lang]);

  // Persist learner onboarding state immediately on every change
  useEffect(() => {
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(learnerState));
    } catch {
      // Ignore storage errors
    }
  }, [learnerState]);

  // Load live extension registry from Express API on mount
  useEffect(() => {
    fetch('/api/v1/extensions')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.extensions?.length) {
          setPlugins(data.extensions);
        }
      })
      .catch(() => {
        // Keep initial seed catalog if offline
      });
  }, []);

  const handleFeedback = useCallback(
    (pattern: TactilePattern, announce?: string) => {
      if (announce) setLiveAnnouncement(announce);
      triggerTactileFeedback(pattern, {
        hapticEnabled,
        audioEnabled: audioCueEnabled,
        onVisualPulse: (label) => {
          if (hapticEnabled) setTactilePulseLabel(label);
        },
      });
    },
    [hapticEnabled, audioCueEnabled]
  );

  const handleRatePlugin = async (
    pluginId: string,
    payload: { rating: number; author: string; comment: string; deviceTested: string }
  ): Promise<boolean> => {
    try {
      const res = await fetch(`/api/v1/extensions/${pluginId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.extension) {
          setPlugins((prev) =>
            prev.map((p) => (p.id === pluginId ? data.extension : p))
          );
          return true;
        }
      }
    } catch {
      // Fallback local rating update
    }
    return false;
  };

  const handleDownloadPlugin = async (plugin: MarketplacePlugin) => {
    try {
      const res = await fetch(`/api/v1/extensions/${plugin.id}/download`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.extension) {
          setPlugins((prev) =>
            prev.map((p) => (p.id === plugin.id ? data.extension : p))
          );
        }
      }
    } catch {
      // Keep local download working offline
    }

    if (plugin.scriptSrc) {
      const a = document.createElement('a');
      a.href = plugin.scriptSrc;
      a.download = `${plugin.id}.js`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } else {
      const manifest = {
        name: plugin.slug,
        displayName: plugin.name,
        version: plugin.version,
        publisher: plugin.publisher,
        license: plugin.license,
        description: plugin.longDescription,
        accessibilitySupport: plugin.supportedDisabilities,
        vscodeCommand: plugin.vscodeCommand,
      };
      const blob = new Blob([JSON.stringify(manifest, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${plugin.slug}.vsix-manifest.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }

    handleFeedback('confirm', `Downloaded ${plugin.name}`);
  };

  const handleLaunchDemo = (pluginId: string) => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    if (pluginId === 'auth') {
      setActiveSection('onboarding');
      handleFeedback('step', 'Switched to Accessible Sign-In & Dual-Disability Access');
    } else if (pluginId === 'db-career-gateway') {
      setActiveSection('careers');
      handleFeedback('step', 'Switched to Career Gateway');
    } else {
      setActiveSection('media');
      handleFeedback('step', 'Switched to Track 2 Accessible Learning Media');
    }
  };

  const langClass =
    lang === 'am' || lang === 'ti' ? 'lang-am' : lang === 'ar' ? 'lang-ar' : '';

  return (
    <div
      dir={getLanguageMeta(lang).dir}
      className={`min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100 ${langClass}`}
    >
      <Navbar
        activeSection={activeSection}
        onNavigate={(sec) => {
          window.scrollTo({ top: 0, behavior: 'auto' });
          setActiveSection(sec);
          handleFeedback('tap', `Navigated to ${sec}`);
        }}
        lang={lang}
        onChangeLang={(nextLang) => {
          const meta = getLanguageMeta(nextLang);
          setLang(nextLang);
          handleFeedback('step', `Language switched to ${meta.englishName}`);
        }}
        darkMode={darkMode}
        onToggleDarkMode={() => {
          setDarkMode((d) => !d);
          handleFeedback('tap', !darkMode ? 'High contrast dark mode enabled' : 'Light mode enabled');
        }}
        hapticEnabled={hapticEnabled}
        onToggleHaptic={() => {
          setHapticEnabled((h) => !h);
        }}
        audioCueEnabled={audioCueEnabled}
        onToggleAudioCue={() => {
          setAudioCueEnabled((a) => !a);
        }}
        liveAnnouncement={liveAnnouncement}
        tactilePulseLabel={tactilePulseLabel}
      />

      <main id="main-content" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {activeSection === 'marketplace' && (
          <MarketplaceView
            plugins={plugins}
            lang={lang}
            onRatePlugin={handleRatePlugin}
            onDownloadPlugin={handleDownloadPlugin}
            onLaunchDemo={handleLaunchDemo}
            onFeedback={handleFeedback}
          />
        )}

        {activeSection === 'media' && (
          <LearningMediaView lang={lang} onFeedback={handleFeedback} />
        )}

        {activeSection === 'onboarding' && (
          <OnboardingAuthView
            lang={lang}
            savedState={learnerState}
            onUpdateState={setLearnerState}
            onFeedback={handleFeedback}
          />
        )}

        {activeSection === 'careers' && (
          <CareerGatewayView
            lang={lang}
            savedSupportChoices={learnerState.supportChoices}
            onFeedback={handleFeedback}
          />
        )}
      </main>

      <footer className="mt-12 border-t border-slate-200 bg-white py-6 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <p>
            Digital Bridge Open Accessibility Toolkit · MIT License · Built for Savanna, VS Code &amp; Partner Platforms
          </p>
          <div className="flex flex-wrap gap-4">
            <a href="/savanna/index.html" target="_blank" rel="noopener noreferrer" className="hover:underline">
              Savanna Static Pages
            </a>
            <a href="/savanna/pages/jobs.html" target="_blank" rel="noopener noreferrer" className="hover:underline">
              Savanna Jobs Widget
            </a>
            <a href="/demo/blank.html" target="_blank" rel="noopener noreferrer" className="hover:underline">
              Blank Host Proof
            </a>
            <a href="/docs" target="_blank" rel="noopener noreferrer" className="hover:underline">
              REST API Docs
            </a>
            <a href="/openapi.yaml" target="_blank" rel="noopener noreferrer" className="hover:underline">
              OpenAPI YAML
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

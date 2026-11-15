import React from 'react';
import { Moon, Sun, Volume2, Vibrate, Globe } from 'lucide-react';
import {
  SUPPORTED_LANGUAGES,
  UI_TRANSLATIONS,
  type AppLang,
} from '../i18n/translations';

export type AppSection = 'marketplace' | 'media' | 'onboarding' | 'careers';

interface NavbarProps {
  activeSection: AppSection;
  onNavigate: (section: AppSection) => void;
  lang: AppLang;
  onChangeLang: (lang: AppLang) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  hapticEnabled: boolean;
  onToggleHaptic: () => void;
  audioCueEnabled: boolean;
  onToggleAudioCue: () => void;
  liveAnnouncement: string;
  tactilePulseLabel: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeSection,
  onNavigate,
  lang,
  onChangeLang,
  darkMode,
  onToggleDarkMode,
  hapticEnabled,
  onToggleHaptic,
  audioCueEnabled,
  onToggleAudioCue,
  liveAnnouncement,
  tactilePulseLabel,
}) => {
  const t = UI_TRANSLATIONS[lang].nav;
  const navItems: Array<{ id: AppSection; label: string }> = [
    { id: 'marketplace', label: t.marketplace },
    { id: 'media', label: t.media },
    { id: 'onboarding', label: t.onboarding },
    { id: 'careers', label: t.careers },
  ];

  return (
    <div className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <a href="#main-content" className="skip-link">
        {t.skip}
      </a>

      {/* Strict 3-Zone Top Bar Contract */}
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-4 py-3 sm:px-6 lg:px-8">
          {/* Zone 1: Brand Wordmark */}
          <a
            href="#marketplace"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('marketplace');
            }}
            className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 dark:text-white"
          >
            {t.brand}
          </a>

          {/* Zone 2: 4 Single-line Navigation Links */}
          <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-6">
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`min-h-[44px] px-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                    isActive
                      ? 'border-[#0b2239] text-slate-950 font-semibold dark:border-emerald-400 dark:text-white'
                      : 'border-transparent text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('onboarding')}
              className="min-h-[44px] rounded-lg bg-[#0b2239] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 whitespace-nowrap shrink-0 dark:bg-emerald-700 dark:hover:bg-emerald-600"
            >
              {t.cta}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Nav Row (Visible only < md) */}
      <nav
        aria-label="Mobile navigation"
        className="flex md:hidden items-center gap-2 overflow-x-auto border-t border-slate-200 px-4 py-2 dark:border-slate-800"
      >
        {navItems.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`min-h-[44px] rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-[#0b2239] text-white dark:bg-emerald-700'
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Slim Accessibility Preferences Toolbar */}
      <div
        role="region"
        aria-label="Accessibility controls"
        className="border-t border-slate-200 bg-slate-50 px-4 py-2 dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 sm:px-2 lg:px-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex min-h-[38px] items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
              <Globe className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <label htmlFor="global-lang-select" className="sr-only">
                {t.langLabel}
              </label>
              <select
                id="global-lang-select"
                aria-label={t.langLabel}
                value={lang}
                onChange={(e) => onChangeLang(e.target.value as AppLang)}
                className="min-h-[30px] bg-transparent text-xs font-semibold text-slate-900 focus:outline-none dark:bg-slate-800 dark:text-white"
              >
                {SUPPORTED_LANGUAGES.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.nativeLabel} ({item.englishName})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={onToggleDarkMode}
              aria-pressed={darkMode}
              className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-md border px-3 py-1 text-xs font-semibold whitespace-nowrap ${
                darkMode
                  ? 'border-amber-400 bg-slate-800 text-amber-300'
                  : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-100'
              }`}
            >
              {darkMode ? (
                <Sun className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <Moon className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              <span>{t.contrast}</span>
            </button>

            <button
              type="button"
              onClick={onToggleHaptic}
              aria-pressed={hapticEnabled}
              className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-md border px-3 py-1 text-xs font-semibold whitespace-nowrap ${
                hapticEnabled
                  ? 'border-emerald-700 bg-emerald-700 text-white'
                  : 'border-slate-300 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
              }`}
            >
              <Vibrate className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t.tactile}</span>
            </button>

            <button
              type="button"
              onClick={onToggleAudioCue}
              aria-pressed={audioCueEnabled}
              className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-md border px-3 py-1 text-xs font-semibold whitespace-nowrap ${
                audioCueEnabled
                  ? 'border-[#0b2239] bg-[#0b2239] text-white dark:border-emerald-600 dark:bg-emerald-600'
                  : 'border-slate-300 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
              }`}
            >
              <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t.audio}</span>
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-300">
            {tactilePulseLabel && (
              <span className="font-mono text-emerald-800 dark:text-emerald-300">
                Haptic: {tactilePulseLabel}
              </span>
            )}
            <span className="sr-only" role="status" aria-live="polite">
              {liveAnnouncement}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

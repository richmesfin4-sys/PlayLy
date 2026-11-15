import React, { useEffect, useRef, useState } from 'react';
import {
  Search,
  Star,
  Download,
  Code2,
  Play,
  Check,
  Copy,
  ExternalLink,
  X,
} from 'lucide-react';
import {
  filterPlugins,
  type DisabilityTag,
  type MarketplacePlugin,
  type PluginCategory,
} from '../utils/accessibilityLogic';
import type { TactilePattern } from '../utils/tactileFeedback';
import { UI_TRANSLATIONS, type AppLang } from '../i18n/translations';

interface MarketplaceViewProps {
  plugins: MarketplacePlugin[];
  lang: AppLang;
  onRatePlugin: (
    pluginId: string,
    payload: { rating: number; author: string; comment: string; deviceTested: string }
  ) => Promise<boolean>;
  onDownloadPlugin: (plugin: MarketplacePlugin) => Promise<void>;
  onLaunchDemo: (pluginId: string) => void;
  onFeedback: (pattern: TactilePattern, announce?: string) => void;
}

export const MarketplaceView: React.FC<MarketplaceViewProps> = ({
  plugins,
  lang,
  onRatePlugin,
  onDownloadPlugin,
  onLaunchDemo,
  onFeedback,
}) => {
  const t = UI_TRANSLATIONS[lang].marketplace;
  const navT = UI_TRANSLATIONS[lang].nav;
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<PluginCategory>('all');
  const [disabilityFilter, setDisabilityFilter] = useState<DisabilityTag | 'all'>('all');
  const [sortBy, setSortBy] = useState<'rating' | 'downloads'>('rating');

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modalTab, setModalTab] = useState<'overview' | 'reviews' | 'install'>('overview');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [downloadedId, setDownloadedId] = useState<string | null>(null);

  // Review form state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewAuthor, setReviewAuthor] = useState('');
  const [reviewDevice, setReviewDevice] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const lastTriggerRef = useRef<HTMLButtonElement | null>(null);

  const selectedPlugin = plugins.find((p) => p.id === selectedId) || null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (selectedPlugin && !dialog.open) {
      dialog.showModal();
    } else if (!selectedPlugin && dialog.open) {
      dialog.close();
    }
  }, [selectedPlugin]);

  const closeModal = () => {
    setSelectedId(null);
    setReviewError('');
    setTimeout(() => {
      lastTriggerRef.current?.focus();
    }, 0);
  };

  const openModal = (
    pluginId: string,
    tab: 'overview' | 'reviews' | 'install',
    triggerEl: HTMLButtonElement
  ) => {
    lastTriggerRef.current = triggerEl;
    setModalTab(tab);
    setSelectedId(pluginId);
    onFeedback('step', `Opened details for ${pluginId}`);
  };

  const filtered = filterPlugins(plugins, query, category, disabilityFilter).sort((a, b) =>
    sortBy === 'rating' ? b.ratingAvg - a.ratingAvg : b.downloads - a.downloads
  );

  const handleCopy = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      onFeedback('confirm', 'Copied installation command to clipboard');
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      onFeedback('error', 'Clipboard copy failed');
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlugin) return;
    if (!reviewAuthor.trim() || !reviewComment.trim()) {
      setReviewError('Please enter both your name and your review comment.');
      onFeedback('error', 'Please enter both your name and review comment.');
      return;
    }
    setReviewError('');
    setReviewSubmitting(true);
    const ok = await onRatePlugin(selectedPlugin.id, {
      rating: reviewRating,
      author: reviewAuthor.trim(),
      comment: reviewComment.trim(),
      deviceTested: reviewDevice.trim() || 'Desktop Keyboard & Screen Reader',
    });
    setReviewSubmitting(false);
    if (ok) {
      setReviewAuthor('');
      setReviewDevice('');
      setReviewComment('');
      onFeedback('confirm', 'Thank you. Your rating and review have been saved.');
    } else {
      setReviewError('Could not submit review. Please try again.');
      onFeedback('error', 'Could not submit review.');
    }
  };

  const categories: Array<{ id: PluginCategory; label: string }> = [
    { id: 'all', label: lang === 'am' ? 'ሁሉም' : 'All Plug-ins' },
    { id: 'track-2-media', label: navT.media },
    { id: 'vscode-extension', label: 'VS Code Extensions' },
    { id: 'career-gateway', label: navT.careers },
  ];

  const disabilityOptions: Array<{ id: DisabilityTag | 'all'; label: string }> = [
    { id: 'all', label: 'All Dual-Disability & Access Modes' },
    { id: 'deafblind', label: 'Blind + Deaf (Braille)' },
    { id: 'blind-half-deaf', label: 'Blind + Half Deaf (Voice + Braille)' },
    { id: 'blind-no-hands', label: 'Blind + Unable to Use Hands (Voice Plus)' },
    { id: 'deaf-no-hands', label: 'Deaf + Unable to Use Hands (Sign Language)' },
    { id: 'blind', label: 'Blind / Screen Reader' },
    { id: 'deaf', label: 'Deaf / Sign Language' },
    { id: 'non-speaking', label: 'Non-Speaking / Switch' },
    { id: 'low-literacy', label: 'Low-Literacy / Audio' },
  ];

  return (
    <div className="space-y-10">
      {/* Hero Showcase Split */}
      <section className="grid grid-cols-1 items-stretch gap-8 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 lg:grid-cols-12 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col justify-between gap-6 lg:col-span-7">
          <div className="space-y-4">
            <p className="text-xs font-semibold tracking-wide text-emerald-800 dark:text-emerald-400">
              ALX Digital Bridge · Savanna &amp; VS Code Open Ecosystem
            </p>
            <h1 className="font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl [text-wrap:balance] dark:text-white">
              {t.heroTitle}
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-300">
              {t.heroSubtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onLaunchDemo('db-player')}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#0b2239] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-emerald-700 dark:hover:bg-emerald-600"
            >
              <Play className="h-4 w-4" aria-hidden="true" />
              <span>{t.launchMedia}</span>
            </button>
            <button
              type="button"
              onClick={() => onLaunchDemo('auth')}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
            >
              <span>{t.launchAuth}</span>
            </button>
            <a
              href="/demo/blank.html"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center gap-1.5 px-3 py-2 text-sm font-semibold text-[#0b2239] underline-offset-4 hover:underline dark:text-emerald-400"
            >
              <span>{t.standaloneProof}</span>
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
            <a
              href="/savanna/pages/concept-with-navigation.html"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center gap-1.5 px-3 py-2 text-sm font-semibold text-emerald-800 underline-offset-4 hover:underline dark:text-emerald-300"
            >
              <span>Savanna Static Host</span>
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="relative h-full min-h-[220px] overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800">
            <img
              src="/src/assets/images/marketplace_showcase_banner_1794748146137.jpg"
              alt="Clean developer monitor showing VS Code editor side-by-side with an accessible media player interface"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Search & Filter Toolbar */}
      <section
        aria-label="Filter extensions"
        className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          <div className="md:col-span-6">
            <label
              htmlFor="plugin-search"
              className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-200"
            >
              {t.searchLabel}
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute inset-y-0 start-3.5 my-auto h-4 w-4 text-slate-500"
                aria-hidden="true"
              />
              <input
                id="plugin-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white ps-10 pe-4 text-sm text-slate-900 placeholder:text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
          </div>

          <div className="md:col-span-3">
            <label
              htmlFor="disability-filter"
              className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-200"
            >
              {t.needLabel}
            </label>
            <select
              id="disability-filter"
              value={disabilityFilter}
              onChange={(e) => setDisabilityFilter(e.target.value as DisabilityTag | 'all')}
              className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            >
              {disabilityOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <label
              htmlFor="sort-select"
              className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-200"
            >
              {t.sortLabel}
            </label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'rating' | 'downloads')}
              className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            >
              <option value="rating">{t.sortRating}</option>
              <option value="downloads">{t.sortDownloads}</option>
            </select>
          </div>
        </div>

        {/* Interactive Category Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg bg-slate-100 p-1.5 dark:bg-slate-950">
          {categories.map((cat) => {
            const active = category === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setCategory(cat.id);
                  onFeedback('tap');
                }}
                aria-pressed={active}
                className={`min-h-[40px] rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-white text-slate-950 shadow-sm dark:bg-slate-800 dark:text-white'
                    : 'text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Extension Cards Grid */}
      <section aria-label="Community extensions and plug-ins">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-slate-950 dark:text-white">
            {t.availableHeading} ({filtered.length})
          </h2>
          <a
            href="/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-[#0b2239] hover:underline dark:text-emerald-400"
          >
            Level 2 REST API Docs
          </a>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              {t.emptyTitle}
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t.emptyBody}</p>
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setCategory('all');
                setDisabilityFilter('all');
              }}
              className="mt-4 min-h-[44px] rounded-lg bg-[#0b2239] px-5 py-2 text-sm font-semibold text-white dark:bg-emerald-700"
            >
              {t.clearFilters}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((plugin) => (
              <article
                key={plugin.id}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <span>{plugin.kind}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">v{plugin.version}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">{plugin.sizeKb} KB</span>
                  </div>

                  <h3 className="font-display text-lg font-bold text-slate-950 dark:text-white">
                    {plugin.name}
                  </h3>

                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    {plugin.publisher}
                  </p>

                  <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    {plugin.shortDescription}
                  </p>

                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Supports: {plugin.supportedDisabilities.join(' · ')}
                  </p>
                </div>

                <div className="mt-6 space-y-4 border-t border-slate-100 pt-4 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <Star className="h-4 w-4 fill-amber-500 text-amber-500" aria-hidden="true" />
                      <strong>{plugin.ratingAvg.toFixed(1)}</strong> ({plugin.ratingCount})
                    </span>
                    <span className="tabular-nums">
                      {plugin.downloads.toLocaleString()} {t.downloadsLabel}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => openModal(plugin.id, 'overview', e.currentTarget)}
                      className="min-h-[44px] flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
                    >
                      {t.inspect}
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await onDownloadPlugin(plugin);
                        setDownloadedId(plugin.id);
                        setTimeout(() => setDownloadedId(null), 2200);
                      }}
                      className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg bg-[#0b2239] px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-emerald-700 dark:hover:bg-emerald-600"
                    >
                      {downloadedId === plugin.id ? (
                        <>
                          <Check className="h-4 w-4" aria-hidden="true" />
                          <span>Saved</span>
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4" aria-hidden="true" />
                          <span>{t.download}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Accessible <dialog> Detail, Review & Embed Modal */}
      <dialog
        ref={dialogRef}
        onCancel={(e) => {
          e.preventDefault();
          closeModal();
        }}
        aria-labelledby="plugin-modal-title"
        className="m-auto w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/60 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
      >
        {selectedPlugin && (
          <div className="flex max-h-[90vh] flex-col">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-6 dark:border-slate-800">
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {selectedPlugin.publisher} · v{selectedPlugin.version} · {selectedPlugin.license}
                </p>
                <h2 id="plugin-modal-title" className="mt-1 font-display text-xl font-bold">
                  {selectedPlugin.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Close extension details"
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="flex gap-2 border-b border-slate-200 bg-slate-50 px-6 py-2 dark:border-slate-800 dark:bg-slate-950">
              {(
                [
                  { id: 'overview', label: 'Overview' },
                  { id: 'reviews', label: `Ratings & Reviews (${selectedPlugin.ratingCount})` },
                  { id: 'install', label: 'Embed & VS Code' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setModalTab(tab.id)}
                  aria-pressed={modalTab === tab.id}
                  className={`min-h-[40px] rounded-md px-3.5 text-sm font-semibold ${
                    modalTab === tab.id
                      ? 'bg-white text-slate-950 shadow-sm dark:bg-slate-800 dark:text-white'
                      : 'text-slate-600 hover:text-slate-950 dark:text-slate-400'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-6">
              {modalTab === 'overview' && (
                <>
                  <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    {selectedPlugin.longDescription}
                  </p>
                  <div>
                    <h3 className="mb-2 text-sm font-bold text-slate-900 dark:text-white">
                      Verified Accessibility Capabilities
                    </h3>
                    <ul className="list-disc space-y-1.5 ps-5 text-sm text-slate-700 dark:text-slate-300">
                      {selectedPlugin.features.map((feat) => (
                        <li key={feat}>{feat}</li>
                      ))}
                    </ul>
                  </div>
                  {(selectedPlugin.id === 'db-player' || selectedPlugin.id === 'db-career-gateway') && (
                    <button
                      type="button"
                      onClick={() => {
                        const target = selectedPlugin.id;
                        closeModal();
                        onLaunchDemo(target);
                      }}
                      className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#0b2239] px-4 py-2 text-sm font-semibold text-white dark:bg-emerald-700"
                    >
                      <Play className="h-4 w-4" aria-hidden="true" />
                      <span>Open Interactive Live Showcase</span>
                    </button>
                  )}
                </>
              )}

              {modalTab === 'reviews' && (
                <div className="space-y-6">
                  <form onSubmit={handleReviewSubmit} noValidate className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                    <h3 className="text-sm font-bold">Rate &amp; Review This Plug-in</h3>

                    <fieldset>
                      <legend className="mb-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Star Rating
                      </legend>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewRating(star)}
                            aria-label={`${star} star${star > 1 ? 's' : ''}`}
                            aria-pressed={reviewRating === star}
                            className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border text-sm font-bold ${
                              reviewRating >= star
                                ? 'border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'border-slate-300 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-900'
                            }`}
                          >
                            {star}★
                          </button>
                        ))}
                      </div>
                    </fieldset>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label htmlFor="rev-author" className="mb-1 block text-xs font-semibold">
                          Your Name
                        </label>
                        <input
                          id="rev-author"
                          type="text"
                          value={reviewAuthor}
                          onChange={(e) => setReviewAuthor(e.target.value)}
                          className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
                        />
                      </div>
                      <div>
                        <label htmlFor="rev-device" className="mb-1 block text-xs font-semibold">
                          Device / Screen Reader Tested
                        </label>
                        <input
                          id="rev-device"
                          type="text"
                          placeholder="e.g. Android TalkBack / NVDA"
                          value={reviewDevice}
                          onChange={(e) => setReviewDevice(e.target.value)}
                          className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="rev-comment" className="mb-1 block text-xs font-semibold">
                        Accessibility &amp; Usability Review
                      </label>
                      <textarea
                        id="rev-comment"
                        rows={3}
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-900"
                      />
                    </div>

                    {reviewError && (
                      <p role="alert" className="text-sm font-semibold text-red-700 dark:text-red-400">
                        {reviewError}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={reviewSubmitting}
                      className="min-h-[44px] rounded-lg bg-[#0b2239] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 dark:bg-emerald-700"
                    >
                      {reviewSubmitting ? 'Saving...' : 'Submit Rating & Review'}
                    </button>
                  </form>

                  <div className="space-y-3">
                    {selectedPlugin.reviews.map((rev) => (
                      <div
                        key={rev.id}
                        className="rounded-xl border border-slate-200 p-4 dark:border-slate-800"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400">
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {rev.author} · {rev.rating}★
                          </span>
                          <span>
                            {rev.deviceTested} · {rev.createdAt}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                          {rev.comment}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {modalTab === 'install' && (
                <div className="space-y-4">
                  {selectedPlugin.embedTag && selectedPlugin.scriptSrc && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold">Level 1 Web Embed (1 Script Tag)</h3>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(
                              'embed',
                              `<script src="${window.location.origin}${selectedPlugin.scriptSrc}" defer></script>\n${selectedPlugin.embedTag}`
                            )
                          }
                          className="inline-flex min-h-[38px] items-center gap-1.5 rounded-md border border-slate-300 px-3 text-xs font-semibold dark:border-slate-700"
                        >
                          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>{copiedKey === 'embed' ? 'Copied' : 'Copy HTML'}</span>
                        </button>
                      </div>
                      <pre className="overflow-x-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-100">
                        {`<script src="${selectedPlugin.scriptSrc}" defer></script>\n${selectedPlugin.embedTag}`}
                      </pre>
                    </div>
                  )}

                  {selectedPlugin.vscodeCommand && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="inline-flex items-center gap-1.5 text-sm font-bold">
                          <Code2 className="h-4 w-4" aria-hidden="true" />
                          <span>VS Code CLI Install</span>
                        </h3>
                        <button
                          type="button"
                          onClick={() => handleCopy('vscode', selectedPlugin.vscodeCommand || '')}
                          className="inline-flex min-h-[38px] items-center gap-1.5 rounded-md border border-slate-300 px-3 text-xs font-semibold dark:border-slate-700"
                        >
                          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>{copiedKey === 'vscode' ? 'Copied' : 'Copy CLI'}</span>
                        </button>
                      </div>
                      <pre className="overflow-x-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-100">
                        {selectedPlugin.vscodeCommand}
                      </pre>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => onDownloadPlugin(selectedPlugin)}
                      className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#0b2239] px-4 py-2 text-sm font-semibold text-white dark:bg-emerald-700"
                    >
                      <Download className="h-4 w-4" aria-hidden="true" />
                      <span>Download Plug-in Bundle</span>
                    </button>
                    <a
                      href="/demo/blank.html"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold dark:border-slate-700"
                    >
                      <span>Test on Blank Page</span>
                      <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
};

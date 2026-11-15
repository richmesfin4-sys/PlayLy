import React, { useEffect, useRef, useState } from 'react';
import {
  Volume2,
  ShieldCheck,
  Award,
  CheckCircle2,
  AlertTriangle,
  Briefcase,
  Code,
  X,
} from 'lucide-react';
import { SEED_CERTIFICATES, SEED_JOBS } from '../data/jobsAndBadges';
import {
  filterJobsBySupport,
  verifyBadgeSignature,
  type JobListing,
  type OpenBadgeCredential,
} from '../utils/accessibilityLogic';
import { speakText, type TactilePattern } from '../utils/tactileFeedback';
import { UI_TRANSLATIONS, type AppLang } from '../i18n/translations';

interface CareerGatewayViewProps {
  lang: AppLang;
  savedSupportChoices: string[];
  onFeedback: (pattern: TactilePattern, announce?: string) => void;
}

export const CareerGatewayView: React.FC<CareerGatewayViewProps> = ({
  lang,
  savedSupportChoices,
  onFeedback,
}) => {
  const t = UI_TRANSLATIONS[lang].careers;
  const [onlyMatching, setOnlyMatching] = useState(false);
  const [showSchemaJobId, setShowSchemaJobId] = useState<string | null>(null);
  const [applyJob, setApplyJob] = useState<JobListing | null>(null);
  const [applicantName, setApplicantName] = useState('');
  const [applicantNote, setApplicantNote] = useState('');
  const [requestAccommodation, setRequestAccommodation] = useState(false);
  const [applyError, setApplyError] = useState('');
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>([]);

  // Open Badges 3.0 Verifier state
  const [selectedCertIdx, setSelectedCertIdx] = useState(0);
  const [tampered, setTampered] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{ valid: boolean; reason: string } | null>(
    null
  );

  const applyDialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const dlg = applyDialogRef.current;
    if (!dlg) return;
    if (applyJob && !dlg.open) dlg.showModal();
    else if (!applyJob && dlg.open) dlg.close();
  }, [applyJob]);

  const filteredJobs = filterJobsBySupport(SEED_JOBS, savedSupportChoices, onlyMatching);

  const activeCert: OpenBadgeCredential = {
    ...SEED_CERTIFICATES[selectedCertIdx],
    recipientName: tampered
      ? 'Modified Recipient Name'
      : SEED_CERTIFICATES[selectedCertIdx].recipientName,
  };

  const handleVerifyCert = async () => {
    try {
      const res = await fetch('/api/v1/certificates/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activeCert),
      });
      if (res.ok) {
        const data = await res.json();
        setVerifyResult(data);
        onFeedback(data.valid ? 'confirm' : 'error', data.reason);
        return;
      }
    } catch {
      // Fallback to client verification
    }
    const localVerdict = verifyBadgeSignature(activeCert);
    setVerifyResult(localVerdict);
    onFeedback(localVerdict.valid ? 'confirm' : 'error', localVerdict.reason);
  };

  const handleSubmitApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyJob) return;
    if (!applicantName.trim()) {
      setApplyError('Please enter your name or tactile identifier.');
      onFeedback('error', 'Please enter your name.');
      return;
    }
    setApplyError('');
    setAppliedJobIds((prev) => [...prev, applyJob.id]);
    const jobTitle = applyJob.title;
    setApplicantName('');
    setApplicantNote('');
    setRequestAccommodation(false);
    setApplyJob(null);
    onFeedback('confirm', `Application submitted for ${jobTitle}`);
  };

  const buildSchemaJsonLd = (job: JobListing) =>
    JSON.stringify(
      {
        '@context': 'https://schema.org',
        '@type': 'JobPosting',
        title: job.title,
        description: job.summary,
        datePosted: job.postedDate,
        employmentType: job.employmentType,
        jobLocationType: job.remote ? 'TELECOMMUTE' : 'ON_SITE',
        hiringOrganization: { '@type': 'Organization', name: job.organization },
        jobLocation: {
          '@type': 'Place',
          address: {
            '@type': 'PostalAddress',
            addressLocality: job.location,
            addressCountry: 'ET',
          },
        },
        jobBenefits: job.accommodations.join(', '),
      },
      null,
      2
    );

  return (
    <div className="space-y-10">
      {/* Header & Private Support Filter */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-400">
              Career Gateway · schema.org/JobPosting · Open Badges 3.0
            </p>
            <h1 className="font-display text-2xl font-bold text-slate-950 dark:text-white">
              {t.title}
            </h1>
            <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-300">
              {t.subtitle}
            </p>
          </div>

          <div className="flex flex-col items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
            <label className="flex min-h-[40px] cursor-pointer items-center gap-2.5 text-sm font-semibold">
              <input
                type="checkbox"
                checked={onlyMatching}
                onChange={(e) => {
                  setOnlyMatching(e.target.checked);
                  onFeedback('tap', e.target.checked ? 'Showing jobs matching your private support choices' : 'Showing all jobs');
                }}
                className="h-5 w-5 accent-[#0b2239] dark:accent-emerald-500"
              />
              <span>{t.matchLabel}</span>
            </label>
            <p className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
              <span>
                {savedSupportChoices.length > 0
                  ? `${savedSupportChoices.length} private preferences active locally`
                  : 'Set support preferences in Accessible Sign-In to filter'}
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* Accessible Job Cards Grid (200%-Zoom Safe) */}
      <section aria-label="Inclusive job postings" className="space-y-4">
        <h2 className="font-display text-xl font-bold text-slate-950 dark:text-white">
          {t.openRoles} ({filteredJobs.length})
        </h2>

        {filteredJobs.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-semibold">No jobs matched your active private filter.</p>
            <button
              type="button"
              onClick={() => setOnlyMatching(false)}
              className="mt-3 min-h-[44px] rounded-lg bg-[#0b2239] px-4 text-sm font-semibold text-white dark:bg-emerald-700"
            >
              Show All Jobs
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {filteredJobs.map((job) => {
              const applied = appliedJobIds.includes(job.id);
              const showingSchema = showSchemaJobId === job.id;
              return (
                <article
                  key={job.id}
                  className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <span>{job.organization}</span>
                      <span aria-hidden="true">·</span>
                      <span>{job.location}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{job.salaryRangeEtb}</span>
                    </div>

                    <h3 className="font-display text-lg font-bold text-slate-950 dark:text-white">
                      {job.title}
                    </h3>

                    <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                      {lang === 'am' ? job.summaryAm : job.summary}
                    </p>

                    <div className="space-y-1 pt-1">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Verified Employer Accommodations:
                      </p>
                      <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                        {job.accommodations.join(' · ')}
                      </p>
                    </div>

                    {job.matchedAccommodations.length > 0 && (
                      <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-400">
                        Local match: {job.matchedAccommodations.join(', ')}
                      </p>
                    )}

                    {showingSchema && (
                      <pre className="max-h-48 overflow-auto rounded-lg bg-slate-950 p-3 text-[11px] text-slate-100">
                        {buildSchemaJsonLd(job)}
                      </pre>
                    )}
                  </div>

                  <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        const text = `${job.title} at ${job.organization}. ${lang === 'am' ? job.summaryAm : job.summary}. Accommodations: ${job.accommodations.join(', ')}.`;
                        speakText(text, lang);
                        onFeedback('pulse', `Reading summary for ${job.title}`);
                      }}
                      className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      <Volume2 className="h-4 w-4" aria-hidden="true" />
                      <span>{t.listenSummary}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowSchemaJobId(showingSchema ? null : job.id)}
                      aria-expanded={showingSchema}
                      className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      <Code className="h-4 w-4" aria-hidden="true" />
                      <span>JSON-LD</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setApplyJob(job)}
                      disabled={applied}
                      className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#0b2239] px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:bg-emerald-700 dark:bg-emerald-700"
                    >
                      <Briefcase className="h-4 w-4" aria-hidden="true" />
                      <span>{applied ? t.applied : t.apply}</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Level 3: Open Badges 3.0 Verifiable Certificate Page */}
      <section
        aria-label="Open Badges 3.0 Certificate Verifier"
        className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <Award className="h-6 w-6 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
            <div>
              <h2 className="font-display text-xl font-bold text-slate-950 dark:text-white">
                {t.verifierTitle}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Employers can open this verification link to confirm graduate credentials cryptographically.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {SEED_CERTIFICATES.map((cert, idx) => (
              <button
                key={cert.id}
                type="button"
                onClick={() => {
                  setSelectedCertIdx(idx);
                  setTampered(false);
                  setVerifyResult(null);
                }}
                aria-pressed={selectedCertIdx === idx}
                className={`min-h-[40px] rounded-lg border px-3 text-xs font-semibold ${
                  selectedCertIdx === idx
                    ? 'border-[#0b2239] bg-[#0b2239] text-white dark:border-emerald-500 dark:bg-emerald-700'
                    : 'border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950'
                }`}
              >
                {cert.recipientName}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-3 lg:col-span-7">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Issuer: {activeCert.issuer.name} · Issued {activeCert.issuedOn}
            </p>
            <h3 className="font-display text-lg font-bold text-slate-950 dark:text-white">
              {activeCert.achievementTitle}
            </h3>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Recipient: <strong>{activeCert.recipientName}</strong>
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {activeCert.achievementDescription}
            </p>
            <p className="font-mono text-xs text-slate-600 dark:text-slate-400">
              Signature: {activeCert.signatureHash}
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={handleVerifyCert}
                className="min-h-[44px] rounded-lg bg-[#0b2239] px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-emerald-700"
              >
                {t.verifyBtn}
              </button>
              <button
                type="button"
                onClick={() => {
                  setTampered((v) => !v);
                  setVerifyResult(null);
                }}
                className="min-h-[44px] rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                {tampered ? 'Restore Original Name' : 'Simulate Payload Tampering'}
              </button>
            </div>

            {verifyResult && (
              <div
                role="status"
                className={`mt-3 flex items-start gap-2.5 rounded-xl border p-4 text-sm font-semibold ${
                  verifyResult.valid
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                    : 'border-red-300 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-200'
                }`}
              >
                {verifyResult.valid ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                ) : (
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                )}
                <div>
                  <div>{verifyResult.valid ? 'Valid Credential' : 'Not Valid'}</div>
                  <div className="text-xs font-normal">{verifyResult.reason}</div>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-5">
            <pre className="max-h-72 overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-100">
              {JSON.stringify(activeCert, null, 2)}
            </pre>
          </div>
        </div>
      </section>

      {/* Accessible Job Application <dialog> */}
      <dialog
        ref={applyDialogRef}
        onCancel={(e) => {
          e.preventDefault();
          setApplyJob(null);
        }}
        aria-labelledby="apply-title"
        className="m-auto w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl backdrop:bg-slate-950/60 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
      >
        {applyJob && (
          <form onSubmit={handleSubmitApplication} noValidate className="space-y-4">
            <div className="flex items-start justify-between gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400">{applyJob.organization}</p>
                <h2 id="apply-title" className="font-display text-lg font-bold">
                  Apply: {applyJob.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setApplyJob(null)}
                aria-label="Close application form"
                className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-slate-300 dark:border-slate-700"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div>
              <label htmlFor="apply-name" className="mb-1 block text-sm font-semibold">
                Your Name or Tactile ID
              </label>
              <input
                id="apply-name"
                type="text"
                value={applicantName}
                onChange={(e) => setApplicantName(e.target.value)}
                className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
              />
            </div>

            <div>
              <label htmlFor="apply-note" className="mb-1 block text-sm font-semibold">
                Short Skills Summary (Optional)
              </label>
              <textarea
                id="apply-note"
                rows={3}
                value={applicantNote}
                onChange={(e) => setApplicantNote(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-950"
              />
            </div>

            <label className="flex min-h-[44px] cursor-pointer items-center gap-2.5 text-sm">
              <input
                type="checkbox"
                checked={requestAccommodation}
                onChange={(e) => setRequestAccommodation(e.target.checked)}
                className="h-5 w-5 accent-[#0b2239] dark:accent-emerald-500"
              />
              <span>I need an accommodation for my interview (e.g., interpreter or written chat)</span>
            </label>

            {applyError && (
              <p role="alert" className="text-sm font-semibold text-red-700 dark:text-red-400">
                {applyError}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setApplyJob(null)}
                className="min-h-[44px] rounded-lg border border-slate-300 px-4 text-sm font-semibold dark:border-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="min-h-[44px] rounded-lg bg-[#0b2239] px-5 text-sm font-semibold text-white dark:bg-emerald-700"
              >
                Submit Application
              </button>
            </div>
          </form>
        )}
      </dialog>
    </div>
  );
};

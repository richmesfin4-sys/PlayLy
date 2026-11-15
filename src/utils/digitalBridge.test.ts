import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseVtt,
  findActiveCue,
  exportToVtt,
  exportToBrf,
  formatDisplayTime,
} from './vttParser';
import {
  normalizeEthiopianPhone,
  filterPlugins,
  computeNewRating,
  filterJobsBySupport,
  computeCredentialChecksum,
  verifyBadgeSignature,
  decodeBrailleDots,
  type MarketplacePlugin,
  type JobListing,
  type OpenBadgeCredential,
} from './accessibilityLogic';
import { SUPPORTED_LANGUAGES, getLanguageMeta } from '../i18n/translations';
import { getSpeechLocale } from './tactileFeedback';
import { LESSON_VTT_BY_LANG } from '../data/lessonMedia';

const SAMPLE_VTT = `WEBVTT

1
00:00:00.000 --> 00:00:04.500
[soft chimes] Welcome to Digital Bridge.

2
00:00:05.000 --> 00:00:09.500
Captions and sign language work together.
`;

test('parseVtt parses cues, sound tags, and active cue lookup accurately', () => {
  const cues = parseVtt(SAMPLE_VTT);
  assert.equal(cues.length, 2);
  assert.equal(cues[0].isSoundCue, true);
  assert.equal(cues[1].isSoundCue, false);
  assert.equal(cues[1].start, 5);
  assert.equal(cues[1].end, 9.5);

  const active = findActiveCue(cues, 6.2);
  assert.ok(active);
  assert.equal(active.id, '2');
  assert.equal(findActiveCue(cues, 4.7), null);
});

test('exportToVtt and exportToBrf produce valid outputs', () => {
  const cues = parseVtt(SAMPLE_VTT);
  const vttOut = exportToVtt(cues);
  assert.ok(vttOut.startsWith('WEBVTT'));
  assert.ok(vttOut.includes('00:05.000 --> 00:09.500'));

  const brf = exportToBrf(cues, 'Lesson 1');
  assert.ok(brf.includes('LESSON #A'));
  assert.ok(brf.includes('#J#J3#J#J'));
  assert.equal(formatDisplayTime(65), '01:05');
});

test('normalizeEthiopianPhone accepts 09, 07, and +251 formats', () => {
  assert.deepEqual(normalizeEthiopianPhone('0911223344'), {
    valid: true,
    normalized: '+251911223344',
  });
  assert.deepEqual(normalizeEthiopianPhone('0712345678'), {
    valid: true,
    normalized: '+251712345678',
  });
  assert.deepEqual(normalizeEthiopianPhone('+251 911 223 344'), {
    valid: true,
    normalized: '+251911223344',
  });
  const bad = normalizeEthiopianPhone('12345');
  assert.equal(bad.valid, false);
  assert.ok(bad.errorAm);
});

test('filterPlugins and computeNewRating behave deterministically', () => {
  const sample: MarketplacePlugin[] = [
    {
      id: 'p1',
      slug: 'db-player',
      name: 'Digital Bridge Player',
      publisher: 'ALX Team',
      version: '1.2.0',
      category: 'track-2-media',
      kind: 'Web Plug-in + VS Code',
      shortDescription: 'Accessible player with EthSL window',
      longDescription: 'Full captions and Braille export',
      ratingAvg: 4.5,
      ratingCount: 2,
      downloads: 100,
      sizeKb: 18,
      license: 'MIT',
      supportedDisabilities: ['deaf', 'blind'],
      supportsOffline: true,
      features: ['Captions', 'Sign language'],
      reviews: [],
    },
    {
      id: 'p2',
      slug: 'ethiotactile-bridge',
      name: 'EthioTactile Bridge',
      publisher: 'ALX Team',
      version: '1.0.0',
      category: 'vscode-extension',
      kind: 'VS Code Extension',
      shortDescription: 'Tactile Braille support for deafblind developers',
      longDescription: 'Screen reader and tactile cadences',
      ratingAvg: 5,
      ratingCount: 1,
      downloads: 50,
      sizeKb: 12,
      license: 'MIT',
      supportedDisabilities: ['deafblind', 'non-speaking'],
      supportsOffline: true,
      features: ['Braille pad'],
      reviews: [],
    },
  ];

  assert.equal(filterPlugins(sample, 'ethsl', 'all', 'all').length, 1);
  assert.equal(filterPlugins(sample, '', 'vscode-extension', 'deafblind').length, 1);
  assert.equal(filterPlugins(sample, '', 'track-2-media', 'deafblind').length, 0);

  const updated = computeNewRating(4.5, 2, 5);
  assert.equal(updated.ratingCount, 3);
  assert.equal(updated.ratingAvg, 4.67);
});

test('filterJobsBySupport runs locally without losing non-matching when disabled', () => {
  const jobs: JobListing[] = [
    {
      id: 'j1',
      title: 'Accessible QA Tester',
      organization: 'Addis Tech',
      location: 'Addis Ababa',
      remote: true,
      employmentType: 'FULL_TIME',
      salaryRangeEtb: '18,000 - 25,000 ETB',
      summary: 'Screen reader testing',
      summaryAm: 'የስክሪን አንባቢ ሙከራ',
      accommodations: ['Screen reader compatible workspace', 'Captions on all meetings'],
      postedDate: '2026-11-14',
    },
    {
      id: 'j2',
      title: 'Data Entry Specialist',
      organization: 'EthioLogistics',
      location: 'Hawassa',
      remote: false,
      employmentType: 'PART_TIME',
      salaryRangeEtb: '12,000 ETB',
      summary: 'Office logistics',
      summaryAm: 'የቢሮ መረጃ',
      accommodations: ['Flexible hours'],
      postedDate: '2026-11-12',
    },
  ];

  const matched = filterJobsBySupport(jobs, ['captions', 'prefer_not_to_say'], true);
  assert.equal(matched.length, 1);
  assert.equal(matched[0].id, 'j1');
  assert.equal(filterJobsBySupport(jobs, ['captions'], false).length, 2);
});

test('Open Badges 3.0 checksum verification detects tampering', () => {
  const base = {
    id: 'urn:uuid:db-cert-2026-001',
    type: ['VerifiableCredential', 'OpenBadgeCredential'],
    issuer: { id: 'https://alxafrica.com/digital-bridge', name: 'ALX Digital Bridge Ethiopia' },
    recipientName: 'Abebe Bikila',
    achievementTitle: 'Accessible Web Engineering Track 2',
    achievementDescription: 'Completed accessible media & caption pipeline.',
    issuedOn: '2026-11-15',
  };
  const validCred: OpenBadgeCredential = {
    ...base,
    signatureHash: computeCredentialChecksum(base),
  };

  assert.equal(verifyBadgeSignature(validCred).valid, true);
  assert.equal(
    verifyBadgeSignature({ ...validCred, recipientName: 'Tampered Name' }).valid,
    false
  );
});

test('decodeBrailleDots decodes 6-dot Perkins chords accurately', () => {
  assert.equal(decodeBrailleDots([1]), 'A');
  assert.equal(decodeBrailleDots([1, 2]), 'B');
  assert.equal(decodeBrailleDots([1, 3, 4, 5]), 'N');
  assert.equal(decodeBrailleDots([6, 4, 2, 5]), 'W');
  assert.equal(decodeBrailleDots([]), null);
});

test('6-language metadata, speech locales, and Arabic RTL direction are consistent', () => {
  assert.equal(SUPPORTED_LANGUAGES.length, 6);
  const codes = SUPPORTED_LANGUAGES.map((l) => l.code);
  assert.deepEqual(codes, ['en', 'am', 'ti', 'om', 'ar', 'so']);
  assert.equal(getLanguageMeta('ar').dir, 'rtl');
  assert.equal(getLanguageMeta('ti').dir, 'ltr');
  assert.equal(getSpeechLocale('ti'), 'ti-ET');
  assert.equal(getSpeechLocale('om'), 'om-ET');
  assert.equal(getSpeechLocale('ar'), 'ar-SA');
  assert.equal(getSpeechLocale('so'), 'so-SO');
});

test('filterPlugins and filterJobsBySupport handle all 4 dual-disability solution profiles', () => {
  const dualPlugins: MarketplacePlugin[] = [
    {
      id: 'p-dual-1',
      slug: 'db-player',
      name: 'Digital Bridge Player',
      publisher: 'ALX',
      version: '1.0.0',
      category: 'track-2-media',
      kind: 'Web Plug-in + VS Code',
      shortDescription: 'Braille, Voice + Braille, Voice Plus, Sign Language',
      longDescription: 'Supports all dual disabilities',
      ratingAvg: 5,
      ratingCount: 3,
      downloads: 400,
      sizeKb: 14,
      license: 'MIT',
      supportedDisabilities: ['deafblind', 'blind-half-deaf', 'blind-no-hands', 'deaf-no-hands'],
      supportsOffline: true,
      features: ['6-dot Braille', 'Voice Plus', 'EthSL'],
      reviews: [],
    },
  ];

  assert.equal(filterPlugins(dualPlugins, '', 'all', 'deafblind').length, 1);
  assert.equal(filterPlugins(dualPlugins, '', 'all', 'blind-half-deaf').length, 1);
  assert.equal(filterPlugins(dualPlugins, '', 'all', 'blind-no-hands').length, 1);
  assert.equal(filterPlugins(dualPlugins, '', 'all', 'deaf-no-hands').length, 1);

  const jobs: JobListing[] = [
    {
      id: 'j-voice',
      title: 'Voice QA Lead',
      organization: 'Bridge Tech',
      location: 'Addis Ababa',
      remote: true,
      employmentType: 'FULL_TIME',
      salaryRangeEtb: '20,000 ETB',
      summary: 'Screen reader and async workflow',
      summaryAm: 'የስክሪን አንባቢ',
      accommodations: ['Screen reader compatible', 'Async communication'],
      postedDate: '2026-11-15',
    },
    {
      id: 'j-sign',
      title: 'Visual Accessibility Reviewer',
      organization: 'Addis Studio',
      location: 'Remote',
      remote: true,
      employmentType: 'PART_TIME',
      salaryRangeEtb: '16,000 ETB',
      summary: 'Sign language team reviews',
      summaryAm: 'የምልክት ቋንቋ',
      accommodations: ['Ethiopian Sign Language interpreter', 'Visual alerts'],
      postedDate: '2026-11-15',
    },
  ];

  const voiceMatched = filterJobsBySupport(jobs, ['voice_plus'], true);
  assert.equal(voiceMatched.length, 1);
  assert.equal(voiceMatched[0].id, 'j-voice');

  const signMatched = filterJobsBySupport(jobs, ['hands_free_sign'], true);
  assert.equal(signMatched.length, 2);
});

test('LESSON_VTT_BY_LANG parses cleanly for all 6 languages with 8 cues each', () => {
  for (const lang of ['en', 'am', 'ti', 'om', 'ar', 'so'] as const) {
    const cues = parseVtt(LESSON_VTT_BY_LANG[lang]);
    assert.equal(cues.length, 8, `Expected 8 cues for ${lang}`);
  }
});

import {
  computeCredentialChecksum,
  type JobListing,
  type OpenBadgeCredential,
} from '../utils/accessibilityLogic';

export const SEED_JOBS: JobListing[] = [
  {
    id: 'job-1',
    title: 'Junior Accessibility QA Specialist',
    organization: 'Addis Civic Tech PLC',
    location: 'Addis Ababa (Remote Optional)',
    remote: true,
    employmentType: 'FULL_TIME',
    salaryRangeEtb: '22,000 - 30,000 ETB / mo',
    summary:
      'Test web apps and VS Code plugins with NVDA, TalkBack, keyboard-only navigation, and caption verification.',
    summaryAm:
      'ድረ-ገጾችን እና የVS Code ፕለጊኖችን በNVDA፣ TalkBack እና በኪቦርድ ብቻ በመጠቀም ተደራሽነታቸውን ይፈትሹ።',
    accommodations: [
      'Screen reader compatible workspace',
      'Captions on all meetings',
      'Braille display stipend',
      'Flexible async hours',
    ],
    postedDate: '2026-11-14',
  },
  {
    id: 'job-2',
    title: 'Amharic & EthSL Caption Editor',
    organization: 'Savanna Learning Studios',
    location: 'Addis Ababa / Hybrid',
    remote: true,
    employmentType: 'PART_TIME',
    salaryRangeEtb: '16,000 - 21,000 ETB / mo',
    summary:
      'Review machine-generated Amharic and English WebVTT subtitles, add sound cues, and verify EthSL interpreter sync.',
    summaryAm:
      'የአማርኛ እና የእንግሊዝኛ ጽሑፍ መግለጫዎችን ያርሙ፣ የድምፅ ምልክቶችን ይጨምሩ እና የምልክት ቋንቋ ስምምነትን ያረጋግጡ።',
    accommodations: [
      'Ethiopian Sign Language interpreter for interviews',
      'Captions on all meetings',
      'Visual async communication (no phone calls required)',
    ],
    postedDate: '2026-11-13',
  },
  {
    id: 'job-3',
    title: 'Remote Virtual Assistant (Inclusive Operations)',
    organization: 'Horn Digital Partners',
    location: 'Remote (Ethiopia)',
    remote: true,
    employmentType: 'FULL_TIME',
    salaryRangeEtb: '18,000 - 24,000 ETB / mo',
    summary:
      'Manage scheduling, inbox triage, and accessible client documentation using structured templates and screen-reader-safe sheets.',
    summaryAm:
      'የቀጠሮ ማስያዣ፣ የኢሜይል አደረጃጀት እና ለስክሪን አንባቢ ምቹ የሆኑ ሰነዶችን በርቀት ያስተዳድሩ።',
    accommodations: [
      'Screen reader compatible workspace',
      'Flexible async hours',
      'Low-bandwidth text-first workflow',
      'Extra interview time',
    ],
    postedDate: '2026-11-12',
  },
  {
    id: 'job-4',
    title: 'Front-End Web Component Developer',
    organization: 'Awash Cloud Systems',
    location: 'Addis Ababa (Bole)',
    remote: false,
    employmentType: 'FULL_TIME',
    salaryRangeEtb: '35,000 - 48,000 ETB / mo',
    summary:
      'Build zero-dependency WCAG 2.2 AA web components in TypeScript that plug cleanly into partner portals.',
    summaryAm:
      'ከማንኛውም ድረ-ገጽ ጋር በቀላሉ የሚሰሩ WCAG 2.2 AA ተደራሽ የዌብ ኮምፖነንቶችን በTypeScript ይገንቡ።',
    accommodations: [
      'Ethiopian Sign Language interpreter for interviews',
      'Screen reader compatible workspace',
      'Wheelchair & step-free office access',
      'Braille display stipend',
    ],
    postedDate: '2026-11-10',
  },
];

const CERT_BASE_1 = {
  id: 'urn:uuid:alx-db-2026-t2-0941',
  type: ['VerifiableCredential', 'OpenBadgeCredential'],
  issuer: {
    id: 'https://alxafrica.com/digital-bridge',
    name: 'ALX Digital Bridge Ethiopia',
  },
  recipientName: 'Abebe Bikila',
  achievementTitle: 'Accessible Learning Media & WebVTT Engineering (Track 2)',
  achievementDescription:
    'Built and verified a WCAG 2.2 AA compliant media player, Amharic/English caption pipeline, EthSL sync window, and .brf Braille exporter.',
  issuedOn: '2026-11-15',
};

const CERT_BASE_2 = {
  id: 'urn:uuid:alx-db-2026-t2-0412',
  type: ['VerifiableCredential', 'OpenBadgeCredential'],
  issuer: {
    id: 'https://alxafrica.com/digital-bridge',
    name: 'ALX Digital Bridge Ethiopia',
  },
  recipientName: 'Selamawit Girma',
  achievementTitle: 'Multilingual WebVTT & Dual-Disability Media Specialist (Track 2)',
  achievementDescription:
    'Verified EthSL sign-language timing, 6-language captions (EN/AM/TI/OM/AR/SO), Voice Plus controls, and Braille output.',
  issuedOn: '2026-11-15',
};

export const SEED_CERTIFICATES: OpenBadgeCredential[] = [
  {
    ...CERT_BASE_1,
    signatureHash: computeCredentialChecksum(CERT_BASE_1),
  },
  {
    ...CERT_BASE_2,
    signatureHash: computeCredentialChecksum(CERT_BASE_2),
  },
];

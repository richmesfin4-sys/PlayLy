export type PluginCategory =
  | 'all'
  | 'track-2-media'
  | 'vscode-extension'
  | 'career-gateway';

export type DisabilityTag =
  | 'blind'
  | 'deaf'
  | 'deafblind'
  | 'blind-half-deaf'
  | 'blind-no-hands'
  | 'deaf-no-hands'
  | 'non-speaking'
  | 'low-literacy'
  | 'motor';

export interface PluginReview {
  id: string;
  author: string;
  rating: number;
  comment: string;
  deviceTested: string;
  createdAt: string;
}

export interface MarketplacePlugin {
  id: string;
  slug: string;
  name: string;
  publisher: string;
  version: string;
  category: Exclude<PluginCategory, 'all'>;
  kind: 'Web Plug-in + VS Code' | 'VS Code Extension' | 'Web Component';
  shortDescription: string;
  longDescription: string;
  ratingAvg: number;
  ratingCount: number;
  downloads: number;
  sizeKb: number;
  license: string;
  supportedDisabilities: DisabilityTag[];
  supportsOffline: boolean;
  embedTag?: string;
  scriptSrc?: string;
  vscodeCommand?: string;
  features: string[];
  reviews: PluginReview[];
}

export interface JobListing {
  id: string;
  title: string;
  organization: string;
  location: string;
  remote: boolean;
  employmentType: string;
  salaryRangeEtb: string;
  summary: string;
  summaryAm: string;
  accommodations: string[];
  postedDate: string;
}

export interface OpenBadgeCredential {
  id: string;
  type: string[];
  issuer: {
    id: string;
    name: string;
  };
  recipientName: string;
  achievementTitle: string;
  achievementDescription: string;
  issuedOn: string;
  signatureHash: string;
}

export interface PhoneNormalizationResult {
  valid: boolean;
  normalized: string;
  errorEn?: string;
  errorAm?: string;
}

export function normalizeEthiopianPhone(raw: string): PhoneNormalizationResult {
  const digits = raw.replace(/[\s()-]/g, '');
  if (!digits) {
    return {
      valid: false,
      normalized: '',
      errorEn: 'Please enter your phone number starting with 09, 07, or +251.',
      errorAm: 'እባክዎ በ 09፣ 07 ወይም +251 የሚጀምር ስልክ ቁጥር ያስገቡ።',
    };
  }

  if (/^\+251[79]\d{8}$/.test(digits)) {
    return { valid: true, normalized: digits };
  }
  if (/^251[79]\d{8}$/.test(digits)) {
    return { valid: true, normalized: `+${digits}` };
  }
  if (/^0[79]\d{8}$/.test(digits)) {
    return { valid: true, normalized: `+251${digits.slice(1)}` };
  }

  return {
    valid: false,
    normalized: '',
    errorEn: 'Enter a valid Ethiopian mobile number (09..., 07..., or +2519...).',
    errorAm: 'ትክክለኛ የኢትዮጵያ ሞባይል ቁጥር ያስገቡ (09...፣ 07... ወይም +2519...)።',
  };
}

export function formatEthiopianDate(
  date: Date,
  lang: 'en' | 'am' | 'ti' | 'om' | 'ar' | 'so' = 'am'
): string {
  try {
    if (lang === 'am' || lang === 'ti') {
      return new Intl.DateTimeFormat('am-ET-u-ca-ethiopic', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(date);
    }
    if (lang === 'ar') {
      return new Intl.DateTimeFormat('ar-EG', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(date);
    }
    return new Intl.DateTimeFormat('en-ET', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

export function filterPlugins(
  plugins: MarketplacePlugin[],
  query: string,
  category: PluginCategory,
  disabilityFilter: DisabilityTag | 'all'
): MarketplacePlugin[] {
  const q = query.trim().toLowerCase();
  return plugins.filter((plugin) => {
    if (category !== 'all' && plugin.category !== category) return false;
    if (
      disabilityFilter !== 'all' &&
      !plugin.supportedDisabilities.includes(disabilityFilter)
    ) {
      return false;
    }
    if (!q) return true;
    const haystack = [
      plugin.name,
      plugin.publisher,
      plugin.shortDescription,
      plugin.longDescription,
      plugin.kind,
      ...plugin.features,
      ...plugin.supportedDisabilities,
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function computeNewRating(
  currentAvg: number,
  currentCount: number,
  newStars: number
): { ratingAvg: number; ratingCount: number } {
  const clampedStars = Math.min(5, Math.max(1, Math.round(newStars)));
  const safeCount = Math.max(0, currentCount);
  const total = currentAvg * safeCount + clampedStars;
  const nextCount = safeCount + 1;
  return {
    ratingAvg: Number((total / nextCount).toFixed(2)),
    ratingCount: nextCount,
  };
}

export function filterJobsBySupport(
  jobs: JobListing[],
  learnerSupportNeeds: string[],
  onlyMatching: boolean
): Array<JobListing & { matchedAccommodations: string[] }> {
  const normalizedNeeds = learnerSupportNeeds
    .filter((s) => s !== 'prefer_not_to_say')
    .map((s) => s.toLowerCase());

  const mapped = jobs.map((job) => {
    const matched = job.accommodations.filter((acc) => {
      const lower = acc.toLowerCase();
      return normalizedNeeds.some(
        (need) =>
          lower.includes(need) ||
          (need === 'captions' && lower.includes('caption')) ||
          (need === 'sign_language' && (lower.includes('sign') || lower.includes('interpreter'))) ||
          (need === 'screen_reader' && lower.includes('screen')) ||
          (need === 'braille_tactile' && (lower.includes('braille') || lower.includes('tactile'))) ||
          (need === 'voice_plus' && (lower.includes('screen') || lower.includes('async') || lower.includes('voice'))) ||
          (need === 'hands_free_sign' && (lower.includes('sign') || lower.includes('async') || lower.includes('visual'))) ||
          (need === 'extra_time' && (lower.includes('flexible') || lower.includes('async')))
      );
    });
    return { ...job, matchedAccommodations: matched };
  });

  if (!onlyMatching || normalizedNeeds.length === 0) {
    return mapped;
  }
  return mapped.filter((j) => j.matchedAccommodations.length > 0);
}

export function computeCredentialChecksum(credential: Omit<OpenBadgeCredential, 'signatureHash'>): string {
  const canonical = `${credential.id}|${credential.issuer.id}|${credential.recipientName}|${credential.achievementTitle}|${credential.issuedOn}`;
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  for (let i = 0; i < canonical.length; i += 1) {
    const ch = canonical.charCodeAt(i);
    h1 ^= ch;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= ch + i;
    h2 = Math.imul(h2, 0x85ebca6b);
  }
  const partA = (h1 >>> 0).toString(16).padStart(8, '0');
  const partB = (h2 >>> 0).toString(16).padStart(8, '0');
  return `db-ob3-${partA}${partB}`;
}

export function verifyBadgeSignature(credential: OpenBadgeCredential): {
  valid: boolean;
  reason: string;
} {
  if (!credential.id || !credential.recipientName || !credential.signatureHash) {
    return { valid: false, reason: 'Missing required Open Badges 3.0 fields.' };
  }
  const expected = computeCredentialChecksum({
    id: credential.id,
    type: credential.type,
    issuer: credential.issuer,
    recipientName: credential.recipientName,
    achievementTitle: credential.achievementTitle,
    achievementDescription: credential.achievementDescription,
    issuedOn: credential.issuedOn,
  });
  if (credential.signatureHash === expected) {
    return { valid: true, reason: 'Signature matches issuer cryptographic checksum.' };
  }
  return {
    valid: false,
    reason: 'Signature mismatch: credential payload was altered or unsigned.',
  };
}

// 6-dot Braille mapping (dots 1-6) for Deafblind & Tactile Auth Pad
const BRAILLE_TO_CHAR: Record<string, string> = {
  '1': 'A',
  '12': 'B',
  '14': 'C',
  '145': 'D',
  '15': 'E',
  '124': 'F',
  '1245': 'G',
  '125': 'H',
  '24': 'I',
  '245': 'J',
  '13': 'K',
  '123': 'L',
  '134': 'M',
  '1345': 'N',
  '135': 'O',
  '1234': 'P',
  '12345': 'Q',
  '1235': 'R',
  '234': 'S',
  '2345': 'T',
  '136': 'U',
  '1236': 'V',
  '2456': 'W',
  '1346': 'X',
  '13456': 'Y',
  '1356': 'Z',
  '3456': '#',
};

export function decodeBrailleDots(dots: number[]): string | null {
  const sortedUnique = Array.from(new Set(dots.filter((d) => d >= 1 && d <= 6))).sort(
    (a, b) => a - b
  );
  if (sortedUnique.length === 0) return null;
  const key = sortedUnique.join('');
  return BRAILLE_TO_CHAR[key] ?? null;
}

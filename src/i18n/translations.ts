export type AppLang = 'en' | 'am' | 'ti' | 'om' | 'ar' | 'so';

export interface LanguageMeta {
  code: AppLang;
  nativeLabel: string;
  englishName: string;
  dir: 'ltr' | 'rtl';
  speechLocale: string;
}

export const SUPPORTED_LANGUAGES: LanguageMeta[] = [
  { code: 'en', nativeLabel: 'English', englishName: 'English', dir: 'ltr', speechLocale: 'en-US' },
  { code: 'am', nativeLabel: 'አማርኛ', englishName: 'Amharic', dir: 'ltr', speechLocale: 'am-ET' },
  { code: 'ti', nativeLabel: 'ትግርኛ', englishName: 'Tigray (Tigrinya)', dir: 'ltr', speechLocale: 'ti-ET' },
  { code: 'om', nativeLabel: 'Afaan Oromoo', englishName: 'Oromo', dir: 'ltr', speechLocale: 'om-ET' },
  { code: 'ar', nativeLabel: 'العربية', englishName: 'Arabic', dir: 'rtl', speechLocale: 'ar-SA' },
  { code: 'so', nativeLabel: 'Af-Soomaali', englishName: 'Somali', dir: 'ltr', speechLocale: 'so-SO' },
];

export function getLanguageMeta(code: AppLang): LanguageMeta {
  return SUPPORTED_LANGUAGES.find((l) => l.code === code) || SUPPORTED_LANGUAGES[0];
}

export interface UiTranslation {
  nav: {
    brand: string;
    marketplace: string;
    media: string;
    onboarding: string;
    careers: string;
    cta: string;
    skip: string;
    langLabel: string;
    contrast: string;
    tactile: string;
    audio: string;
  };
  marketplace: {
    heroTitle: string;
    heroSubtitle: string;
    launchMedia: string;
    launchAuth: string;
    standaloneProof: string;
    searchLabel: string;
    searchPlaceholder: string;
    needLabel: string;
    sortLabel: string;
    sortRating: string;
    sortDownloads: string;
    availableHeading: string;
    emptyTitle: string;
    emptyBody: string;
    clearFilters: string;
    inspect: string;
    download: string;
    downloadsLabel: string;
  };
  media: {
    presetsLabel: string;
    presetBlindDeaf: string;
    presetBlindHalfDeaf: string;
    presetBlindNoHands: string;
    presetDeafNoHands: string;
    play: string;
    pause: string;
    back10: string;
    captions: string;
    signLanguage: string;
    textOnly: string;
    transcript: string;
    fullScreen: string;
    kbHelp: string;
    docHeading: string;
    voiceCommandBtn: string;
    voiceCommandListening: string;
  };
  onboarding: {
    kicker: string;
    title: string;
    subtitle: string;
    profileLegend: string;
    questionOf: string;
    listenBtn: string;
    back: string;
    continue: string;
    finish: string;
    fullName: string;
    speakAnswer: string;
    stepHeadings: Record<number, { standard: string; simple: string }>;
  };
  careers: {
    title: string;
    subtitle: string;
    matchLabel: string;
    openRoles: string;
    listenSummary: string;
    apply: string;
    applied: string;
    verifierTitle: string;
    verifyBtn: string;
  };
}

export const UI_TRANSLATIONS: Record<AppLang, UiTranslation> = {
  en: {
    nav: {
      brand: 'Digital Bridge',
      marketplace: 'Marketplace',
      media: 'Learning Media',
      onboarding: 'Accessible Sign-In',
      careers: 'Career Gateway',
      cta: 'Dual-Disability Auth',
      skip: 'Skip to main content',
      langLabel: 'Language',
      contrast: 'High Contrast',
      tactile: 'Tactile Haptics',
      audio: 'Earcon Cues',
    },
    marketplace: {
      heroTitle: 'VS Code & Accessible Web Plug-in Registry',
      heroSubtitle:
        'Browse, rate, and download community VS Code extensions and single-script Digital Bridge modules built for screen readers, Deaf learners, Braille displays, voice-only navigation, and dual-disability access.',
      launchMedia: 'Open Track 2 Media Player',
      launchAuth: 'Open Accessible Sign-In',
      standaloneProof: 'Standalone Host Proof',
      searchLabel: 'Search extensions and plug-ins',
      searchPlaceholder: 'Search by name, EthSL, Braille, Voice, captions, VS Code...',
      needLabel: 'Accessibility Need',
      sortLabel: 'Sort by',
      sortRating: 'Highest Rated',
      sortDownloads: 'Most Downloaded',
      availableHeading: 'Available Modules & Extensions',
      emptyTitle: 'No matching extensions found',
      emptyBody: 'Clear your search query or switch category filters to browse all community plug-ins.',
      clearFilters: 'Reset filters',
      inspect: 'Inspect & Rate',
      download: 'Download',
      downloadsLabel: 'downloads',
    },
    media: {
      presetsLabel: 'Dual-Disability Presets:',
      presetBlindDeaf: 'Blind + Deaf (Braille)',
      presetBlindHalfDeaf: 'Blind + Half Deaf (Voice + Braille)',
      presetBlindNoHands: 'Blind + No Hands (Voice Plus)',
      presetDeafNoHands: 'Deaf + No Hands (Sign Language)',
      play: 'Play',
      pause: 'Pause',
      back10: 'Back 10 seconds',
      captions: 'Captions',
      signLanguage: 'Sign language',
      textOnly: 'Text only',
      transcript: 'Transcript',
      fullScreen: 'Full screen',
      kbHelp: 'Keyboard help',
      docHeading: 'Accessible Lesson Document',
      voiceCommandBtn: 'Hands-Free Voice Control',
      voiceCommandListening: 'Listening for command (Play, Pause, Back, Captions)...',
    },
    onboarding: {
      kicker: 'Cross-Device · Zero Timers · Auto-Saved Every Keystroke',
      title: 'Accessible Sign-In & Dual-Disability Authentication',
      subtitle:
        'Seamless cross-device sign-in for Blind + Deaf (Braille), Blind + Half Deaf (Voice + Braille), Blind + Unable to Use Hands (Voice Plus), and Unable to Use Hands + Deaf (Sign Language & Auto-Scan).',
      profileLegend: 'Select your access & dual-disability solution',
      questionOf: 'Question {step} of 6',
      listenBtn: 'Listen to Question',
      back: 'Back',
      continue: 'Continue',
      finish: 'Complete & Save',
      fullName: 'Full Name',
      speakAnswer: 'Speak your answer',
      stepHeadings: {
        1: { standard: 'What is your name?', simple: 'Type, speak, or tap your name' },
        2: { standard: 'Phone number or Tactile Passkey', simple: 'Enter 09... phone or a 2+ letter tactile PIN' },
        3: { standard: 'Choose your preferred language', simple: 'Pick your language' },
        4: { standard: 'Identity verification route', simple: 'Pick an ID, or select "No document"' },
        5: { standard: 'Private support choices (never sent to employers)', simple: 'Tell us what helps you learn' },
        6: { standard: 'Review, consent, and finish', simple: 'Check your details and save' },
      },
    },
    careers: {
      title: 'Inclusive Career Gateway & Certificate Verifier',
      subtitle:
        'Filter roles against your private support choices directly inside your browser—nothing about your disability or support needs is ever sent to employers.',
      matchLabel: 'Match my saved support needs',
      openRoles: 'Open Roles',
      listenSummary: 'Listen to summary',
      apply: 'Apply',
      applied: 'Applied',
      verifierTitle: 'Verifiable Certificate Check (Open Badges 3.0)',
      verifyBtn: 'Verify Signature',
    },
  },
  am: {
    nav: {
      brand: 'ዲጂታል ብሪጅ',
      marketplace: 'የፕለጊን ገበያ',
      media: 'ተደራሽ ትምህርት',
      onboarding: 'ምዝገባ እና መግቢያ',
      careers: 'የሥራ መግቢያ',
      cta: 'ተደራሽ መግቢያ',
      skip: 'ወደ ዋናው ይዘት ይዝለሉ',
      langLabel: 'ቋንቋ',
      contrast: 'ከፍተኛ ንጽጽር',
      tactile: 'ንዝረት (Tactile)',
      audio: 'የድምፅ ምልክት',
    },
    marketplace: {
      heroTitle: 'የVS Code እና ተደራሽ የድረ-ገጽ ፕለጊኖች ማዕከል',
      heroSubtitle:
        'ለዓይነ ስውር እና መስማት ለተሳናቸው (ብሬይል)፣ ለከፊል መስማት ችግር (ድምፅ + ብሬይል)፣ እጅ መጠቀም ለማይችሉ (ድምፅ ወይም ምልክት ቋንቋ) የተገነቡ ፕለጊኖችን ይፈልጉ እና ያውርዱ።',
      launchMedia: 'የትምህርት ሚዲያ (Track 2) ክፈት',
      launchAuth: 'ተደራሽ መግቢያ ክፈት',
      standaloneProof: 'ነጻ ገጽ ሙከራ',
      searchLabel: 'ፕለጊኖችን ይፈልጉ',
      searchPlaceholder: 'በስም፣ በምልክት ቋንቋ፣ በብሬይል፣ በድምፅ ወይም በVS Code ይፈልጉ...',
      needLabel: 'የተደራሽነት ፍላጎት',
      sortLabel: 'ደርድር በ',
      sortRating: 'ከፍተኛ ደረጃ',
      sortDownloads: 'ብዙ የወረዱ',
      availableHeading: 'የሚገኙ ፕለጊኖች እና ሞጁሎች',
      emptyTitle: 'ተዛማጅ ፕለጊን አልተገኘም',
      emptyBody: 'ሁሉንም ፕለጊኖች ለማየት ፍለጋውን ያጽዱ።',
      clearFilters: 'ማጣሪያ አጽዳ',
      inspect: 'ዝርዝር እና ደረጃ',
      download: 'አውርድ',
      downloadsLabel: 'ውርዶች',
    },
    media: {
      presetsLabel: 'ፈጣን የተደራሽነት ምርጫዎች:',
      presetBlindDeaf: 'ዓይነ ስውር + መስማት የተሳነው (ብሬይል)',
      presetBlindHalfDeaf: 'ዓይነ ስውር + ከፊል መስማት (ድምፅ + ብሬይል)',
      presetBlindNoHands: 'ዓይነ ስውር + እጅ የማይጠቀም (ድምፅ ብቻ)',
      presetDeafNoHands: 'መስማት የተሳነው + እጅ የማይጠቀም (ምልክት ቋንቋ)',
      play: 'አጫውት',
      pause: 'አቁም',
      back10: '10 ሰከንድ ወደ ኋላ',
      captions: 'የጽሑፍ ግልባጭ',
      signLanguage: 'የምልክት ቋንቋ',
      textOnly: 'ጽሑፍ ብቻ',
      transcript: 'ሙሉ ጽሑፍ',
      fullScreen: 'ሙሉ ማያ',
      kbHelp: 'የቁልፍ ሰሌዳ እገዛ',
      docHeading: 'የትምህርቱ ሙሉ ሰነድ (ተደራሽ HTML)',
      voiceCommandBtn: 'ያለ እጅ የድምፅ መቆጣጠሪያ',
      voiceCommandListening: 'ትዕዛዝ በመጠበቅ ላይ (Play, Pause, Back)...',
    },
    onboarding: {
      kicker: 'በሁሉም መሳሪያ · ሰዓት ቆጣሪ የሌለው · በራሱ የሚያስቀምጥ',
      title: 'ተደራሽ ምዝገባ እና የድርብ አካል ጉዳት መግቢያ',
      subtitle:
        'ዓይነ ስውር እና መስማት ለተሳናቸው (ብሬይል)፣ ዓይነ ስውር እና ከፊል መስማት (ድምፅ + ብሬይል)፣ እጅ መጠቀም ለማይችሉ (ድምፅ ወይም ምልክት ቋንቋ) የተዘጋጀ።',
      profileLegend: 'የተደራሽነት መፍትሄዎን ይምረጡ',
      questionOf: 'ጥያቄ {step} ከ 6',
      listenBtn: 'ጥያቄውን አንብብልኝ',
      back: 'ተመለስ',
      continue: 'ቀጥል',
      finish: 'ምዝገባውን አጠናቅቅ',
      fullName: 'ሙሉ ስም',
      speakAnswer: 'በድምፅ ይመልሱ',
      stepHeadings: {
        1: { standard: 'ሙሉ ስምዎ ማን ነው?', simple: 'ስምዎን ይጻፉ ወይም ይናገሩ' },
        2: { standard: 'ስልክ ቁጥር ወይም የብሬይል መለያ ቁልፍ', simple: '09... ስልክ ወይም የብሬይል ቁልፍ ያስገቡ' },
        3: { standard: 'የሚመርጡትን ቋንቋ ይምረጡ', simple: 'ቋንቋ ይምረጡ' },
        4: { standard: 'የማንነት ማረጋገጫ መንገድ', simple: 'መታወቂያ ወይም ያለ መታወቂያ ይምረጡ' },
        5: { standard: 'የግል የድጋፍ ምርጫዎች (ለቀጣሪዎች አይላክም)', simple: 'ምን ድጋፍ እንደሚያስፈልግዎ ይምረጡ' },
        6: { standard: 'ያረጋግጡ እና ይጨርሱ', simple: 'መረጃዎን አረጋግጠው ያስቀምጡ' },
      },
    },
    careers: {
      title: 'ተደራሽ የሥራ መግቢያ እና የምስክር ወረቀት ማረጋገጫ',
      subtitle: 'የሥራ ማስታወቂያዎችን በግል የድጋፍ ምርጫዎ መሠረት በአሳሽዎ ውስጥ በሚስጥር ያጣሩ።',
      matchLabel: 'ከድጋፍ ምርጫዬ ጋር አዛምድ',
      openRoles: 'ክፍት የሥራ ቦታዎች',
      listenSummary: 'ማጠቃለያውን ስማ',
      apply: 'አመልክት',
      applied: 'ተመልክቷል',
      verifierTitle: 'የምስክር ወረቀት ማረጋገጫ (Open Badges 3.0)',
      verifyBtn: 'ፊርማውን አረጋግጥ',
    },
  },
  ti: {
    nav: {
      brand: 'ዲጂታል ብሪጅ',
      marketplace: 'ዕዳጋ ፕላጊን',
      media: 'ተበጻሒ ትምህርቲ',
      onboarding: 'ምዝገባን መእተውን',
      careers: 'ዕድል ስራሕ',
      cta: 'ተበጻሒ መእተዊ',
      skip: 'ናብ ዋና ትሕዝቶ ሕለፍ',
      langLabel: 'ቋንቋ',
      contrast: 'ልዑል ንጽጽር',
      tactile: 'ምንቅጥቃጥ (Tactile)',
      audio: 'ናይ ድምጺ ምልክት',
    },
    marketplace: {
      heroTitle: 'ማእከል ፕላጊናት VS Code ከምኡውን ተበጻሒ መርበብ ሓበሬታ',
      heroSubtitle:
        'ንዓይነ-ስውራንን ጽሙማንን (ብሬይል)፣ ንክፋል ምስማዕ ዝጎደሎም (ድምጺ + ብሬይል)፣ ኢዶም ክጥቀሙ ዘይክእሉ (ድምጺ ወይ ቋንቋ ምልክት) ዝተዳለዉ ፕላጊናት ድለዩን ኣውርዱን።',
      launchMedia: 'ተበጻሒ ሚድያ (Track 2) ክፈት',
      launchAuth: 'ተበጻሒ መእተዊ ክፈት',
      standaloneProof: 'ነጻ ገጽ ፈተነ',
      searchLabel: 'ፕላጊናት ድለዩ',
      searchPlaceholder: 'ብስም፣ ቋንቋ ምልክት፣ ብሬይል፣ ድምጺ ወይ VS Code ድለዩ...',
      needLabel: 'ተበጻሕነት ድሌት',
      sortLabel: 'ሰርዕ ብ',
      sortRating: 'ዝለዓለ ደረጃ',
      sortDownloads: 'ብዙሕ ዝወረደ',
      availableHeading: 'ዝርከቡ ፕላጊናትን ሞጁላትን',
      emptyTitle: 'ዝሰማማዕ ፕላጊን ኣይተረኽበን',
      emptyBody: 'ኩሎም ፕላጊናት ንምርኣይ መጻረዪ ኣጽርዩ።',
      clearFilters: 'መጻረዪ ኣጽሪ',
      inspect: 'ዝርዝርን ደረጃን',
      download: 'ኣውርድ',
      downloadsLabel: 'ምውራድ',
    },
    media: {
      presetsLabel: 'ቅልጡፍ ናይ ተበጻሕነት ምርጫታት:',
      presetBlindDeaf: 'ዓይነ-ስውር + ጽሙም (ብሬይል)',
      presetBlindHalfDeaf: 'ዓይነ-ስውር + ፍርቂ ጽሙም (ድምጺ + ብሬይል)',
      presetBlindNoHands: 'ዓይነ-ስውር + ኢድ ዘይጥቀም (ድምጺ ጥራይ)',
      presetDeafNoHands: 'ጽሙም + ኢድ ዘይጥቀም (ቋንቋ ምልክት)',
      play: 'ኣጻውት',
      pause: 'ኣቋርጽ',
      back10: '10 ካልኢት ንድሕሪት',
      captions: 'ጽሑፋዊ መግለጺ',
      signLanguage: 'ቋንቋ ምልክት',
      textOnly: 'ጽሑፍ ጥራይ',
      transcript: 'ምሉእ ጽሑፍ',
      fullScreen: 'ምሉእ ስክሪን',
      kbHelp: 'ሓገዝ ኪቦርድ',
      docHeading: 'ተበጻሒ ሰነድ ትምህርቲ',
      voiceCommandBtn: 'ብዘይ ኢድ መቆጻጸሪ ድምጺ',
      voiceCommandListening: 'ትእዛዝ ድምጺ ይጽበ ኣሎ (Play, Pause, Back)...',
    },
    onboarding: {
      kicker: 'ኣብ ኩሉ መሳርሒ · ግዜ ቆጻሪ ዘይብሉ · ብቀጥታ ዝዕቅብ',
      title: 'ተበጻሒ ምዝገባን መእተዊ ድርብ ስንክልናን',
      subtitle:
        'ንዓይነ-ስውር + ጽሙም (ብሬይል)፣ ዓይነ-ስውር + ፍርቂ ጽሙም (ድምጺ + ብሬይል)፣ ኢድ ዘይጥቀም + ዓይነ-ስውር (ድምጺ)፣ ከምኡውን ኢድ ዘይጥቀም + ጽሙም (ቋንቋ ምልክት)።',
      profileLegend: 'ናይ ተበጻሕነት ፍታሕኩም ምረጹ',
      questionOf: 'ሕቶ {step} ካብ 6',
      listenBtn: 'ሕቶ ስማዕ',
      back: 'ተመለስ',
      continue: 'ቀጽል',
      finish: 'ኣጠናቕቕን ዓቅብን',
      fullName: 'ምሉእ ስም',
      speakAnswer: 'ብድምጺ መልሱ',
      stepHeadings: {
        1: { standard: 'ምሉእ ስምኩም መን እዩ?', simple: 'ስምኩም ጽሓፉ ወይ ተዛረቡ' },
        2: { standard: 'ቁጽሪ ስልኪ ወይ ብሬይል መፍትሕ', simple: '09... ስልኪ ወይ ብሬይል መፍትሕ ኣእትዉ' },
        3: { standard: 'ዝመረጽኩምዎ ቋንቋ ምረጹ', simple: 'ቋንቋ ምረጹ' },
        4: { standard: 'መንነት መረጋገጺ መንገዲ', simple: 'መንነት ወረቐት ወይ ብዘይ ወረቐት ምረጹ' },
        5: { standard: 'ብሕታዊ ናይ ሓገዝ ምርጫታት (ንኣስራሕቲ ኣይለኣኽን)', simple: 'ዘድልየኩም ሓገዝ ምረጹ' },
        6: { standard: 'ኣረጋግጹን ወድኡን', simple: 'ሓበሬታኹም ኣረጋጊጽኩም ዓቅቡ' },
      },
    },
    careers: {
      title: 'ተበጻሒ ዕድል ስራሕን መረጋገጺ ምስክር ወረቐትን',
      subtitle: 'ስራሕቲ ብብሕታዊ ናይ ሓገዝ ምርጫኹም ኣብ ውሽጢ መርበብ ኣጻርዩ።',
      matchLabel: 'ምስ ምርጫ ሓገዘይ ኣዛምድ',
      openRoles: 'ክፉት ናይ ስራሕ ቦታታት',
      listenSummary: 'ጽማቕ ስማዕ',
      apply: 'ኣመልክት',
      applied: 'ተላኢኹ',
      verifierTitle: 'መረጋገጺ ምስክር ወረቐት (Open Badges 3.0)',
      verifyBtn: 'ፌርማ ኣረጋግጽ',
    },
  },
  om: {
    nav: {
      brand: 'Digital Bridge',
      marketplace: 'Gabaa Plagiinii',
      media: 'Barnoota Dhaqqabamaa',
      onboarding: 'Galmee fi Seensa',
      careers: 'Carraa Hojii',
      cta: 'Seensa Dhaqqabamaa',
      skip: 'Gara qabiyyee ijoo darbi',
      langLabel: 'Afaan',
      contrast: 'Ifa Olaanaa',
      tactile: 'Hurgufama (Haptic)',
      audio: 'Mallattoo Sagalee',
    },
    marketplace: {
      heroTitle: 'Kuusaa Plagiinii VS Code fi Marsariitii Dhaqqabamaa',
      heroSubtitle:
        'Plagiinota VS Code fi weebii namoota jaamaa fi duudaa (Braille), jaamaa fi gurri walakkaan hin dhageenye (Sagalee + Braille), harka hin fayyadamne (Sagalee ykn Afaan Mallattoo) barbaadaa fi buufadhaa.',
      launchMedia: 'Miidiyaa Barnootaa (Track 2) Bani',
      launchAuth: 'Seensa Dhaqqabamaa Bani',
      standaloneProof: 'Yaalii Fuula Qofaa',
      searchLabel: 'Plagiinota barbaadi',
      searchPlaceholder: 'Maqaan, Afaan Mallattoo, Braille, Sagalee ykn VS Code barbaadi...',
      needLabel: 'Fedhii Dhaqqabamummaa',
      sortLabel: 'Tartiibessi',
      sortRating: 'Sadarkaa Olaanaa',
      sortDownloads: 'Baayʼee Buufame',
      availableHeading: 'Plagiinotaa fi Moodeelota Argaman',
      emptyTitle: 'Plagiiniin walsimu hin argamne',
      emptyBody: 'Plagiinota hunda arguuf barbaacha qulqulleessi.',
      clearFilters: 'Calaltuu haqi',
      inspect: 'Ilaali & Madaali',
      download: 'Buufadhu',
      downloadsLabel: 'buufama',
    },
    media: {
      presetsLabel: 'Qindaaʼina Dhaqqabamummaa Saffisaa:',
      presetBlindDeaf: 'Jaamaa + Duudaa (Braille)',
      presetBlindHalfDeaf: 'Jaamaa + Gurra Walakkaa (Sagalee + Braille)',
      presetBlindNoHands: 'Jaamaa + Harka Hin Qabne (Sagalee Qofa)',
      presetDeafNoHands: 'Duudaa + Harka Hin Qabne (Afaan Mallattoo)',
      play: 'Taphachiisi',
      pause: 'Dhaabi',
      back10: 'Sekondii 10 duubatti',
      captions: 'Barreeffama Jalaa',
      signLanguage: 'Afaan Mallattoo',
      textOnly: 'Barreeffama Qofa',
      transcript: 'Barreeffama Guutuu',
      fullScreen: 'Fuula Guutuu',
      kbHelp: 'Gargaarsa Kiiboordii',
      docHeading: 'Sanada Barnootaa Dhaqqabamaa',
      voiceCommandBtn: 'Toʼannoo Sagalee Harkaan Malee',
      voiceCommandListening: 'Ajaja sagalee eegaa jira (Play, Pause, Back)...',
    },
    onboarding: {
      kicker: 'Meeshaa Hunda Irratti · Daangaa Yeroo Malee · Ofumaan Kuusa',
      title: 'Galmee Dhaqqabamaa fi Seensa Qaama Miidhamtoota Dachaa',
      subtitle:
        'Seensa salphaa namoota Jaamaa + Duudaa (Braille), Jaamaa + Gurri Walakkaa (Sagalee + Braille), Jaamaa + Harka Hin Fayyadamne (Sagalee), fi Duudaa + Harka Hin Fayyadamne (Afaan Mallattoo).',
      profileLegend: 'Furmaata dhaqqabamummaa keessan filadhaa',
      questionOf: 'Gaaffii {step} / 6',
      listenBtn: 'Gaaffii Dhaggeeffadhu',
      back: 'Duubatti',
      continue: 'Itti Fufi',
      finish: 'Xumuri & Olkaaʼi',
      fullName: 'Maqaa Guutuu',
      speakAnswer: 'Sagaleedhaan deebisi',
      stepHeadings: {
        1: { standard: 'Maqaan kee guutuun eenyu?', simple: 'Maqaa kee barreessi ykn dubbadhu' },
        2: { standard: 'Lakkoofsa bilbilaa ykn furtuu Braille', simple: 'Bilbila 09... ykn furtuu Braille galchi' },
        3: { standard: 'Afaan filattu filadhu', simple: 'Afaan filadhu' },
        4: { standard: 'Karaa mirkaneessa eenyummaa', simple: 'Waraqaa eenyummaa ykn waraqaa malee filadhu' },
        5: { standard: 'Filannoo deeggarsa dhuunfaa (hojjechiiftotaaf hin ergamu)', simple: 'Waan si gargaaru filadhu' },
        6: { standard: 'Mirkaneessiitii xumuri', simple: 'Odeeffannoo kee mirkaneessii olkaaʼi' },
      },
    },
    careers: {
      title: 'Carraa Hojii Dhaqqabamaa fi Mirkaneessa Ragaa',
      subtitle: 'Hojiiwwan fedhii deeggarsa dhuunfaa keetiin weebsaayitii keessatti dhuunfaan calali.',
      matchLabel: 'Fedhii deeggarsa koo waliin walsimsiisi',
      openRoles: 'Gita Hojii Banaa',
      listenSummary: 'Cuunfaa dhaggeeffadhu',
      apply: 'Iyyadhu',
      applied: 'Ergameera',
      verifierTitle: 'Mirkaneessa Waraqaa Ragaa (Open Badges 3.0)',
      verifyBtn: 'Mallattoo Mirkaneessi',
    },
  },
  ar: {
    nav: {
      brand: 'الجسر الرقمي',
      marketplace: 'متجر الإضافات',
      media: 'الوسائط التعليمية',
      onboarding: 'التسجيل والدخول',
      careers: 'بوابة الوظائف',
      cta: 'دخول مزدوج الإعاقة',
      skip: 'تخطي إلى المحتوى الرئيسي',
      langLabel: 'اللغة',
      contrast: 'تباين عالٍ',
      tactile: 'اهتزاز لمسي',
      audio: 'تنبيهات صوتية',
    },
    marketplace: {
      heroTitle: 'سجل إضافات VS Code والويب الميسّر',
      heroSubtitle:
        'تصفح وقيّم وحمّل إضافات VS Code ووحدات الجسر الرقمي المصممة للمكفوفين الصم (برايل)، والمكفوفين ضعاف السمع (الصوت + برايل)، ومن لا يستخدمون اليدين (التحكم الصوتي ولغة الإشارة).',
      launchMedia: 'فتح مشغل الوسائط (Track 2)',
      launchAuth: 'فتح تسجيل الدخول المزدوج',
      standaloneProof: 'اختبار صفحة مستقلة',
      searchLabel: 'البحث عن الإضافات والوحدات',
      searchPlaceholder: 'ابحث بالاسم، برايل، لغة الإشارة، الصوت، VS Code...',
      needLabel: 'احتياج الوصول',
      sortLabel: 'ترتيب حسب',
      sortRating: 'الأعلى تقييماً',
      sortDownloads: 'الأكثر تحميلاً',
      availableHeading: 'الوحدات والإضافات المتاحة',
      emptyTitle: 'لم يتم العثور على إضافات مطابقة',
      emptyBody: 'امسح نص البحث أو غيّر التصنيف لعرض جميع الإضافات.',
      clearFilters: 'إعادة تعيين المرشحات',
      inspect: 'فحص وتقييم',
      download: 'تحميل',
      downloadsLabel: 'تنزيلات',
    },
    media: {
      presetsLabel: 'أوضاع الوصول السريع للإعاقات المزدوجة:',
      presetBlindDeaf: 'كفيف + أصم (برايل)',
      presetBlindHalfDeaf: 'كفيف + ضعف سمع جزئي (صوت + برايل)',
      presetBlindNoHands: 'كفيف + بدون استخدام اليدين (صوت بلس)',
      presetDeafNoHands: 'أصم + بدون استخدام اليدين (لغة الإشارة)',
      play: 'تشغيل',
      pause: 'إيقاف مؤقت',
      back10: 'رجوع 10 ثوانٍ',
      captions: 'الترجمة النصية',
      signLanguage: 'لغة الإشارة',
      textOnly: 'نص فقط',
      transcript: 'النص الكامل',
      fullScreen: 'ملء الشاشة',
      kbHelp: 'اختصارات لوحة المفاتيح',
      docHeading: 'مستند الدرس الميسّر',
      voiceCommandBtn: 'تحكم صوتي بدون يدين',
      voiceCommandListening: 'جاري الاستماع للأمر (Play, Pause, Back)...',
    },
    onboarding: {
      kicker: 'عبر جميع الأجهزة · بدون مؤقت · حفظ تلقائي فوري',
      title: 'التسجيل الميسّر والمصادقة للإعاقات المزدوجة',
      subtitle:
        'تسجيل دخول سلس عبر الأجهزة للمكفوفين الصم (برايل)، المكفوفين ضعاف السمع (الصوت + برايل)، المكفوفين غير القادرين على استخدام اليدين (الصوت)، والصم غير القادرين على استخدام اليدين (لغة الإشارة).',
      profileLegend: 'اختر حل الوصول والإعاقة المزدوجة المناسب لك',
      questionOf: 'السؤال {step} من 6',
      listenBtn: 'استمع للسؤال',
      back: 'رجوع',
      continue: 'متابعة',
      finish: 'إكمال وحفظ',
      fullName: 'الاسم الكامل',
      speakAnswer: 'تحدث بإجابتك',
      stepHeadings: {
        1: { standard: 'ما هو اسمك الكامل؟', simple: 'اكتب أو انطق أو أدخل اسمك ببرايل' },
        2: { standard: 'رقم الهاتف أو رمز برايل اللمسي', simple: 'أدخل هاتف 09... أو رمزاً لمسياً' },
        3: { standard: 'اختر لغتك المفضلة', simple: 'اختر لغتك' },
        4: { standard: 'مسار التحقق من الهوية', simple: 'اختر هوية أو اختر بدون وثيقة' },
        5: { standard: 'خيارات الدعم الخاصة (لا تُرسل لأصحاب العمل)', simple: 'أخبرنا بما يساعدك على التعلم' },
        6: { standard: 'المراجعة والموافقة والحفظ', simple: 'راجع بياناتك واحفظها' },
      },
    },
    careers: {
      title: 'بوابة الوظائف الشاملة والتحقق من الشهادات',
      subtitle: 'صفّ الوظائف وفق احتياجات الدعم الخاصة بك داخل المتصفح دون مشاركة أي بيانات حساسة مع أصحاب العمل.',
      matchLabel: 'مطابقة احتياجات الدعم المحفوظة',
      openRoles: 'الوظائف المتاحة',
      listenSummary: 'استمع للملخص',
      apply: 'تقديم',
      applied: 'تم التقديم',
      verifierTitle: 'التحقق من الشهادة (Open Badges 3.0)',
      verifyBtn: 'تحقق من التوقيع',
    },
  },
  so: {
    nav: {
      brand: 'Digital Bridge',
      marketplace: 'Suuqa Plugins',
      media: 'Waxbarasho Fudud',
      onboarding: 'Diiwaangelin & Galid',
      careers: 'Shaqooyinka',
      cta: 'Galid Laba-Naafo',
      skip: 'U gudub nuxurka weyn',
      langLabel: 'Luuqad',
      contrast: 'Isbarbardhig Sare',
      tactile: 'Gariir Taabasho',
      audio: 'Dhawaq Tilmaan',
    },
    marketplace: {
      heroTitle: 'Diiwaanka Plugins-ka VS Code iyo Webka La Heli Karo',
      heroSubtitle:
        'Raadi, qiimee, oo soo degso kordhinta VS Code iyo qaybaha Digital Bridge ee loogu talagalay indhoole & dhegoole (Braille), indhoole & maqal-dhiman (Cod + Braille), iyo kuwa aan gacmaha adeegsan karin (Cod & Luuqadda Calaamadaha).',
      launchMedia: 'Fur Ciyaaryahanka Waxbarashada (Track 2)',
      launchAuth: 'Fur Galitaanka Laba-Naafo',
      standaloneProof: 'Tijaabo Bog Gaar ah',
      searchLabel: 'Raadi plugins iyo kordhinta',
      searchPlaceholder: 'Ku raadi magac, Braille, Cod, Calaamad, qoraal hoose...',
      needLabel: 'Baahida Helitaanka',
      sortLabel: 'Kala saar',
      sortRating: 'Qiimeynta Ugu Sareysa',
      sortDownloads: 'Kuwa Ugu Badan La Degsaday',
      availableHeading: 'Qaybaha & Plugins-ka Diyaarka ah',
      emptyTitle: 'Wax plugin ah oo ku habboon lama helin',
      emptyBody: 'Tirtir raadinta si aad u aragto dhammaan plugins-ka bulshada.',
      clearFilters: 'Nadiifi shaandhada',
      inspect: 'Eeg & Qiimee',
      download: 'Soo degso',
      downloadsLabel: 'soo degsasho',
    },
    media: {
      presetsLabel: 'Dejinta Degdegga ah ee Laba-Naafo:',
      presetBlindDeaf: 'Indhoole + Dhegoole (Braille)',
      presetBlindHalfDeaf: 'Indhoole + Maqal-dhiman (Cod + Braille)',
      presetBlindNoHands: 'Indhoole + Gacmo Laʼaan (Cod Plus)',
      presetDeafNoHands: 'Dhegoole + Gacmo Laʼaan (Luuqadda Calaamadaha)',
      play: 'Daar',
      pause: 'Jooji',
      back10: '10 ilbiriqsi dib u celi',
      captions: 'Qoraalka Hoose',
      signLanguage: 'Luuqadda Calaamadaha',
      textOnly: 'Qoraal Keliya',
      transcript: 'Qoraalka Buuxa',
      fullScreen: 'Shaashad Buuxda',
      kbHelp: 'Caawimaadda Kiiboodhka',
      docHeading: 'Dukumeentiga Casharka ee La Heli Karo',
      voiceCommandBtn: 'Xakamaynta Codka ee Gacmo Laʼaan',
      voiceCommandListening: 'Wuxuu sugayaa amar (Play, Pause, Back)...',
    },
    onboarding: {
      kicker: 'Aalad Kasta · Waqti Xadidan Ma Leh · Si Toos Ah Ayuu U Kaydiyaa',
      title: 'Diiwaangelin & Galid La Heli Karo oo Laba-Naafo ah',
      subtitle:
        'Galid fudud dhammaan aaladaha: Indhoole + Dhegoole (Braille), Indhoole + Maqal-dhiman (Cod + Braille), Indhoole + Gacmo Laʼaan (Cod), iyo Dhegoole + Gacmo Laʼaan (Luuqadda Calaamadaha).',
      profileLegend: 'Dooro xalka helitaanka iyo naafanimada laba-jibbaaran',
      questionOf: 'Suʼaasha {step} ee 6',
      listenBtn: 'Dhageyso Suʼaasha',
      back: 'Dib u noqo',
      continue: 'Sii wad',
      finish: 'Dhammee & Kaydi',
      fullName: 'Magaca Oo Dhan',
      speakAnswer: 'Ku hadal jawaabtaada',
      stepHeadings: {
        1: { standard: 'Magacaagu waa maxay?', simple: 'Qor, ku hadal, ama taabo magacaaga' },
        2: { standard: 'Lambarka telefoonka ama furaha Braille', simple: 'Geli 09... ama fure Braille ah' },
        3: { standard: 'Dooro luuqadda aad jeceshahay', simple: 'Dooro luuqaddaada' },
        4: { standard: 'Habka xaqiijinta aqoonsiga', simple: 'Dooro aqoonsi ama "Dokumeenti ma haysto"' },
        5: { standard: 'Doorashooyinka taageerada gaarka ah (looma diro loo-shaqeeyayaasha)', simple: 'Noo sheeg waxa ku caawiya' },
        6: { standard: 'Dib u eeg, ogolow, oo dhammee', simple: 'Hubi faahfaahinta oo kaydi' },
      },
    },
    careers: {
      title: 'Albaabka Shaqooyinka Loo Dhan Yahay & Xaqiijinta Shahaadada',
      subtitle: 'Ku shaandhee shaqooyinka baahidaada gaarka ah gudaha biraawsarka adigoon u dirin wax xog ah loo-shaqeeyayaasha.',
      matchLabel: 'La jaanqaad baahiyahayga taageero ee kaydsan',
      openRoles: 'Shaqooyinka Furan',
      listenSummary: 'Dhageyso soo koobidda',
      apply: 'Codso',
      applied: 'Waa la codsaday',
      verifierTitle: 'Hubinta Shahaadada (Open Badges 3.0)',
      verifyBtn: 'Xaqiiji Saxiixa',
    },
  },
};

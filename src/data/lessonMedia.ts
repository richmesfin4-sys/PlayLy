import type { AppLang } from '../i18n/translations';

export const LESSON_METADATA = {
  id: 'demo-accessibility',
  courseTitle: 'ALX Savanna · Track 2 Accessible Learning Media',
  lessonTitleEn: 'Designing for Everyone (Accessible Learning Media)',
  lessonTitleAm: 'ለሁሉም የሚሆን ንድፍ (ተደራሽ የመማሪያ ሚዲያ)',
  lessonTitles: {
    en: 'Designing for Everyone (Accessible Learning Media)',
    am: 'ለሁሉም የሚሆን ንድፍ (ተደራሽ የመማሪያ ሚዲያ)',
    ti: 'ንኹሉ ዝኸውን ንድፊ (ተበጻሒ መምሃሪ ሚድያ)',
    om: 'Wixinee Nama Hundaaf Taʼu (Miidiyaa Barnootaa Dhaqqabamaa)',
    ar: 'التصميم للجميع (وسائط تعليمية ميسّرة)',
    so: 'Naqshadeynta Qof Walba (Warbaahinta Waxbarashada La Heli Karo)',
  } as Record<AppLang, string>,
  durationSeconds: 40,
  videoUrl: '/assets/media/demo-lesson.mp4',
  signVideoUrl: '/savanna/assets/media/va-future-ethsl.mp4',
  audioOnlyUrl: '/assets/media/demo-lesson.m4a',
  posterUrl: '/src/assets/images/lesson_va_poster_1794748146176.jpg',
  posterAlt:
    'Young Ethiopian developer wearing glasses and an earpiece working at a wooden desk in Addis Ababa with a laptop and compact tactile Braille display in bright natural daylight.',
  offlineSizeKb: 160,
};

export const LESSON_VTT_EN = `WEBVTT

1
00:00:00.000 --> 00:00:03.681
Welcome to this short lesson on digital accessibility.

2
00:00:04.181 --> 00:00:08.941
One in six people worldwide live with a disability, visible or not.

3
00:00:09.441 --> 00:00:13.387
Good design removes barriers. It does not remove people.

4
00:00:13.887 --> 00:00:18.471
Captions let deaf and hard of hearing learners follow every word.

5
00:00:18.971 --> 00:00:23.711
Screen readers describe the page aloud for blind and low vision learners.

6
00:00:24.211 --> 00:00:29.105
Keyboard support means everyone can navigate without ever touching a mouse.

7
00:00:29.605 --> 00:00:34.862
Plain language and clear steps support learners with cognitive disabilities.

8
00:00:35.362 --> 00:00:39.458
Now let's build something that actually works for everyone.
`;

export const LESSON_VTT_AM = `WEBVTT

1
00:00:00.000 --> 00:00:03.681
ስለ ዲጂታል ተደራሽነት ወደዚህ አጭር ትምህርት እንኳን በደህና መጡ።

2
00:00:04.181 --> 00:00:08.941
በዓለም ላይ ካሉ ስድስት ሰዎች አንዱ የአካል ጉዳት አለበት፤ የሚታይም ይሁን የማይታይ።

3
00:00:09.441 --> 00:00:13.387
ጥሩ ንድፍ እንቅፋቶችን ያስወግዳል እንጂ ሰዎችን አያስወግድም።

4
00:00:13.887 --> 00:00:18.471
የጽሑፍ ግልባጮች መስማት የተሳናቸው እና የመስማት ችግር ያለባቸው ተማሪዎች እያንዳንዱን ቃል እንዲከታተሉ ያስችላሉ።

5
00:00:18.971 --> 00:00:23.711
የስክሪን አንባቢዎች ለዓይነ ስውር እና ዝቅተኛ የማየት ችሎታ ላላቸው ተማሪዎች ገጹን ጮክ ብለው ይገልጻሉ።

6
00:00:24.211 --> 00:00:29.105
የቁልፍ ሰሌዳ ድጋፍ ማለት ማንም ሰው አይጥ ሳይነካ ማሰስ ይችላል ማለት ነው።

7
00:00:29.605 --> 00:00:34.862
ቀላል ቋንቋ እና ግልጽ ደረጃዎች የመረዳት ችግር ያለባቸውን ተማሪዎች ይደግፋሉ።

8
00:00:35.362 --> 00:00:39.458
አሁን ለሁሉም በትክክል የሚሰራ ነገር እንገንባ።
`;

export const LESSON_VTT_TI = `WEBVTT

1
00:00:00.000 --> 00:00:03.681
ብዛዕባ ዲጂታላዊ ተበጻሕነት ናብዛ ሓጻር ትምህርቲ ብደሓን መጻእኩም።

2
00:00:04.181 --> 00:00:08.941
ኣብ ዓለም ካብ ሽዱሽተ ሰባት ሓደ ብዝርአ ይኹን ብዘይርአ ስንክልና ይነብር።

3
00:00:09.441 --> 00:00:13.387
ጽቡቕ ንድፊ ዕንቅፋታት የወግድ እምበር ሰባት ኣየወግድን።

4
00:00:13.887 --> 00:00:18.471
ጽሑፋዊ መግለጺታት ጽሙማንን ክፋል ምስማዕ ዝጎደሎምን ተምሃሮ ነፍሲ ወከፍ ቃል ክከታተሉ ይሕግዝ።

5
00:00:18.971 --> 00:00:23.711
መንበቢ ስክሪንን ብሬይልን ንዓይነ-ስውራን ተምሃሮ ነቲ ገጽ ብንጹር የብርሁ።

6
00:00:24.211 --> 00:00:29.105
ደገፍ ድምጽን ኪቦርድን ማለት ኢድ ከይተንከፈ ነፍሲ ወከፍ ሰብ ክምርምር ይኽእል ማለት እዩ።

7
00:00:29.605 --> 00:00:34.862
ቀሊል ቋንቋን ንጹር ደረጃታትን ንኹሎም ተምሃሮ ይድግፉ።

8
00:00:35.362 --> 00:00:39.458
ሕጂ ንኹሉ ብሓቂ ዝሰርሕ ነገር ንስራሕ።
`;

export const LESSON_VTT_OM = `WEBVTT

1
00:00:00.000 --> 00:00:03.681
Baga gara barnoota gabaabaa dhaqqabamummaa dijitaalaa irratti qophaaʼe kanaatti nagaan dhuftan.

2
00:00:04.181 --> 00:00:08.941
Addunyaa irratti namoota jaʼa keessaa tokko qaama miidhama mulʼatu ykn hin mulʼanne qaba.

3
00:00:09.441 --> 00:00:13.387
Wixineen gaariin gufuu balleessa malee nama hin balleessu.

4
00:00:13.887 --> 00:00:18.471
Barreeffamni jalaa fi afaan mallattoo barattoota gurri hin dhageenye jecha hundaa akka hordofan gargaara.

5
00:00:18.971 --> 00:00:23.711
Sagaleen fi Braille barattoota jaamaa fi gurri walakkaan hin dhageenyeef fuula ibsa.

6
00:00:24.211 --> 00:00:29.105
Toʼannoon sagalee fi kiiboordii namni harka hin fayyadamne illee akka fayyadamu taasisa.

7
00:00:29.605 --> 00:00:34.862
Afaan salphaan fi tarkaanfiiwwan ifaan barattoota hunda ni deeggaru.

8
00:00:35.362 --> 00:00:39.458
Amma waan nama hundaaf hojjetu waliin haa ijaarru.
`;

export const LESSON_VTT_AR = `WEBVTT

1
00:00:00.000 --> 00:00:03.681
مرحباً بكم في هذا الدرس القصير حول إمكانية الوصول الرقمي.

2
00:00:04.181 --> 00:00:08.941
يعيش واحد من كل ستة أشخاص حول العالم مع إعاقة ظاهرة أو غير ظاهرة.

3
00:00:09.441 --> 00:00:13.387
التصميم الجيد يزيل الحواجز ولا يقصي الأشخاص.

4
00:00:13.887 --> 00:00:18.471
تتيح الترجمة النصية ولغة الإشارة للطلاب الصم متابعة كل كلمة بوضوح.

5
00:00:18.971 --> 00:00:23.711
يجمع الصوت الواضح وبرايل لدعم المكفوفين وضعاف السمع الجزئي.

6
00:00:24.211 --> 00:00:29.105
التحكم الصوتي والمسح التلقائي يمكنان من لا يستطيع استخدام يديه من التنقل بسهولة.

7
00:00:29.605 --> 00:00:34.862
اللغة البسيطة والخطوات الواضحة تدعم جميع المتعلمين.

8
00:00:35.362 --> 00:00:39.458
الآن لنبنِ شيئاً يعمل فعلياً للجميع.
`;

export const LESSON_VTT_SO = `WEBVTT

1
00:00:00.000 --> 00:00:03.681
Ku soo dhawoow casharkan gaaban ee ku saabsan helitaanka dhijitaalka.

2
00:00:04.181 --> 00:00:08.941
Lixdii qofba hal qof oo adduunka ku nool ayaa leh naafonimo muuqata ama qarsoon.

3
00:00:09.441 --> 00:00:13.387
Naqshadda wanaagsan waxay meesha ka saartaa caqabadaha ee ma saarto dadka.

4
00:00:13.887 --> 00:00:18.471
Qoraalka hoose iyo luuqadda calaamaduhu waxay u oggolaadaan ardayda dhegooleyaasha ah inay raacaan eray kasta.

5
00:00:18.971 --> 00:00:23.711
Codka iyo Braille waxay si wada jir ah u caawiyaan ardayda indhoolayaasha ah iyo kuwa maqal-dhiman.

6
00:00:24.211 --> 00:00:29.105
Xakamaynta codka ee gacmo laʼaanta ah waxay qof walba u sahlaysaa inuu maro isagoon taaban.

7
00:00:29.605 --> 00:00:34.862
Luuqadda fudud iyo tillaabooyinka cadcad waxay taageeraan ardayda oo dhan.

8
00:00:35.362 --> 00:00:39.458
Hadda aan dhisno wax run ahaantii u shaqeeya qof walba.
`;

export const LESSON_VTT_BY_LANG: Record<AppLang, string> = {
  en: LESSON_VTT_EN,
  am: LESSON_VTT_AM,
  ti: LESSON_VTT_TI,
  om: LESSON_VTT_OM,
  ar: LESSON_VTT_AR,
  so: LESSON_VTT_SO,
};

export const AUDIO_DESCRIPTIONS: Array<{
  start: number;
  textByLang: Record<AppLang, string>;
}> = [
  {
    start: 0,
    textByLang: {
      en: 'Dark slate background. White title: "Accessible Learning Media". A green audio waveform moves under the title while the narrator speaks.',
      am: 'ጥቁር ሰሌዳ ዳራ። ነጭ ርዕስ፡ "ተደራሽ የመማሪያ ሚዲያ"። ተናጋሪው ሲናገር አረንጓዴ የድምፅ ሞገድ ይንቀሳቀሳል።',
      ti: 'ጸሊም ሰሌዳ ድሕረ-ባይታ። ጻዕዳ ኣርእስቲ፡ "ተበጻሒ መምሃሪ ሚድያ"። ተዛራቢ ክዛረብ ከሎ ቀጠልያ ማዕበል ድምጺ ይንቀሳቐስ።',
      om: 'Duubni gurraacha. Mata duree adii: "Miidiyaa Barnootaa Dhaqqabamaa". Yeroo dubbatamu dambaliin sagalee magariisni ni sochoʼa.',
      ar: 'خلفية داكنة بعنوان أبيض: "وسائط تعليمية ميسّرة" مع موجة صوتية خضراء تتحرك أثناء السرد.',
      so: 'Gadaal madow. Cinwaan cad: "Warbaahinta Waxbarashada La Heli Karo". Mowjad cod cagaaran ayaa dhaqaaqda.',
    },
  },
  {
    start: 18.9,
    textByLang: {
      en: 'Ethiopian Sign Language interpreter window appears alongside narration, demonstrating hands-free sign and Braille workflows.',
      am: 'የኢትዮጵያ የምልክት ቋንቋ ተርጓሚ መስኮት ከትረካው ጋር በአንድነት ይታያል።',
      ti: 'መስኮት ተርጓሚ ቋንቋ ምልክት ኢትዮጵያ ምስቲ ትረኻ ብሓባር ይርአ።',
      om: 'Foddaan hiikaa Afaan Mallattoo Itoophiyaa sagalee waliin mulʼata.',
      ar: 'تظهر نافذة مترجم لغة الإشارة بالتزامن مع السرد الصوتي ومسارات برايل.',
      so: 'Daaqadda turjumaanka Luuqadda Calaamadaha Itoobiya ayaa la soo muuqata.',
    },
  },
  {
    start: 35.3,
    textByLang: {
      en: 'The title card stays on screen. The waveform slows and fades as the narration ends.',
      am: 'ርዕሱ በስክሪኑ ላይ ይቆያል፤ ትረካው ሲጠናቀቅ የድምፅ ሞገዱ ይቆማል።',
      ti: 'ኣርእስቲ ኣብ ስክሪን ይጸንሕ፤ እቲ ትረኻ ክውዳእ ከሎ ማዕበል ድምጺ የቋርጽ።',
      om: 'Kaardiin mata duree iskiriinii irra tura; yeroo xumuramu dambaliin sagalee ni dhaabbata.',
      ar: 'تبقى بطاقة العنوان على الشاشة وتتباطأ الموجة الصوتية مع نهاية السرد.',
      so: 'Kaarka cinwaanku wuxuu ku sii jiraa shaashadda marka casharku dhammaado.',
    },
  },
];

export const LESSON_DOCUMENT_SECTIONS = [
  {
    id: 'dual-sensory-braille-voice',
    headingByLang: {
      en: '1. Blind + Deaf & Half-Deaf Solutions (Braille & Voice+Braille)',
      am: '1. ዓይነ ስውር + መስማት የተሳነው እና ከፊል መስማት (ብሬይል እና ድምፅ + ብሬይል)',
      ti: '1. ዓይነ-ስውር + ጽሙምን ፍርቂ ጽሙምን (ብሬይልን ድምጺ + ብሬይልን)',
      om: '1. Furmaata Jaamaa + Duudaa fi Gurra Walakkaa (Braille & Sagalee+Braille)',
      ar: '1. حلول المكفوفين الصم وضعاف السمع (برايل و الصوت + برايل)',
      so: '1. Xalka Indhoole + Dhegoole & Maqal-dhiman (Braille & Cod+Braille)',
    } as Record<AppLang, string>,
    bodyByLang: {
      en: 'For Blind + Deaf learners, full transcripts convert to 40-cell Grade-1 Braille (.brf) with tactile vibration cadences. For Blind + Half-Deaf learners, clear slower-rate speech (0.85x) runs alongside Braille and live captions.',
      am: 'ዓይነ ስውር እና መስማት ለተሳናቸው ተማሪዎች ሙሉ ጽሑፉ ወደ .brf ብሬይል ይቀየራል። ከፊል መስማት ችግር ላለባቸው ደግሞ ግልጽ ድምፅ ከብሬይል ጋር በአንድነት ይሰራል።',
      ti: 'ንዓይነ-ስውራንን ጽሙማንን ምሉእ ጽሑፍ ናብ .brf ብሬይል ይልወጥ። ንፍርቂ ጽሙማን ድማ ንጹር ድምጺ ምስ ብሬይል ብሓባር ይሰርሕ።',
      om: 'Barattoota Jaamaa + Duudaaf barreeffamni gara Braille (.brf) fi hurgufamaatti jijjiirama. Gurra walakkaa hin dhageenyeef immoo sagalee suuta jedhaa fi Braille waliin deema.',
      ar: 'للمكفوفين الصم، تتحول النصوص إلى برايل (.brf) مع اهتزازات لمسية. ولمن يعانون من ضعف سمع جزئي، يعمل الصوت الواضح البطيء بالتوازي مع برايل.',
      so: 'Ardayda Indhoolaha + Dhegooleyaasha ah qoraalka waxaa loo beddelaa Braille (.brf). Kuwa maqal-dhiman codka cad ayaa la socda Braille.',
    } as Record<AppLang, string>,
  },
  {
    id: 'hands-free-voice-sign',
    headingByLang: {
      en: '2. Hands-Free Access (Voice Plus & Sign Language Dwell)',
      am: '2. እጅ ሳይጠቀሙ መማር (ድምፅ ብቻ እና የምልክት ቋንቋ)',
      ti: '2. ብዘይ ኢድ ምጥቃም (ድምጺ ጥራይን ቋንቋ ምልክትን)',
      om: '2. Harka Malee Fayyadamuu (Sagalee & Afaan Mallattoo)',
      ar: '2. الوصول بدون استخدام اليدين (التحكم الصوتي ولغة الإشارة)',
      so: '2. Helitaan Gacmo Laʼaan ah (Cod Plus & Luuqadda Calaamadaha)',
    } as Record<AppLang, string>,
    bodyByLang: {
      en: 'Blind learners unable to use their hands control playback and navigation by voice ("Play", "Pause", "Continue"). Deaf learners unable to use hands use large Sign Language video + automated dwell-scanning.',
      am: 'እጃቸውን መጠቀም የማይችሉ ዓይነ ስውራን በድምፅ ትዕዛዝ ይቆጣጠራሉ። እጃቸውን መጠቀም የማይችሉ መስማት የተሳናቸው ደግሞ ሰፊ የምልክት ቋንቋ መስኮት እና ራስ-ሰር መቃኛ ይጠቀማሉ።',
      ti: 'ኢዶም ክጥቀሙ ዘይክእሉ ዓይነ-ስውራን ብትእዛዝ ድምጺ ይቆጻጸሩ። ኢዶም ዘይጥቀሙ ጽሙማን ድማ ዓቢይ መስኮት ቋንቋ ምልክትን ባዕሉ ዝንቀሳቐስ ምርጫን ይጥቀሙ።',
      om: 'Barattoonni jaamaa harka hin fayyadamne ajaja sagaleetiin toʼatu. Barattoonni duudaa harka hin fayyadamne immoo Afaan Mallattoo fi ofumaan filachuu fayyadamu.',
      ar: 'يتحكم المكفوفون غير القادرين على استخدام اليدين عبر الأوامر الصوتية، بينما يعتمد الصم غير القادرين على استخدام اليدين على لغة الإشارة والمسح التلقائي.',
      so: 'Indhoolayaasha aan gacmaha adeegsan karin waxay ku xakameeyaan codka, halka dhegooleyaashu adeegsadaan Luuqadda Calaamadaha iyo baaritaanka tooska ah.',
    } as Record<AppLang, string>,
  },
  {
    id: 'multilingual-offline-3g',
    headingByLang: {
      en: '3. Multilingual Offline-First Delivery (6 Languages)',
      am: '3. በ6 ቋንቋዎች እና ያለ ኢንተርኔት (3G) የሚሰራ',
      ti: '3. ብ6 ቋንቋታትን ብዘይ ኢንተርኔትን (3G) ዝሰርሕ',
      om: '3. Afaanota 6n fi Interneetii Malee (3G)',
      ar: '3. دعم 6 لغات والعمل دون اتصال (3G)',
      so: '3. 6 Luuqadood iyo Shaqeyn Internet Laʼaan ah (3G)',
    } as Record<AppLang, string>,
    bodyByLang: {
      en: 'Captions, transcripts, audio descriptions, and onboarding prompts are localized in English, Amharic, Tigray, Oromo, Arabic (RTL), and Somali, with 160 KB offline packs cached via Service Worker.',
      am: 'ትምህርቱ እና ምዝገባው በእንግሊዝኛ፣ በአማርኛ፣ በትግርኛ፣ በኦሮምኛ፣ በአረብኛ እና በሶማሊኛ ከመስመር ውጭ ማውረጃ ጋር ይሰራሉ።',
      ti: 'መግለጺታትን ምዝገባን ብእንግሊዝኛ፣ ኣማርኛ፣ ትግርኛ፣ ኦሮምኛ፣ ዓረብኛን ሶማልኛን ምስ 160 KB ከመስመር ወጻኢ ጥቕላላ ይሰርሑ።',
      om: 'Ibsi fi galmeen Afaan Ingilizii, Amaariffaa, Tigree, Afaan Oromoo, Arabiffaa fi Somaaliffaan kuusaa 160 KB waliin ni hojjatu.',
      ar: 'تتوفر الترجمة والنصوص والوصف الصوتي والتسجيل باللغات الإنجليزية والأمهرية والتيغرينية والأورومو والعربية (من اليمين لليسار) والصومالية مع حزم غير متصلة بحجم 160 كيلوبايت.',
      so: 'Qoraallada hoose, codka iyo diiwaangelinta waxaa lagu heli karaa Ingiriisi, Amxaari, Tigray, Oromo, Carabi iyo Soomaali iyadoo leh xirmo 160 KB ah.',
    } as Record<AppLang, string>,
  },
];

import express from 'express';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import { INITIAL_PLUGINS } from './src/data/plugins';
import {
  LESSON_METADATA,
  LESSON_VTT_BY_LANG,
} from './src/data/lessonMedia';
import type { AppLang } from './src/i18n/translations';
import { SEED_CERTIFICATES, SEED_JOBS } from './src/data/jobsAndBadges';
import {
  computeNewRating,
  filterPlugins,
  verifyBadgeSignature,
  type MarketplacePlugin,
  type OpenBadgeCredential,
} from './src/utils/accessibilityLogic';
import { parseVtt } from './src/utils/vttParser';

const PORT = 3000;

interface LearnerProfile {
  id: string;
  name: string;
  phone: string;
  language: string;
  idRoute: string;
  authMethod: string;
  createdAt: string;
}

// Separate in-memory stores on purpose (privacy by design: support needs never live inside profile)
const pluginsStore: MarketplacePlugin[] = structuredClone(INITIAL_PLUGINS);
const learnerProfiles = new Map<string, LearnerProfile>();
const learnerSupportChoices = new Map<string, string[]>();
const lessonCaptions = new Map<string, Record<AppLang, string>>([
  ['demo-accessibility', { ...LESSON_VTT_BY_LANG }],
  ['va-future-01', { ...LESSON_VTT_BY_LANG }],
]);

function normalizeLangParam(raw: unknown): AppLang {
  const val = String(raw || 'en').toLowerCase();
  if (val === 'am' || val === 'ti' || val === 'om' || val === 'ar' || val === 'so') {
    return val;
  }
  return 'en';
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // Serve public assets (/module/*.js, /assets/media/*, /demo/blank.html, /openapi.yaml)
  app.use(express.static(path.resolve(process.cwd(), 'public')));

  // --- Level 2 REST API v1 ---
  app.get('/api/v1/health', (_req, res) => {
    res.json({ ok: true, service: 'digital-bridge-hub', version: '1.0.0' });
  });

  app.get('/api/v1/extensions', (req, res) => {
    const q = typeof req.query.q === 'string' ? req.query.q : '';
    const category =
      typeof req.query.category === 'string' ? req.query.category : 'all';
    const disability =
      typeof req.query.disability === 'string' ? req.query.disability : 'all';
    const results = filterPlugins(
      pluginsStore,
      q,
      category as Parameters<typeof filterPlugins>[2],
      disability as Parameters<typeof filterPlugins>[3]
    );
    res.json({ extensions: results, total: results.length });
  });

  app.post('/api/v1/extensions/:id/rate', (req, res) => {
    const plugin = pluginsStore.find((p) => p.id === req.params.id);
    if (!plugin) {
      res.status(404).json({ error: 'Extension not found.' });
      return;
    }
    const { rating, author, comment, deviceTested } = req.body || {};
    const stars = Number(rating);
    if (!Number.isFinite(stars) || stars < 1 || stars > 5) {
      res.status(400).json({ error: 'Rating must be a number between 1 and 5.' });
      return;
    }
    if (!author || !String(author).trim() || !comment || !String(comment).trim()) {
      res.status(400).json({ error: 'Author name and review comment are required.' });
      return;
    }
    const updated = computeNewRating(plugin.ratingAvg, plugin.ratingCount, stars);
    plugin.ratingAvg = updated.ratingAvg;
    plugin.ratingCount = updated.ratingCount;
    plugin.reviews.unshift({
      id: `rev-${Date.now()}`,
      author: String(author).trim(),
      rating: Math.round(stars),
      comment: String(comment).trim(),
      deviceTested: String(deviceTested || 'Browser / Keyboard').trim(),
      createdAt: new Date().toISOString().slice(0, 10),
    });
    res.status(201).json({ extension: plugin });
  });

  app.post('/api/v1/extensions/:id/download', (req, res) => {
    const plugin = pluginsStore.find((p) => p.id === req.params.id);
    if (!plugin) {
      res.status(404).json({ error: 'Extension not found.' });
      return;
    }
    plugin.downloads += 1;
    res.json({
      extension: plugin,
      downloadUrl: plugin.scriptSrc || `/api/v1/extensions/${plugin.id}/bundle`,
    });
  });

  app.post('/api/v1/learners', (req, res) => {
    const { name, phone, language, idRoute, authMethod } = req.body || {};
    if (!name || !String(name).trim()) {
      res.status(400).json({ error: 'Learner name is required.' });
      return;
    }
    const id = `lrn-${Date.now().toString(36)}`;
    const profile: LearnerProfile = {
      id,
      name: String(name).trim(),
      phone: String(phone || '').trim(),
      language: String(language || 'en'),
      idRoute: String(idRoute || 'partner_referral'),
      authMethod: String(authMethod || 'standard'),
      createdAt: new Date().toISOString(),
    };
    learnerProfiles.set(id, profile);
    res.status(201).json({ id, profile });
  });

  app.put('/api/v1/learners/:id/support', (req, res) => {
    const { id } = req.params;
    const { support } = req.body || {};
    if (!Array.isArray(support)) {
      res.status(400).json({ error: 'Support must be an array of support identifiers.' });
      return;
    }
    learnerSupportChoices.set(
      id,
      support.map((item) => String(item))
    );
    res.json({ id, storedSeparately: true, count: support.length });
  });

  app.get('/api/v1/learners/:id/export', (req, res) => {
    const { id } = req.params;
    const profile = learnerProfiles.get(id);
    if (!profile) {
      res.status(404).json({ error: 'Learner record not found.' });
      return;
    }
    res.json({
      profile,
      support: learnerSupportChoices.get(id) || [],
      exportedAt: new Date().toISOString(),
    });
  });

  app.delete('/api/v1/learners/:id', (req, res) => {
    const { id } = req.params;
    const existed = learnerProfiles.delete(id);
    learnerSupportChoices.delete(id);
    if (!existed) {
      res.status(404).json({ error: 'Learner record not found.' });
      return;
    }
    res.json({ deleted: true, id });
  });

  // Savanna static pages & dual-video lesson registry
  interface SavannaLessonRecord {
    id: string;
    title: string;
    video: string;
    sign: string;
    audio: string;
    captions: Record<string, string>;
    descriptions: Record<string, string>;
    offline_pack_bytes: number;
    viewer_url: string;
  }

  const savannaLessons = new Map<string, SavannaLessonRecord>([
    [
      'va-future',
      {
        id: 'va-future',
        title: 'The Future of the VA Industry',
        video: '/savanna/assets/media/va-future-lesson.mp4',
        sign: '/savanna/assets/media/va-future-ethsl.mp4',
        audio: '/savanna/assets/media/va-future-audio.mp3',
        captions: {
          en: '/savanna/assets/captions/va-future-en.vtt',
          am: '/savanna/assets/captions/va-future-am.vtt',
        },
        descriptions: {
          en: '/savanna/assets/captions/va-future-ad-en.vtt',
          am: '/savanna/assets/captions/va-future-ad-am.vtt',
        },
        offline_pack_bytes: 285000,
        viewer_url: '/savanna/pages/concept-with-navigation.html?lesson=va-future',
      },
    ],
    [
      'html-h1-tag',
      {
        id: 'html-h1-tag',
        title: 'What is the H1 tag on HTML',
        video: '/savanna/assets/media/va-future-lesson.mp4',
        sign: '/savanna/assets/media/va-future-ethsl.mp4',
        audio: '/savanna/assets/media/va-future-audio.mp3',
        captions: {
          en: '/savanna/assets/captions/va-future-en.vtt',
          am: '/savanna/assets/captions/va-future-am.vtt',
        },
        descriptions: {
          en: '/savanna/assets/captions/va-future-ad-en.vtt',
          am: '/savanna/assets/captions/va-future-ad-am.vtt',
        },
        offline_pack_bytes: 285000,
        viewer_url: '/savanna/pages/concept-with-navigation.html?lesson=html-h1-tag',
      },
    ],
    [
      'demo-accessibility',
      {
        id: 'demo-accessibility',
        title: LESSON_METADATA.lessonTitleEn,
        video: LESSON_METADATA.videoUrl,
        sign: '/savanna/assets/media/va-future-ethsl.mp4',
        audio: LESSON_METADATA.audioOnlyUrl,
        captions: {
          en: '/assets/media/demo-lesson.vtt',
          am: '/assets/media/demo-lesson.am.vtt',
        },
        descriptions: {
          en: '/assets/media/demo-lesson.ad.vtt',
        },
        offline_pack_bytes: 160000,
        viewer_url: '/savanna/pages/concept-with-navigation.html?lesson=demo-accessibility',
      },
    ],
  ]);

  const accommodationRequests: Array<{
    id: string;
    job_id: string;
    accommodations: string[];
    language: string;
    created_at: string;
  }> = [];

  app.get('/api/v1/lessons', (_req, res) => {
    res.json(Array.from(savannaLessons.values()));
  });

  app.post('/api/v1/lessons', express.raw({ type: '*/*', limit: '25mb' }), (req, res) => {
    let fields: Record<string, string> = {};
    const ctype = String(req.headers['content-type'] || '');
    if (ctype.includes('application/json') && Buffer.isBuffer(req.body)) {
      try {
        fields = JSON.parse(req.body.toString('utf8'));
      } catch {
        fields = {};
      }
    } else if (ctype.includes('multipart/form-data') && Buffer.isBuffer(req.body)) {
      const match = ctype.match(/boundary=([^;\s]+)/i);
      const boundary = match?.[1]?.replace(/^"|"$/g, '');
      if (boundary) {
        const raw = req.body.toString('latin1');
        const parts = raw.split(`--${boundary}`);
        for (const part of parts) {
          const nameMatch = part.match(/name="([^"]+)"/);
          if (!nameMatch || part.includes('filename="')) continue;
          const idx = part.indexOf('\r\n\r\n');
          if (idx !== -1) {
            const val = part.slice(idx + 4).replace(/\r\n$/, '');
            fields[nameMatch[1]] = Buffer.from(val, 'latin1').toString('utf8').trim();
          }
        }
      }
    } else if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
      fields = req.body as Record<string, string>;
    }

    const title = (fields.title || '').trim() || 'Custom Accessible Tutorial';
    const rawId = (fields.lesson_id || '').trim();
    const cleanId =
      rawId ||
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') ||
      `lesson-${Date.now()}`;

    const entry: SavannaLessonRecord = {
      id: cleanId,
      title,
      video: (fields.video_url || '').trim() || '/savanna/assets/media/va-future-lesson.mp4',
      sign: (fields.sign_url || '').trim() || '/savanna/assets/media/va-future-ethsl.mp4',
      audio: (fields.audio_url || '').trim() || '/savanna/assets/media/va-future-audio.mp3',
      captions: {
        en: (fields.captions_en_url || '').trim() || '/savanna/assets/captions/va-future-en.vtt',
        am: (fields.captions_am_url || '').trim() || '/savanna/assets/captions/va-future-am.vtt',
      },
      descriptions: {
        en: '/savanna/assets/captions/va-future-ad-en.vtt',
        am: '/savanna/assets/captions/va-future-ad-am.vtt',
      },
      offline_pack_bytes: 285000,
      viewer_url: `/savanna/pages/concept-with-navigation.html?lesson=${encodeURIComponent(cleanId)}`,
    };
    savannaLessons.set(cleanId, entry);
    if (!lessonCaptions.has(cleanId)) {
      lessonCaptions.set(cleanId, { ...LESSON_VTT_BY_LANG });
    }
    res.status(201).json(entry);
  });

  app.get('/api/v1/lessons/:id', (req, res) => {
    const savannaEntry = savannaLessons.get(req.params.id);
    if (!lessonCaptions.has(req.params.id) && !savannaEntry) {
      res.status(404).json({ error: 'Lesson not found.' });
      return;
    }
    res.json({
      ...LESSON_METADATA,
      ...(savannaEntry || {}),
      id: req.params.id,
      tracks: ['en', 'am', 'ti', 'om', 'ar', 'so'],
    });
  });

  app.get('/api/v1/lessons/:id/transcript', (req, res) => {
    const tracks = lessonCaptions.get(req.params.id) || { ...LESSON_VTT_BY_LANG };
    if (!lessonCaptions.has(req.params.id) && !savannaLessons.has(req.params.id)) {
      res.status(404).json({ error: 'Transcript not found.' });
      return;
    }
    const lang = normalizeLangParam(req.query.lang);
    const fmt = Array.isArray(req.query.format) ? req.query.format[0] : req.query.format;
    if (fmt === 'json') {
      res.json({ lessonId: req.params.id, lang, cues: parseVtt(tracks[lang]) });
      return;
    }
    res.type('text/vtt; charset=utf-8').send(tracks[lang]);
  });

  app.post('/api/v1/lessons/:id/captions', (req, res) => {
    const tracks = lessonCaptions.get(req.params.id) || (savannaLessons.has(req.params.id) ? { ...LESSON_VTT_BY_LANG } : null);
    if (!tracks) {
      res.status(404).json({ error: 'Lesson not found.' });
      return;
    }
    const { lang, vtt } = req.body || {};
    if (!vtt || !String(vtt).includes('WEBVTT')) {
      res.status(400).json({ error: 'Valid WebVTT text starting with WEBVTT is required.' });
      return;
    }
    const targetLang = normalizeLangParam(lang);
    tracks[targetLang] = String(vtt);
    lessonCaptions.set(req.params.id, tracks);
    res.status(201).json({ updated: true, lang: targetLang });
  });

  app.get('/api/v1/lessons/:id/offline-pack', (req, res) => {
    const tracks = lessonCaptions.get(req.params.id) || (savannaLessons.has(req.params.id) ? { ...LESSON_VTT_BY_LANG } : null);
    if (!tracks) {
      res.status(404).json({ error: 'Lesson not found.' });
      return;
    }
    if (req.query.inline !== '1') {
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${req.params.id}-offline-pack.json"`
      );
    }
    res.json({
      lessonId: req.params.id,
      estimatedSizeKb: LESSON_METADATA.offlineSizeKb,
      audioUrl: LESSON_METADATA.audioOnlyUrl,
      tracks,
      enVtt: tracks.en,
      amVtt: tracks.am,
    });
  });

  const SAVANNA_JOB_CARD: Record<'en' | 'am', Record<string, unknown>> = {
    en: {
      id: 'accessible-va',
      title: 'Junior Virtual Assistant',
      organization: 'Safaricom Telecommunications Ethiopia',
      location: 'Addis Ababa or remote',
      summary:
        'Support a distributed team with scheduling and accessible digital documents. The employer provides an Ethiopian Sign Language interpreter and offers remote interview accommodations.',
      accommodations: [
        'Screen-reader compatible application process (NVDA / TalkBack)',
        'Ethiopian Sign Language (EthSL) interpreter on request',
        'Remote or asynchronous written interview option',
      ],
      certificate_url: '/certificates/va-2026-001',
    },
    am: {
      id: 'accessible-va',
      title: 'ጀማሪ ቨርቹዋል ረዳት (Junior Virtual Assistant)',
      organization: 'Safaricom Telecommunications Ethiopia',
      location: 'አዲስ አበባ ወይም በርቀት (Remote)',
      summary:
        'የርቀት ቡድንን በቀጠሮ ማስያዝ እና በተደራሽ ዲጂታል ሰነዶች ያግዙ። ቀጣሪው የኢትዮጵያ የምልክት ቋንቋ አስተርጓሚ እና ለቃለ መጠይቅ ልዩ ድጋፍ ያቀርባል።',
      accommodations: [
        'ለስክሪን አንባቢ (NVDA / TalkBack) ተስማሚ የሆነ የማመልከቻ ሂደት',
        'በጥያቄ የሚቀርብ የኢትዮጵያ የምልክት ቋንቋ (EthSL) አስተርጓሚ',
        'በርቀት ወይም በጽሑፍ የሚከናወን የቃለ መጠይቅ አማራጭ',
      ],
      certificate_url: '/certificates/va-2026-001',
    },
  };

  app.get('/api/v1/jobs', (_req, res) => {
    res.json({ jobs: SEED_JOBS, certificates: SEED_CERTIFICATES });
  });

  app.get('/api/v1/jobs/:jobId', (req, res) => {
    if (req.params.jobId === 'accessible-va') {
      const langKey = req.query.lang === 'am' ? 'am' : 'en';
      res.json(SAVANNA_JOB_CARD[langKey]);
      return;
    }
    const found = SEED_JOBS.find((j) => j.id === req.params.jobId);
    if (!found) {
      res.status(404).json({ error: 'Job not found.' });
      return;
    }
    res.json(found);
  });

  app.post('/api/v1/jobs/:jobId/accommodations', (req, res) => {
    const body = req.body || {};
    const entry = {
      id: `acc-${String(accommodationRequests.length + 1).padStart(3, '0')}`,
      job_id: req.params.jobId,
      accommodations: Array.isArray(body.accommodations) ? body.accommodations : [],
      language: String(body.language || 'en'),
      created_at: new Date().toISOString(),
    };
    accommodationRequests.push(entry);
    res.status(201).json({ status: 'confirmed', request: entry });
  });

  app.get('/api/v1/certificates/:credentialId', (req, res) => {
    const cred = SEED_CERTIFICATES[0];
    const sigOverride = typeof req.query.sig === 'string' ? req.query.sig : undefined;
    const valid = !sigOverride || sigOverride === cred.signatureHash;
    res.json({
      credential: { ...cred, id: req.params.credentialId },
      valid,
      status: valid ? 'valid' : 'not_valid',
    });
  });

  app.get('/certificates/:credentialId', (req, res) => {
    const cred = SEED_CERTIFICATES[0];
    const sigOverride = typeof req.query.sig === 'string' ? req.query.sig : undefined;
    const valid = !sigOverride || sigOverride === cred.signatureHash;
    res.type('html').send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Open Badges 3.0 Verification — ${req.params.credentialId}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 720px; margin: 2.5rem auto; padding: 0 1rem; color: #0f172a; background: #f8fafc; }
    .card { background: #fff; border: 1px solid #cbd5e1; border-radius: 12px; padding: 1.5rem; }
    .status { font-weight: 700; padding: 0.4rem 0.75rem; border-radius: 6px; display: inline-block; }
    .valid { background: #dcfce7; color: #166534; }
    .invalid { background: #fee2e2; color: #991b1b; }
  </style>
</head>
<body>
  <main class="card">
    <h1>Open Badges 3.0 Credential Verification</h1>
    <p class="status ${valid ? 'valid' : 'invalid'}" role="status">${valid ? 'VALID SIGNATURE' : 'NOT VALID / TAMPERED SIGNATURE'}</p>
    <p><strong>Credential ID:</strong> ${req.params.credentialId}</p>
    <p><strong>Recipient:</strong> ${cred.recipientName}</p>
    <p><strong>Achievement:</strong> ${cred.achievementTitle}</p>
    <p><strong>Issuer:</strong> ${cred.issuer.name}</p>
    <p><strong>Signature Hash:</strong> <code>${sigOverride || cred.signatureHash}</code></p>
    <p><a href="/savanna/pages/jobs.html">&larr; Back to Savanna Career Gateway</a></p>
  </main>
</body>
</html>`);
  });

  app.post('/api/v1/certificates/verify', (req, res) => {
    const credential = req.body as OpenBadgeCredential;
    const verdict = verifyBadgeSignature(credential);
    res.json(verdict);
  });

  // Accessible Interactive API Documentation Page (/docs)
  app.get('/docs', (_req, res) => {
    res.type('html').send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Digital Bridge API v1 — Interactive Docs</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 920px; margin: 2rem auto; padding: 0 1rem; color: #0f172a; background: #f8fafc; line-height: 1.6; }
    h1, h2 { color: #0b2239; }
    .endpoint { background: #fff; border: 1px solid #cbd5e1; border-radius: 10px; padding: 1rem; margin-bottom: 1rem; }
    button { min-height: 44px; padding: 0.5rem 1rem; background: #0b2239; color: #fff; border: 0; border-radius: 8px; cursor: pointer; font-weight: 600; }
    pre { background: #0f172a; color: #f8fafc; padding: 0.85rem; border-radius: 8px; overflow-x: auto; }
  </style>
</head>
<body>
  <main>
    <h1>Digital Bridge REST API v1</h1>
    <p>Specification: <a href="/openapi.yaml">/openapi.yaml</a> · Standalone Proof: <a href="/demo/blank.html">/demo/blank.html</a></p>
    <div class="endpoint">
      <h2>GET /api/v1/extensions</h2>
      <p>Search and filter VS Code extensions and Digital Bridge Web Components.</p>
      <button type="button" onclick="runCall('/api/v1/extensions')">Try GET /api/v1/extensions</button>
    </div>
    <div class="endpoint">
      <h2>GET /api/v1/lessons/va-future-01/transcript?lang=am</h2>
      <p>Retrieve Amharic WebVTT subtitle track.</p>
      <button type="button" onclick="runCall('/api/v1/lessons/va-future-01/transcript?lang=am')">Try Amharic Transcript</button>
    </div>
    <div class="endpoint">
      <h2>GET /api/v1/jobs</h2>
      <p>Fetch inclusive job listings and Open Badges 3.0 credentials.</p>
      <button type="button" onclick="runCall('/api/v1/jobs')">Try GET /api/v1/jobs</button>
    </div>
    <h2>Live Response</h2>
    <pre id="out" aria-live="polite">Click an endpoint button to inspect the JSON/VTT response.</pre>
  </main>
  <script>
    async function runCall(url) {
      const res = await fetch(url);
      const txt = await res.text();
      document.getElementById('out').textContent = 'HTTP ' + res.status + '\\n\\n' + txt;
    }
  </script>
</body>
</html>`);
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Digital Bridge server listening on http://localhost:${PORT}`);
  });
}

startServer();

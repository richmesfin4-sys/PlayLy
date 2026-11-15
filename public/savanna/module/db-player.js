(function () {
  "use strict";

  const scriptUrl = document.currentScript && document.currentScript.src;
  let moduleBase; try { moduleBase = new URL(".", scriptUrl || window.location.href); } catch { moduleBase = new URL("http://localhost/"); }
  const dictionaries = new Map();

  const fallback = {
    playerTitle: "Accessible Lesson Player",
    play: "Play",
    pause: "Pause",
    back: "Back 10 seconds",
    forward: "Forward 10 seconds",
    speed: "Playback speed",
    captions: "Captions",
    captionLanguage: "Caption language",
    captionSettings: "Caption and accessibility settings",
    captionSize: "Caption size",
    captionColor: "Caption text colour",
    captionBackground: "Caption background",
    captionPosition: "Caption position",
    posBottom: "Bottom",
    posTop: "Top",
    audioDescription: "Audio description",
    signLanguage: "Sign Language Video (EthSL)",
    signPlayerTitle: "EthSL Video Player",
    signPrerecorded: "Human Video",
    signVideoDesc: "Prerecorded Ethiopian Sign Language interpreter video",
    playPauseSign: "Play or pause synchronized video",
    splitView: "Side-by-side view",
    transcript: "Transcript",
    editCaptions: "Edit captions",
    downloadTranscript: "Download transcript (.txt)",
    downloadBraille: "Download Braille (.brf)",
    downloadVtt: "Export WebVTT (.vtt)",
    downloadOffline: "Download 3G offline pack",
    keyboardHelp: "Keyboard help",
    fullScreen: "Full screen",
    exitFullScreen: "Exit full screen",
    seek: "Seek timeline",
    noSign: "No Ethiopian Sign Language recording is available for this lesson.",
    topLeft: "Top left",
    topRight: "Top right",
    bottomLeft: "Bottom left",
    bottomRight: "Bottom right",
    larger: "Larger",
    smaller: "Smaller",
    close: "Close",
    saveCorrections: "Save & submit captions",
    reviewerName: "Reviewer name",
    reviewNotes: "Correction notes",
    editorHeading: "Caption Pipeline & Timestamp Editor",
    editorIntro: "Review auto-generated speech-to-text cues, adjust timestamps or Amharic/English phrasing, and export or submit to the platform.",
    listenSummary: "Listen to audio summary",
    stopSummary: "Stop audio",
    requestAccommodation: "Request interview accommodation",
    verifyCertificate: "Verify Open Badge credential",
    workplaceAccommodations: "Workplace & interview accommodations",
    accommodationModalTitle: "Request Interview Accommodation",
    accommodationDesc: "Your request goes privately to the hiring coordinator. No medical proof is required.",
    accOptionSign: "Ethiopian Sign Language (EthSL) interpreter",
    accOptionScreenReader: "Screen-reader compatible assessment",
    accOptionExtraTime: "50% extended interview time",
    accOptionAsync: "Written / asynchronous interview option",
    submitRequest: "Send private request",
    requestSent: "Accommodation request saved and confirmed.",
    liveViewerTitle: "Recorded Live Session Viewer",
    chatHeading: "Synchronized Session Chat Log",
    searchChat: "Filter chat messages",
    audioOnlyMode: "3G Audio-Only Mode",
    dockSign: "Dock to video",
    floatSign: "Float on page"
  };

  const escapeHtml = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[ch]);

  const toSeconds = (stamp) =>
    String(stamp || "0:00")
      .replace(",", ".")
      .split(":")
      .map(Number)
      .reduce((acc, part) => acc * 60 + (Number.isFinite(part) ? part : 0), 0);

  const formatTime = (value) => {
    const seconds = Math.max(0, Math.floor(Number(value) || 0));
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  };

  const formatVttTimestamp = (value) => {
    const total = Math.max(0, Number(value) || 0);
    const hrs = Math.floor(total / 3600);
    const mins = Math.floor((total % 3600) / 60);
    const secs = (total % 60).toFixed(3).padStart(6, "0");
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${secs}`;
  };

  const parseVtt = (text) =>
    String(text || "")
      .replace(/^\uFEFF?WEBVTT[^\n]*\n/i, "")
      .split(/\r?\n\s*\r?\n/)
      .map((block) => block.trim().split(/\r?\n/).filter(Boolean))
      .map((lines) => {
        const timing = lines.findIndex((line) => line.includes("-->"));
        if (timing < 0) return null;
        const [start, end] = lines[timing]
          .split("-->")
          .map((part) => part.trim().split(/\s+/)[0]);
        const rawText = lines.slice(timing + 1).join(" ").replace(/<v\s+([^>]+)>/gi, "$1: ").replace(/<\/?[^>]+>/g, "");
        return { start: toSeconds(start), end: toSeconds(end), text: rawText.trim() };
      })
      .filter((cue) => cue && cue.text);

  const serializeVtt = (cues) =>
    "WEBVTT\n\n" +
    (cues || [])
      .map((cue, idx) => `${idx + 1}\n${formatVttTimestamp(cue.start)} --> ${formatVttTimestamp(cue.end)}\n${cue.text}`)
      .join("\n\n") +
    "\n";

  const languageForPath = (path) =>
    /(?:[._-]am(?:[._-]|$)|amharic)/i.test(path) ? "am" : "en";

  const BRAILLE_MAP = {
    a: "a", b: "b", c: "c", d: "d", e: "e", f: "f", g: "g", h: "h", i: "i", j: "j",
    k: "k", l: "l", m: "m", n: "n", o: "o", p: "p", q: "q", r: "r", s: "s", t: "t",
    u: "u", v: "v", w: "w", x: "x", y: "y", z: "z",
    "1": "#a", "2": "#b", "3": "#c", "4": "#d", "5": "#e", "6": "#f", "7": "#g", "8": "#h", "9": "#i", "0": "#j",
    ",": "1", ";": "2", ":": "3", ".": "4", "!": "6", "(": "7", ")": "7", "?": "8", '"': "8", "-": "-", " ": " "
  };

  function textToBrailleAscii(text, maxLineLen = 38) {
    const words = String(text || "").split(/\s+/);
    const lines = [];
    let currentLine = "";
    for (const word of words) {
      let brfWord = "";
      for (let i = 0; i < word.length; i++) {
        const char = word[i];
        if (char >= "A" && char <= "Z") brfWord += ",";
        brfWord += BRAILLE_MAP[char.toLowerCase()] || char.toLowerCase();
      }
      if ((currentLine + " " + brfWord).trim().length <= maxLineLen) {
        currentLine = (currentLine + " " + brfWord).trim();
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = brfWord;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines.join("\r\n");
  }

  async function getDictionary(language) {
    const key = language === "am" ? "am" : "en";
    if (dictionaries.has(key)) return dictionaries.get(key);
    try {
      const response = await fetch(new URL(`i18n/${key}.json`, moduleBase));
      if (!response.ok) throw new Error("Dictionary fetch failed");
      const data = { ...fallback, ...(await response.json()) };
      dictionaries.set(key, data);
      return data;
    } catch {
      return fallback;
    }
  }

  const DEFAULT_CUES = {
    en: [
      { start: 0, end: 6, text: "[Introductory chime] Welcome to Module 2: The Future of the Virtual Assistant (VA) Industry." },
      { start: 6, end: 13, text: "The Virtual Assistant profession is not shrinking. It is evolving rapidly as global remote work expands." },
      { start: 13, end: 21, text: "[Soft transition tone] Important Distinction: Virtual Assistant can mean an AI software bot like Siri, or a skilled human remote professional." },
      { start: 21, end: 29, text: "While AI automates repetitive scheduling and data entry, human VAs lead in judgment, empathy, and complex problem-solving." },
      { start: 29, end: 37, text: "By combining AI tools with human communication skills, Ethiopian tech talent can compete for global remote careers." },
      { start: 37, end: 45, text: "[Closing chime] Complete this concept and review the Accessible Career Gateway below to share your verifiable ALX certificate with employers." }
    ],
    am: [
      { start: 0, end: 6, text: "[የመክፈቻ ደወል ድምፅ] እንኳን ወደ ሞጁል 2 በደህና መጡ፦ የቨርቹዋል ረዳት (VA) ኢንዱስትሪ የወደፊት እጣ ፈንታ።" },
      { start: 6, end: 13, text: "የቨርቹዋል ረዳት ሙያ እየጠበበ አይደለም፤ የርቀት ሥራ በዓለም አቀፍ ደረጃ እያደገ ሲሄድ በፍጥነት እየተሻሻለ ነው።" },
      { start: 13, end: 21, text: "[የሽግግር ድምፅ] አስፈላጊ ልዩነት፦ ቨርቹዋል ረዳት ማለት እንደ ሲሪ ያለ የAI ሶፍትዌር ወይም የሰለጠነ የሰው የርቀት ባለሙያ ማለት ሊሆን ይችላል።" },
      { start: 21, end: 29, text: "AI ተደጋጋሚ የመረጃ አያያዝ ስራዎችን ሲያቀልል፣ የሰው ባለሙያዎች ግን በውሳኔ አሰጣጥ፣ በመረዳት እና ውስብስብ ችግሮችን በመፍታት ይመራሉ።" },
      { start: 29, end: 37, text: "የAI መሳሪያዎችን ከሰው ልጅ የተግባቦት ክህሎት ጋር በማቀናጀት፣ የኢትዮጵያ ወጣቶች በዓለም አቀፍ የርቀት ሥራዎች መወዳደር ይችላሉ።" },
      { start: 37, end: 45, text: "[የመዝጊያ ደወል ድምፅ] ይህንን ትምህርት ያጠናቅቁ እና የተረጋገጠ የALX የምስክር ወረቀትዎን ለቀጣሪዎች ለማጋራት ከታች ያለውን የሥራ እድል ክፍል ይመልከቱ።" }
    ]
  };

  const DEFAULT_DESCRIPTIONS = {
    en: [
      { start: 0, end: 5.5, text: "Audio description: A high-contrast dark navy title card reads Accessible Learning Media, accompanied by an Ethiopian Sign Language interpreter window." },
      { start: 6, end: 15.5, text: "Audio description: The lesson visual displays a diagram comparing global remote teams and digital operations." },
      { start: 16, end: 28.5, text: "Audio description: A side-by-side comparison highlights AI automation for routine scheduling versus human empathy." },
      { start: 29, end: 39, text: "Audio description: The screen shows the ALX Accessible Career Gateway card with a verified credential link." }
    ],
    am: [
      { start: 0, end: 5.5, text: "የድምፅ መግለጫ፦ ጥቁር ሰማያዊ የርዕስ ገጽ ተደራሽ የትምህርት ማጫወቻ የሚል ጽሑፍ እና የኢትዮጵያ የምልክት ቋንቋ አስተርጓሚ ያሳያል።" },
      { start: 6, end: 15.5, text: "የድምፅ መግለጫ፦ ምስሉ የዓለም አቀፍ የርቀት ሥራ ቡድኖችን እና የዲጂታል አሠራሮችን ያነጻጽራል።" },
      { start: 16, end: 28.5, text: "የድምፅ መግለጫ፦ የAI መደበኛ የመረጃ አያያዝ ከሰው ልጅ ውሳኔ አሰጣጥ እና መረዳት ጋር ጎን ለጎን ተነጻጽሯል።" },
      { start: 29, end: 39, text: "የድምፅ መግለጫ፦ ማያ ገጹ የተረጋገጠ የALX የምስክር ወረቀት ማገናኛ ያለው የሥራ እድል ካርድ ያሳያል።" }
    ]
  };

  /* ==========================================================================
     1. <db-player> — Accessible Video Player, Sign Language & Transcript Module
     ========================================================================== */
  class DbPlayer extends HTMLElement {
    static get observedAttributes() {
      return ["lang", "src", "captions", "sign", "describe", "descriptions", "api", "lesson-id", "offline-worker", "title", "theme"];
    }

    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this.captionCues = { en: [...DEFAULT_CUES.en], am: [...DEFAULT_CUES.am] };
      this.descriptionCues = { en: [...DEFAULT_DESCRIPTIONS.en], am: [...DEFAULT_DESCRIPTIONS.am] };
      this.describedCue = -1;
      this.signTimer = null;
      this.t = fallback;
      this.startQueued = false;
    }

    connectedCallback() {
      this.initialisePreferences();
      if ("serviceWorker" in navigator && this.offlineWorkerSource) {
        navigator.serviceWorker.register(this.offlineWorkerSource).catch(() => {});
      }
      this.queueRender();
    }

    disconnectedCallback() {
      if (this.signTimer) window.clearInterval(this.signTimer);
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      if (this.fullscreenHandler) {
        document.removeEventListener("fullscreenchange", this.fullscreenHandler);
      }
      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
        this.resizeObserver = null;
      }
      if (this.windowResizeHandler) {
        window.removeEventListener("resize", this.windowResizeHandler);
        this.windowResizeHandler = null;
      }
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue === newValue) return;
      if (name === "lang" && this.preferences) {
        this.preferences.captionLanguage = newValue === "am" ? "am" : "en";
      }
      this.queueRender();
    }

    queueRender() {
      if (this.startQueued) return;
      this.startQueued = true;
      window.queueMicrotask(async () => {
        this.startQueued = false;
        await this.render();
      });
    }

    initialisePreferences() {
      const saved = this.readStorage();
      this.preferences = {
        captions: saved.captions ?? true,
        captionLanguage: saved.captionLanguage || (this.getAttribute("lang") === "am" ? "am" : "en"),
        captionSize: saved.captionSize || "1.25",
        captionColor: saved.captionColor || "#fff000",
        captionBackground: saved.captionBackground || "#000000",
        captionPosition: saved.captionPosition || "bottom",
        sign: saved.sign ?? true,
        signPosition: saved.signPosition || "bottom-right",
        signSize: saved.signSize || "medium",
        signFloating: saved.signFloating ?? true,
        signSplit: saved.signSplit ?? false,
        signCoords:
          saved.signCoords && (typeof saved.signCoords.xRatio === "number" || typeof saved.signCoords.left === "number")
            ? saved.signCoords
            : null,
        audioDescription: saved.audioDescription ?? false,
        transcriptOpen: saved.transcriptOpen ?? true,
        playbackRate: saved.playbackRate || 1
      };
    }

    readStorage() {
      try {
        return JSON.parse(window.localStorage.getItem("db-player-preferences") || "{}");
      } catch {
        return {};
      }
    }

    persist(announcementText) {
      try {
        window.localStorage.setItem("db-player-preferences", JSON.stringify(this.preferences));
      } catch {}
      this.dispatchEvent(
        new CustomEvent("db-player:prefs", {
          bubbles: true,
          composed: true,
          detail: {
            captionSize: this.preferences.captionSize,
            captionColor: this.preferences.captionColor,
            captionBackground: this.preferences.captionBackground,
            captionPosition: this.preferences.captionPosition,
            signPosition: this.preferences.signPosition,
            signSize: this.preferences.signSize,
            signCoords: this.preferences.signCoords,
            signFloating: this.preferences.signFloating,
            language: this.preferences.captionLanguage
          }
        })
      );
      if (announcementText) this.announce(announcementText);
    }

    get language() {
      return this.getAttribute("lang") === "am" ? "am" : "en";
    }
    get source() {
      return this.getAttribute("src") || "/savanna/assets/media/va-future-lesson.mp4";
    }
    get signSource() {
      return this.getAttribute("sign") || "/savanna/assets/media/va-future-ethsl.mp4";
    }
    get descriptionSource() {
      return this.getAttribute("describe") || this.getAttribute("descriptions") || "";
    }
    get api() {
      return (this.getAttribute("api") || "/api/v1").replace(/\/$/, "");
    }
    get lessonId() {
      return this.getAttribute("lesson-id") || "va-future";
    }
    get offlineWorkerSource() {
      return this.getAttribute("offline-worker") || "/service-worker.js";
    }

    captionSources() {
      const declared = (this.getAttribute("captions") || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      const map = {};
      declared.forEach((path) => {
        map[languageForPath(path)] = path;
      });
      return map;
    }

    async loadTracks() {
      const declared = this.captionSources();
      for (const [code, path] of Object.entries(declared)) {
        try {
          const response = await fetch(path);
          if (response.ok) {
            const parsed = parseVtt(await response.text());
            if (parsed.length) this.captionCues[code] = parsed;
          }
        } catch {}
      }
      if (this.descriptionSource) {
        const descPaths = this.descriptionSource.split(",").map((s) => s.trim()).filter(Boolean);
        for (const path of descPaths) {
          const langCode = languageForPath(path);
          try {
            const response = await fetch(path);
            if (response.ok) {
              const parsed = parseVtt(await response.text());
              if (parsed.length) this.descriptionCues[langCode] = parsed;
            }
          } catch {}
        }
      }
    }

    async render() {
      const activeVideo = this.shadowRoot.querySelector("#video");
      this.restorePlayback = activeVideo
        ? { time: activeVideo.currentTime, paused: activeVideo.paused, rate: activeVideo.playbackRate }
        : null;
      if (this.signTimer) {
        window.clearInterval(this.signTimer);
        this.signTimer = null;
      }

      this.t = await getDictionary(this.language);
      const t = this.t;
      await this.loadTracks();
      const hasSign = Boolean(this.signSource);
      const captionOptions = ["en", "am"]
        .map(
          (code) =>
            `<option value="${code}" ${this.preferences.captionLanguage === code ? "selected" : ""}>${
              code === "am" ? "አማርኛ (Amharic)" : "English"
            }</option>`
        )
        .join("");

      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            font-family: var(--bs-body-font-family, system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans Ethiopic", sans-serif);
            color: var(--bs-body-color, #101828);
            line-height: 1.6;
            margin: 1rem 0;
          }
          *, *::before, *::after { box-sizing: border-box; }
          .shell {
            border: 2px solid #05192d;
            border-radius: 0.75rem;
            background: #ffffff;
            overflow: visible;
            display: grid;
            gap: 0;
            box-shadow: 0 4px 16px rgba(5, 25, 45, 0.08);
          }
          .shell:fullscreen {
            width: 100vw;
            height: 100vh;
            overflow-y: auto;
            border-radius: 0;
            background: #05192d;
          }
          .heading {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 0.5rem;
            padding: 0.75rem 1rem;
            background: #05192d;
            color: #ffffff;
            border-top-left-radius: 0.65rem;
            border-top-right-radius: 0.65rem;
            border-bottom: 3px solid #0d5c3a;
          }
          .heading h2 {
            margin: 0;
            font-size: 1.15rem;
            font-weight: 700;
            color: #ffffff;
          }
          .time-badge {
            font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
            font-size: 0.95rem;
            background: rgba(255, 255, 255, 0.14);
            padding: 0.2rem 0.6rem;
            border-radius: 0.35rem;
            color: #ffffff;
          }
          .stage {
            position: relative;
            background: #000000;
            display: grid;
            place-items: center;
            min-height: 18rem;
            outline: none;
            overflow: visible;
          }
          .stage.split {
            display: grid !important;
            grid-template-columns: minmax(0, 1.4fr) minmax(280px, 1fr) !important;
            gap: 0.75rem;
            align-items: stretch;
            background: #020b14;
            padding: 0.6rem;
            box-sizing: border-box;
          }
          .stage.split video.main {
            width: 100%;
            height: 100%;
            max-height: 34rem;
            object-fit: contain;
          }
          .stage.split .sign {
            position: relative !important;
            inset: auto !important;
            width: 100% !important;
            height: 100% !important;
            max-height: 34rem;
            left: auto !important;
            top: auto !important;
            right: auto !important;
            bottom: auto !important;
            transform: none !important;
            box-shadow: none;
            cursor: default;
          }
          .stage.split .sign video {
            height: 100%;
            object-fit: contain;
          }
          @media (max-width: 52rem) {
            .stage.split {
              grid-template-columns: 1fr !important;
            }
            .stage.split .sign {
              min-height: 16rem;
            }
          }
          video.main {
            width: 100%;
            max-height: 34rem;
            display: block;
            background: #000000;
          }
          /* Native track elements hidden so our custom restyleable renderer draws cues */
          video::cue { opacity: 0; }
          .captions {
            position: absolute;
            left: 5%;
            right: 5%;
            text-align: center;
            pointer-events: none;
            z-index: 4;
          }
          .captions.bottom { bottom: 8%; }
          .captions.top { top: 8%; }
          .caption {
            display: inline-block;
            padding: 0.35rem 0.75rem;
            border-radius: 0.35rem;
            line-height: 1.45;
            font-weight: 700;
            max-width: 92%;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
          }
          .caption:empty { display: none; }
          .sign {
            position: absolute;
            z-index: 5;
            display: flex;
            flex-direction: column;
            border: 3px solid #00e676;
            border-radius: 0.5rem;
            background: #05192d;
            overflow: hidden;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.75);
            touch-action: none;
            user-select: none;
            -webkit-user-select: none;
            cursor: grab;
            transition: box-shadow 0.15s ease, border-color 0.15s ease;
          }
          .sign-header {
            flex: 0 0 auto;
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: #091e35;
            color: #00e676;
            font-size: 0.68rem;
            font-weight: 700;
            padding: 0.22rem 0.45rem;
            border-bottom: 1px solid #1e3a5f;
            user-select: none;
            letter-spacing: 0.02em;
            pointer-events: auto;
          }
          .sign-header .sign-title {
            display: inline-flex;
            align-items: center;
            color: #f1f5f9;
          }
          .sign-header .sign-badge {
            background: rgba(0, 230, 118, 0.15);
            color: #00e676;
            padding: 0.05rem 0.35rem;
            border-radius: 3px;
            font-size: 0.6rem;
            text-transform: uppercase;
            border: 1px solid rgba(0, 230, 118, 0.4);
          }
          .sign.floating {
            position: fixed !important;
            z-index: 9999 !important;
            box-shadow: 0 12px 36px rgba(0, 0, 0, 0.85);
          }
          .sign.floating.top-left { top: 1rem; left: 1rem; right: auto; bottom: auto; }
          .sign.floating.top-right { top: 1rem; right: 1rem; left: auto; bottom: auto; }
          .sign.floating.bottom-left { bottom: 1rem; left: 1rem; right: auto; top: auto; }
          .sign.floating.bottom-right { bottom: 1rem; right: 1rem; left: auto; top: auto; }

          .sign.docked.top-left, .sign.top-left { top: 0.75rem; left: 0.75rem; right: auto; bottom: auto; }
          .sign.docked.top-right, .sign.top-right { top: 0.75rem; right: 0.75rem; left: auto; bottom: auto; }
          .sign.docked.bottom-left, .sign.bottom-left { bottom: 0.75rem; left: 0.75rem; right: auto; top: auto; }
          .sign.docked.bottom-right, .sign.bottom-right { bottom: 0.75rem; right: 0.75rem; left: auto; top: auto; }
          .sign.custom { bottom: 0.75rem; right: 0.75rem; }

          .sign:focus-visible {
            outline: 3px solid #ffeb3b;
            outline-offset: 2px;
          }
          .sign.dragging {
            cursor: grabbing;
            box-shadow: 0 16px 40px rgba(0, 0, 0, 0.95);
            border-color: #69f0ae;
          }
          .sign[hidden] { display: none !important; }
          .sign video {
            width: 100%;
            flex: 1 1 auto;
            min-height: 0;
            object-fit: contain;
            display: block;
            background: #05192d;
            cursor: pointer;
            user-select: none;
            -webkit-user-drag: none;
          }
          .sign.small { width: 12rem; height: 10.5rem; }
          .sign.medium { width: 15.5rem; height: 13rem; }
          .sign.large { width: 20rem; height: 16.5rem; }
          .sign-controls {
            flex: 0 0 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: nowrap;
            background: #05192d;
            padding: 0.2rem 0.3rem;
            gap: 0.18rem;
            border-top: 1px solid #1e3a5f;
            pointer-events: auto;
            cursor: default;
          }
          .sign-controls button {
            min-height: 26px !important;
            min-width: 24px !important;
            padding: 0.1rem 0.25rem !important;
            font-size: 0.74rem !important;
            line-height: 1 !important;
            background: #0f2942 !important;
            color: #ffffff !important;
            border: 1px solid #64748b !important;
            cursor: pointer;
            border-radius: 0.25rem;
            flex: 1 1 0;
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }
          .sign-controls button:hover {
            background: #1e3a5f !important;
            border-color: #00e676 !important;
          }
          .controls, .prefs {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            padding: 0.75rem 1rem;
            background: #f8fafc;
            align-items: center;
            border-top: 1px solid #cbd5e1;
          }
          .field {
            display: grid;
            flex: 1 1 9.5rem;
            gap: 0.25rem;
            font-size: 0.88rem;
            font-weight: 700;
            color: #1e293b;
          }
          button, select, input {
            min-height: 44px;
            font: inherit;
          }
          button {
            padding: 0.5rem 0.8rem;
            border: 2px solid #05192d;
            border-radius: 0.4rem;
            background: #ffffff;
            color: #05192d;
            font-weight: 700;
            cursor: pointer;
            transition: background 0.15s ease, color 0.15s ease;
          }
          button:hover:not(:disabled) {
            background: #e2e8f0;
          }
          button.primary {
            background: #0d5c3a;
            border-color: #0d5c3a;
            color: #ffffff;
          }
          button.primary:hover:not(:disabled) {
            background: #094229;
          }
          button[aria-pressed="true"] {
            background: #05192d;
            border-color: #05192d;
            color: #ffffff;
          }
          button:disabled {
            cursor: not-allowed;
            opacity: 0.55;
          }
          button:focus-visible, select:focus-visible, input:focus-visible, a:focus-visible, .stage:focus-visible {
            outline: 3px solid #f5a300 !important;
            outline-offset: 2px !important;
          }
          .body {
            display: grid;
            grid-template-columns: 1fr;
            border-top: 1px solid #cbd5e1;
            background: #ffffff;
          }
          .transcript {
            max-height: 22rem;
            overflow-y: auto;
            padding: 1rem;
          }
          .transcript[hidden] { display: none !important; }
          .transcript-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 0.75rem;
            margin-bottom: 0.75rem;
          }
          .transcript-header h3 {
            margin: 0;
            font-size: 1.05rem;
            color: #05192d;
          }
          .transcript-links {
            display: flex;
            gap: 0.75rem;
            flex-wrap: wrap;
          }
          .transcript-links a {
            color: #0d5c3a;
            font-weight: 700;
            text-decoration: underline;
            padding: 0.35rem 0.5rem;
            min-height: 44px;
            display: inline-flex;
            align-items: center;
          }
          .transcript ol {
            display: grid;
            gap: 0.4rem;
            padding: 0;
            margin: 0;
            list-style: none;
          }
          .transcript button {
            display: grid;
            grid-template-columns: 4.5rem 1fr;
            gap: 0.5rem;
            width: 100%;
            text-align: left;
            font-weight: 500;
            border: 1px solid #cbd5e1;
          }
          .transcript button time {
            font-family: ui-monospace, SFMono-Regular, monospace;
            font-weight: 700;
            color: #0d5c3a;
          }
          .transcript button[aria-current="true"] {
            border: 3px solid #0d5c3a;
            background: #ecfdf5;
            color: #05192d;
            font-weight: 700;
          }
          .notice {
            padding: 0.75rem 1rem;
            margin: 0;
            background: #ecfdf5;
            color: #065f46;
            font-weight: 600;
            border-top: 1px solid #a7f3d0;
          }
          .sr {
            position: absolute;
            width: 1px;
            height: 1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
          }
          dialog {
            max-width: 44rem;
            width: calc(100% - 2rem);
            border: 2px solid #05192d;
            border-radius: 0.65rem;
            padding: 1.25rem;
            background: #ffffff;
            color: #101828;
          }
          dialog::backdrop { background: rgba(5, 25, 45, 0.7); }
          .editor-rows {
            display: grid;
            gap: 0.65rem;
            max-height: 18rem;
            overflow-y: auto;
            margin: 0.75rem 0;
            padding-right: 0.25rem;
          }
          .editor-row {
            display: grid;
            grid-template-columns: 5.5rem 5.5rem 1fr;
            gap: 0.4rem;
            align-items: center;
          }
          .editor-row input {
            padding: 0.4rem 0.5rem;
            border: 1px solid #64748b;
            border-radius: 0.35rem;
          }
          @media (max-width: 48rem) {
            .heading { flex-direction: column; align-items: flex-start; }
            .editor-row { grid-template-columns: 1fr; }
            .sign.medium, .sign.large { width: 11rem; height: 9.5rem; }
          }
        </style>

        <section class="shell" id="player-shell" lang="${this.language}">
          <div class="heading">
            <h2>${escapeHtml(this.getAttribute("title") || t.playerTitle)}</h2>
            <span class="time-badge" id="time" aria-live="off">0:00 / 0:00</span>
          </div>

          <div class="stage" id="stage" tabindex="0" role="region" aria-label="${escapeHtml(t.playerTitle)}">
            <video class="main" id="video" preload="metadata" playsinline src="${escapeHtml(this.source)}">
              <track kind="captions" srclang="en" label="English" src="/savanna/assets/captions/va-future-en.vtt">
              <track kind="captions" srclang="am" label="Amharic" src="/savanna/assets/captions/va-future-am.vtt">
            </video>
            <div class="captions ${this.preferences.captionPosition}" id="captions" aria-hidden="true">
              <span id="caption" class="caption"></span>
            </div>
            ${
              hasSign
                ? `<aside class="sign ${this.preferences.signFloating ? "floating" : "docked"} ${this.preferences.signPosition} ${this.preferences.signSize}" id="sign-window" data-sign-panel="true" tabindex="0" title="${escapeHtml(t.signPlayerTitle || t.signLanguage)}" ${
                    this.preferences.sign ? "" : "hidden"
                  } aria-label="${escapeHtml(t.signPlayerTitle || t.signLanguage)}">
              <div class="sign-header" aria-label="${escapeHtml(t.signPlayerTitle || 'EthSL Video Player')}">
                <span class="sign-title">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="margin-right:4px;vertical-align:-1px"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
                  ${escapeHtml(t.signPlayerTitle || 'EthSL Video Player')}
                </span>
                <span class="sign-badge">${escapeHtml(t.signPrerecorded || 'Video Player')}</span>
              </div>
              <video id="sign-video" preload="metadata" playsinline muted src="${escapeHtml(this.signSource)}" aria-label="${escapeHtml(t.signVideoDesc || 'Prerecorded Ethiopian Sign Language interpreter video')}"></video>
              <div class="sign-controls" role="group" aria-label="${escapeHtml(t.signLanguage)}">
                <button type="button" id="sign-play-btn" aria-label="${escapeHtml(t.playPauseSign || 'Play/Pause synchronized video')}" title="${escapeHtml(t.playPauseSign || 'Play/Pause synchronized video')}">▶</button>
                <button type="button" data-sign-pos="top-left" aria-label="${escapeHtml(t.topLeft)}" title="${escapeHtml(t.topLeft)}">↖</button>
                <button type="button" data-sign-pos="top-right" aria-label="${escapeHtml(t.topRight)}" title="${escapeHtml(t.topRight)}">↗</button>
                <button type="button" data-sign-pos="bottom-left" aria-label="${escapeHtml(t.bottomLeft)}" title="${escapeHtml(t.bottomLeft)}">↙</button>
                <button type="button" data-sign-pos="bottom-right" aria-label="${escapeHtml(t.bottomRight)}" title="${escapeHtml(t.bottomRight)}">↘</button>
                <button type="button" data-sign-size="larger" aria-label="${escapeHtml(t.larger)}" title="${escapeHtml(t.larger)}">+</button>
                <button type="button" data-sign-size="smaller" aria-label="${escapeHtml(t.smaller)}" title="${escapeHtml(t.smaller)}">−</button>
                <button type="button" id="sign-split-toggle" data-sign-split="toggle" aria-label="${escapeHtml(t.splitView || 'Side-by-side view')}" title="${escapeHtml(t.splitView || 'Side-by-side view')}">◫</button>
                <button type="button" id="sign-dock-toggle" data-sign-dock="toggle" aria-label="${this.preferences.signFloating ? escapeHtml(t.dockSign || 'Dock to video') : escapeHtml(t.floatSign || 'Float on page')}" title="${this.preferences.signFloating ? escapeHtml(t.dockSign || 'Dock to video') : escapeHtml(t.floatSign || 'Float on page')}">${this.preferences.signFloating ? "⤓" : "⛶"}</button>
              </div>
            </aside>`
                : ""
            }
          </div>

          <div class="controls" role="toolbar" aria-label="${escapeHtml(t.playerTitle)}">
            <button type="button" class="primary" id="play-pause" aria-pressed="false">${escapeHtml(t.play)}</button>
            <button type="button" id="back">${escapeHtml(t.back)}</button>
            <button type="button" id="forward">${escapeHtml(t.forward)}</button>
            <label class="field" for="seek">${escapeHtml(t.seek)}
              <input id="seek" type="range" min="0" max="100" value="0" step="0.1">
            </label>
            <label class="field" for="speed">${escapeHtml(t.speed)}
              <select id="speed">
                <option value="0.75">0.75x</option>
                <option value="1" selected>1x</option>
                <option value="1.25">1.25x</option>
                <option value="1.5">1.5x</option>
              </select>
            </label>
            <button type="button" id="caption-toggle" aria-pressed="${this.preferences.captions}">${escapeHtml(t.captions)}</button>
            <button type="button" id="sign-toggle" ${
              hasSign ? `aria-pressed="${this.preferences.sign}"` : 'disabled aria-disabled="true"'
            }>${escapeHtml(t.signLanguage)}</button>
            <button type="button" id="desc-toggle" aria-pressed="${this.preferences.audioDescription}">${escapeHtml(t.audioDescription)}</button>
            <button type="button" id="transcript-toggle" aria-pressed="${this.preferences.transcriptOpen}">${escapeHtml(t.transcript)}</button>
            <button type="button" id="edit-captions-btn">${escapeHtml(t.editCaptions)}</button>
            <button type="button" id="fullscreen">${escapeHtml(t.fullScreen)}</button>
            <button type="button" id="help-button">${escapeHtml(t.keyboardHelp)}</button>
          </div>

          <div class="prefs" role="region" aria-label="${escapeHtml(t.captionSettings)}">
            <label class="field" for="caption-language">${escapeHtml(t.captionLanguage)}
              <select id="caption-language">${captionOptions}</select>
            </label>
            <label class="field" for="caption-size">${escapeHtml(t.captionSize)}
              <input id="caption-size" type="range" min="0.9" max="2.4" value="${this.preferences.captionSize}" step="0.1">
            </label>
            <label class="field" for="caption-color">${escapeHtml(t.captionColor)}
              <input id="caption-color" type="color" value="${this.preferences.captionColor}">
            </label>
            <label class="field" for="caption-background">${escapeHtml(t.captionBackground)}
              <input id="caption-background" type="color" value="${this.preferences.captionBackground}">
            </label>
            <label class="field" for="caption-position">${escapeHtml(t.captionPosition)}
              <select id="caption-position">
                <option value="bottom">${escapeHtml(t.posBottom)}</option>
                <option value="top">${escapeHtml(t.posTop)}</option>
              </select>
            </label>
            <button type="button" id="offline">${escapeHtml(t.downloadOffline)} (0.28 MB)</button>
          </div>

          <div class="body">
            <section class="transcript" id="transcript-panel" ${this.preferences.transcriptOpen ? "" : "hidden"} aria-labelledby="transcript-heading">
              <div class="transcript-header">
                <h3 id="transcript-heading">${escapeHtml(t.transcript)}</h3>
                <div class="transcript-links">
                  <a id="transcript-download" href="#download-txt" download="${this.lessonId}-transcript.txt">${escapeHtml(t.downloadTranscript)}</a>
                  <a id="transcript-download-brf" href="#download-brf" download="${this.lessonId}-braille.brf">${escapeHtml(t.downloadBraille)}</a>
                  <a id="transcript-download-vtt" href="#download-vtt" download="${this.lessonId}-${this.preferences.captionLanguage}.vtt">${escapeHtml(t.downloadVtt)}</a>
                </div>
              </div>
              <ol id="transcript-list"></ol>
            </section>
          </div>

          <p class="notice" id="notice" hidden></p>
          <p class="sr" id="announcement" role="status" aria-live="polite"></p>
        </section>

        <dialog id="help" aria-labelledby="help-title">
          <h3 id="help-title">${escapeHtml(t.keyboardHelp)}</h3>
          <ul>
            <li><strong>Space / K:</strong> ${escapeHtml(t.play)} / ${escapeHtml(t.pause)}</li>
            <li><strong>Left / Right Arrows:</strong> ${escapeHtml(t.seek)} (5 seconds)</li>
            <li><strong>C:</strong> Toggle ${escapeHtml(t.captions)}</li>
            <li><strong>S:</strong> Toggle ${escapeHtml(t.signLanguage)}</li>
            <li><strong>D:</strong> Toggle ${escapeHtml(t.audioDescription)}</li>
            <li><strong>T:</strong> Toggle ${escapeHtml(t.transcript)}</li>
            <li><strong>F / Escape:</strong> ${escapeHtml(t.fullScreen)} / ${escapeHtml(t.exitFullScreen)}</li>
          </ul>
          <button type="button" id="close-help">${escapeHtml(t.close)}</button>
        </dialog>

        <dialog id="caption-editor-dialog" aria-labelledby="editor-title">
          <h3 id="editor-title">${escapeHtml(t.editorHeading)}</h3>
          <p style="font-size:0.9rem;color:#475569;margin-top:0">${escapeHtml(t.editorIntro)}</p>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;margin-bottom:0.5rem">
            <label class="field" for="reviewer-input">${escapeHtml(t.reviewerName)}
              <input id="reviewer-input" type="text" value="Co-Designer Reviewer">
            </label>
            <label class="field" for="notes-input">${escapeHtml(t.reviewNotes)}
              <input id="notes-input" type="text" value="Verified Amharic & English terminology">
            </label>
          </div>
          <div class="editor-rows" id="editor-rows"></div>
          <div style="display:flex;gap:0.5rem;flex-wrap:wrap;justify-content:flex-end;margin-top:0.75rem">
            <button type="button" class="primary" id="save-captions-btn">${escapeHtml(t.saveCorrections)}</button>
            <button type="button" id="close-editor-btn">${escapeHtml(t.close)}</button>
          </div>
        </dialog>
      `;

      this.$ = (selector) => this.shadowRoot.querySelector(selector);
      this.$("#caption-position").value = this.preferences.captionPosition;
      this.applyCaptionStyle();
      if (!hasSign) this.announce(t.noSign);
      this.connectControls();
      this.renderTranscript();
      this.restorePlaybackState();
      this.loadMetadata();
    }

    async loadMetadata() {
      try {
        const response = await fetch(`${this.api}/lessons/${encodeURIComponent(this.lessonId)}`);
        if (!response.ok) return;
        const details = await response.json();
        if (details.offline_pack_bytes) {
          this.$("#offline").textContent = `${this.t.downloadOffline} (${(Number(details.offline_pack_bytes) / 1000000).toFixed(2)} MB)`;
        }
      } catch {}
    }

    connectControls() {
      const video = this.$("#video");
      const signVideo = this.$("#sign-video");

      // Hide native browser text tracks so our restyleable renderer controls appearance
      Array.from(video.textTracks || []).forEach((tr) => {
        tr.mode = "hidden";
      });

      this.$("#play-pause").addEventListener("click", () => this.togglePlay());
      this.$("#back").addEventListener("click", () => {
        video.currentTime = Math.max(0, video.currentTime - 10);
        this.announce("Rewound 10 seconds");
      });
      this.$("#forward").addEventListener("click", () => {
        video.currentTime = Math.min(video.duration || 45, video.currentTime + 10);
        this.announce("Forwarded 10 seconds");
      });
      this.$("#seek").addEventListener("input", (event) => {
        if (!video.duration) return;
        video.currentTime = (Number(event.target.value) / 100) * video.duration;
      });
      this.$("#speed").value = String(this.preferences.playbackRate);
      this.$("#speed").addEventListener("change", (event) => {
        this.preferences.playbackRate = Number(event.target.value);
        video.playbackRate = this.preferences.playbackRate;
        if (signVideo) signVideo.playbackRate = this.preferences.playbackRate;
        this.persist(`Playback speed set to ${this.preferences.playbackRate}x`);
      });

      this.$("#caption-toggle").addEventListener("click", () => {
        this.preferences.captions = !this.preferences.captions;
        this.$("#caption-toggle").setAttribute("aria-pressed", String(this.preferences.captions));
        this.updateCaption();
        this.persist(this.preferences.captions ? "Captions enabled" : "Captions hidden");
      });

      this.$("#desc-toggle").addEventListener("click", () => {
        this.preferences.audioDescription = !this.preferences.audioDescription;
        if (!this.preferences.audioDescription && "speechSynthesis" in window) {
          window.speechSynthesis.cancel();
        }
        this.$("#desc-toggle").setAttribute("aria-pressed", String(this.preferences.audioDescription));
        this.persist(this.preferences.audioDescription ? "Audio description enabled" : "Audio description disabled");
      });

      this.$("#transcript-toggle").addEventListener("click", () => {
        this.preferences.transcriptOpen = !this.preferences.transcriptOpen;
        this.$("#transcript-toggle").setAttribute("aria-pressed", String(this.preferences.transcriptOpen));
        this.$("#transcript-panel").hidden = !this.preferences.transcriptOpen;
        this.persist(this.preferences.transcriptOpen ? "Transcript panel shown" : "Transcript panel hidden");
      });

      if (signVideo) {
        this.$("#sign-toggle").addEventListener("click", () => {
          this.preferences.sign = !this.preferences.sign;
          this.$("#sign-toggle").setAttribute("aria-pressed", String(this.preferences.sign));
          const signEl = this.$("#sign-window");
          if (signEl) {
            signEl.hidden = !this.preferences.sign;
            if (this.preferences.sign) this.positionSign();
          }
          this.persist(this.preferences.sign ? "Ethiopian Sign Language window shown" : "Sign Language window hidden");
        });
      }

      this.$("#caption-language").addEventListener("change", (event) => {
        this.preferences.captionLanguage = event.target.value;
        this.renderTranscript();
        this.updateCaption();
        this.persist(`Caption language switched to ${this.preferences.captionLanguage === "am" ? "Amharic" : "English"}`);
      });

      this.$("#caption-size").addEventListener("input", (event) => {
        this.preferences.captionSize = event.target.value;
        this.applyCaptionStyle();
        this.persist(`Caption size set to ${this.preferences.captionSize} rem`);
      });

      this.$("#caption-color").addEventListener("input", (event) => {
        this.preferences.captionColor = event.target.value;
        this.applyCaptionStyle();
        this.persist(`Caption text colour set to ${this.preferences.captionColor}`);
      });

      this.$("#caption-background").addEventListener("input", (event) => {
        this.preferences.captionBackground = event.target.value;
        this.applyCaptionStyle();
        this.persist(`Caption background colour set to ${this.preferences.captionBackground}`);
      });

      this.$("#caption-position").addEventListener("change", (event) => {
        this.preferences.captionPosition = event.target.value;
        this.$("#captions").className = `captions ${this.preferences.captionPosition}`;
        this.persist(`Caption position moved to ${this.preferences.captionPosition}`);
      });

      this.shadowRoot.querySelectorAll("[data-sign-pos]").forEach((button) =>
        button.addEventListener("click", () => {
          this.preferences.signPosition = button.dataset.signPos;
          this.preferences.signCoords = null;
          this.positionSign();
          const posMap = {
            "top-left": "topLeft",
            "top-right": "topRight",
            "bottom-left": "bottomLeft",
            "bottom-right": "bottomRight"
          };
          const posName = this.t[posMap[button.dataset.signPos]] || this.preferences.signPosition;
          this.persist(
            this.language === "am"
              ? `የምልክት ቋንቋ መስኮት ወደ ${posName} ተቀይሯል`
              : `Sign language window moved to ${posName}`
          );
        })
      );

      this.shadowRoot.querySelectorAll("[data-sign-size]").forEach((button) =>
        button.addEventListener("click", () => {
          const choices = ["small", "medium", "large"];
          const index = choices.indexOf(this.preferences.signSize);
          this.preferences.signSize =
            choices[button.dataset.signSize === "larger" ? Math.min(2, index + 1) : Math.max(0, index - 1)];
          this.positionSign();
          const sizeName = this.t[this.preferences.signSize] || this.preferences.signSize;
          this.persist(
            this.language === "am"
              ? `የምልክት ቋንቋ መስኮት መጠን ወደ ${sizeName} ተቀይሯል`
              : `Sign language window size set to ${this.preferences.signSize}`
          );
        })
      );

      const dockBtn = this.$("#sign-dock-toggle");
      if (dockBtn) {
        dockBtn.addEventListener("click", () => this.toggleSignDock());
      }
      const splitBtn = this.$("#sign-split-toggle");
      if (splitBtn) {
        splitBtn.addEventListener("click", () => this.toggleSignSplit());
      }
      const signPlayBtn = this.$("#sign-play-btn");
      if (signPlayBtn) {
        signPlayBtn.addEventListener("click", () => this.togglePlay());
      }

      this.dragSign();
      this.positionSign();

      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
      }
      const stageEl = this.$("#stage");
      if (stageEl && typeof ResizeObserver !== "undefined") {
        this.resizeObserver = new ResizeObserver(() => {
          if (!this.isDragging) this.positionSign();
        });
        this.resizeObserver.observe(stageEl);
      }
      if (this.windowResizeHandler) {
        window.removeEventListener("resize", this.windowResizeHandler);
      }
      this.windowResizeHandler = () => {
        if (!this.isDragging) this.positionSign();
      };
      window.addEventListener("resize", this.windowResizeHandler);

      this.$("#offline").addEventListener("click", () => this.downloadOffline());
      this.$("#fullscreen").addEventListener("click", () => this.toggleFullscreen());
      this.fullscreenHandler = () => {
        const isFs = Boolean(document.fullscreenElement || this.shadowRoot.fullscreenElement);
        const fsBtn = this.$("#fullscreen");
        if (fsBtn) {
          fsBtn.textContent = isFs ? this.t.exitFullScreen : this.t.fullScreen;
          fsBtn.setAttribute("aria-pressed", String(isFs));
        }
        this.announce(
          isFs
            ? (this.language === "am" ? "ወደ ሙሉ ማያ ገጽ ገብቷል" : "Entered full screen mode")
            : (this.language === "am" ? "ከሙሉ ማያ ገጽ ወጥቷል" : "Exited full screen mode")
        );
        window.requestAnimationFrame(() => this.positionSign());
      };
      document.addEventListener("fullscreenchange", this.fullscreenHandler);

      this.$("#help-button").addEventListener("click", () => this.$("#help").showModal());
      this.$("#close-help").addEventListener("click", () => this.$("#help").close());
      this.$("#edit-captions-btn").addEventListener("click", () => this.openCaptionEditor());
      this.$("#close-editor-btn").addEventListener("click", () => this.$("#caption-editor-dialog").close());
      this.$("#save-captions-btn").addEventListener("click", () => this.saveCaptionCorrections());

      // Bind keyboard listener across the entire player shell so controls stay operable everywhere
      this.$("#player-shell").addEventListener("keydown", (event) => this.keyboard(event));

      this.$("#transcript-download").addEventListener("click", (e) => this.downloadTranscript(e));
      this.$("#transcript-download-brf").addEventListener("click", (e) => this.downloadBraille(e));
      this.$("#transcript-download-vtt").addEventListener("click", (e) => this.downloadVttFile(e));

      if (signVideo) {
        this.signTimer = window.setInterval(() => this.syncSign(!video.paused), 1000);
      }
    }

    toggleFullscreen() {
      const shell = this.$("#player-shell");
      if (document.fullscreenElement || this.shadowRoot.fullscreenElement) {
        document.exitFullscreen?.();
      } else {
        shell.requestFullscreen?.();
      }
    }

    openCaptionEditor() {
      const cues = this.cues();
      const container = this.$("#editor-rows");
      container.innerHTML = cues
        .map(
          (cue, idx) => `
        <div class="editor-row">
          <input type="text" data-edit-start="${idx}" value="${formatVttTimestamp(cue.start)}" aria-label="Start time ${idx + 1}">
          <input type="text" data-edit-end="${idx}" value="${formatVttTimestamp(cue.end)}" aria-label="End time ${idx + 1}">
          <input type="text" data-edit-text="${idx}" value="${escapeHtml(cue.text)}" aria-label="Caption line ${idx + 1}">
        </div>`
        )
        .join("");
      this.$("#caption-editor-dialog").showModal();
    }

    async saveCaptionCorrections() {
      const lang = this.preferences.captionLanguage;
      const rows = this.shadowRoot.querySelectorAll("[data-edit-text]");
      const updated = [];
      rows.forEach((textInput, idx) => {
        const startInput = this.$((`[data-edit-start="${idx}"]`));
        const endInput = this.$((`[data-edit-end="${idx}"]`));
        updated.push({
          start: toSeconds(startInput ? startInput.value : 0),
          end: toSeconds(endInput ? endInput.value : 5),
          text: textInput.value.trim()
        });
      });
      this.captionCues[lang] = updated;
      this.renderTranscript();
      this.updateCaption();

      const vttContent = serializeVtt(updated);
      const rawReviewer = this.$("#reviewer-input")?.value?.trim() || "";
      const reviewer = rawReviewer.length >= 2 ? rawReviewer : "Co-Designer Reviewer";
      const notes = this.$("#notes-input")?.value || "";
      let savedRemote = false;
      try {
        const formData = new FormData();
        formData.append(
          "metadata",
          JSON.stringify({ lesson_id: this.lessonId, language: lang, reviewer, notes })
        );
        formData.append("caption_file", new Blob([vttContent], { type: "text/vtt" }), `${this.lessonId}.${lang}.vtt`);
        const res = await fetch(`${this.api}/lessons/${encodeURIComponent(this.lessonId)}/captions`, {
          method: "POST",
          body: formData
        });
        if (res.ok) savedRemote = true;
      } catch {}
      this.$("#caption-editor-dialog").close();
      this.showNotice(
        savedRemote
          ? (this.language === "am" ? "የተስተካከሉ ንዑስ ርዕሶች ተቀምጠው ወደ ሲስተሙ ተልከዋል።" : "Captions updated and saved to the WebVTT pipeline.")
          : (this.language === "am" ? "ንዑስ ርዕሶች በአካባቢው ተስተካክለዋል (አገልጋይ አልተገናኘም)።" : "Captions updated locally in browser.")
      );
    }

    restorePlaybackState() {
      const state = this.restorePlayback;
      this.restorePlayback = null;
      const video = this.$("#video");
      video.playbackRate = this.preferences.playbackRate;
      video.addEventListener("timeupdate", () => this.timeUpdate());
      video.addEventListener("seeking", () => {
        if ("speechSynthesis" in window) window.speechSynthesis.cancel();
        this.syncSign(!video.paused);
      });
      video.addEventListener("ratechange", () => this.syncSign(!video.paused));
      video.addEventListener("play", () => this.playbackChanged(true));
      video.addEventListener("pause", () => this.playbackChanged(false));
      video.addEventListener("ended", () => {
        this.playbackChanged(false);
        this.dispatchEvent(new CustomEvent("db-player:complete", { bubbles: true, composed: true, detail: { lessonId: this.lessonId } }));
      });
      video.addEventListener("loadedmetadata", () => this.timeUpdate());
      if (state) {
        video.currentTime = state.time || 0;
        if (!state.paused) video.play().catch(() => {});
      }
    }

    positionSign() {
      const sign = this.$("#sign-window");
      if (!sign) return;

      const stage = this.$("#stage");
      if (this.preferences.signSplit) {
        if (stage) stage.classList.add("split");
        sign.className = `sign split ${this.preferences.signSize || "medium"}`;
        sign.style.left = "";
        sign.style.top = "";
        sign.style.right = "";
        sign.style.bottom = "";
        this.updateDockButton();
        return;
      } else if (stage) {
        stage.classList.remove("split");
      }

      const isFloating = Boolean(this.preferences.signFloating);
      const pos = this.preferences.signPosition || "bottom-right";
      const size = this.preferences.signSize || "medium";

      if (isFloating) {
        sign.className = `sign floating ${pos} ${size}`;
        const maxLeft = Math.max(0, window.innerWidth - sign.offsetWidth);
        const maxTop = Math.max(0, window.innerHeight - sign.offsetHeight);

        if (pos === "custom" && this.preferences.signCoords) {
          let left, top;
          if (typeof this.preferences.signCoords.xRatio === "number" && maxLeft > 0) {
            left = Math.round(this.preferences.signCoords.xRatio * maxLeft);
            top = Math.round(this.preferences.signCoords.yRatio * maxTop);
          } else if (typeof this.preferences.signCoords.left === "number") {
            left = this.preferences.signCoords.left;
            top = this.preferences.signCoords.top;
          } else {
            left = Math.max(0, maxLeft - 16);
            top = Math.max(0, maxTop - 16);
          }
          const clampedLeft = Math.max(0, Math.min(left, maxLeft));
          const clampedTop = Math.max(0, Math.min(top, maxTop));
          sign.style.left = `${clampedLeft}px`;
          sign.style.top = `${clampedTop}px`;
          sign.style.right = "auto";
          sign.style.bottom = "auto";
        } else if (pos === "top-left") {
          sign.style.left = "1rem";
          sign.style.top = "1rem";
          sign.style.right = "auto";
          sign.style.bottom = "auto";
        } else if (pos === "top-right") {
          sign.style.left = "auto";
          sign.style.top = "1rem";
          sign.style.right = "1rem";
          sign.style.bottom = "auto";
        } else if (pos === "bottom-left") {
          sign.style.left = "1rem";
          sign.style.top = "auto";
          sign.style.right = "auto";
          sign.style.bottom = "1rem";
        } else { // bottom-right
          sign.style.left = "auto";
          sign.style.top = "auto";
          sign.style.right = "1rem";
          sign.style.bottom = "1rem";
        }
      } else {
        const dockedPos = pos === "custom" ? "bottom-right" : pos;
        this.preferences.signPosition = dockedPos;
        sign.className = `sign docked ${dockedPos} ${size}`;
        sign.style.left = "";
        sign.style.top = "";
        sign.style.right = "";
        sign.style.bottom = "";
      }

      this.updateDockButton();
    }

    toggleSignSplit() {
      this.preferences.signSplit = !this.preferences.signSplit;
      this.positionSign();
      const msg = this.preferences.signSplit
        ? (this.language === "am" ? "የጎንዮሽ እይታ ተመርጧል" : "Side-by-side view enabled")
        : (this.language === "am" ? "የጎንዮሽ እይታ ተዘግቷል" : "Side-by-side view disabled");
      this.persist(msg);
    }

    toggleSignDock() {
      this.preferences.signFloating = !this.preferences.signFloating;
      if (this.preferences.signFloating) {
        if (!this.preferences.signCoords && this.preferences.signPosition === "custom") {
          this.preferences.signPosition = "bottom-right";
        }
      } else {
        if (this.preferences.signPosition === "custom") {
          this.preferences.signPosition = "bottom-right";
        }
      }
      this.positionSign();
      const msg = this.preferences.signFloating
        ? (this.language === "am" ? "የምልክት ቋንቋ መስኮት በገጹ ላይ ተንሳፍፏል" : "Sign language window floating on page")
        : (this.language === "am" ? "የምልክት ቋንቋ መስኮት ከቪዲዮው ጋር ተያይዟል" : "Sign language window docked to video");
      this.persist(msg);
    }

    updateDockButton() {
      const btn = this.$("#sign-dock-toggle");
      if (!btn) return;
      const isFloating = Boolean(this.preferences.signFloating);
      const label = isFloating ? (this.t.dockSign || "Dock to video") : (this.t.floatSign || "Float on page");
      btn.textContent = isFloating ? "⤓" : "⛶";
      btn.setAttribute("aria-label", label);
      btn.setAttribute("title", label);
      btn.setAttribute("aria-pressed", String(isFloating));

      const splitBtn = this.$("#sign-split-toggle");
      if (splitBtn) {
        const isSplit = Boolean(this.preferences.signSplit);
        splitBtn.setAttribute("aria-pressed", String(isSplit));
        if (isSplit) {
          splitBtn.style.borderColor = "#00e676";
          splitBtn.style.background = "#1e3a5f";
        } else {
          splitBtn.style.borderColor = "";
          splitBtn.style.background = "";
        }
      }
    }

    dragSign() {
      const sign = this.$("#sign-window");
      if (!sign) return;
      let startX = 0, startY = 0, initialLeft = 0, initialTop = 0, dragging = false, hasMoved = false;

      const onPointerMove = (event) => {
        if (!dragging) return;
        const deltaX = event.clientX - startX;
        const deltaY = event.clientY - startY;
        if (!hasMoved) {
          if (Math.abs(deltaX) < 3 && Math.abs(deltaY) < 3) return;
          hasMoved = true;
          this.preferences.signFloating = true;
          this.preferences.signPosition = "custom";
          sign.className = `sign floating custom ${this.preferences.signSize} dragging`;
        }

        const maxLeft = Math.max(0, window.innerWidth - sign.offsetWidth);
        const maxTop = Math.max(0, window.innerHeight - sign.offsetHeight);
        const clampedLeft = Math.max(0, Math.min(initialLeft + deltaX, maxLeft));
        const clampedTop = Math.max(0, Math.min(initialTop + deltaY, maxTop));

        sign.style.left = `${clampedLeft}px`;
        sign.style.top = `${clampedTop}px`;
        sign.style.bottom = "auto";
        sign.style.right = "auto";

        this.preferences.signCoords = {
          left: clampedLeft,
          top: clampedTop,
          xRatio: maxLeft > 0 ? clampedLeft / maxLeft : 0,
          yRatio: maxTop > 0 ? clampedTop / maxTop : 0
        };
      };

      const stop = (event) => {
        if (!dragging) return;
        dragging = false;
        this.isDragging = false;
        sign.classList.remove("dragging");

        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", stop);
        window.removeEventListener("pointercancel", stop);

        try {
          if (event && typeof event.pointerId === "number") {
            sign.releasePointerCapture(event.pointerId);
          }
        } catch {}

        if (hasMoved) {
          sign.className = `sign floating custom ${this.preferences.signSize}`;
          this.updateDockButton();
          this.persist(this.language === "am" ? "የምልክት ቋንቋ መስኮት ተንቀሳቅሷል" : "Sign language window moved");
        } else if (event && event.target && event.target.id === "sign-video") {
          this.togglePlay();
        }
      };

      sign.addEventListener("pointerdown", (event) => {
        if (event.button !== 0) return;
        if (this.preferences.signSplit) return;
        if (event.target.closest("button, select, input, a")) return;
        event.preventDefault();
        dragging = true;
        this.isDragging = true;
        hasMoved = false;
        startX = event.clientX;
        startY = event.clientY;
        const rect = sign.getBoundingClientRect();
        initialLeft = rect.left;
        initialTop = rect.top;

        try { sign.setPointerCapture(event.pointerId); } catch {}
        window.addEventListener("pointermove", onPointerMove);
        window.addEventListener("pointerup", stop);
        window.addEventListener("pointercancel", stop);
      });

      sign.addEventListener("lostpointercapture", stop);

      // Explicit keyboard arrow navigation on the sign window for accessibility
      sign.addEventListener("keydown", (event) => {
        if (event.target !== sign) return; // let buttons handle their own keys

        if (event.key === "Enter") {
          event.preventDefault();
          event.stopPropagation();
          this.toggleSignDock();
          return;
        }

        const keys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
        if (!keys.includes(event.key)) return;

        event.preventDefault();
        event.stopPropagation();

        const rect = sign.getBoundingClientRect();
        const currentLeft = rect.left;
        const currentTop = rect.top;
        const step = event.shiftKey ? 40 : 15;
        const maxLeft = Math.max(0, window.innerWidth - sign.offsetWidth);
        const maxTop = Math.max(0, window.innerHeight - sign.offsetHeight);
        let newLeft = currentLeft;
        let newTop = currentTop;

        if (event.key === "ArrowLeft") {
          newLeft = Math.max(0, currentLeft - step);
        } else if (event.key === "ArrowRight") {
          newLeft = Math.min(maxLeft, currentLeft + step);
        } else if (event.key === "ArrowUp") {
          newTop = Math.max(0, currentTop - step);
        } else if (event.key === "ArrowDown") {
          newTop = Math.min(maxTop, currentTop + step);
        }

        const moved = (newLeft !== currentLeft || newTop !== currentTop);
        if (moved) {
          this.preferences.signFloating = true;
          this.preferences.signPosition = "custom";
          this.preferences.signCoords = {
            left: newLeft,
            top: newTop,
            xRatio: maxLeft > 0 ? newLeft / maxLeft : 0,
            yRatio: maxTop > 0 ? newTop / maxTop : 0
          };
          sign.className = `sign floating custom ${this.preferences.signSize}`;
          sign.style.left = `${newLeft}px`;
          sign.style.top = `${newTop}px`;
          sign.style.right = "auto";
          sign.style.bottom = "auto";
          this.updateDockButton();
          this.persist(this.language === "am" ? "የምልክት ቋንቋ መስኮት ተንቀሳቅሷል" : "Sign language window moved");
        }
      });

      // Keyboard navigation between buttons inside sign controls without seeking video
      const signControls = sign.querySelector(".sign-controls");
      if (signControls) {
        signControls.addEventListener("keydown", (event) => {
          const buttons = Array.from(signControls.querySelectorAll("button"));
          const currentIndex = buttons.indexOf(event.target);
          if (currentIndex === -1) return;

          if (event.key === "ArrowRight" || event.key === "ArrowDown") {
            event.preventDefault();
            event.stopPropagation();
            const next = buttons[(currentIndex + 1) % buttons.length];
            next.focus();
          } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
            event.preventDefault();
            event.stopPropagation();
            const prev = buttons[(currentIndex - 1 + buttons.length) % buttons.length];
            prev.focus();
          }
        });
      }
    }

    togglePlay() {
      const video = this.$("#video");
      if (video.paused) video.play().catch(() => {});
      else video.pause();
    }

    playbackChanged(playing) {
      const button = this.$("#play-pause");
      if (button) {
        button.textContent = playing ? this.t.pause : this.t.play;
        button.setAttribute("aria-pressed", String(playing));
      }
      const signPlayBtn = this.$("#sign-play-btn");
      if (signPlayBtn) {
        signPlayBtn.textContent = playing ? "⏸" : "▶";
        signPlayBtn.setAttribute("aria-label", playing ? this.t.pause : this.t.play);
        signPlayBtn.setAttribute("title", playing ? this.t.pause : this.t.play);
      }
      this.syncSign(playing);
    }

    syncSign(playing) {
      const video = this.$("#video");
      const sign = this.$("#sign-video");
      if (!sign || !video) return;
      if (Math.abs(sign.currentTime - video.currentTime) > 0.3) {
        sign.currentTime = video.currentTime;
      }
      sign.playbackRate = video.playbackRate;
      if (playing && sign.paused) sign.play().catch(() => {});
      if (!playing && !sign.paused) sign.pause();
    }

    cues() {
      return this.captionCues[this.preferences.captionLanguage] || this.captionCues.en || [];
    }

    descriptions() {
      return this.descriptionCues[this.preferences.captionLanguage] || this.descriptionCues.en || [];
    }

    updateCaption() {
      const video = this.$("#video");
      if (!video) return;
      const current = this.cues().find((cue) => video.currentTime >= cue.start && video.currentTime < cue.end);
      this.$("#caption").textContent = this.preferences.captions && current ? current.text : "";
    }

    renderTranscript() {
      const list = this.$("#transcript-list");
      if (!list) return;
      list.innerHTML = this.cues()
        .map(
          (cue, index) =>
            `<li><button type="button" data-cue="${index}" aria-current="false"><time>${formatTime(cue.start)}</time><span>${escapeHtml(
              cue.text
            )}</span></button></li>`
        )
        .join("");
      this.shadowRoot.querySelectorAll("[data-cue]").forEach((button) =>
        button.addEventListener("click", () => {
          const cue = this.cues()[Number(button.dataset.cue)];
          if (!cue) return;
          this.$("#video").currentTime = cue.start;
          this.$("#video").play().catch(() => {});
        })
      );
    }

    applyCaptionStyle() {
      const caption = this.$("#caption");
      if (!caption) return;
      caption.style.fontSize = `${this.preferences.captionSize}rem`;
      caption.style.color = this.preferences.captionColor;
      caption.style.backgroundColor = this.preferences.captionBackground;
    }

    timeUpdate() {
      const video = this.$("#video");
      if (!video) return;
      this.$("#time").textContent = `${formatTime(video.currentTime)} / ${formatTime(video.duration || 45)}`;
      if (video.duration) {
        this.$("#seek").value = String((video.currentTime / video.duration) * 100);
      }
      this.updateCaption();
      this.highlightCue(video.currentTime);
      this.checkAudioDescription(video.currentTime);
      this.emitProgress();
    }

    highlightCue(currentSeconds) {
      const items = this.shadowRoot.querySelectorAll("[data-cue]");
      this.cues().forEach((cue, index) => {
        const matches = currentSeconds >= cue.start && currentSeconds < cue.end;
        const button = items[index];
        if (button) button.setAttribute("aria-current", matches ? "true" : "false");
      });
    }

    checkAudioDescription(currentSeconds) {
      if (!this.preferences.audioDescription || !("speechSynthesis" in window)) return;
      const list = this.descriptions();
      const index = list.findIndex((cue) => currentSeconds >= cue.start && currentSeconds < cue.end);
      if (index === -1 || index === this.describedCue) return;
      this.describedCue = index;
      const cue = list[index];
      const video = this.$("#video");
      video.pause();
      const utterance = new SpeechSynthesisUtterance(cue.text);
      utterance.lang = this.preferences.captionLanguage === "am" ? "am-ET" : "en-US";
      utterance.onend = () => {
        if (this.preferences.audioDescription && !video.ended) {
          video.play().catch(() => {});
        }
      };
      utterance.onerror = () => {
        if (this.preferences.audioDescription && !video.ended) {
          video.play().catch(() => {});
        }
      };
      window.speechSynthesis.speak(utterance);
    }

    keyboard(event) {
      const tag = (event.target && event.target.tagName) || "";
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") {
        if (event.key !== "Escape") return;
      }
      if (event.target && event.target.closest && event.target.closest("#sign-window")) {
        if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Enter"].includes(event.key)) {
          return;
        }
      }
      const video = this.$("#video");
      if (event.key === " " || event.key.toLowerCase() === "k") {
        if (tag === "BUTTON" && event.key === " ") return; // Let native button click handle Space on buttons
        event.preventDefault();
        this.togglePlay();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        video.currentTime = Math.max(0, video.currentTime - 5);
        this.announce(this.language === "am" ? "5 ሰከንድ ወደ ኋላ ተመልሷል" : "Rewound 5 seconds");
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        video.currentTime = Math.min(video.duration || 45, video.currentTime + 5);
        this.announce(this.language === "am" ? "5 ሰከንድ ወደ ፊት ተዘሏል" : "Forwarded 5 seconds");
      } else if (event.key.toLowerCase() === "f") {
        event.preventDefault();
        this.toggleFullscreen();
      } else if (event.key.toLowerCase() === "c") {
        event.preventDefault();
        this.$("#caption-toggle")?.click();
      } else if (event.key.toLowerCase() === "s") {
        event.preventDefault();
        this.$("#sign-toggle")?.click();
      } else if (event.key.toLowerCase() === "d") {
        event.preventDefault();
        this.$("#desc-toggle")?.click();
      } else if (event.key.toLowerCase() === "t") {
        event.preventDefault();
        this.$("#transcript-toggle")?.click();
      }
    }

    emitProgress() {
      const video = this.$("#video");
      this.dispatchEvent(
        new CustomEvent("db-player:progress", {
          bubbles: true,
          composed: true,
          detail: {
            seconds: video.currentTime,
            percent: video.duration ? Math.round((video.currentTime / video.duration) * 100) : 0
          }
        })
      );
    }

    downloadTranscript(event) {
      if (event) event.preventDefault();
      const content = this.cues()
        .map((cue) => `[${formatTime(cue.start)}] ${cue.text}`)
        .join("\n");
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${this.lessonId}-transcript.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => URL.revokeObjectURL(url), 1500);
      this.announce(this.language === "am" ? "የጽሑፍ ፋይል ወርዷል" : "Downloaded plain-text transcript");
    }

    downloadBraille(event) {
      if (event) event.preventDefault();
      const header = `,alx ,savanna\r\n,accessible ,learning ,media\r\n,lesson: ${this.lessonId}\r\n======================================\r\n`;
      const body = this.cues()
        .map((cue, i) => `,part #${i + 1}\r\n` + textToBrailleAscii(cue.text, 38))
        .join("\r\n\r\n");
      const brf = header + "\r\n" + body + "\r\n\x0C";
      const blob = new Blob([brf], { type: "text/plain;charset=us-ascii" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${this.lessonId}-braille.brf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => URL.revokeObjectURL(url), 1500);
      this.announce(this.language === "am" ? "የብሬይል ፋይል ወርዷል" : "Downloaded Braille transcript");
    }

    downloadVttFile(event) {
      if (event) event.preventDefault();
      const vtt = serializeVtt(this.cues());
      const blob = new Blob([vtt], { type: "text/vtt;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${this.lessonId}-${this.preferences.captionLanguage}.vtt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => URL.revokeObjectURL(url), 1500);
      this.announce(this.language === "am" ? "የWebVTT ፋይል ተዘጋጅቷል" : "Exported WebVTT captions");
    }

    async downloadOffline() {
      try {
        if ("serviceWorker" in navigator && this.offlineWorkerSource) {
          navigator.serviceWorker.register(this.offlineWorkerSource).catch(() => {});
        }
        const response = await fetch(`${this.api}/lessons/${encodeURIComponent(this.lessonId)}/offline-pack`);
        if (!response.ok) throw new Error("Server offline pack unavailable");
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${this.lessonId}-3g-offline-pack.zip`;
        link.click();
        document.body.appendChild(link);
        document.body.removeChild(link);
        window.setTimeout(() => URL.revokeObjectURL(url), 1500);
        this.showNotice("3G offline pack downloaded and cached for aeroplane mode.");
      } catch {
        // Offline client fallback: generate light HTML lesson bundle directly in browser
        const htmlOffline = `<!doctype html><html lang="${this.language}"><meta charset="utf-8"><title>${escapeHtml(
          this.getAttribute("title") || "Offline Lesson"
        )}</title><body style="font-family:sans-serif;max-width:44rem;margin:2rem auto;padding:1rem"><h1>${escapeHtml(
          this.getAttribute("title") || "Offline Lesson"
        )}</h1><h2>Transcript</h2><ol>${this.cues()
          .map((c) => `<li><strong>[${formatTime(c.start)}]</strong> ${escapeHtml(c.text)}</li>`)
          .join("")}</ol></body></html>`;
        const url = URL.createObjectURL(new Blob([htmlOffline], { type: "text/html;charset=utf-8" }));
        const link = document.createElement("a");
        link.href = url;
        link.download = `${this.lessonId}-offline-lesson.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.setTimeout(() => URL.revokeObjectURL(url), 1500);
        this.showNotice("Saved light offline HTML lesson directly to this device.");
      }
    }

    showNotice(message) {
      const notice = this.$("#notice");
      if (notice) {
        notice.textContent = message;
        notice.hidden = false;
      }
      this.announce(message);
    }

    announce(message) {
      const live = this.$?.("#announcement");
      if (!live) return;
      live.textContent = "";
      window.setTimeout(() => {
        live.textContent = message;
      }, 50);
    }
  }

  /* ==========================================================================
     2. <db-job-card> — Accessible Career Gateway + Schema.org JSON-LD + Open Badges
     ========================================================================== */
  class DbJobCard extends HTMLElement {
    static get observedAttributes() {
      return ["api", "job-id", "lang"];
    }
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
    }
    connectedCallback() {
      this.render();
    }
    disconnectedCallback() {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    }
    attributeChangedCallback() {
      this.render();
    }
    get api() {
      return (this.getAttribute("api") || "/api/v1").replace(/\/$/, "");
    }
    get jobId() {
      return this.getAttribute("job-id") || "accessible-va";
    }
    get language() {
      return this.getAttribute("lang") === "am" ? "am" : "en";
    }

    injectJsonLd(job) {
      const scriptId = `jsonld-job-${job.id || this.jobId}`;
      let scriptEl = document.getElementById(scriptId);
      if (!scriptEl) {
        scriptEl = document.createElement("script");
        scriptEl.id = scriptId;
        scriptEl.type = "application/ld+json";
        document.head.appendChild(scriptEl);
      }
      scriptEl.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "JobPosting",
        title: job.title,
        description: job.summary,
        datePosted: "2026-11-14",
        employmentType: "FULL_TIME",
        jobLocationType: "TELECOMMUTE",
        hiringOrganization: { "@type": "Organization", name: job.organization },
        jobLocation: {
          "@type": "Place",
          address: { "@type": "PostalAddress", addressLocality: "Addis Ababa", addressCountry: "ET" }
        },
        jobBenefits: (job.accommodations || []).join(", ")
      });
    }

    async render() {
      const t = await getDictionary(this.language);
      let job = {
        id: this.jobId,
        title: this.language === "am" ? "ጀማሪ ቨርቹዋል ረዳት (Junior Virtual Assistant)" : "Junior Virtual Assistant",
        organization: "Safaricom Telecommunications Ethiopia",
        location: this.language === "am" ? "አዲስ አበባ ወይም በርቀት (Remote)" : "Addis Ababa or remote",
        summary:
          this.language === "am"
            ? "የርቀት ቡድንን በቀጠሮ ማስያዝ እና በተደራሽ ዲጂታል ሰነዶች ያግዙ። ቀጣሪው የኢትዮጵያ የምልክት ቋንቋ አስተርጓሚ እና ለቃለ መጠይቅ ልዩ ድጋፍ ያቀርባል።"
            : "Support a distributed team with scheduling and accessible digital documents. The employer provides an Ethiopian Sign Language interpreter and offers remote interview accommodations.",
        accommodations:
          this.language === "am"
            ? [
                "ለስክሪን አንባቢ (NVDA / TalkBack) ተስማሚ የሆነ የማመልከቻ ሂደት",
                "በጥያቄ የሚቀርብ የኢትዮጵያ የምልክት ቋንቋ (EthSL) አስተርጓሚ",
                "በርቀት ወይም በጽሑፍ የሚከናወን የቃለ መጠይቅ አማራጭ"
              ]
            : [
                "Screen-reader compatible application process (NVDA / TalkBack)",
                "Ethiopian Sign Language (EthSL) interpreter on request",
                "Remote or asynchronous written interview option"
              ],
        certificate_url: "/certificates/va-2026-001"
      };
      try {
        const response = await fetch(`${this.api}/jobs/${encodeURIComponent(this.jobId)}?lang=${this.language}`);
        if (response.ok) job = await response.json();
      } catch {}

      this.injectJsonLd(job);

      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            font-family: var(--bs-body-font-family, system-ui, "Noto Sans Ethiopic", sans-serif);
            color: #101828;
            line-height: 1.6;
            margin: 1rem 0;
          }
          *, *::before, *::after { box-sizing: border-box; }
          article {
            border: 2px solid #05192d;
            border-radius: 0.75rem;
            padding: 1.25rem;
            background: #ffffff;
            display: grid;
            gap: 0.75rem;
            box-shadow: 0 4px 12px rgba(5, 25, 45, 0.06);
          }
          h3 { margin: 0; font-size: 1.3rem; color: #05192d; }
          h4 { margin: 0.25rem 0 0 0; font-size: 1.05rem; color: #0d5c3a; }
          .meta { font-weight: 700; color: #334155; }
          ul { margin: 0; padding-inline-start: 1.25rem; }
          li { margin-bottom: 0.25rem; }
          .actions {
            display: flex;
            flex-wrap: wrap;
            gap: 0.6rem;
            margin-top: 0.5rem;
          }
          button, a {
            min-height: 44px;
            padding: 0.55rem 0.9rem;
            border-radius: 0.4rem;
            font: inherit;
            font-weight: 700;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border: 2px solid #05192d;
            cursor: pointer;
          }
          button.primary { background: #0d5c3a; border-color: #0d5c3a; color: #ffffff; }
          button.secondary, a { background: #ffffff; color: #05192d; }
          button:focus-visible, a:focus-visible, input:focus-visible {
            outline: 3px solid #f5a300 !important;
            outline-offset: 2px !important;
          }
          .status-msg {
            padding: 0.65rem 0.9rem;
            background: #ecfdf5;
            color: #065f46;
            border-left: 4px solid #0d5c3a;
            border-radius: 0.35rem;
            font-weight: 700;
          }
          dialog {
            max-width: 34rem;
            width: calc(100% - 2rem);
            border: 2px solid #05192d;
            border-radius: 0.65rem;
            padding: 1.25rem;
          }
          dialog::backdrop { background: rgba(5, 25, 45, 0.7); }
          .check-list { display: grid; gap: 0.5rem; margin: 0.75rem 0; }
          .check-item { display: flex; align-items: center; gap: 0.5rem; font-weight: 600; min-height: 36px; }
          .check-item input { width: 22px; height: 22px; }
        </style>

        <article aria-labelledby="job-title" lang="${this.language}">
          <h3 id="job-title">${escapeHtml(job.title)}</h3>
          <div class="meta">${escapeHtml(job.organization)} &bull; ${escapeHtml(job.location)}</div>
          <p style="margin:0">${escapeHtml(job.summary)}</p>
          <h4>${escapeHtml(t.workplaceAccommodations)}</h4>
          <ul>${(job.accommodations || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
          <div class="actions">
            <button type="button" class="primary" id="speak" aria-pressed="false">${escapeHtml(t.listenSummary)}</button>
            <button type="button" class="secondary" id="request">${escapeHtml(t.requestAccommodation)}</button>
            <a href="${escapeHtml(job.certificate_url || "/certificates/va-2026-001")}" id="verify">${escapeHtml(t.verifyCertificate)}</a>
          </div>
          <div id="acc-status" class="status-msg" role="status" aria-live="polite" hidden></div>
        </article>

        <dialog id="acc-dialog" aria-labelledby="acc-dialog-title" lang="${this.language}">
          <h3 id="acc-dialog-title">${escapeHtml(t.accommodationModalTitle)}</h3>
          <p>${escapeHtml(t.accommodationDesc)}</p>
          <div class="check-list">
            <label class="check-item"><input type="checkbox" value="ethsl_interpreter" checked> <span>${escapeHtml(t.accOptionSign)}</span></label>
            <label class="check-item"><input type="checkbox" value="screen_reader_format"> <span>${escapeHtml(t.accOptionScreenReader)}</span></label>
            <label class="check-item"><input type="checkbox" value="extra_time"> <span>${escapeHtml(t.accOptionExtraTime)}</span></label>
            <label class="check-item"><input type="checkbox" value="async_written"> <span>${escapeHtml(t.accOptionAsync)}</span></label>
          </div>
          <p id="acc-error" role="alert" style="color:#b42318;font-weight:700;margin:0.25rem 0;" hidden></p>
          <div style="display:flex;gap:0.5rem;justify-content:flex-end;margin-top:1rem">
            <button type="button" class="primary" id="submit-acc">${escapeHtml(t.submitRequest)}</button>
            <button type="button" class="secondary" id="close-acc">${escapeHtml(t.close)}</button>
          </div>
        </dialog>
      `;

      const speakBtn = this.shadowRoot.querySelector("#speak");
      speakBtn.addEventListener("click", () => {
        if (!("speechSynthesis" in window)) return;
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel();
          speakBtn.setAttribute("aria-pressed", "false");
          speakBtn.textContent = t.listenSummary;
          return;
        }
        const utterance = new SpeechSynthesisUtterance(
          `${job.title}. ${job.organization}. ${job.location}. ${job.summary}. ${(job.accommodations || []).join(". ")}`
        );
        utterance.lang = this.language === "am" ? "am-ET" : "en-US";
        utterance.onend = () => {
          speakBtn.setAttribute("aria-pressed", "false");
          speakBtn.textContent = t.listenSummary;
        };
        speakBtn.setAttribute("aria-pressed", "true");
        speakBtn.textContent = t.stopSummary;
        window.speechSynthesis.speak(utterance);
      });

      const dialog = this.shadowRoot.querySelector("#acc-dialog");
      this.shadowRoot.querySelector("#request").addEventListener("click", () => dialog.showModal());
      this.shadowRoot.querySelector("#close-acc").addEventListener("click", () => dialog.close());
      this.shadowRoot.querySelector("#submit-acc").addEventListener("click", async () => {
        const selected = Array.from(this.shadowRoot.querySelectorAll(".check-item input:checked")).map((el) => el.value);
        const statusEl = this.shadowRoot.querySelector("#acc-status");
        const errEl = this.shadowRoot.querySelector("#acc-error");
        if (selected.length === 0) {
          errEl.textContent = this.language === "am" ? "እባክዎ ቢያንስ አንድ የድጋፍ አማራጭ ይምረጡ።" : "Please select at least one accommodation option.";
          errEl.hidden = false;
          return;
        }
        errEl.hidden = true;
        try {
          await fetch(`${this.api}/jobs/${encodeURIComponent(job.id || this.jobId)}/accommodations`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ accommodations: selected, language: this.language })
          });
        } catch {}
        try {
          window.localStorage.setItem(`db-job-acc-${job.id || this.jobId}`, JSON.stringify({ accommodations: selected, language: this.language }));
        } catch {}
        dialog.close();
        statusEl.textContent = t.requestSent;
        statusEl.hidden = false;
        this.dispatchEvent(
          new CustomEvent("db-job-card:accommodation-requested", {
            bubbles: true,
            composed: true,
            detail: { jobId: job.id || this.jobId, accommodations: selected, language: this.language }
          })
        );
      });
    }
  }

  /* ==========================================================================
     3. <db-live-viewer> — Extra Credit Recorded Live Session + Chat Log Viewer
     ========================================================================== */
  class DbLiveViewer extends HTMLElement {
    static get observedAttributes() {
      return ["lang", "src", "captions", "title"];
    }
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this.chatMessages = [
        { time: 2, sender: "Heaven Youn (ALX Host)", text: "Welcome everyone to Session 3! Today Hussein Ali joins us for WCAG 2.2 AA and NVDA/TalkBack testing." },
        { time: 8, sender: "Hussein Ali (A11y Lead)", text: "Remember the 4 core principles: Perceivable, Operable, Understandable, and Robust." },
        { time: 15, sender: "Kidus (Co-Designer)", text: "For Deaf learners in Ethiopia, the movable Sign Language window and visual chat log are essential." },
        { time: 24, sender: "Meron (Learner)", text: "Can we export the session transcript to Grade 1 Braille (.brf) for refreshable displays?" },
        { time: 33, sender: "Hussein Ali (A11y Lead)", text: "Yes! Every cue and chat message can be searched, clicked to seek, or exported to .brf and .vtt." }
      ];
    }
    connectedCallback() {
      this.render();
    }
    disconnectedCallback() {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    }
    attributeChangedCallback() {
      this.render();
    }
    get language() {
      return this.getAttribute("lang") === "am" ? "am" : "en";
    }
    get messages() {
      if (this.language === "am") {
        return [
          { time: 2, sender: "ሄቨን ዩን (ALX አስተናጋጅ)", text: "እንኳን ወደ ስልጠና 3 በደህና መጡ! ዛሬ ሁሴን አሊ ስለ WCAG 2.2 AA እና NVDA/TalkBack ስክሪን አንባቢ ሙከራ ያካፍለናል።" },
          { time: 8, sender: "ሁሴን አሊ (የተደራሽነት መሪ)", text: "4ቱን ዋና መርሆች አስታውሱ፦ መገንዘብ (Perceivable)፣ መስራት (Operable)፣ መረዳት (Understandable)፣ እና ጠንካራ (Robust)።" },
          { time: 15, sender: "ኪዱስ (አብሮ አዘጋጅ)", text: "በኢትዮጵያ ውስጥ ላሉ መስማት የተሳናቸው ተማሪዎች ተንቀሳቃሽ የምልክት ቋንቋ መስኮት እና የጽሑፍ ውይይት ወሳኝ ናቸው።" },
          { time: 24, sender: "ሜሮን (ተማሪ)", text: "የስብሰባውን ሙሉ ጽሑፍ ለብሬይል መሳሪያዎች በGrade 1 Braille (.brf) ማውረድ እንችላለን?" },
          { time: 33, sender: "ሁሴን አሊ (የተደራሽነት መሪ)", text: "አዎ! እያንዳንዱ መልዕክት ሊፈለግ፣ ተጭኖ ቪዲዮውን ሊያዘል ወይም ወደ .brf እና .vtt ሊላክ ይችላል።" }
        ];
      }
      return this.chatMessages;
    }
    async render() {
      const t = await getDictionary(this.language);
      const videoSrc = this.getAttribute("src") || "/savanna/assets/media/va-future-lesson.mp4";
      const capSrc = this.getAttribute("captions") || "/savanna/assets/captions/session-20261112-wcag.vtt";

      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            font-family: var(--bs-body-font-family, system-ui, sans-serif);
            color: #101828;
            margin: 1rem 0;
          }
          *, *::before, *::after { box-sizing: border-box; }
          .grid {
            display: grid;
            grid-template-columns: minmax(0, 1.4fr) minmax(18rem, 0.9fr);
            gap: 1rem;
          }
          .chat-box {
            border: 2px solid #05192d;
            border-radius: 0.75rem;
            background: #ffffff;
            display: flex;
            flex-direction: column;
            max-height: 36rem;
            overflow: hidden;
          }
          .chat-head {
            background: #05192d;
            color: #ffffff;
            padding: 0.75rem 1rem;
            font-weight: 700;
          }
          .chat-search {
            padding: 0.65rem 1rem;
            border-bottom: 1px solid #cbd5e1;
          }
          .chat-search input {
            width: 100%;
            min-height: 44px;
            padding: 0.45rem 0.75rem;
            border: 1px solid #64748b;
            border-radius: 0.35rem;
            font: inherit;
          }
          .chat-list {
            list-style: none;
            margin: 0;
            padding: 0.75rem;
            overflow-y: auto;
            display: grid;
            gap: 0.5rem;
          }
          .chat-btn {
            width: 100%;
            text-align: left;
            padding: 0.6rem 0.75rem;
            border: 1px solid #cbd5e1;
            border-radius: 0.45rem;
            background: #f8fafc;
            cursor: pointer;
            font: inherit;
          }
          .chat-btn:hover, .chat-btn:focus-visible {
            outline: 3px solid #f5a300;
            background: #ecfdf5;
          }
          .chat-meta {
            display: flex;
            justify-content: space-between;
            font-size: 0.82rem;
            font-weight: 700;
            color: #0d5c3a;
            margin-bottom: 0.25rem;
          }
          @media (max-width: 54rem) { .grid { grid-template-columns: 1fr; } }
        </style>
        <div class="grid" lang="${this.language}">
          <db-player
            id="inner-player"
            title="${escapeHtml(this.getAttribute("title") || t.liveViewerTitle)}"
            src="${escapeHtml(videoSrc)}"
            captions="${escapeHtml(capSrc)}"
            sign="/savanna/assets/media/va-future-ethsl.mp4"
            lang="${this.language}">
          </db-player>
          <aside class="chat-box" aria-labelledby="chat-heading">
            <div class="chat-head" id="chat-heading">${escapeHtml(t.chatHeading)}</div>
            <div class="chat-search">
              <label for="chat-filter" style="display:block;font-size:0.85rem;font-weight:700;margin-bottom:0.25rem">${escapeHtml(t.searchChat)}</label>
              <input id="chat-filter" type="search" placeholder="WCAG, Braille, EthSL...">
            </div>
            <ul class="chat-list" id="chat-list" role="log" aria-live="polite"></ul>
          </aside>
        </div>
      `;

      const renderMessages = (filterText = "") => {
        const q = filterText.trim().toLowerCase();
        const listEl = this.shadowRoot.querySelector("#chat-list");
        listEl.innerHTML = this.messages
          .filter((m) => !q || m.text.toLowerCase().includes(q) || m.sender.toLowerCase().includes(q))
          .map(
            (m) => `
          <li>
            <button type="button" class="chat-btn" data-seek="${m.time}">
              <div class="chat-meta"><span>${escapeHtml(m.sender)}</span><time>${formatTime(m.time)}</time></div>
              <div>${escapeHtml(m.text)}</div>
            </button>
          </li>`
          )
          .join("");
        listEl.querySelectorAll("[data-seek]").forEach((btn) =>
          btn.addEventListener("click", () => {
            const innerPlayer = this.shadowRoot.querySelector("#inner-player");
            const innerVideo = innerPlayer?.shadowRoot?.querySelector("#video");
            if (innerVideo) {
              innerVideo.currentTime = Number(btn.dataset.seek);
              innerVideo.play().catch(() => {});
            }
          })
        );
      };

      renderMessages();
      this.shadowRoot.querySelector("#chat-filter").addEventListener("input", (e) => renderMessages(e.target.value));
    }
  }

  if (!customElements.get("db-player")) customElements.define("db-player", DbPlayer);
  if (!customElements.get("db-job-card")) customElements.define("db-job-card", DbJobCard);
  if (!customElements.get("db-live-viewer")) customElements.define("db-live-viewer", DbLiveViewer);
})();

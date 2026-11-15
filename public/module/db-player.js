/**
 * db-player.js - ALX Digital Bridge Hackathon 2026 (Track 2: Accessible Learning Media)
 * Standard Drop-in Web Component: <db-player>
 *
 * Usage:
 *   <script src="/module/db-player.js" defer></script>
 *   <db-player
 *     src="/assets/media/demo-lesson.mp4"
 *     captions="/assets/media/demo-lesson.vtt,/assets/media/demo-lesson.am.vtt"
 *     sign="/assets/media/demo-lesson.ethsl.mp4"
 *     describe="/assets/media/demo-lesson.ad.vtt"
 *     lang="am"
 *     api="/api/v1">
 *   </db-player>
 *
 * Events emitted on document and element:
 *   - db-player:progress { seconds, percent }
 *   - db-player:complete {}
 *   - db-player:prefs { captionSize, captionColor, signPosition }
 */

(function () {
  'use strict';

  if (customElements.get('db-player')) return;

  // Embedded default translations for fallback resilience (even offline / before i18n JSON fetches)
  const I18N_FALLBACK = {
    en: {
      play: "Play",
      pause: "Pause",
      back10: "Back 10 seconds",
      speed: "Speed",
      captions: "Captions",
      signLanguage: "Sign language",
      transcript: "Transcript",
      fullscreen: "Full screen",
      exitFullscreen: "Exit full screen",
      keyboardHelp: "Keyboard help",
      downloadOffline: "Download for offline (1.8 MB)",
      textOnly: "Text only",
      getHelp: "Get help with this part",
      signTopLeft: "Top left",
      signTopRight: "Top right",
      signBottomLeft: "Bottom left",
      signBottomRight: "Bottom right",
      signLarger: "Larger",
      signSmaller: "Smaller",
      noSignVideo: "No sign language video for this lesson yet.",
      settings: "Caption, sound & sign settings",
      captionLang: "Caption language",
      captionSize: "Size",
      captionTheme: "Colours",
      audioDescription: "Audio description",
      adOff: "Off",
      adSpeech: "Spoken by device",
      adText: "Text for screen reader",
      sizeNormal: "Normal",
      sizeLarge: "Large",
      sizeXLarge: "Extra large",
      themeWhiteBlack: "White on black",
      themeYellowBlack: "Yellow on black",
      themeBlackYellow: "Black on yellow",
      themeWhiteNavy: "White on navy",
      downloadText: "Text (.txt)",
      downloadBraille: "Braille (.brf, English)",
      downloadVtt: "Captions (.vtt)",
      brailleNotice: "Braille export covers English only. Amharic text is not converted yet.",
      savedOffline: "Saved on this phone. It will send when you are online.",
      offlineReady: "Offline pack downloaded and cached. Aeroplane mode ready.",
      lessonCompleted: "Lesson complete.",
      seek: "Seek",
      description: "Description:",
      textModeNote: "Text-only mode is on. The video is hidden. Use the transcript below; it includes descriptions of what is on screen."
    },
    am: {
      play: "አጫውት",
      pause: "አቁም",
      back10: "10 ሰከንድ ወደ ኋላ",
      speed: "ፍጥነት",
      captions: "የጽሑፍ ግልባጭ",
      signLanguage: "የምልክት ቋንቋ",
      transcript: "ሙሉ ጽሑፍ",
      fullscreen: "ሙሉ ማያ",
      exitFullscreen: "ከሙሉ ማያ ውጣ",
      keyboardHelp: "የቁልፍ ሰሌዳ እገዛ",
      downloadOffline: "ከመስመር ውጭ ለማውረድ (1.8 MB)",
      textOnly: "ጽሑፍ ብቻ",
      getHelp: "በዚህ ክፍል እገዛ ያግኙ",
      signTopLeft: "ከላይ በስተግራ",
      signTopRight: "ከላይ በስተቀኝ",
      signBottomLeft: "ከታች በስተግራ",
      signBottomRight: "ከታች በስተቀኝ",
      signLarger: "መጠን ጨምር",
      signSmaller: "መጠን ቀንስ",
      noSignVideo: "ለዚህ ትምህርት እስካሁን የምልክት ቋንቋ ቪዲዮ የለም።",
      settings: "የጽሑፍ፣ ድምጽ እና ምልክት ቅንብሮች",
      captionLang: "የጽሑፍ ቋንቋ",
      captionSize: "መጠን",
      captionTheme: "ቀለሞች",
      audioDescription: "የድምጽ ማብራሪያ",
      adOff: "አጥፋ",
      adSpeech: "በመሳሪያው ጮክ ብሎ ይነበብ",
      adText: "ለስክሪን አንባቢ የሚሆን ጽሑፍ",
      sizeNormal: "መደበኛ",
      sizeLarge: "ትልቅ",
      sizeXLarge: "በጣም ትልቅ",
      themeWhiteBlack: "ነጭ በጥቁር ላይ",
      themeYellowBlack: "ቢጫ በጥቁር ላይ",
      themeBlackYellow: "ጥቁር በቢጫ ላይ",
      themeWhiteNavy: "ነጭ በሰማያዊ ላይ",
      downloadText: "ጽሑፍ (.txt)",
      downloadBraille: "ብሬል (.brf, እንግሊዝኛ)",
      downloadVtt: "የጽሑፍ ግልባጭ (.vtt)",
      brailleNotice: "የብሬል ልወጣ እንግሊዝኛ ፊደላትን ብቻ ይደግፋል። አማርኛ ጽሑፍ እስካሁን አልተለወጠም።",
      savedOffline: "በዚህ ስልክ ላይ ተቀምጧል። ኢንተርኔት ሲኖር ይላካል።",
      offlineReady: "የትምህርት ጥቅል ወርዶ ተቀምጧል። ያለ ኢንተርኔት መጠቀም ይችላሉ።",
      lessonCompleted: "ትምህርቱ ተጠናቋል።",
      seek: "ፈልግ",
      description: "ማብራሪያ:",
      textModeNote: "የጽሑፍ-ብቻ ሁነታ በርቷል። ቪዲዮው ተደብቋል። ከታች ያለውን ሙሉ ጽሑፍ ይጠቀሙ፤ በስክሪኑ ላይ የሚታየውን ማብራሪያ ያካትታል።"
    }
  };

  // VTT parser
  function parseVTT(text) {
    if (!text) return [];
    const lines = String(text).replace(/\r/g, '').split('\n');
    const cues = [];
    const parseSec = (stamp) => {
      const parts = stamp.trim().replace(',', '.').split(':').map(parseFloat);
      let s = 0;
      for (let i = 0; i < parts.length; i++) s = s * 60 + (parts[i] || 0);
      return s;
    };
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('-->')) {
        const [startStr, endRaw] = lines[i].split('-->');
        const start = parseSec(startStr);
        const end = parseSec(endRaw.trim().split(/\s+/)[0]);
        const buf = [];
        while (i + 1 < lines.length && lines[i + 1].trim() !== '') {
          i++;
          buf.push(lines[i]);
        }
        cues.push({ start, end, text: buf.join(' ').replace(/<[^>]+>/g, '').trim() });
      }
    }
    return cues;
  }

  function formatClock(sec) {
    sec = Math.max(0, Math.floor(sec || 0));
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  // Grade 1 English Braille ASCII table
  const BRAILLE_MAP = {
    'a':'a','b':'b','c':'c','d':'d','e':'e','f':'f','g':'g','h':'h','i':'i','j':'j',
    'k':'k','l':'l','m':'m','n':'n','o':'o','p':'p','q':'q','r':'r','s':'s','t':'t',
    'u':'u','v':'v','w':'w','x':'x','y':'y','z':'z',
    '1':'#a','2':'#b','3':'#c','4':'#d','5':'#e','6':'#f','7':'#g','8':'#h','9':'#i','0':'#j',
    ' ': ' ', ',': '1', ';': '2', ':': '3', '.': '4', '!': '6', '(': '7', ')': '7', '?': '8', '"': '8', '\'': '\''
  };

  function toBrailleAscii(text) {
    return text.split('\n').map(line => {
      let out = '';
      for (const ch of line) {
        const lower = ch.toLowerCase();
        if (ch >= 'A' && ch <= 'Z') out += ',' + (BRAILLE_MAP[lower] || lower);
        else if (BRAILLE_MAP[ch]) out += BRAILLE_MAP[ch];
        else if (/[\u1200-\u137F]/.test(ch)) {
          return '[NOTICE: Amharic script is not yet supported in Grade 1 Braille export]';
        } else out += ch;
      }
      return out;
    }).join('\n');
  }

  const CSS = `
    :host {
      display: block;
      color: var(--bs-body-color, #1a1a1a);
      font-family: var(--bs-body-font-family, system-ui, -apple-system, "Noto Sans Ethiopic", "Abyssinica SIL", sans-serif);
      line-height: 1.6;
      box-sizing: border-box;
      max-width: 100%;
    }
    *, *::before, *::after {
      box-sizing: inherit;
    }
    :host([lang="am"]) {
      line-height: 1.7;
    }
    .db-player-card {
      background: #ffffff;
      border: 2px solid var(--bs-border-color, #d0d7de);
      border-radius: 12px;
      padding: 1rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.06);
      position: relative;
    }
    .video-viewport {
      position: relative;
      background: #000000;
      border-radius: 8px;
      overflow: hidden;
      aspect-ratio: 16 / 9;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .video-viewport:focus-visible {
      outline: 3px solid #f5a300;
      outline-offset: 3px;
    }
    video#main-video {
      width: 100%;
      height: 100%;
      display: block;
      object-fit: contain;
    }
    .video-viewport.text-only-active video#main-video {
      visibility: hidden;
    }
    /* Custom Captions Overlay */
    .caption-overlay {
      position: absolute;
      left: 5%;
      right: 5%;
      bottom: 8%;
      text-align: center;
      pointer-events: none;
      z-index: 10;
      transition: all 0.2s ease;
    }
    .caption-overlay span {
      display: inline-block;
      padding: 0.35em 0.75em;
      border-radius: 6px;
      line-height: 1.45;
      font-weight: 600;
      max-width: 90%;
      word-wrap: break-word;
    }
    .caption-overlay.size-normal span { font-size: 1.15rem; }
    .caption-overlay.size-large span { font-size: 1.55rem; }
    .caption-overlay.size-xlarge span { font-size: 2.1rem; }

    .theme-white-on-black span { background: #000000; color: #ffffff; border: 1px solid rgba(255,255,255,0.3); }
    .theme-yellow-on-black span { background: #000000; color: #ffeb3b; border: 1px solid rgba(255,235,59,0.3); }
    .theme-black-on-yellow span { background: #ffeb3b; color: #000000; border: 1px solid #000000; }
    .theme-white-on-navy span { background: #002b56; color: #ffffff; border: 1px solid rgba(255,255,255,0.4); }

    /* Sign Language Pip Window */
    .sign-window {
      position: absolute;
      border: 3px solid #f5a300;
      background: #000000;
      border-radius: 8px;
      overflow: hidden;
      z-index: 20;
      cursor: move;
      box-shadow: 0 4px 15px rgba(0,0,0,0.5);
      transition: width 0.2s, height 0.2s;
    }
    .sign-window video {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .sign-window.size-small { width: 25%; aspect-ratio: 3 / 4; }
    .sign-window.size-medium { width: 35%; aspect-ratio: 3 / 4; }
    .sign-window.size-large { width: 48%; aspect-ratio: 3 / 4; }

    .sign-window.pos-top-left { top: 3%; left: 3%; }
    .sign-window.pos-top-right { top: 3%; right: 3%; }
    .sign-window.pos-bottom-left { bottom: 3%; left: 3%; }
    .sign-window.pos-bottom-right { bottom: 3%; right: 3%; }

    /* Controls Bar */
    .controls-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.75rem;
    }
    button, select, input[type=range] {
      font: inherit;
    }
    button, select {
      min-height: 44px;
      min-width: 44px;
      padding: 0.45rem 0.85rem;
      border: 2px solid var(--bs-primary, #002b56);
      border-radius: 8px;
      background: #ffffff;
      color: var(--bs-primary, #002b56);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      transition: background 0.15s, color 0.15s;
    }
    button:hover, select:hover {
      background: #f0f4f8;
    }
    button.btn-primary {
      background: var(--bs-primary, #002b56);
      color: #ffffff;
    }
    button.btn-primary:hover {
      background: #001f3f;
    }
    button[aria-pressed="true"] {
      background: var(--bs-primary, #002b56);
      color: #ffffff;
      outline: 3px solid #f5a300;
      outline-offset: -2px;
    }
    :focus-visible {
      outline: 3px solid #f5a300 !important;
      outline-offset: 2px !important;
    }
    .scrub-container {
      flex: 1 1 12rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    input[type=range] {
      width: 100%;
      min-height: 44px;
      cursor: pointer;
    }
    .time-display {
      font-variant-numeric: tabular-nums;
      min-width: 6.5rem;
      font-weight: 600;
      font-size: 0.95rem;
    }
    .status-alert {
      margin: 0.5rem 0;
      padding: 0.6rem 0.85rem;
      border-radius: 8px;
      background: #eef4fc;
      border-left: 5px solid var(--bs-primary, #002b56);
      font-weight: 600;
    }
    .audio-desc-alert {
      margin: 0.5rem 0;
      padding: 0.6rem 0.85rem;
      border-radius: 8px;
      background: #fff8e1;
      border-left: 5px solid #f5a300;
      font-style: italic;
    }
    details.settings-box {
      margin: 0.75rem 0;
      border: 1px solid var(--bs-border-color, #d0d7de);
      border-radius: 8px;
      padding: 0.5rem 0.85rem;
    }
    summary {
      cursor: pointer;
      font-weight: 700;
      min-height: 44px;
      display: flex;
      align-items: center;
      user-select: none;
    }
    .settings-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem 1.25rem;
      align-items: center;
      margin: 0.5rem 0;
    }
    label.form-label {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      min-height: 44px;
      font-weight: 500;
    }
    .btn-group-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      align-items: center;
    }
    /* Transcript List */
    .transcript-box {
      margin-top: 1rem;
    }
    ol.transcript-list {
      list-style: none;
      margin: 0.5rem 0 0 0;
      padding: 0;
      max-height: 18rem;
      overflow-y: auto;
      border: 1px solid var(--bs-border-color, #d0d7de);
      border-radius: 8px;
    }
    ol.transcript-list li {
      border-bottom: 1px solid var(--bs-border-color, #d0d7de);
    }
    ol.transcript-list li:last-child {
      border-bottom: none;
    }
    ol.transcript-list li button {
      width: 100%;
      text-align: left;
      border: none;
      border-left: 6px solid transparent;
      border-radius: 0;
      padding: 0.6rem 0.8rem;
      min-height: 44px;
      background: transparent;
      color: inherit;
      display: flex;
      align-items: baseline;
      gap: 0.8rem;
    }
    ol.transcript-list li[aria-current="true"] button {
      border-left-color: var(--bs-primary, #002b56);
      background: #eef4fc;
      font-weight: 700;
    }
    /* Dialog Modal */
    dialog {
      border: 2px solid var(--bs-primary, #002b56);
      border-radius: 12px;
      padding: 1.5rem;
      max-width: 90vw;
      width: 32rem;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    }
    dialog::backdrop {
      background: rgba(0,0,0,0.5);
    }
    .visually-hidden {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      border: 0;
    }
    @media (max-width: 480px) {
      .controls-row {
        gap: 0.35rem;
      }
      button, select {
        padding: 0.35rem 0.5rem;
        font-size: 0.9rem;
      }
      .sign-window.size-small { width: 35%; }
      .sign-window.size-medium { width: 50%; }
      .sign-window.size-large { width: 68%; }
    }
  `;

  class DbPlayer extends HTMLElement {
    static get observedAttributes() {
      return ['src', 'captions', 'sign', 'describe', 'lang', 'api'];
    }

    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.s = {
        lang: 'en',
        captionSize: 'normal',
        captionColor: 'white-on-black',
        signPosition: 'bottom-right',
        signSize: 'medium',
        rate: 1.0,
        volume: 1.0,
        adMode: 'off',
        captionsVisible: true,
        signVisible: false,
        textOnly: false,
        transcriptVisible: true
      };
      this.cues = { en: [], am: [] };
      this.adCues = [];
      this.rawVtt = { en: '', am: '' };
      this.t = I18N_FALLBACK.en;
    }

    connectedCallback() {
      this._initFromStorage();
      this._updateLang();
      this._render();
      this._bindEvents();
      this._loadMediaAndTracks();
    }

    attributeChangedCallback(name, oldVal, newVal) {
      if (oldVal === newVal) return;
      if (name === 'lang') {
        this.s.lang = newVal === 'am' ? 'am' : 'en';
        this._updateLang();
        if (this.shadowRoot && this.shadowRoot.innerHTML) {
          this._applyTranslations();
          this._renderTranscript();
        }
      } else if (name === 'src' && this._video) {
        this._video.src = newVal;
      }
    }

    _initFromStorage() {
      try {
        const saved = JSON.parse(localStorage.getItem('db-player-prefs') || '{}');
        if (saved.captionSize) this.s.captionSize = saved.captionSize;
        if (saved.captionColor) this.s.captionColor = saved.captionColor;
        if (saved.signPosition) this.s.signPosition = saved.signPosition;
        if (saved.adMode) this.s.adMode = saved.adMode;
      } catch (e) {}
    }

    _savePrefs() {
      try {
        localStorage.setItem('db-player-prefs', JSON.stringify({
          captionSize: this.s.captionSize,
          captionColor: this.s.captionColor,
          signPosition: this.s.signPosition,
          adMode: this.s.adMode
        }));
      } catch (e) {}
      this._dispatch('db-player:prefs', {
        captionSize: this.s.captionSize,
        captionColor: this.s.captionColor,
        signPosition: this.s.signPosition
      });
    }

    _updateLang() {
      const attrLang = this.getAttribute('lang') || 'en';
      this.s.lang = attrLang === 'am' ? 'am' : 'en';
      this.t = I18N_FALLBACK[this.s.lang] || I18N_FALLBACK.en;
      this.setAttribute('lang', this.s.lang);

      // Async fetch language file if available to ensure full localization
      fetch(`/module/i18n/${this.s.lang}.json`).then(r => r.json()).then(data => {
        this.t = Object.assign({}, this.t, data);
        this._applyTranslations();
      }).catch(() => {});
    }

    _dispatch(name, detail) {
      const evt = new CustomEvent(name, {
        bubbles: true,
        composed: true,
        detail: detail || {}
      });
      this.dispatchEvent(evt);
      document.dispatchEvent(evt);
    }

    _say(msg) {
      const el = this.shadowRoot.getElementById('live-status');
      if (el) {
        el.textContent = '';
        setTimeout(() => { el.textContent = msg; }, 30);
      }
    }

    _render() {
      const t = this.t;
      this.shadowRoot.innerHTML = `
        <style>${CSS}</style>
        <div class="db-player-card" role="region" aria-label="Accessible Learning Media Player">
          <div class="video-viewport" id="viewport" tabindex="0"
               aria-label="Video lesson. Space or K to play and pause, arrows to seek, C for captions.">
            <video id="main-video" playsinline preload="metadata"></video>
            
            <!-- Custom Captions Overlay -->
            <div class="caption-overlay size-${this.s.captionSize} theme-${this.s.captionColor}"
                 id="caption-box" aria-hidden="true" lang="${this.s.lang}">
              <span id="caption-text" style="display:none;"></span>
            </div>

            <!-- Sign Language PiP Window -->
            <div class="sign-window size-${this.s.signSize} pos-${this.s.signPosition}"
                 id="sign-box" style="display:none;" aria-label="Sign Language Video Window">
              <video id="sign-video" muted playsinline></video>
            </div>
          </div>

          <!-- Live Announcement & Audio Description Regions -->
          <div id="live-status" class="visually-hidden" role="status" aria-live="polite"></div>
          <div id="ad-text-box" class="audio-desc-alert" style="display:none;" role="status" aria-live="polite">
            <strong>${t.description}</strong> <span id="ad-text-content"></span>
          </div>
          <div id="text-mode-alert" class="status-alert" style="display:none;">
            ${t.textModeNote}
          </div>

          <!-- Primary Controls (All Real <button> elements with names) -->
          <div class="controls-row" role="group" aria-label="Playback controls">
            <button type="button" class="btn-primary" id="btn-play">${t.play}</button>
            <button type="button" id="btn-back10" aria-label="${t.back10}">${t.back10}</button>
            
            <div class="scrub-container">
              <label for="seek-bar" class="visually-hidden">${t.seek}</label>
              <input type="range" id="seek-bar" min="0" max="100" step="0.1" value="0"
                     aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-valuetext="0:00 of 0:00">
              <span class="time-display" id="time-txt">0:00 / 0:00</span>
            </div>

            <label class="form-label" style="margin-bottom:0;">
              <span class="visually-hidden">${t.speed}</span>
              <select id="select-speed" title="${t.speed}">
                <option value="0.75">0.75x</option>
                <option value="1" selected>1.0x</option>
                <option value="1.25">1.25x</option>
                <option value="1.5">1.5x</option>
              </select>
            </label>

            <button type="button" id="btn-fullscreen">${t.fullscreen}</button>
          </div>

          <!-- Secondary Feature Controls -->
          <div class="controls-row" role="group" aria-label="Accessibility options">
            <button type="button" id="btn-captions" aria-pressed="${this.s.captionsVisible}">${t.captions}</button>
            <button type="button" id="btn-sign" aria-pressed="${this.s.signVisible}">${t.signLanguage}</button>
            <button type="button" id="btn-transcript" aria-pressed="${this.s.transcriptVisible}">${t.transcript}</button>
            <button type="button" id="btn-text-only" aria-pressed="${this.s.textOnly}">${t.textOnly}</button>
            <button type="button" id="btn-offline">${t.downloadOffline}</button>
            <button type="button" id="btn-key-help">${t.keyboardHelp}</button>
          </div>

          <!-- Settings Collapsible Details -->
          <details class="settings-box">
            <summary id="summary-settings">${t.settings}</summary>
            
            <div class="settings-grid">
              <label class="form-label">
                <span id="lbl-lang">${t.captionLang}:</span>
                <select id="select-lang">
                  <option value="en" ${this.s.lang === 'en' ? 'selected' : ''}>English</option>
                  <option value="am" ${this.s.lang === 'am' ? 'selected' : ''}>አማርኛ (Amharic)</option>
                </select>
              </label>

              <label class="form-label">
                <span id="lbl-size">${t.captionSize}:</span>
                <select id="select-size">
                  <option value="normal" ${this.s.captionSize === 'normal' ? 'selected' : ''}>${t.sizeNormal}</option>
                  <option value="large" ${this.s.captionSize === 'large' ? 'selected' : ''}>${t.sizeLarge}</option>
                  <option value="xlarge" ${this.s.captionSize === 'xlarge' ? 'selected' : ''}>${t.sizeXLarge}</option>
                </select>
              </label>

              <label class="form-label">
                <span id="lbl-theme">${t.captionTheme}:</span>
                <select id="select-theme">
                  <option value="white-on-black" ${this.s.captionColor === 'white-on-black' ? 'selected' : ''}>${t.themeWhiteBlack}</option>
                  <option value="yellow-on-black" ${this.s.captionColor === 'yellow-on-black' ? 'selected' : ''}>${t.themeYellowBlack}</option>
                  <option value="black-on-yellow" ${this.s.captionColor === 'black-on-yellow' ? 'selected' : ''}>${t.themeBlackYellow}</option>
                  <option value="white-on-navy" ${this.s.captionColor === 'white-on-navy' ? 'selected' : ''}>${t.themeWhiteNavy}</option>
                </select>
              </label>

              <label class="form-label">
                <span id="lbl-ad">${t.audioDescription}:</span>
                <select id="select-ad">
                  <option value="off" ${this.s.adMode === 'off' ? 'selected' : ''}>${t.adOff}</option>
                  <option value="speech" ${this.s.adMode === 'speech' ? 'selected' : ''}>${t.adSpeech}</option>
                  <option value="text" ${this.s.adMode === 'text' ? 'selected' : ''}>${t.adText}</option>
                </select>
              </label>
            </div>

            <!-- Sign Window Buttons for WCAG 2.2 Discrete Positioning -->
            <div id="sign-controls-panel" style="margin-top:0.75rem; border-top:1px dashed #d0d7de; padding-top:0.5rem;">
              <span style="font-weight:600; display:block; margin-bottom:0.4rem;">${t.signLanguage} ${t.settings}:</span>
              <div class="btn-group-row">
                <button type="button" id="btn-pos-tl">${t.signTopLeft}</button>
                <button type="button" id="btn-pos-tr">${t.signTopRight}</button>
                <button type="button" id="btn-pos-bl">${t.signBottomLeft}</button>
                <button type="button" id="btn-pos-br">${t.signBottomRight}</button>
                <button type="button" id="btn-sign-larger">${t.signLarger}</button>
                <button type="button" id="btn-sign-smaller">${t.signSmaller}</button>
              </div>
              <p id="sign-notice" style="font-size:0.9rem; color:#666; margin-top:0.4rem;"></p>
            </div>

            <!-- Export Formats -->
            <div style="margin-top:0.75rem; border-top:1px dashed #d0d7de; padding-top:0.5rem;">
              <span style="font-weight:600; display:block; margin-bottom:0.4rem;">${t.downloadOffline} / Export:</span>
              <div class="btn-group-row">
                <button type="button" id="btn-export-txt">${t.downloadText}</button>
                <button type="button" id="btn-export-brf">${t.downloadBraille}</button>
                <button type="button" id="btn-export-vtt">${t.downloadVtt}</button>
              </div>
              <p style="font-size:0.85rem; color:#666; margin-top:0.35rem;">${t.brailleNotice}</p>
            </div>
          </details>

          <!-- Interactive Transcript Section -->
          <div class="transcript-box" id="transcript-container">
            <h3 style="font-size:1.15rem; margin:0.75rem 0 0.35rem 0;" id="transcript-heading">${t.transcript}</h3>
            <ol class="transcript-list" id="transcript-list" aria-labelledby="transcript-heading"></ol>
          </div>

          <!-- Accessible Keyboard Help Dialog Modal -->
          <dialog id="help-dialog" aria-labelledby="help-title">
            <h2 id="help-title" style="margin-top:0; font-size:1.3rem;">${t.keyboardHelp}</h2>
            <ul style="line-height:1.8;">
              <li><strong>Space / K:</strong> ${t.play} / ${t.pause}</li>
              <li><strong>Left Arrow / J:</strong> 5 seconds backward</li>
              <li><strong>Right Arrow / L:</strong> 5 seconds forward</li>
              <li><strong>Back 10 button:</strong> 10 seconds backward</li>
              <li><strong>C:</strong> Toggle ${t.captions}</li>
              <li><strong>T:</strong> Toggle ${t.textOnly}</li>
              <li><strong>F:</strong> Toggle ${t.fullscreen}</li>
              <li><strong>M:</strong> Toggle mute</li>
              <li><strong>Escape:</strong> Close help dialog</li>
            </ul>
            <div style="text-align:right; margin-top:1rem;">
              <button type="button" class="btn-primary" id="btn-close-help">Close</button>
            </div>
          </dialog>
        </div>
      `;

      this._video = this.shadowRoot.getElementById('main-video');
      this._signVideo = this.shadowRoot.getElementById('sign-video');
    }

    _applyTranslations() {
      const t = this.t;
      const sr = this.shadowRoot;
      if (!sr) return;

      const setTxt = (id, val) => { const el = sr.getElementById(id); if (el) el.textContent = val; };
      setTxt('btn-play', this._video && !this._video.paused ? t.pause : t.play);
      setTxt('btn-back10', t.back10);
      setTxt('btn-fullscreen', t.fullscreen);
      setTxt('btn-captions', t.captions);
      setTxt('btn-sign', t.signLanguage);
      setTxt('btn-transcript', t.transcript);
      setTxt('btn-text-only', t.textOnly);
      setTxt('btn-offline', t.downloadOffline);
      setTxt('btn-key-help', t.keyboardHelp);
      setTxt('summary-settings', t.settings);
      setTxt('lbl-lang', t.captionLang + ':');
      setTxt('lbl-size', t.captionSize + ':');
      setTxt('lbl-theme', t.captionTheme + ':');
      setTxt('lbl-ad', t.audioDescription + ':');
      setTxt('btn-pos-tl', t.signTopLeft);
      setTxt('btn-pos-tr', t.signTopRight);
      setTxt('btn-pos-bl', t.signBottomLeft);
      setTxt('btn-pos-br', t.signBottomRight);
      setTxt('btn-sign-larger', t.signLarger);
      setTxt('btn-sign-smaller', t.signSmaller);
      setTxt('btn-export-txt', t.downloadText);
      setTxt('btn-export-brf', t.downloadBraille);
      setTxt('btn-export-vtt', t.downloadVtt);
      setTxt('transcript-heading', t.transcript);
      setTxt('text-mode-alert', t.textModeNote);
      setTxt('help-title', t.keyboardHelp);
    }

    _loadMediaAndTracks() {
      const src = this.getAttribute('src');
      if (src && this._video) this._video.src = src;

      const signSrc = this.getAttribute('sign');
      const signNotice = this.shadowRoot.getElementById('sign-notice');
      if (signSrc && this._signVideo) {
        this._signVideo.src = signSrc;
        if (signNotice) signNotice.textContent = '';
      } else {
        if (signNotice) signNotice.textContent = this.t.noSignVideo;
      }

      // Parse captions attribute: comma-separated list of URLs
      const captionAttr = this.getAttribute('captions') || '';
      const urls = captionAttr.split(',').map(u => u.trim()).filter(Boolean);

      const fetchTrack = (url, lang) => {
        return fetch(url).then(r => {
          if (!r.ok) throw new Error(r.statusText);
          return r.text();
        }).then(text => {
          this.rawVtt[lang] = text;
          this.cues[lang] = parseVTT(text);
        }).catch(() => {});
      };

      const promises = [];
      urls.forEach(u => {
        if (u.includes('.am.') || u.endsWith('am.vtt')) {
          promises.push(fetchTrack(u, 'am'));
        } else {
          promises.push(fetchTrack(u, 'en'));
        }
      });

      const descUrl = this.getAttribute('describe');
      if (descUrl) {
        promises.push(fetch(descUrl).then(r => r.text()).then(text => {
          this.adCues = parseVTT(text);
        }).catch(() => {}));
      }

      Promise.all(promises).then(() => {
        this._renderTranscript();
      });
    }

    _bindEvents() {
      const sr = this.shadowRoot;
      const v = this._video;
      const sv = this._signVideo;
      const btnPlay = sr.getElementById('btn-play');
      const seekBar = sr.getElementById('seek-bar');
      const timeTxt = sr.getElementById('time-txt');
      const capBox = sr.getElementById('caption-box');
      const capText = sr.getElementById('caption-text');
      const signBox = sr.getElementById('sign-box');

      const togglePlay = () => {
        if (v.paused) {
          v.play().catch(() => this._say('Could not start playback.'));
        } else {
          v.pause();
        }
      };

      btnPlay.addEventListener('click', togglePlay);

      v.addEventListener('play', () => {
        btnPlay.textContent = this.t.pause;
        if (this.s.signVisible && sv.src) sv.play().catch(() => {});
      });

      v.addEventListener('pause', () => {
        btnPlay.textContent = this.t.play;
        if (sv) sv.pause();
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      });

      v.addEventListener('timeupdate', () => {
        const cur = v.currentTime || 0;
        const dur = v.duration || 0;
        if (dur) {
          seekBar.max = dur;
          seekBar.value = cur;
          seekBar.setAttribute('aria-valuenow', Math.round(cur));
          const valText = `${formatClock(cur)} of ${formatClock(dur)}`;
          seekBar.setAttribute('aria-valuetext', valText);
          timeTxt.textContent = `${formatClock(cur)} / ${formatClock(dur)}`;

          // Dispatch progress event per Track 2 spec:
          const percent = dur > 0 ? Math.round((cur / dur) * 100) : 0;
          this._dispatch('db-player:progress', {
            seconds: Math.floor(cur),
            percent: percent
          });
        }
        this._updateCaptionsAndAd(cur);
        this._highlightTranscript(cur);
      });

      // Sign language video sync (Section 5 Step 4)
      // Drift correction once a second:
      setInterval(() => {
        if (this.s.signVisible && sv.src && !v.paused) {
          if (Math.abs(sv.currentTime - v.currentTime) > 0.3) {
            sv.currentTime = v.currentTime;
          }
          if (sv.playbackRate !== v.playbackRate) {
            sv.playbackRate = v.playbackRate;
          }
        }
      }, 1000);

      v.addEventListener('seeking', () => {
        if (sv && sv.src) sv.currentTime = v.currentTime;
      });

      v.addEventListener('ratechange', () => {
        if (sv && sv.src) sv.playbackRate = v.playbackRate;
      });

      v.addEventListener('ended', () => {
        btnPlay.textContent = this.t.play;
        this._say(this.t.lessonCompleted);
        this._dispatch('db-player:complete', {
          lessonId: this.getAttribute('lesson-id') || 'demo'
        });
      });

      // Back 10 seconds button
      sr.getElementById('btn-back10').addEventListener('click', () => {
        v.currentTime = Math.max(0, v.currentTime - 10);
        this._say('Back 10 seconds');
      });

      // Scrubbing
      seekBar.addEventListener('input', (e) => {
        v.currentTime = parseFloat(e.target.value);
      });

      // Speed selection
      sr.getElementById('select-speed').addEventListener('change', (e) => {
        const rate = parseFloat(e.target.value);
        this.s.rate = rate;
        v.playbackRate = rate;
      });

      // Full screen button
      sr.getElementById('btn-fullscreen').addEventListener('click', () => {
        const vp = sr.getElementById('viewport');
        if (!document.fullscreenElement) {
          if (vp.requestFullscreen) vp.requestFullscreen();
          else if (this.requestFullscreen) this.requestFullscreen();
        } else {
          if (document.exitFullscreen) document.exitFullscreen();
        }
      });

      // Captions toggle
      const btnCap = sr.getElementById('btn-captions');
      btnCap.addEventListener('click', () => {
        this.s.captionsVisible = !this.s.captionsVisible;
        btnCap.setAttribute('aria-pressed', String(this.s.captionsVisible));
        capBox.style.display = this.s.captionsVisible ? 'block' : 'none';
        this._say(this.s.captionsVisible ? 'Captions on' : 'Captions off');
      });

      // Sign language toggle
      const btnSign = sr.getElementById('btn-sign');
      btnSign.addEventListener('click', () => {
        this.s.signVisible = !this.s.signVisible;
        btnSign.setAttribute('aria-pressed', String(this.s.signVisible));
        signBox.style.display = this.s.signVisible ? 'block' : 'none';
        if (this.s.signVisible && sv.src && !v.paused) sv.play().catch(() => {});
        this._say(this.s.signVisible ? 'Sign language on' : 'Sign language off');
      });

      // Transcript toggle
      const btnTr = sr.getElementById('btn-transcript');
      btnTr.addEventListener('click', () => {
        this.s.transcriptVisible = !this.s.transcriptVisible;
        btnTr.setAttribute('aria-pressed', String(this.s.transcriptVisible));
        sr.getElementById('transcript-container').style.display = this.s.transcriptVisible ? 'block' : 'none';
      });

      // Text only mode toggle
      const btnText = sr.getElementById('btn-text-only');
      btnText.addEventListener('click', () => {
        this.s.textOnly = !this.s.textOnly;
        btnText.setAttribute('aria-pressed', String(this.s.textOnly));
        sr.getElementById('viewport').classList.toggle('text-only-active', this.s.textOnly);
        sr.getElementById('text-mode-alert').style.display = this.s.textOnly ? 'block' : 'none';
        if (this.s.textOnly && !v.paused) v.pause();
        this._say(this.s.textOnly ? 'Text only mode on' : 'Text only mode off');
      });

      // Language selection
      sr.getElementById('select-lang').addEventListener('change', (e) => {
        this.s.lang = e.target.value;
        this.setAttribute('lang', this.s.lang);
        this._updateLang();
        this._renderTranscript();
      });

      // Caption size selection
      sr.getElementById('select-size').addEventListener('change', (e) => {
        this.s.captionSize = e.target.value;
        capBox.className = `caption-overlay size-${this.s.captionSize} theme-${this.s.captionColor}`;
        this._savePrefs();
      });

      // Caption theme selection
      sr.getElementById('select-theme').addEventListener('change', (e) => {
        this.s.captionColor = e.target.value;
        capBox.className = `caption-overlay size-${this.s.captionSize} theme-${this.s.captionColor}`;
        this._savePrefs();
      });

      // Audio description mode selection
      sr.getElementById('select-ad').addEventListener('change', (e) => {
        this.s.adMode = e.target.value;
        if (this.s.adMode !== 'speech' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
        this._savePrefs();
      });

      // Sign window position buttons (Discrete for WCAG 2.2)
      const setSignPos = (pos) => {
        this.s.signPosition = pos;
        signBox.className = `sign-window size-${this.s.signSize} pos-${pos}`;
        this._savePrefs();
      };
      sr.getElementById('btn-pos-tl').addEventListener('click', () => setSignPos('top-left'));
      sr.getElementById('btn-pos-tr').addEventListener('click', () => setSignPos('top-right'));
      sr.getElementById('btn-pos-bl').addEventListener('click', () => setSignPos('bottom-left'));
      sr.getElementById('btn-pos-br').addEventListener('click', () => setSignPos('bottom-right'));

      sr.getElementById('btn-sign-larger').addEventListener('click', () => {
        if (this.s.signSize === 'small') this.s.signSize = 'medium';
        else if (this.s.signSize === 'medium') this.s.signSize = 'large';
        signBox.className = `sign-window size-${this.s.signSize} pos-${this.s.signPosition}`;
      });
      sr.getElementById('btn-sign-smaller').addEventListener('click', () => {
        if (this.s.signSize === 'large') this.s.signSize = 'medium';
        else if (this.s.signSize === 'medium') this.s.signSize = 'small';
        signBox.className = `sign-window size-${this.s.signSize} pos-${this.s.signPosition}`;
      });

      // Download Offline Button (Service Worker registration + cache)
      sr.getElementById('btn-offline').addEventListener('click', () => {
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.register('/module/sw.js').then(() => {
            this._say(this.t.offlineReady);
            // Also trigger offline-pack download from API
            const apiBase = this.getAttribute('api') || '/api/v1';
            const lessonId = this.getAttribute('lesson-id') || 'demo-accessibility';
            window.location.href = `${apiBase}/lessons/${lessonId}/offline-pack`;
          }).catch(() => {
            const apiBase = this.getAttribute('api') || '/api/v1';
            const lessonId = this.getAttribute('lesson-id') || 'demo-accessibility';
            window.location.href = `${apiBase}/lessons/${lessonId}/offline-pack`;
          });
        } else {
          this._say('Offline storage not supported in this browser.');
        }
      });

      // Export buttons
      const downloadBlob = (filename, content, type) => {
        const blob = new Blob([content], { type: type || 'text/plain;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
      };

      sr.getElementById('btn-export-txt').addEventListener('click', () => {
        const text = (this.cues[this.s.lang] || this.cues.en).map(c => `[${formatClock(c.start)}] ${c.text}`).join('\n');
        downloadBlob('lesson-transcript.txt', text);
      });

      sr.getElementById('btn-export-brf').addEventListener('click', () => {
        const text = (this.cues[this.s.lang] || this.cues.en).map(c => `[${formatClock(c.start)}] ${c.text}`).join('\n');
        const brf = toBrailleAscii(text);
        downloadBlob('lesson-transcript.brf', brf);
      });

      sr.getElementById('btn-export-vtt').addEventListener('click', () => {
        const vtt = this.rawVtt[this.s.lang] || this.rawVtt.en || 'WEBVTT\n';
        downloadBlob(`lesson-${this.s.lang}.vtt`, vtt, 'text/vtt;charset=utf-8');
      });

      // Keyboard Help Dialog Modal
      const dlg = sr.getElementById('help-dialog');
      sr.getElementById('btn-key-help').addEventListener('click', () => dlg.showModal());
      sr.getElementById('btn-close-help').addEventListener('click', () => dlg.close());

      // Keyboard Shortcuts (Space, K, arrows, C, T, F, M)
      sr.getElementById('viewport').addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
        const key = e.key;
        let handled = false;
        if (key === ' ' || key.toLowerCase() === 'k') {
          togglePlay();
          handled = true;
        } else if (key === 'ArrowLeft' || key.toLowerCase() === 'j') {
          v.currentTime = Math.max(0, v.currentTime - 5);
          handled = true;
        } else if (key === 'ArrowRight' || key.toLowerCase() === 'l') {
          v.currentTime = Math.min(v.duration || 0, v.currentTime + 5);
          handled = true;
        } else if (key.toLowerCase() === 'c') {
          sr.getElementById('btn-captions').click();
          handled = true;
        } else if (key.toLowerCase() === 't') {
          sr.getElementById('btn-text-only').click();
          handled = true;
        } else if (key.toLowerCase() === 'f') {
          sr.getElementById('btn-fullscreen').click();
          handled = true;
        } else if (key.toLowerCase() === 'm') {
          v.muted = !v.muted;
          this._say(v.muted ? 'Muted' : 'Unmuted');
          handled = true;
        }
        if (handled) e.preventDefault();
      });
    }

    _updateCaptionsAndAd(currentTime) {
      const sr = this.shadowRoot;
      const span = sr.getElementById('caption-text');
      const adBox = sr.getElementById('ad-text-box');
      const adContent = sr.getElementById('ad-text-content');
      const list = this.cues[this.s.lang] || this.cues.en || [];

      // Find active cue
      const activeCue = list.find(c => currentTime >= c.start && currentTime <= c.end);
      if (this.s.captionsVisible && activeCue) {
        span.textContent = activeCue.text;
        span.style.display = 'inline-block';
      } else {
        span.style.display = 'none';
      }

      // Audio descriptions
      const activeAd = this.adCues.find(c => currentTime >= c.start && currentTime <= c.end);
      if (this.s.adMode !== 'off' && activeAd) {
        adBox.style.display = 'block';
        adContent.textContent = activeAd.text;
        if (this.s.adMode === 'speech' && this._lastSpokenAd !== activeAd.start && 'speechSynthesis' in window) {
          this._lastSpokenAd = activeAd.start;
          window.speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(activeAd.text);
          u.lang = 'en-US';
          window.speechSynthesis.speak(u);
        }
      } else {
        adBox.style.display = 'none';
      }
    }

    _renderTranscript() {
      const ol = this.shadowRoot.getElementById('transcript-list');
      if (!ol) return;
      ol.innerHTML = '';
      const list = this.cues[this.s.lang] || this.cues.en || [];
      list.forEach((cue) => {
        const li = document.createElement('li');
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.innerHTML = `<span style="font-weight:700; min-width:3rem;">${formatClock(cue.start)}</span> <span>${cue.text}</span>`;
        btn.addEventListener('click', () => {
          if (this._video) {
            this._video.currentTime = cue.start;
            if (this._video.paused) this._video.play().catch(() => {});
          }
        });
        li.appendChild(btn);
        ol.appendChild(li);
      });
    }

    _highlightTranscript(currentTime) {
      const ol = this.shadowRoot.getElementById('transcript-list');
      if (!ol) return;
      const list = this.cues[this.s.lang] || this.cues.en || [];
      let activeIdx = -1;
      for (let i = 0; i < list.length; i++) {
        if (currentTime >= list[i].start && currentTime <= list[i].end) {
          activeIdx = i;
          break;
        }
      }
      Array.from(ol.children).forEach((li, idx) => {
        if (idx === activeIdx) {
          li.setAttribute('aria-current', 'true');
        } else {
          li.removeAttribute('aria-current');
        }
      });
    }
  }

  customElements.define('db-player', DbPlayer);
})();

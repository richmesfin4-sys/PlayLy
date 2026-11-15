/**
 * Digital Bridge — Dual-Disability Accessible Sign-In (<db-signup>)
 * Zero-dependency Shadow DOM Web Component.
 * Usage:
 *   <script src="/module/db-signup.js" defer></script>
 *   <db-signup lang="en" api="/api/v1/learners"></db-signup>
 */
(function () {
  if (customElements.get('db-signup')) return;

  const STORAGE_KEY = 'db_signup_standalone_v1';

  const TEXT = {
    en: {
      title: 'Accessible Sign-Up',
      stepOf: 'Question {step} of 3',
      nameLabel: 'Your full name',
      nameError: 'Please enter your name to continue.',
      idLabel: 'Identity route (no ID required)',
      idOptions: [
        { value: 'national_id', label: 'National ID' },
        { value: 'refugee_id', label: 'Refugee ID' },
        { value: 'partner_referral', label: 'I have no document — refer me through a partner' },
      ],
      supportLabel: 'Private support choices (never shared with employers)',
      supportOptions: [
        { value: 'captions', label: 'Captions (Amharic / English)' },
        { value: 'sign_language', label: 'Ethiopian Sign Language' },
        { value: 'screen_reader', label: 'Screen reader & Braille support' },
        { value: 'prefer_not_to_say', label: 'Prefer not to say' },
      ],
      back: 'Back',
      next: 'Continue',
      finish: 'Complete registration',
      doneMsg: 'Registration saved. Partner referral and support preferences kept private.',
    },
    am: {
      title: 'ተደራሽ ምዝገባ',
      stepOf: 'ጥያቄ {step} ከ 3',
      nameLabel: 'ሙሉ ስምዎ',
      nameError: 'ለመቀጠል እባክዎ ስምዎን ያስገቡ።',
      idLabel: 'የማንነት ማረጋገጫ መንገድ (መታወቂያ ባይኖርም ይቻላል)',
      idOptions: [
        { value: 'national_id', label: 'ብሔራዊ መታወቂያ' },
        { value: 'refugee_id', label: 'የስደተኛ መታወቂያ' },
        { value: 'partner_referral', label: 'መታወቂያ የለኝም — በአጋር ድርጅት በኩል ይምሩኝ' },
      ],
      supportLabel: 'የድጋፍ ምርጫዎች (ለቀጣሪዎች አይታይም)',
      supportOptions: [
        { value: 'braille_tactile', label: 'ብሬይል እና ንዝረት (ዓይነ ስውር + መስማት የተሳነው)' },
        { value: 'voice_plus', label: 'ድምፅ + ብሬይል (ከፊል መስማት / እጅ የማይጠቀም)' },
        { value: 'hands_free_sign', label: 'የምልክት ቋንቋ (መስማት የተሳነው + እጅ የማይጠቀም)' },
        { value: 'prefer_not_to_say', label: 'መናገር አልፈልግም' },
      ],
      back: 'ተመለስ',
      next: 'ቀጥል',
      finish: 'ምዝገባውን አጠናቅቅ',
      doneMsg: 'ምዝገባው ተቀምጧል። የድጋፍ ምርጫዎ በሚስጥር ተይዟል።',
    },
    ti: {
      title: 'ተበጻሒ ምዝገባ',
      stepOf: 'ሕቶ {step} ካብ 3',
      nameLabel: 'ምሉእ ስምኩም',
      nameError: 'ንምቕጻል በጃኹም ስምኩም ኣእትዉ።',
      idLabel: 'መንነት መረጋገጺ መንገዲ (ብዘይ መንነት ወረቐት ይከኣል)',
      idOptions: [
        { value: 'national_id', label: 'ሃገራዊ መንነት' },
        { value: 'refugee_id', label: 'መንነት ስደተኛታት' },
        { value: 'partner_referral', label: 'ወረቐት የብለይን — ብመሻርኽቲ ትካል ይምርሑኒ' },
      ],
      supportLabel: 'ናይ ሓገዝ ምርጫታት (ንኣስራሕቲ ኣይረአን)',
      supportOptions: [
        { value: 'braille_tactile', label: 'ብሬይል (ዓይነ-ስውር + ጽሙም)' },
        { value: 'voice_plus', label: 'ድምጺ + ብሬይል (ፍርቂ ጽሙም / ኢድ ዘይጥቀም)' },
        { value: 'hands_free_sign', label: 'ቋንቋ ምልክት (ጽሙም + ኢድ ዘይጥቀም)' },
        { value: 'prefer_not_to_say', label: 'ክገልጽ ኣይደልን' },
      ],
      back: 'ተመለስ',
      next: 'ቀጽል',
      finish: 'ምዝገባ ኣጠናቕቕ',
      doneMsg: 'ምዝገባ ተዓቂቡ ኣሎ። ናይ ሓገዝ ምርጫኹም ብምስጢር ተታሒዙ ኣሎ።',
    },
    om: {
      title: 'Galmee Dhaqqabamaa',
      stepOf: 'Gaaffii {step} / 3',
      nameLabel: 'Maqaa kee guutuu',
      nameError: 'Itti fufuuf maaloo maqaa kee galchi.',
      idLabel: 'Karaa mirkaneessa eenyummaa (waraqaa malees ni dandaʼama)',
      idOptions: [
        { value: 'national_id', label: 'Waraqaa Eenyummaa Biyyaalessaa' },
        { value: 'refugee_id', label: 'Waraqaa Baqataa' },
        { value: 'partner_referral', label: 'Waraqaa hin qabu — dhaabbata michuun na qajeelchaa' },
      ],
      supportLabel: 'Filannoo deeggarsaa (hojjechiiftotaaf hin mulʼatu)',
      supportOptions: [
        { value: 'braille_tactile', label: 'Braille (Jaamaa + Duudaa)' },
        { value: 'voice_plus', label: 'Sagalee + Braille (Gurra Walakkaa / Harka Malee)' },
        { value: 'hands_free_sign', label: 'Afaan Mallattoo (Duudaa + Harka Malee)' },
        { value: 'prefer_not_to_say', label: 'Dubbachuu hin barbaadu' },
      ],
      back: 'Duubatti',
      next: 'Itti fufi',
      finish: 'Galmee xumuri',
      doneMsg: 'Galmeen olkaaʼameera. Filannoon deeggarsaa dhuunfaatti qabameera.',
    },
    ar: {
      title: 'التسجيل الميسّر',
      stepOf: 'السؤال {step} من 3',
      nameLabel: 'الاسم الكامل',
      nameError: 'يرجى إدخال اسمك للمتابعة.',
      idLabel: 'مسار الهوية (يعمل بدون وثيقة)',
      idOptions: [
        { value: 'national_id', label: 'الهوية الوطنية' },
        { value: 'refugee_id', label: 'هوية لاجئ' },
        { value: 'partner_referral', label: 'ليس لدي وثيقة — إحالة عبر شريك' },
      ],
      supportLabel: 'خيارات الدعم الخاصة (لا تُشارك مع أصحاب العمل)',
      supportOptions: [
        { value: 'braille_tactile', label: 'برايل والاهتزاز (كفيف + أصم)' },
        { value: 'voice_plus', label: 'الصوت + برايل (ضعف سمع جزئي / بدون يدين)' },
        { value: 'hands_free_sign', label: 'لغة الإشارة (أصم + بدون يدين)' },
        { value: 'prefer_not_to_say', label: 'أفضل عدم التحديد' },
      ],
      back: 'رجوع',
      next: 'متابعة',
      finish: 'إكمال التسجيل',
      doneMsg: 'تم حفظ التسجيل وإبقاء خيارات الدعم سرية.',
    },
    so: {
      title: 'Diiwaangelinta La Heli Karo',
      stepOf: 'Suʼaasha {step} ee 3',
      nameLabel: 'Magacaaga oo buuxa',
      nameError: 'Fadlan geli magacaaga si aad u sii waddo.',
      idLabel: 'Habka aqoonsiga (dokumeenti laʼaan wuu shaqeeyaa)',
      idOptions: [
        { value: 'national_id', label: 'Aqoonsiga Qaranka' },
        { value: 'refugee_id', label: 'Aqoonsiga Qaxootiga' },
        { value: 'partner_referral', label: 'Dokumeenti ma haysto — igu xir hayʼad shuraako ah' },
      ],
      supportLabel: 'Doorashooyinka taageerada gaarka ah (looma sheego loo-shaqeeyaha)',
      supportOptions: [
        { value: 'braille_tactile', label: 'Braille (Indhoole + Dhegoole)' },
        { value: 'voice_plus', label: 'Cod + Braille (Maqal-dhiman / Gacmo Laʼaan)' },
        { value: 'hands_free_sign', label: 'Luuqadda Calaamadaha (Dhegoole + Gacmo Laʼaan)' },
        { value: 'prefer_not_to_say', label: 'Ma doonayo inaan sheego' },
      ],
      back: 'Dib u noqo',
      next: 'Sii wad',
      finish: 'Dhammee diiwaangelinta',
      doneMsg: 'Diiwaangelinta waa la keydiyay. Doorashada taageerada waa qarsoodi.',
    },
  };

  class DbSignup extends HTMLElement {
    static observedAttributes = ['lang', 'api'];

    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      const saved = this._load();
      this.step = saved.step || 1;
      this.formData = saved.formData || {
        name: '',
        idRoute: 'partner_referral',
        support: [],
      };
      this.completed = false;
    }

    _load() {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      } catch {
        return {};
      }
    }

    _save() {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ step: this.step, formData: this.formData })
        );
      } catch {
        // Ignore storage quota errors
      }
    }

    connectedCallback() {
      this.render();
    }

    attributeChangedCallback() {
      this.render();
    }

    render() {
      const rawLang = this.getAttribute('lang') || 'en';
      const lang = TEXT[rawLang] ? rawLang : 'en';
      const dir = lang === 'ar' ? 'rtl' : 'ltr';
      const t = TEXT[lang];

      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            font-family: var(--bs-body-font-family, "DM Sans", system-ui, sans-serif);
            color: var(--bs-body-color, #0f172a);
            border: 1px solid #cbd5e1;
            border-radius: 12px;
            background: #ffffff;
            padding: 1.25rem;
          }
          h2 { margin: 0 0 0.5rem 0; font-size: 1.25rem; }
          .progress { font-size: 0.875rem; color: #475569; margin-bottom: 1rem; }
          label { display: block; font-weight: 600; margin-bottom: 0.4rem; }
          input[type="text"], select {
            width: 100%;
            box-sizing: border-box;
            min-height: 44px;
            padding: 0.65rem 0.85rem;
            border: 1px solid #94a3b8;
            border-radius: 8px;
            font: inherit;
          }
          .check-item {
            display: flex;
            align-items: center;
            gap: 0.6rem;
            min-height: 44px;
            cursor: pointer;
          }
          .actions {
            display: flex;
            gap: 0.75rem;
            margin-top: 1.25rem;
          }
          button {
            font: inherit;
            min-height: 44px;
            padding: 0.6rem 1.1rem;
            border-radius: 8px;
            border: 1px solid #cbd5e1;
            background: #ffffff;
            font-weight: 600;
            cursor: pointer;
          }
          button.primary {
            background: var(--bs-primary, #0b2239);
            color: #ffffff;
            border-color: transparent;
          }
          .error { color: #b91c1c; font-weight: 600; margin-top: 0.4rem; }
          :focus-visible { outline: 3px solid #d97706; outline-offset: 2px; }
        </style>
        <form lang="${lang}" dir="${dir}" novalidate>
          <h2 id="step-heading" tabindex="-1">${t.title}</h2>
          <p class="progress">${t.stepOf.replace('{step}', String(this.step))}</p>
          ${
            this.completed
              ? `<p role="status" style="color:#047857;font-weight:600">${t.doneMsg}</p>`
              : this.step === 1
                ? `<label for="db-name">${t.nameLabel}</label>
                   <input id="db-name" type="text" value="${this.formData.name.replace(/"/g, '&quot;')}" aria-describedby="db-err" />
                   <p id="db-err" class="error" role="alert"></p>`
                : this.step === 2
                  ? `<label for="db-id">${t.idLabel}</label>
                     <select id="db-id">
                       ${t.idOptions
                         .map(
                           (o) =>
                             `<option value="${o.value}" ${this.formData.idRoute === o.value ? 'selected' : ''}>${o.label}</option>`
                         )
                         .join('')}
                     </select>`
                  : `<fieldset style="border:0;padding:0;margin:0">
                       <legend style="font-weight:600;margin-bottom:0.5rem">${t.supportLabel}</legend>
                       ${t.supportOptions
                         .map(
                           (o) =>
                             `<label class="check-item">
                               <input type="checkbox" value="${o.value}" ${this.formData.support.includes(o.value) ? 'checked' : ''} />
                               <span>${o.label}</span>
                             </label>`
                         )
                         .join('')}
                     </fieldset>`
          }
          ${
            this.completed
              ? ''
              : `<div class="actions">
                  ${this.step > 1 ? `<button type="button" id="btn-back">${t.back}</button>` : ''}
                  <button type="submit" class="primary">${this.step < 3 ? t.next : t.finish}</button>
                </div>`
          }
        </form>
      `;

      const form = this.shadowRoot.querySelector('form');
      const nameInput = this.shadowRoot.querySelector('#db-name');
      const idSelect = this.shadowRoot.querySelector('#db-id');
      const backBtn = this.shadowRoot.querySelector('#btn-back');

      if (nameInput) {
        nameInput.addEventListener('input', () => {
          this.formData.name = nameInput.value;
          this._save();
        });
      }
      if (idSelect) {
        idSelect.addEventListener('change', () => {
          this.formData.idRoute = idSelect.value;
          this._save();
        });
      }
      this.shadowRoot.querySelectorAll('input[type="checkbox"]').forEach((box) => {
        box.addEventListener('change', () => {
          const vals = Array.from(
            this.shadowRoot.querySelectorAll('input[type="checkbox"]:checked')
          ).map((b) => b.value);
          this.formData.support = vals;
          this._save();
        });
      });
      if (backBtn) {
        backBtn.addEventListener('click', () => {
          this.step = Math.max(1, this.step - 1);
          this._save();
          this.render();
        });
      }

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (this.step === 1) {
          if (!this.formData.name.trim()) {
            const err = this.shadowRoot.querySelector('#db-err');
            if (err) err.textContent = t.nameError;
            if (nameInput) {
              nameInput.setAttribute('aria-invalid', 'true');
              nameInput.focus();
            }
            return;
          }
          this.step = 2;
          this._save();
          this.render();
          this.shadowRoot.querySelector('#step-heading')?.focus();
          return;
        }
        if (this.step === 2) {
          this.step = 3;
          this._save();
          this.render();
          this.shadowRoot.querySelector('#step-heading')?.focus();
          return;
        }

        this.completed = true;
        this.dispatchEvent(
          new CustomEvent('db-signup:done', {
            bubbles: true,
            composed: true,
            detail: {
              profile: {
                name: this.formData.name.trim(),
                language: lang,
                idRoute: this.formData.idRoute,
              },
            },
          })
        );
        this.dispatchEvent(
          new CustomEvent('db-signup:support', {
            bubbles: true,
            composed: true,
            detail: { support: this.formData.support },
          })
        );
        this.render();
      });
    }
  }

  customElements.define('db-signup', DbSignup);
})();

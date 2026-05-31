/* Generated classic build for file:// usage. Edit source modules, then regenerate. */
(() => {
'use strict';

/* --- js/constants.js --- */
/** 復帰バナー表示までの時間（時間） */
const RETURN_HOURS_THRESHOLD = 24;

/** ヒートマップ表示日数 */
const HEATMAP_DAYS = 28;

/** Wishあたりの If-then 上限 */
const MAX_IFTHEN_RULES = 3;

/** UIアニメーション（ms） */
const ANIMATION_MS = 200;

const MICRO_WINS = [
  { id: 'open_app', labelKey: 'microOpenApp', emoji: '🌱', auto: true },
  { id: 'sit_chair', labelKey: 'microSitChair', emoji: '🪑', auto: false },
  { id: 'drink_water', labelKey: 'microDrinkWater', emoji: '💧', auto: false },
];


/* --- js/utils.js --- */
/** @param {Date} date */
function dateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function today() {
  return dateKey(new Date());
}

/** @param {string} str */
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** @param {number} pct */
function percentToHeatLevel(pct) {
  if (pct >= 100) return 4;
  if (pct >= 75) return 3;
  if (pct >= 50) return 2;
  if (pct > 0) return 1;
  return 0;
}


/* --- js/store.js --- */
/**
 * ローカルストレージ抽象層（将来 FirebaseStore に差し替え）
 */

const EMPTY_WOOP = { w: '', o: '', ob: '' };

function normalizeRule(r) {
  return {
    id: r.id,
    if: r.if ?? '',
    then: r.then ?? '',
  };
}

function normalizeWish(w) {
  return {
    id: w.id,
    title: w.title ?? '',
    woop: {
      w: w.woop?.w ?? '',
      o: w.woop?.o ?? '',
      ob: w.woop?.ob ?? '',
    },
    rules: (w.rules ?? []).map(normalizeRule),
    envDesign: w.envDesign ?? '',
  };
}

function normalizeDeletedWish(entry) {
  return {
    deletedAt: entry.deletedAt ?? new Date().toISOString(),
    wish: normalizeWish(entry.wish ?? entry),
  };
}

class LocalStore {
  get(key, fallback = null) {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    try {
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  getWishes() {
    let wishes = this.get('habit-wishes', null);
    if (wishes?.length) {
      return wishes.map(normalizeWish);
    }
    return this.migrateLegacyWishes();
  }

  setWishes(wishes) {
    this.set('habit-wishes', wishes.map(normalizeWish));
  }

  getDeletedWishes() {
    return (this.get('habit-deleted-wishes', []) || []).map(normalizeDeletedWish);
  }

  setDeletedWishes(entries) {
    this.set('habit-deleted-wishes', entries.map(normalizeDeletedWish));
  }

  /** 旧 habit-rules → 最初の Wish に統合 */
  migrateLegacyWishes() {
    const legacyRules = (this.get('habit-rules', []) || []).map(normalizeRule);
    const legacyWoop = this.get('habit-woop', EMPTY_WOOP);

    if (!legacyRules.length && !legacyWoop.w) {
      return [];
    }

    const wish = normalizeWish({
      id: Date.now(),
      title: legacyWoop.w || 'あなたのWish',
      woop: legacyWoop,
      rules: legacyRules,
      envDesign: '',
    });

    this.setWishes([wish]);
    return [wish];
  }

  /** 全 Wish の If-then をフラットに（チェック用） */
  getAllRules() {
    return this.getWishes().flatMap((w) => w.rules);
  }

  getCheckState(date = today()) {
    return this.get(`habit-check-${date}`, {});
  }

  setCheckState(state, date = today()) {
    this.set(`habit-check-${date}`, state);
  }

  getReasons(date = today()) {
    return this.get(`habit-reasons-${date}`, {});
  }

  setReasons(reasons, date = today()) {
    this.set(`habit-reasons-${date}`, reasons);
  }

  getHistory(dateKey) {
    return this.get(`habit-history-${dateKey}`, null);
  }

  setHistory(dateKey, data) {
    this.set(`habit-history-${dateKey}`, data);
  }

  getDaySettings(date = today()) {
    return this.get(`habit-day-settings-${date}`, {});
  }

  setDaySettings(settings, date = today()) {
    this.set(`habit-day-settings-${date}`, settings);
  }
  getMeta() {
    return this.get('habit-meta', {
      lastActiveAt: null,
      lastVisitAt: null,
      returnGaps: [],
      lastReturnShownAt: null,
      returnBannerDismissedAt: null,
    });
  }

  setMeta(meta) {
    this.set('habit-meta', meta);
  }

  getUiState() {
    return this.get('habit-ui', {
      expandedWishIds: [],
      openWishId: null,
      openCheck: false,
    });
  }

  setUiState(state) {
    this.set('habit-ui', state);
  }

  getSettings() {
    return this.get('habit-settings', { lang: 'ja', soundOn: true });
  }

  setSettings(settings) {
    this.set('habit-settings', settings);
  }

}

const store = new LocalStore();


/* --- js/toast.js --- */
const TOAST_DURATION_MS = 2800;

let toastEl = null;
let hideTimer = null;

function ensureToast() {
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.className = 'toast';
    toastEl.setAttribute('role', 'status');
    toastEl.setAttribute('aria-live', 'polite');
    document.body.appendChild(toastEl);
  }
  return toastEl;
}

/**
 * @param {string} message
 * @param {'default' | 'success' | 'gentle'} variant
 * @param {{ duration?: number, actionLabel?: string, onAction?: () => void }} [options]
 */
function showToast(message, variant = 'default', options = {}) {
  const el = ensureToast();
  el.innerHTML = '';
  el.className = `toast toast--${variant} is-visible`;

  const text = document.createElement('span');
  text.textContent = message;
  el.appendChild(text);

  if (options.actionLabel && options.onAction) {
    const action = document.createElement('button');
    action.type = 'button';
    action.className = 'toast-action';
    action.textContent = options.actionLabel;
    action.addEventListener('click', () => {
      clearTimeout(hideTimer);
      el.classList.remove('is-visible');
      options.onAction?.();
    });
    el.appendChild(action);
  }

  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    el.classList.remove('is-visible');
  }, options.duration ?? TOAST_DURATION_MS);
}


/* --- js/i18n.js --- */

const dict = {
  ja: {
    appName: '習慣デザインノート',
    headerTagline: '今日も、ゆるく',
    homeGreeting: '今日も、ここから',
    homeLead: '設定は必要なときだけ。Wish を見て、少し触るだけで大丈夫です。',
    todayCheck: '今日のチェックへ',
    saveAndReturn: '保存してホームへ ✓',
    savePartialHint: '途中でも保存できます 🌱',
    emptyTitle: '最初は1つだけで大丈夫 🌱',
    emptyBody:
      '「夜スマホを見たらストレッチする」みたいな小さい行動から始めよう。',
    emptyFabHint: '右下の ＋ から Wish を追加',
    returnWelcome: '今日も開いてくれてありがとうございます 🌱',
    returnProgress: 'また開いた時点で前進です。',
    todayProgress: '今日の進捗',
    progressSubEmpty: '小さな成功から始められます',
    progressSubRules: '{done} / {total} の If-then',
    progressMicroOnly: '{n}つの成功',
    checkTitle: '今日のチェック',
    checkSub: 'できたことにチェック。しんどい日は最低モードでOKです。',
    checkAchievement: '今日の達成',
    newWish: '新しい Wish',
    newWishHint: '例：「英語を話せるようになりたい」「朝スッキリ起きたい」',
    newWishPlaceholder: 'あなたの Wish を一言で',
    cancel: 'キャンセル',
    close: '閉じる',
    addWish: '追加する',
    settings: '設定',
    settingsLang: '言語',
    settingsSound: '効果音',
    settingsSoundOn: 'オン',
    settingsSoundOff: 'オフ',
    settingsData: 'データ',
    settingsDataHint: 'バックアップは今後追加予定です',
    settingsDeletedWishes: '削除済み Wish',
    settingsDeletedEmpty: '削除済みの Wish はありません',
    deletedAt: '削除日時',
    langJa: '日本語',
    langEn: 'English',
    ifthenHint: '状況と行動をセットで、何度も読み返しましょう',
    ifthenEmpty: '「もし〇〇なら、△△する」を1つ追加してみましょう',
    ifthenLimit: 'まずは3個以下がおすすめです 🌱',
    ifthenAdd: '+ ルールを追加',
    ifLabel: 'もし',
    thenLabel: 'なら',
    envDesign: '環境設計',
    envDesignHint: '行動の前に整えること（任意）',
    envPlaceholder: '例：スマホをリビングに置く',
    delete: '削除',
    deleteWish: 'Wish を削除',
    undo: '元に戻す',
    woop: 'WOOP',
    ifthen: 'If-then',
    toastWishAdded: 'Wish を追加しました 🌱',
    toastWishDeleted: 'Wish を削除しました',
    toastWishRestored: 'Wish を戻しました',
    toastWishRequired: 'Wish を一言で入力してください',
    toastRuleAdded: 'If-then を追加しました',
    toastRuleRequired: '「もし〇〇なら」と「△△する」を入力してください',
    toastNoRules: 'まず Wish を開いて If-then を1つ追加しましょう 🌱',
    toastSaved: '保存しました 🌿 {done}/{total}',
    popTodayStep: '今日の一歩',
    microOpenApp: 'アプリを開いた',
    microSitChair: '椅子に座った',
    microDrinkWater: '水を飲んだ',
    reasonPlaceholder: '明日どうする？（任意）',
    previewIf: 'もし {if}',
    previewThen: '{then}',
    usually: '通常: {text}',
  },
  en: {
    appName: 'Habit Design Note',
    headerTagline: 'Easy does it',
    homeGreeting: 'Start from here today',
    homeLead: 'Settings only when you need them. Glance at your Wish and take a small step.',
    todayCheck: "Today's Check",
    saveAndReturn: 'Save & go home ✓',
    savePartialHint: 'You can save anytime, even partway 🌱',
    emptyTitle: 'One small habit is enough 🌱',
    emptyBody:
      'Start with something tiny like stretching after using your phone at night.',
    emptyFabHint: 'Tap + to add your first Wish',
    returnWelcome: 'Thank you for opening this again today 🌱',
    returnProgress: 'Opening the app again is already progress.',
    todayProgress: "Today's progress",
    progressSubEmpty: 'Start with a small win',
    progressSubRules: '{done} / {total} if-then rules',
    progressMicroOnly: '{n} small wins',
    checkTitle: "Today's check-in",
    checkAchievement: "Today's progress",
    newWish: 'New Wish',
    newWishHint: 'e.g. "Speak English" or "Wake up refreshed"',
    newWishPlaceholder: 'Your Wish in one line',
    cancel: 'Cancel',
    close: 'Close',
    addWish: 'Add',
    settings: 'Settings',
    settingsLang: 'Language',
    settingsSound: 'Sound',
    settingsSoundOn: 'On',
    settingsSoundOff: 'Off',
    settingsData: 'Data',
    settingsDataHint: 'Backup coming soon',
    settingsDeletedWishes: 'Deleted Wishes',
    settingsDeletedEmpty: 'No deleted Wishes',
    deletedAt: 'Deleted',
    langJa: '日本語',
    langEn: 'English',
    ifthenHint: 'Pair situation and action—read it again and again',
    ifthenEmpty: 'Add one "If … then …" rule to start',
    ifthenLimit: 'We recommend starting with 3 or fewer 🌱',
    ifthenAdd: '+ Add rule',
    ifLabel: 'If',
    thenLabel: 'then',
    envDesign: 'Environment',
    envDesignHint: 'Prepare before acting (optional)',
    envPlaceholder: 'e.g. Phone in the living room',
    delete: 'Remove',
    deleteWish: 'Delete Wish',
    undo: 'Undo',
    woop: 'WOOP',
    ifthen: 'If-then',
    toastWishAdded: 'Wish added 🌱',
    toastWishDeleted: 'Wish removed',
    toastWishRestored: 'Wish restored',
    toastWishRequired: 'Enter your Wish in one line',
    toastRuleAdded: 'If-then rule added',
    toastRuleRequired: 'Fill in both "if" and "then"',
    toastNoRules: 'Open a Wish and add at least one if-then 🌱',
    toastSaved: 'Saved 🌿 {done}/{total}',
    popTodayStep: "Today's step",
    microOpenApp: 'Opened the app',
    microSitChair: 'Sat down',
    microDrinkWater: 'Drank water',
    reasonPlaceholder: 'What about tomorrow? (optional)',
    previewIf: 'If {if}',
    previewThen: '{then}',
    usually: 'Usually: {text}',
  },
};

let currentLang = store.getSettings().lang || 'ja';

function getLang() {
  return currentLang;
}

function setLang(lang) {
  if (!dict[lang]) return;
  currentLang = lang;
  const s = store.getSettings();
  store.setSettings({ ...s, lang });
  document.documentElement.lang = lang;
}

/**
 * @param {string} key
 * @param {Record<string, string | number>} [vars]
 */
function t(key, vars = {}) {
  let str = dict[currentLang]?.[key] ?? dict.ja[key] ?? key;
  Object.entries(vars).forEach(([k, v]) => {
    str = str.replace(`{${k}}`, String(v));
  });
  return str;
}

function initI18n() {
  currentLang = store.getSettings().lang || 'ja';
  document.documentElement.lang = currentLang;
}

function applyI18nToDom() {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (key) el.textContent = t(key);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (key && 'placeholder' in el) el.placeholder = t(key);
  });
  const title = document.querySelector('title');
  if (title) title.textContent = t('appName');
}


/* --- js/sounds.js --- */
let audioCtx = null;

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

/**
 * 癒し系の短いチャイム（マイクロウィン用）
 * @param {'micro' | 'return'} type
 */
function playSoftChime(type = 'micro') {
  try {
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume();

    const now = ctx.currentTime;
    const freq = type === 'return' ? 523.25 : 659.25;
    const duration = type === 'return' ? 0.18 : 0.1;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.92, now + duration);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.07, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.05);
  } catch {
    /* 音が鳴らなくても体験は続行 */
  }
}


/* --- js/wishes.js --- */
/**
 * @typedef {{ w: string, o: string, ob: string }} Woop
 * @typedef {{ id: number, if: string, then: string }} Rule
 * @typedef {{ id: number, title: string, woop: Woop, rules: Rule[], envDesign: string }} Wish
 */

let wishes = store.getWishes();
let previewTimer = null;

function reloadWishes() {
  wishes = store.getWishes();
  return wishes;
}

function getWishes() {
  return wishes;
}

function saveWishes() {
  store.setWishes(wishes);
}

function getWishById(id) {
  return wishes.find((w) => w.id === id);
}

function setOpenWishId(wishId) {
  const ui = store.getUiState();
  const expanded = new Set(ui.expandedWishIds);
  if (wishId) expanded.add(wishId);
  store.setUiState({
    ...ui,
    openWishId: wishId,
    expandedWishIds: [...expanded],
  });
}

function isAccordionExpanded(wishId) {
  const ui = store.getUiState();
  return ui.openWishId === wishId || ui.expandedWishIds.includes(wishId);
}

function toggleAccordion(wishId) {
  const ui = store.getUiState();
  const set = new Set(ui.expandedWishIds);
  let openWishId = ui.openWishId;

  if (set.has(wishId)) {
    set.delete(wishId);
    if (openWishId === wishId) openWishId = null;
  } else {
    set.add(wishId);
  }

  store.setUiState({ ...ui, expandedWishIds: [...set], openWishId });
}

function ifthenPreviewHtml(wish) {
  if (!wish.rules.length || isAccordionExpanded(wish.id)) return '';

  const rules = wish.rules.slice(0, MAX_IFTHEN_RULES);

  return `
    <div class="wish-preview" data-preview-count="${rules.length}" data-active-preview="0">
      ${rules
        .map(
          (r, index) => `
        <div class="wish-preview-rule ${index === 0 ? 'is-active' : ''}" data-preview-index="${index}">
          <p class="wish-preview-line"><span class="wish-preview-kicker">${t('ifLabel')}</span> ${escHtml(r.if)}</p>
          <p class="wish-preview-line wish-preview-then"><span class="wish-preview-kicker wish-preview-kicker--then">${t('thenLabel')}</span> ${escHtml(r.then)}</p>
        </div>`
        )
        .join('')}
    </div>`;
}

function ifthenCardsHtml(wish) {

  return wish.rules
    .map(
      (r) => `
    <div class="ifthen-reminder" data-rule-id="${r.id}">
      <div class="ifthen-reminder-line">
        <span class="ifthen-reminder-if">${t('ifLabel')}</span>
        <span class="ifthen-reminder-text">${escHtml(r.if)}</span>
      </div>
      <div class="ifthen-reminder-line then-line">
        <span class="ifthen-reminder-then">${t('thenLabel')}</span>
        <span class="ifthen-reminder-text">${escHtml(r.then)}</span>
      </div>
      <button type="button" class="btn-text-muted" onclick="deleteRule(${wish.id}, ${r.id})">${t('delete')}</button>
    </div>`
    )
    .join('');
}

function woopFieldsHtml(wish) {
  const w = wish.woop;
  return `
    <div class="accordion-block">
      <h3 class="accordion-block-title">${t('woop')}</h3>
      <label class="field-label">Wish</label>
      <input type="text" id="wish-title-${wish.id}" value="${escHtml(w.w || wish.title)}"
        placeholder="${escHtml(t('newWishPlaceholder'))}"
        onchange="saveWoopField(${wish.id}, 'w', this.value)" />
      <label class="field-label">Outcome</label>
      <textarea rows="2" onchange="saveWoopField(${wish.id}, 'o', this.value)">${escHtml(w.o)}</textarea>
      <label class="field-label">Obstacle</label>
      <textarea rows="2" onchange="saveWoopField(${wish.id}, 'ob', this.value)">${escHtml(w.ob)}</textarea>
      <label class="field-label">Plan</label>
      ${addRuleFormHtml(wish)}
    </div>`;
}

function addRuleFormHtml(wish) {
  const atLimit = wish.rules.length >= MAX_IFTHEN_RULES;
  return `
    <div class="ifthen-block">
      <div class="ifthen-block-head">
        <h3 class="accordion-block-title">${t('ifthen')}</h3>
        <span class="ifthen-count">${wish.rules.length} / ${MAX_IFTHEN_RULES}</span>
      </div>
      <p class="ifthen-hint">${t('ifthenHint')}</p>
      <div class="ifthen-reminders">${ifthenCardsHtml(wish)}</div>
      ${
        atLimit
          ? `<p class="gentle-notice">${t('ifthenLimit')}</p>`
          : `
      <div class="add-rule-form">
        <input type="text" id="new-if-${wish.id}" placeholder="${escHtml(t('ifLabel'))} …" />
        <input type="text" id="new-then-${wish.id}" placeholder="${escHtml(t('thenLabel'))} …" />
        <button type="button" class="btn btn-sm" onclick="addRule(${wish.id})">${t('ifthenAdd')}</button>
      </div>`
      }
    </div>`;
}

function renderWishAccordion(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  reloadWishes();

  if (!wishes.length) {
    container.innerHTML = `
      <div class="wish-empty-state card-glass">
        <p class="wish-empty-title">${t('emptyTitle')}</p>
        <p class="wish-empty-body">${t('emptyBody')}</p>
      </div>`;
    return;
  }

  container.innerHTML = wishes
    .map((wish) => {
      const open = isAccordionExpanded(wish.id);
      return `
      <article class="wish-card card-glass ${open ? 'is-open' : ''}" data-wish-id="${wish.id}">
        <div class="wish-card-head">
          <button type="button" class="wish-card-toggle" onclick="toggleWishAccordion(${wish.id})"
            aria-expanded="${open}">
            <span class="wish-card-chevron" aria-hidden="true">${open ? '▾' : '▸'}</span>
            <div class="wish-card-text">
              <span class="wish-card-title">${escHtml(wish.title || 'Wish')}</span>
              ${ifthenPreviewHtml(wish)}
            </div>
          </button>
          ${open ? '' : `<button type="button" class="wish-delete-btn" onclick="deleteWish(${wish.id})" aria-label="${t('deleteWish')}">🗑</button>`}
        </div>
        <div class="wish-card-body" ${open ? '' : 'hidden'}>
          ${woopFieldsHtml(wish)}
          <div class="accordion-block">
            <h3 class="accordion-block-title">${t('envDesign')}</h3>
            <p class="accordion-block-hint">${t('envDesignHint')}</p>
            <textarea class="env-design-input" rows="2" placeholder="${escHtml(t('envPlaceholder'))}"
              onchange="saveEnvDesign(${wish.id}, this.value)">${escHtml(wish.envDesign)}</textarea>
          </div>
        </div>
      </article>`;
    })
    .join('');

  initIfthenPreviewRotation();
}

function syncWishTitlesFromWoop() {
  wishes.forEach((w) => {
    if (w.woop.w?.trim()) w.title = w.woop.w.trim();
  });
  saveWishes();
}

function scrollToWish(wishId) {
  requestAnimationFrame(() => {
    const card = document.querySelector(`[data-wish-id="${wishId}"]`);
    card?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}

function focusWishInput(wishId) {
  requestAnimationFrame(() => {
    document.getElementById(`wish-title-${wishId}`)?.focus();
  });
}

function initIfthenPreviewRotation() {
  clearInterval(previewTimer);
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  previewTimer = setInterval(() => {
    const active = document.activeElement;
    if (active?.matches?.('input, textarea')) return;

    document.querySelectorAll('.wish-preview[data-preview-count]').forEach((preview) => {
      const count = Number(preview.getAttribute('data-preview-count') || 0);
      if (count < 2) return;

      const current = Number(preview.getAttribute('data-active-preview') || 0);
      const next = (current + 1) % count;
      preview.setAttribute('data-active-preview', String(next));
      preview.querySelectorAll('.wish-preview-rule').forEach((rule) => {
        rule.classList.toggle('is-active', rule.getAttribute('data-preview-index') === String(next));
      });
    });
  }, 3000);
}


/* --- js/returnUi.js --- */

const RETURN_SESSION_KEY = 'habit-show-return';

/**
 * @param {string | null} iso
 */
function hoursSinceVisit(iso) {
  if (!iso) return 0;
  return (Date.now() - new Date(iso).getTime()) / 3600000;
}

function shouldShowReturnBanner() {
  const meta = store.getMeta();
  if (meta.returnBannerDismissedAt === today()) return false;
  return sessionStorage.getItem(RETURN_SESSION_KEY) === '1';
}

function touchVisit() {
  const meta = store.getMeta();
  store.setMeta({
    ...meta,
    lastActiveAt: today(),
    lastVisitAt: new Date().toISOString(),
  });
}

function dismissReturnBanner() {
  sessionStorage.removeItem(RETURN_SESSION_KEY);
  const meta = store.getMeta();
  store.setMeta({
    ...meta,
    returnBannerDismissedAt: today(),
  });
  const banner = document.getElementById('return-banner');
  if (banner) {
    banner.classList.remove('is-visible');
    setTimeout(() => {
      banner.hidden = true;
    }, 220);
  }
}

/** 起動時：24時間以上空いていれば復帰バナー用フラグを立てる */
function initReturnFlow() {
  const meta = store.getMeta();
  const hours = hoursSinceVisit(meta.lastVisitAt);

  if ((!meta.lastVisitAt || hours >= RETURN_HOURS_THRESHOLD) && meta.returnBannerDismissedAt !== today()) {
    sessionStorage.setItem(RETURN_SESSION_KEY, '1');
  }

  touchVisit();
}

function hideReturnOverlay() {
  const overlay = document.getElementById('return-overlay');
  if (overlay) overlay.hidden = true;
}


/* --- js/settings.js --- */

function isSoundEnabled() {
  return store.getSettings().soundOn !== false;
}

function openSettings() {
  const sheet = document.getElementById('settings-sheet');
  if (!sheet) return;
  renderSettingsContent();
  sheet.hidden = false;
  requestAnimationFrame(() => sheet.classList.add('is-open'));
  document.body.classList.add('sheet-open');
}

function closeSettings() {
  const sheet = document.getElementById('settings-sheet');
  if (!sheet) return;
  sheet.classList.remove('is-open');
  setTimeout(() => {
    sheet.hidden = true;
  }, 200);
  document.body.classList.remove('sheet-open');
}

function renderSettingsContent() {
  const lang = getLang();
  const settings = store.getSettings();
  const deletedWishes = store.getDeletedWishes();
  const body = document.getElementById('settings-body');
  if (!body) return;

  body.innerHTML = `
    <section class="settings-section card-glass">
      <h3 class="settings-section-title" data-i18n="settingsLang">${t('settingsLang')}</h3>
      <div class="settings-lang-row">
        <button type="button" class="settings-lang-btn ${lang === 'ja' ? 'is-active' : ''}"
          onclick="setLanguage('ja')">${t('langJa')}</button>
        <button type="button" class="settings-lang-btn ${lang === 'en' ? 'is-active' : ''}"
          onclick="setLanguage('en')">${t('langEn')}</button>
      </div>
    </section>
    <section class="settings-section card-glass">
      <h3 class="settings-section-title" data-i18n="settingsSound">${t('settingsSound')}</h3>
      <label class="settings-sound-row">
        <input type="checkbox" ${settings.soundOn !== false ? 'checked' : ''}
          onchange="toggleSound(this.checked)" />
        <span id="settings-sound-label">${settings.soundOn !== false ? t('settingsSoundOn') : t('settingsSoundOff')}</span>
      </label>
    </section>
    <section class="settings-section card-glass settings-section--muted">
      <h3 class="settings-section-title" data-i18n="settingsData">${t('settingsData')}</h3>
      <p class="settings-hint" data-i18n="settingsDataHint">${t('settingsDataHint')}</p>
    </section>
    <section class="settings-section card-glass settings-section--muted">
      <h3 class="settings-section-title">${t('settingsDeletedWishes')}</h3>
      <div class="deleted-wish-list">
        ${
          deletedWishes.length
            ? deletedWishes
                .map(
                  (entry) => `
            <div class="deleted-wish-item">
              <span class="deleted-wish-title">${escHtml(entry.wish.title || entry.wish.woop.w || 'Wish')}</span>
              <span class="deleted-wish-date">${t('deletedAt')} ${formatDeletedAt(entry.deletedAt)}</span>
            </div>`
                )
                .join('')
            : `<p class="settings-hint">${t('settingsDeletedEmpty')}</p>`
        }
      </div>
    </section>`;
}

function formatDeletedAt(iso) {
  const locale = getLang() === 'en' ? 'en-US' : 'ja-JP';
  return new Date(iso).toLocaleString(locale, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function setLanguage(lang) {
  setLang(lang);
  applyI18nToDom();
  renderSettingsContent();
  renderHome();
  renderChecklist();
}

function toggleSound(on) {
  const s = store.getSettings();
  store.setSettings({ ...s, soundOn: !!on });
  const label = document.getElementById('settings-sound-label');
  if (label) label.textContent = on ? t('settingsSoundOn') : t('settingsSoundOff');
}


/* --- js/home.js --- */

function renderReturnBanner() {
  const el = document.getElementById('return-banner');
  if (!el) return;

  if (!shouldShowReturnBanner()) {
    el.hidden = true;
    el.classList.remove('is-visible');
    return;
  }

  el.hidden = false;
  el.classList.add('is-visible');
  el.innerHTML = `
    <div class="return-banner-inner">
      <div class="return-banner-copy">
        <p class="return-banner-welcome">${t('returnWelcome')}</p>
      </div>
      <button type="button" class="return-banner-close" onclick="dismissReturnBanner()"
        aria-label="${t('cancel')}">×</button>
    </div>`;

  setTimeout(() => {
    el.classList.remove('is-visible');
    dismissReturnBanner();
    setTimeout(() => {
      el.hidden = true;
    }, 220);
  }, 3600);
}

function renderHome() {
  applyI18nToDom();
  renderReturnBanner();
  renderWishAccordion('wish-accordion');

  const checkBtn = document.getElementById('btn-open-check');
  const rules = store.getAllRules();
  if (checkBtn) {
    checkBtn.disabled = !rules.length;
    checkBtn.classList.toggle('is-disabled', checkBtn.disabled);
    checkBtn.textContent = t('todayCheck');
  }
}


/* --- js/check.js --- */



let checkState = store.getCheckState();
let reasons = store.getReasons();

function loadCheckData() {
  checkState = store.getCheckState();
  reasons = store.getReasons();
}

function openCheckSheet() {
  const rules = store.getAllRules();
  if (!rules.length) {
    showToast(t('toastNoRules'), 'gentle');
    return;
  }

  const sheet = document.getElementById('panel-check');
  if (sheet) {
    sheet.hidden = false;
    requestAnimationFrame(() => sheet.classList.add('is-open'));
  }
  document.body.classList.add('sheet-open');
  renderChecklist();
}

function closeCheckSheet() {
  const sheet = document.getElementById('panel-check');
  if (sheet) {
    sheet.classList.remove('is-open');
    setTimeout(() => {
      sheet.hidden = true;
    }, 200);
  }
  document.body.classList.remove('sheet-open');
}

function renderChecklist() {
  loadCheckData();

  const titleEl = document.querySelector('.check-sheet-title');
  if (titleEl) titleEl.textContent = t('checkTitle');

  const subEl = document.getElementById('check-sub');
  if (subEl) subEl.textContent = t('checkSub');

  const partialEl = document.getElementById('check-partial-hint');
  if (partialEl) partialEl.textContent = t('savePartialHint');

  const saveBtn = document.getElementById('btn-save-day');
  if (saveBtn) saveBtn.textContent = t('saveAndReturn');

  const dateEl = document.getElementById('today-date');
  const d = new Date();
  const locale = document.documentElement.lang === 'en' ? 'en-US' : 'ja-JP';
  if (dateEl) {
    dateEl.textContent = d.toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
      weekday: 'short',
    });
  }

  const area = document.getElementById('checklist-area');
  const rules = store.getAllRules();
  if (!area) return;

  if (!rules.length) {
    area.innerHTML = `<div class="empty"><div class="empty-icon">🌱</div>${t('ifthenEmpty')}</div>`;
    updateProg();
    return;
  }
  area.innerHTML = rules
    .map((r) => {
      const done = !!checkState[r.id];
      const reason = reasons[r.id] || '';
      const label = r.then;
      return `
      <div class="habit-item ${done ? 'is-done' : 'is-pending'}" id="item-${r.id}">
        <div class="check-circle ${done ? 'done' : ''}" onclick="toggleCheck(${r.id})">${done ? '✓' : ''}</div>
        <div class="habit-content">
          <div class="habit-name ${done ? 'done' : ''}">
            ${escHtml(label)}
          </div>
          <div class="habit-trigger">${t('ifLabel')} ${escHtml(r.if)} · ${t('thenLabel')} ${escHtml(label)}</div>
          ${
            !done
              ? `<textarea class="habit-reason" placeholder="${escHtml(t('reasonPlaceholder'))}" onchange="saveReason(${r.id}, this.value)">${escHtml(reason)}</textarea>`
              : ''
          }
        </div>
      </div>`;
    })
    .join('');

  updateProg();
}

function updateProg() {
  const labelEl = document.querySelector('.check-prog-label');
  if (labelEl) labelEl.textContent = t('checkAchievement');

  const textEl = document.getElementById('prog-text');
  const fillEl = document.getElementById('prog-fill');
  if (!textEl || !fillEl) return;

  const rules = store.getAllRules();
  if (!rules.length) {
    textEl.textContent = '0 / 0';
    fillEl.style.width = '0%';
    return;
  }

  const done = rules.filter((r) => checkState[r.id]).length;
  const total = rules.length;
  const pct = Math.round((done / total) * 100);
  textEl.textContent = `${done} / ${total}`;
  fillEl.style.width = `${pct}%`;
}

function toggleCheck(id) {
  checkState[id] = !checkState[id];
  store.setCheckState(checkState);
  renderChecklist();
  renderHome();
}

function saveReason(id, val) {
  reasons[id] = val;
  store.setReasons(reasons);
}

function saveDay() {
  const rules = store.getAllRules();
  const done = rules.filter((r) => checkState[r.id]).length;
  const total = rules.length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  store.setHistory(today(), {
    date: today(),
    done,
    total,
    percent: pct,
    checked: checkState,
  });

  closeCheckSheet();
  if (isSoundEnabled()) playSoftChime('micro');
  showToast(t('toastSaved', { done, total }), 'success');
  renderHome();
}


/* --- js/app.js --- */

function toggleWishAccordion(wishId) {
  toggleAccordion(wishId);
  renderWishAccordion('wish-accordion');
}

function saveWoopField(wishId, field, value) {
  const wish = getWishById(wishId);
  if (!wish) return;
  wish.woop[field] = value;
  if (field === 'w') wish.title = value.trim() || wish.title;
  saveWishes();
  renderWishAccordion('wish-accordion');
  renderHome();
}

function saveEnvDesign(wishId, value) {
  const wish = getWishById(wishId);
  if (!wish) return;
  wish.envDesign = value;
  saveWishes();
}

function addRule(wishId) {
  const wish = getWishById(wishId);
  if (!wish) return;

  if (wish.rules.length >= MAX_IFTHEN_RULES) {
    showToast(t('ifthenLimit'), 'gentle');
    return;
  }

  const ifVal = document.getElementById(`new-if-${wishId}`)?.value.trim() ?? '';
  const thenVal = document.getElementById(`new-then-${wishId}`)?.value.trim() ?? '';

  if (!ifVal || !thenVal) {
    showToast(t('toastRuleRequired'), 'gentle');
    return;
  }

  wish.rules.push({
    id: Date.now(),
    if: ifVal,
    then: thenVal,
  });
  saveWishes();
  reloadWishes();

  document.getElementById(`new-if-${wishId}`).value = '';
  document.getElementById(`new-then-${wishId}`).value = '';

  renderWishAccordion('wish-accordion');
  renderHome();
  showToast(t('toastRuleAdded'), 'success');
}

function deleteRule(wishId, ruleId) {
  const wish = getWishById(wishId);
  if (!wish) return;
  wish.rules = wish.rules.filter((r) => r.id !== ruleId);
  saveWishes();
  reloadWishes();
  renderWishAccordion('wish-accordion');
  renderHome();
  renderChecklist();
}

function deleteWish(wishId) {
  reloadWishes();
  const list = getWishes();
  const index = list.findIndex((w) => w.id === wishId);
  if (index < 0) return;

  const [wish] = list.splice(index, 1);
  const deletedAt = new Date().toISOString();
  store.setWishes(list);
  store.setDeletedWishes([
    { deletedAt, wish },
    ...store.getDeletedWishes().filter((entry) => entry.wish.id !== wishId),
  ]);
  reloadWishes();
  renderHome();
  renderChecklist();

  showToast(t('toastWishDeleted'), 'gentle', {
    duration: 5000,
    actionLabel: t('undo'),
    onAction: () => restoreWish(wishId),
  });
}

function restoreWish(wishId) {
  const deleted = store.getDeletedWishes();
  const entry = deleted.find((item) => item.wish.id === wishId);
  if (!entry) return;

  reloadWishes();
  const list = getWishes();
  if (!list.some((wish) => wish.id === wishId)) {
    list.push(entry.wish);
    store.setWishes(list);
  }
  store.setDeletedWishes(deleted.filter((item) => item.wish.id !== wishId));
  reloadWishes();
  setOpenWishId(wishId);
  renderHome();
  scrollToWish(wishId);
  showToast(t('toastWishRestored'), 'success');
}

function openWishModal() {
  const modal = document.getElementById('wish-modal');
  if (!modal) return;
  modal.hidden = false;
  requestAnimationFrame(() => modal.classList.add('is-open'));
  document.getElementById('new-wish-title')?.focus();
}

function closeWishModal() {
  const modal = document.getElementById('wish-modal');
  if (!modal) return;
  modal.classList.remove('is-open');
  setTimeout(() => {
    modal.hidden = true;
  }, 200);
  const input = document.getElementById('new-wish-title');
  if (input) input.value = '';
}

function createWish() {
  const title = document.getElementById('new-wish-title')?.value.trim() ?? '';
  if (!title) {
    showToast(t('toastWishRequired'), 'gentle');
    return;
  }

  reloadWishes();
  const wish = {
    id: Date.now(),
    title,
    woop: { w: title, o: '', ob: '', p: '' },
    rules: [],
    envDesign: '',
  };

  const list = getWishes();
  list.push(wish);
  store.setWishes(list);
  reloadWishes();

  setOpenWishId(wish.id);
  closeWishModal();
  renderHome();
  requestAnimationFrame(() => {
    scrollToWish(wish.id);
    focusWishInput(wish.id);
  });
  showToast(t('toastWishAdded'), 'success');
}

function boot() {
  initI18n();
  reloadWishes();
  syncWishTitlesFromWoop();

  const wishes = getWishes();
  const ui = store.getUiState();
  if (wishes.length && !ui.expandedWishIds?.length && !ui.openWishId) {
    store.setUiState({
      ...ui,
      expandedWishIds: [wishes[0].id],
    });
  }

  initReturnFlow();
  applyI18nToDom();
  renderHome();
}

Object.assign(window, {
  toggleWishAccordion,
  saveWoopField,
  saveEnvDesign,
  addRule,
  deleteRule,
  deleteWish,
  restoreWish,
  openWishModal,
  closeWishModal,
  createWish,
  openCheckSheet,
  closeCheckSheet,
  toggleCheck,
  saveReason,
  saveDay,
  dismissReturnBanner,
  dismissReturnOverlay: hideReturnOverlay,
  openSettings,
  closeSettings,
  setLanguage,
  toggleSound,
});

boot();


})();

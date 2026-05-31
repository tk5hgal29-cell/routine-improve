import { store } from './store.js';

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

export function getLang() {
  return currentLang;
}

export function setLang(lang) {
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
export function t(key, vars = {}) {
  let str = dict[currentLang]?.[key] ?? dict.ja[key] ?? key;
  Object.entries(vars).forEach(([k, v]) => {
    str = str.replace(`{${k}}`, String(v));
  });
  return str;
}

export function initI18n() {
  currentLang = store.getSettings().lang || 'ja';
  document.documentElement.lang = currentLang;
}

export function applyI18nToDom() {
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

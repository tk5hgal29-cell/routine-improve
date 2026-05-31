/**
 * ローカルストレージ抽象層（将来 FirebaseStore に差し替え）
 */
import { today } from './utils.js';

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

export class LocalStore {
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

export const store = new LocalStore();

/**
 * ローカルストレージ抽象層（将来 FirebaseStore に差し替え）
 */
import { today } from './utils.js';

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

  getRules() {
    const rules = this.get('habit-rules', []);
    return rules.map((r) => ({
      ...r,
      minimumThen: r.minimumThen ?? '',
    }));
  }

  setRules(rules) {
    this.set('habit-rules', rules);
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

  /** @returns {{ minimumMode: boolean }} */
  getDaySettings(date = today()) {
    return this.get(`habit-day-settings-${date}`, { minimumMode: false });
  }

  setDaySettings(settings, date = today()) {
    this.set(`habit-day-settings-${date}`, settings);
  }

  /** @returns {Record<string, boolean>} */
  getMicroWins(date = today()) {
    return this.get(`habit-micro-wins-${date}`, {});
  }

  setMicroWins(wins, date = today()) {
    this.set(`habit-micro-wins-${date}`, wins);
  }

  /**
   * @returns {{
   *   lastActiveAt: string | null,
   *   returnGaps: number[],
   *   lastReturnShownAt: string | null
   * }}
   */
  getMeta() {
    return this.get('habit-meta', {
      lastActiveAt: null,
      returnGaps: [],
      lastReturnShownAt: null,
    });
  }

  setMeta(meta) {
    this.set('habit-meta', meta);
  }

  getStreak() {
    return Number(localStorage.getItem('habit-streak') || 0);
  }

  setStreak(n) {
    localStorage.setItem('habit-streak', String(n));
  }
}

export const store = new LocalStore();

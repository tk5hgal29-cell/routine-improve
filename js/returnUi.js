import { today } from './utils.js';
import { RETURN_HOURS_THRESHOLD } from './constants.js';
import { store } from './store.js';

const RETURN_SESSION_KEY = 'habit-show-return';

/**
 * @param {string | null} iso
 */
export function hoursSinceVisit(iso) {
  if (!iso) return 0;
  return (Date.now() - new Date(iso).getTime()) / 3600000;
}

export function shouldShowReturnBanner() {
  const meta = store.getMeta();
  if (meta.returnBannerDismissedAt === today()) return false;
  return sessionStorage.getItem(RETURN_SESSION_KEY) === '1';
}

export function touchVisit() {
  const meta = store.getMeta();
  store.setMeta({
    ...meta,
    lastActiveAt: today(),
    lastVisitAt: new Date().toISOString(),
  });
}

export function dismissReturnBanner() {
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
export function initReturnFlow() {
  const meta = store.getMeta();
  const hours = hoursSinceVisit(meta.lastVisitAt);

  if ((!meta.lastVisitAt || hours >= RETURN_HOURS_THRESHOLD) && meta.returnBannerDismissedAt !== today()) {
    sessionStorage.setItem(RETURN_SESSION_KEY, '1');
  }

  touchVisit();
}

export function hideReturnOverlay() {
  const overlay = document.getElementById('return-overlay');
  if (overlay) overlay.hidden = true;
}

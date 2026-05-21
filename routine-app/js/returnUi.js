import { dateKey, today } from './utils.js';
import { RETURN_GAP_THRESHOLD } from './constants.js';
import { store } from './store.js';
import { playSoftChime } from './sounds.js';

/**
 * 2つの dateKey 間の日数差（同日=0）
 * @param {string} fromKey
 * @param {string} toKey
 */
export function daysBetween(fromKey, toKey) {
  const from = new Date(`${fromKey}T12:00:00`);
  const to = new Date(`${toKey}T12:00:00`);
  const ms = to.getTime() - from.getTime();
  return Math.max(0, Math.round(ms / 86400000));
}

export function averageReturnGap(gaps) {
  if (!gaps.length) return null;
  const sum = gaps.reduce((a, b) => a + b, 0);
  return Math.round((sum / gaps.length) * 10) / 10;
}

/**
 * @returns {{
 *   shouldShow: boolean,
 *   gapDays: number,
 *   avgGap: number | null,
 *   fasterThanBefore: boolean
 * }}
 */
export function evaluateReturn() {
  const meta = store.getMeta();
  const todayKey = today();

  if (!meta.lastActiveAt || meta.lastActiveAt === todayKey) {
    return { shouldShow: false, gapDays: 0, avgGap: null, fasterThanBefore: false };
  }

  const gapDays = daysBetween(meta.lastActiveAt, todayKey);
  const avgGap = averageReturnGap(meta.returnGaps);
  const fasterThanBefore = avgGap !== null && gapDays < avgGap;

  const alreadyShown = meta.lastReturnShownAt === todayKey;
  const shouldShow = gapDays >= RETURN_GAP_THRESHOLD && !alreadyShown;

  return { shouldShow, gapDays, avgGap, fasterThanBefore };
}

export function recordReturnVisit(gapDays) {
  const meta = store.getMeta();
  const gaps = [...(meta.returnGaps || [])];
  if (gapDays > 0) gaps.push(gapDays);

  store.setMeta({
    ...meta,
    returnGaps: gaps.slice(-20),
    lastReturnShownAt: today(),
    lastActiveAt: today(),
  });
}

export function touchActiveToday() {
  const meta = store.getMeta();
  store.setMeta({ ...meta, lastActiveAt: today() });
}

export function showReturnOverlay(info) {
  const overlay = document.getElementById('return-overlay');
  if (!overlay) return;

  const gapEl = document.getElementById('return-gap-days');
  const avgEl = document.getElementById('return-avg-gap');
  const fasterEl = document.getElementById('return-faster-msg');

  if (gapEl) gapEl.textContent = String(info.gapDays);

  if (avgEl) {
    avgEl.textContent =
      info.avgGap !== null
        ? `これまでの平均復帰：約 ${info.avgGap} 日`
        : '初めての復帰を記録します';
  }

  if (fasterEl) {
    fasterEl.hidden = !info.fasterThanBefore;
    fasterEl.textContent = '前回より早く戻ってきました ✨';
  }

  overlay.hidden = false;
  overlay.classList.add('is-visible');
  playSoftChime('return');
}

export function hideReturnOverlay() {
  const overlay = document.getElementById('return-overlay');
  if (!overlay) return;
  overlay.classList.remove('is-visible');
  setTimeout(() => {
    overlay.hidden = true;
  }, 200);
}

export function initReturnFlow() {
  const info = evaluateReturn();
  touchActiveToday();

  if (info.shouldShow) {
    showReturnOverlay(info);
    recordReturnVisit(info.gapDays);
  }
}

export function dismissReturnOverlay() {
  hideReturnOverlay();
}

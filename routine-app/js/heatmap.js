import { dateKey, percentToHeatLevel } from './utils.js';
import { HEATMAP_DAYS } from './constants.js';
import { store } from './store.js';

/**
 * 過去28日分の達成ヒートマップを描画
 */
export function renderHeatmap() {
  const grid = document.getElementById('heatmap-grid');
  if (!grid) return;

  let html = '';
  for (let i = HEATMAP_DAYS - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = dateKey(d);
    const history = store.getHistory(key);
    const pct = history?.percent ?? 0;
    const level = history ? percentToHeatLevel(pct) : 0;

    html += `<div class="heat-day heat-${level}" title="${key} 達成率: ${pct}%"></div>`;
  }

  grid.innerHTML = html;
}

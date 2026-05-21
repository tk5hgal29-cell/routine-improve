import { escHtml } from './utils.js';
import { store } from './store.js';

export function isMinimumModeActive() {
  return store.getDaySettings().minimumMode;
}

export function setMinimumMode(on) {
  store.setDaySettings({ minimumMode: !!on });
}

/** 表示用の THEN テキスト */
export function displayThen(rule) {
  if (isMinimumModeActive() && rule.minimumThen?.trim()) {
    return rule.minimumThen.trim();
  }
  return rule.then;
}

export function minimumModeToggleHtml(checked) {
  return `
    <div class="minimum-mode-bar ${checked ? 'is-on' : ''}">
      <label class="minimum-toggle">
        <input type="checkbox" id="minimum-mode-toggle" ${checked ? 'checked' : ''}
          onchange="toggleMinimumMode(this.checked)" />
        <span class="minimum-toggle-track"></span>
        <span class="minimum-toggle-thumb"></span>
      </label>
      <div class="minimum-mode-copy">
        <span class="minimum-mode-title">今日は最低モードにする</span>
        <span class="minimum-mode-hint">しんどい日は、ここだけで十分です</span>
      </div>
    </div>`;
}

export function minimumBadgeHtml() {
  if (!isMinimumModeActive()) return '';
  return '<span class="minimum-badge">ゆるめ</span>';
}

export function ruleMinimumFieldHtml(value = '') {
  return `
    <div class="field-minimum">
      <div class="field-minimum-label">
        <span class="it-label then-label">MIN</span>
        <span>最低モード（しんどい日用）</span>
      </div>
      <input type="text" id="new-minimum" placeholder="例：英単語を1個見る" value="${escHtml(value)}" />
    </div>`;
}

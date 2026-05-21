import { MICRO_WINS } from './constants.js';
import { escHtml } from './utils.js';
import { store } from './store.js';
import { playSoftChime } from './sounds.js';

let popEl = null;

function ensurePopEl() {
  if (!popEl) {
    popEl = document.createElement('div');
    popEl.className = 'micro-win-pop';
    popEl.setAttribute('aria-live', 'polite');
    document.body.appendChild(popEl);
  }
  return popEl;
}

export function showMicroWinPop(label) {
  const el = ensurePopEl();
  el.textContent = `✨ ${label}`;
  el.classList.remove('is-visible');
  void el.offsetWidth;
  el.classList.add('is-visible');
  setTimeout(() => el.classList.remove('is-visible'), 900);
}

export function getMicroWinState() {
  return store.getMicroWins();
}

export function countDoneMicroWins(state) {
  return MICRO_WINS.filter((w) => state[w.id]).length;
}

/** 初回起動時に「アプリを開いた」を自動記録 */
export function autoRecordAppOpen() {
  const wins = store.getMicroWins();
  if (wins.open_app) return false;

  wins.open_app = true;
  store.setMicroWins(wins);
  showMicroWinPop('アプリを開いた');
  playSoftChime('micro');
  return true;
}

export function toggleMicroWin(id) {
  const def = MICRO_WINS.find((w) => w.id === id);
  if (!def || def.auto) return;

  const wins = store.getMicroWins();
  const next = !wins[id];
  wins[id] = next;
  store.setMicroWins(wins);

  if (next) {
    showMicroWinPop(def.label);
    playSoftChime('micro');
    if (navigator.vibrate) navigator.vibrate(10);
  }

  renderMicroWins('micro-wins-home');
  renderMicroWins('micro-wins-check');
  return next;
}

export function renderMicroWins(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const wins = store.getMicroWins();
  const done = countDoneMicroWins(wins);

  container.innerHTML = `
    <div class="micro-wins-head">
      <span class="micro-wins-title">小さな成功</span>
      <span class="micro-wins-count">${done} / ${MICRO_WINS.length}</span>
    </div>
    <div class="micro-wins-grid">
      ${MICRO_WINS.map((w) => {
        const isDone = !!wins[w.id];
        const disabled = w.auto ? 'disabled' : '';
        return `
          <button type="button"
            class="micro-win-chip ${isDone ? 'is-done' : ''}"
            data-id="${w.id}"
            ${disabled}
            onclick="toggleMicroWin('${w.id}')">
            <span class="micro-win-emoji">${w.emoji}</span>
            <span class="micro-win-label">${escHtml(w.label)}</span>
          </button>`;
      }).join('')}
    </div>`;
}

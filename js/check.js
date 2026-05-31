import { escHtml, today } from './utils.js';
import { store } from './store.js';


import { showToast } from './toast.js';
import { playSoftChime } from './sounds.js';
import { isSoundEnabled } from './settings.js';
import { renderHome } from './home.js';
import { t } from './i18n.js';

let checkState = store.getCheckState();
let reasons = store.getReasons();

function loadCheckData() {
  checkState = store.getCheckState();
  reasons = store.getReasons();
}

export function openCheckSheet() {
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

export function closeCheckSheet() {
  const sheet = document.getElementById('panel-check');
  if (sheet) {
    sheet.classList.remove('is-open');
    setTimeout(() => {
      sheet.hidden = true;
    }, 200);
  }
  document.body.classList.remove('sheet-open');
}

export function renderChecklist() {
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

export function toggleCheck(id) {
  checkState[id] = !checkState[id];
  store.setCheckState(checkState);
  renderChecklist();
  renderHome();
}

export function saveReason(id, val) {
  reasons[id] = val;
  store.setReasons(reasons);
}

export function saveDay() {
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

import { dateKey, escHtml, today } from './utils.js';
import { store } from './store.js';
import { renderHeatmap } from './heatmap.js';
import {
  displayThen,
  isMinimumModeActive,
  minimumBadgeHtml,
  minimumModeToggleHtml,
  ruleMinimumFieldHtml,
  setMinimumMode,
} from './minimumMode.js';
import {
  autoRecordAppOpen,
  countDoneMicroWins,
  getMicroWinState,
  renderMicroWins,
  toggleMicroWin,
} from './microWins.js';
import {
  dismissReturnOverlay,
  initReturnFlow,
} from './returnUi.js';

const QUOTES = [
  '1つできれば十分。',
  '完璧じゃなくていい。',
  '戻ってこれた時点で前進。',
  '今日は昨日より少しだけ。',
  '5分でも立派な継続。',
];

const WEEK_NAMES = ['月', '火', '水', '木', '金', '土', '日'];

let rules = store.getRules();
let checkState = store.getCheckState();
let reasons = store.getReasons();

function loadTodayData() {
  checkState = store.getCheckState();
  reasons = store.getReasons();
}

function renderWeekBars() {
  const week = document.getElementById('week-bars');
  if (!week) return;

  let html = '';
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = dateKey(d);
    const history = store.getHistory(key);
    const percent = history?.percent ?? 0;
    const dayIndex = d.getDay() === 0 ? 6 : d.getDay() - 1;

    html += `
      <div class="week-bar-wrap">
        <div class="week-bar ${percent > 0 ? 'active' : ''}" style="height:${Math.max(percent, 10)}%"></div>
        <div class="week-bar-label">${WEEK_NAMES[dayIndex]}</div>
      </div>`;
  }
  week.innerHTML = html;
}

function renderHabitDashboard() {
  const habitArea = document.getElementById('habit-dashboard');
  if (!habitArea) return;

  if (rules.length === 0) {
    habitArea.innerHTML =
      '<div class="empty">習慣を追加するとここに表示されます</div>';
    return;
  }

  const minOn = isMinimumModeActive();

  habitArea.innerHTML = rules
    .map(
      (r) => `
    <div class="habit-dashboard-card ${minOn ? 'is-minimum' : ''}">
      <div class="habit-dashboard-title">
        ${minimumBadgeHtml()}${escHtml(displayThen(r))}
      </div>
      <div class="mini-label">IF</div>
      <div class="mini-box">${escHtml(r.if)}</div>
      <div class="mini-label">今日の状態</div>
      <div class="mini-box">${checkState[r.id] ? '✅ できた' : '🌱 これから'}</div>
    </div>`
    )
    .join('');
}

export function renderHome() {
  loadTodayData();

  const quoteEl = document.getElementById('daily-quote');
  if (quoteEl) {
    quoteEl.textContent = QUOTES[new Date().getDate() % QUOTES.length];
  }

  const done = rules.filter((r) => checkState[r.id]).length;
  const total = rules.length;
  const habitPct = total ? Math.round((done / total) * 100) : 0;

  const microState = getMicroWinState();
  const microDone = countDoneMicroWins(microState);
  const microTotal = 3;

  const rateEl = document.getElementById('home-rate');
  const fillEl = document.getElementById('home-rate-fill');
  if (rateEl) rateEl.textContent = total ? `${habitPct}%` : `${microDone}つの成功`;
  if (fillEl) {
    const fillPct = total ? habitPct : Math.round((microDone / microTotal) * 100);
    fillEl.style.width = `${fillPct}%`;
  }

  const microEl = document.getElementById('micro-win-count');
  if (microEl) microEl.textContent = String(microDone);

  renderWeekBars();
  renderHeatmap();
  renderMicroWins('micro-wins-home');
  renderHabitDashboard();
}

export function showPanel(name) {
  document.querySelectorAll('.panel').forEach((p) => p.classList.remove('active'));
  document.querySelectorAll('.step-btn').forEach((b) => b.classList.remove('active'));
  document.getElementById(`panel-${name}`)?.classList.add('active');
  const map = { home: 0, woop: 1, ifthen: 2, check: 3 };
  document.querySelectorAll('.step-btn')[map[name]]?.classList.add('active');
  if (name === 'check') renderChecklist();
  if (name === 'home') renderHome();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function goToIfthen() {
  const ob = document.getElementById('woop-ob')?.value.trim() ?? '';
  const summary = document.getElementById('woop-summary');
  if (summary) {
    summary.textContent = ob
      ? `「${ob}」という障害に備えて、下でIf-thenルールを作りましょう。`
      : 'WOOPの障害を入力するとヒントが表示されます。';
  }
  showPanel('ifthen');
}

export function goToCheck() {
  if (rules.length === 0) {
    alert('If-thenルールを1つ以上追加してから次に進んでください。');
    return;
  }
  showPanel('check');
}

export function addRule() {
  const ifVal = document.getElementById('new-if')?.value.trim() ?? '';
  const thenVal = document.getElementById('new-then')?.value.trim() ?? '';
  const minVal = document.getElementById('new-minimum')?.value.trim() ?? '';
  if (!ifVal || !thenVal) {
    alert('IF と THEN の両方を入力してください。');
    return;
  }
  rules.push({
    id: Date.now(),
    if: ifVal,
    then: thenVal,
    minimumThen: minVal,
  });
  store.setRules(rules);
  document.getElementById('new-if').value = '';
  document.getElementById('new-then').value = '';
  const minInput = document.getElementById('new-minimum');
  if (minInput) minInput.value = '';
  renderRules();
}

export function deleteRule(id) {
  rules = rules.filter((r) => r.id !== id);
  store.setRules(rules);
  renderRules();
}

export function renderRules() {
  const container = document.getElementById('rules-list');
  if (!container) return;

  if (rules.length === 0) {
    container.innerHTML =
      '<div class="empty"><div class="empty-icon">📋</div>ルールを追加してください</div>';
    return;
  }

  container.innerHTML = rules
    .map(
      (r) => `
    <div class="ifthen-card">
      <div class="ifthen-row">
        <span class="it-label if-label">IF</span>
        <span class="it-text">${escHtml(r.if)}</span>
      </div>
      <div class="ifthen-row">
        <span class="it-label then-label">THEN</span>
        <span class="it-text">${escHtml(r.then)}</span>
      </div>
      ${
        r.minimumThen
          ? `<div class="ifthen-row minimum-preview">
        <span class="it-label min-label">MIN</span>
        <span class="it-text">${escHtml(r.minimumThen)}</span>
      </div>`
          : ''
      }
      <div class="ifthen-actions">
        <button class="btn btn-sm btn-danger" onclick="deleteRule(${r.id})">削除</button>
      </div>
    </div>`
    )
    .join('');
}

export function toggleMinimumMode(checked) {
  setMinimumMode(checked);
  renderChecklist();
  renderHome();
}

export function renderChecklist() {
  loadTodayData();

  const dateEl = document.getElementById('today-date');
  const d = new Date();
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  if (dateEl) {
    dateEl.textContent = `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${days[d.getDay()]}）`;
  }

  const minBar = document.getElementById('minimum-mode-slot');
  if (minBar) {
    minBar.innerHTML = minimumModeToggleHtml(isMinimumModeActive());
  }

  renderMicroWins('micro-wins-check');

  const area = document.getElementById('checklist-area');
  if (!area) return;

  if (rules.length === 0) {
    area.innerHTML =
      '<div class="empty"><div class="empty-icon">🌱</div>If-thenルールを追加すると<br>ここにチェックリストが表示されます</div>';
    updateProg();
    return;
  }

  const minOn = isMinimumModeActive();

  area.innerHTML = rules
    .map((r) => {
      const done = !!checkState[r.id];
      const reason = reasons[r.id] || '';
      const label = displayThen(r);
      return `
      <div class="habit-item ${minOn ? 'is-minimum' : ''}" id="item-${r.id}">
        <div class="check-circle ${done ? 'done' : ''}" onclick="toggleCheck(${r.id})">${done ? '✓' : ''}</div>
        <div class="habit-content">
          <div class="habit-name ${done ? 'done' : ''}">
            ${minimumBadgeHtml()}${escHtml(label)}
          </div>
          <div class="habit-trigger">▶ IF: ${escHtml(r.if)}</div>
          ${
            minOn && r.minimumThen
              ? `<div class="habit-minimum-note">通常: ${escHtml(r.then)}</div>`
              : ''
          }
          ${
            !done
              ? `<textarea class="habit-reason" placeholder="明日どうする？（任意）" onchange="saveReason(${r.id}, this.value)">${escHtml(reason)}</textarea>`
              : ''
          }
        </div>
      </div>`;
    })
    .join('');

  updateProg();
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

function updateProg() {
  const textEl = document.getElementById('prog-text');
  const fillEl = document.getElementById('prog-fill');
  if (!textEl || !fillEl) return;

  if (rules.length === 0) {
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

export function saveDay() {
  const done = rules.filter((r) => checkState[r.id]).length;
  const total = rules.length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const microWins = getMicroWinState();

  store.setHistory(today(), {
    date: today(),
    done,
    total,
    percent: pct,
    checked: checkState,
    microWins,
    minimumMode: isMinimumModeActive(),
  });

  let streak = store.getStreak();
  const anySuccess = done > 0 || countDoneMicroWins(microWins) > 0;
  streak = anySuccess ? streak + 1 : 0;
  store.setStreak(streak);

  const microDone = countDoneMicroWins(microWins);
  alert(
    `今日の記録を保存しました 🌿\n\n習慣: ${done}/${total}\n小さな成功: ${microDone}つ`
  );
  renderHome();
}

function boot() {
  renderRules();
  initReturnFlow();
  autoRecordAppOpen();
  renderHome();
  renderChecklist();
}

Object.assign(window, {
  showPanel,
  goToIfthen,
  goToCheck,
  addRule,
  deleteRule,
  toggleCheck,
  saveReason,
  saveDay,
  toggleMinimumMode,
  toggleMicroWin,
  dismissReturnOverlay,
});

boot();

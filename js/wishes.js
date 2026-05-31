import { MAX_IFTHEN_RULES } from './constants.js';
import { escHtml } from './utils.js';
import { store } from './store.js';
import { t } from './i18n.js';
/**
 * @typedef {{ w: string, o: string, ob: string }} Woop
 * @typedef {{ id: number, if: string, then: string }} Rule
 * @typedef {{ id: number, title: string, woop: Woop, rules: Rule[], envDesign: string }} Wish
 */

let wishes = store.getWishes();
let previewTimer = null;

export function reloadWishes() {
  wishes = store.getWishes();
  return wishes;
}

export function getWishes() {
  return wishes;
}

export function saveWishes() {
  store.setWishes(wishes);
}

export function getWishById(id) {
  return wishes.find((w) => w.id === id);
}

export function setOpenWishId(wishId) {
  const ui = store.getUiState();
  const expanded = new Set(ui.expandedWishIds);
  if (wishId) expanded.add(wishId);
  store.setUiState({
    ...ui,
    openWishId: wishId,
    expandedWishIds: [...expanded],
  });
}

export function isAccordionExpanded(wishId) {
  const ui = store.getUiState();
  return ui.openWishId === wishId || ui.expandedWishIds.includes(wishId);
}

export function toggleAccordion(wishId) {
  const ui = store.getUiState();
  const set = new Set(ui.expandedWishIds);
  let openWishId = ui.openWishId;

  if (set.has(wishId)) {
    set.delete(wishId);
    if (openWishId === wishId) openWishId = null;
  } else {
    set.add(wishId);
  }

  store.setUiState({ ...ui, expandedWishIds: [...set], openWishId });
}

function ifthenPreviewHtml(wish) {
  if (!wish.rules.length || isAccordionExpanded(wish.id)) return '';

  const rules = wish.rules.slice(0, MAX_IFTHEN_RULES);

  return `
    <div class="wish-preview" data-preview-count="${rules.length}" data-active-preview="0">
      ${rules
        .map(
          (r, index) => `
        <div class="wish-preview-rule ${index === 0 ? 'is-active' : ''}" data-preview-index="${index}">
          <p class="wish-preview-line"><span class="wish-preview-kicker">${t('ifLabel')}</span> ${escHtml(r.if)}</p>
          <p class="wish-preview-line wish-preview-then"><span class="wish-preview-kicker wish-preview-kicker--then">${t('thenLabel')}</span> ${escHtml(r.then)}</p>
        </div>`
        )
        .join('')}
    </div>`;
}

function ifthenCardsHtml(wish) {

  return wish.rules
    .map(
      (r) => `
    <div class="ifthen-reminder" data-rule-id="${r.id}">
      <div class="ifthen-reminder-line">
        <span class="ifthen-reminder-if">${t('ifLabel')}</span>
        <span class="ifthen-reminder-text">${escHtml(r.if)}</span>
      </div>
      <div class="ifthen-reminder-line then-line">
        <span class="ifthen-reminder-then">${t('thenLabel')}</span>
        <span class="ifthen-reminder-text">${escHtml(r.then)}</span>
      </div>
      <button type="button" class="btn-text-muted" onclick="deleteRule(${wish.id}, ${r.id})">${t('delete')}</button>
    </div>`
    )
    .join('');
}

function woopFieldsHtml(wish) {
  const w = wish.woop;
  return `
    <div class="accordion-block">
      <h3 class="accordion-block-title">${t('woop')}</h3>
      <label class="field-label">Wish</label>
      <input type="text" id="wish-title-${wish.id}" value="${escHtml(w.w || wish.title)}"
        placeholder="${escHtml(t('newWishPlaceholder'))}"
        onchange="saveWoopField(${wish.id}, 'w', this.value)" />
      <label class="field-label">Outcome</label>
      <textarea rows="2" onchange="saveWoopField(${wish.id}, 'o', this.value)">${escHtml(w.o)}</textarea>
      <label class="field-label">Obstacle</label>
      <textarea rows="2" onchange="saveWoopField(${wish.id}, 'ob', this.value)">${escHtml(w.ob)}</textarea>
      <label class="field-label">Plan</label>
      ${addRuleFormHtml(wish)}
    </div>`;
}

function addRuleFormHtml(wish) {
  const atLimit = wish.rules.length >= MAX_IFTHEN_RULES;
  return `
    <div class="ifthen-block">
      <div class="ifthen-block-head">
        <h3 class="accordion-block-title">${t('ifthen')}</h3>
        <span class="ifthen-count">${wish.rules.length} / ${MAX_IFTHEN_RULES}</span>
      </div>
      <p class="ifthen-hint">${t('ifthenHint')}</p>
      <div class="ifthen-reminders">${ifthenCardsHtml(wish)}</div>
      ${
        atLimit
          ? `<p class="gentle-notice">${t('ifthenLimit')}</p>`
          : `
      <div class="add-rule-form">
        <input type="text" id="new-if-${wish.id}" placeholder="${escHtml(t('ifLabel'))} …" />
        <input type="text" id="new-then-${wish.id}" placeholder="${escHtml(t('thenLabel'))} …" />
        <button type="button" class="btn btn-sm" onclick="addRule(${wish.id})">${t('ifthenAdd')}</button>
      </div>`
      }
    </div>`;
}

export function renderWishAccordion(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  reloadWishes();

  if (!wishes.length) {
    container.innerHTML = `
      <div class="wish-empty-state card-glass">
        <p class="wish-empty-title">${t('emptyTitle')}</p>
        <p class="wish-empty-body">${t('emptyBody')}</p>
      </div>`;
    return;
  }

  container.innerHTML = wishes
    .map((wish) => {
      const open = isAccordionExpanded(wish.id);
      return `
      <article class="wish-card card-glass ${open ? 'is-open' : ''}" data-wish-id="${wish.id}">
        <div class="wish-card-head">
          <button type="button" class="wish-card-toggle" onclick="toggleWishAccordion(${wish.id})"
            aria-expanded="${open}">
            <span class="wish-card-chevron" aria-hidden="true">${open ? '▾' : '▸'}</span>
            <div class="wish-card-text">
              <span class="wish-card-title">${escHtml(wish.title || 'Wish')}</span>
              ${ifthenPreviewHtml(wish)}
            </div>
          </button>
          ${open ? '' : `<button type="button" class="wish-delete-btn" onclick="deleteWish(${wish.id})" aria-label="${t('deleteWish')}">🗑</button>`}
        </div>
        <div class="wish-card-body" ${open ? '' : 'hidden'}>
          ${woopFieldsHtml(wish)}
          <div class="accordion-block">
            <h3 class="accordion-block-title">${t('envDesign')}</h3>
            <p class="accordion-block-hint">${t('envDesignHint')}</p>
            <textarea class="env-design-input" rows="2" placeholder="${escHtml(t('envPlaceholder'))}"
              onchange="saveEnvDesign(${wish.id}, this.value)">${escHtml(wish.envDesign)}</textarea>
          </div>
        </div>
      </article>`;
    })
    .join('');

  initIfthenPreviewRotation();
}

export function syncWishTitlesFromWoop() {
  wishes.forEach((w) => {
    if (w.woop.w?.trim()) w.title = w.woop.w.trim();
  });
  saveWishes();
}

export function scrollToWish(wishId) {
  requestAnimationFrame(() => {
    const card = document.querySelector(`[data-wish-id="${wishId}"]`);
    card?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}

export function focusWishInput(wishId) {
  requestAnimationFrame(() => {
    document.getElementById(`wish-title-${wishId}`)?.focus();
  });
}

export function initIfthenPreviewRotation() {
  clearInterval(previewTimer);
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  previewTimer = setInterval(() => {
    const active = document.activeElement;
    if (active?.matches?.('input, textarea')) return;

    document.querySelectorAll('.wish-preview[data-preview-count]').forEach((preview) => {
      const count = Number(preview.getAttribute('data-preview-count') || 0);
      if (count < 2) return;

      const current = Number(preview.getAttribute('data-active-preview') || 0);
      const next = (current + 1) % count;
      preview.setAttribute('data-active-preview', String(next));
      preview.querySelectorAll('.wish-preview-rule').forEach((rule) => {
        rule.classList.toggle('is-active', rule.getAttribute('data-preview-index') === String(next));
      });
    });
  }, 3000);
}

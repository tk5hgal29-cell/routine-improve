import { store } from './store.js';
import { MAX_IFTHEN_RULES } from './constants.js';
import { showToast } from './toast.js';
import { initI18n, applyI18nToDom, t } from './i18n.js';
import {
  getWishes,
  reloadWishes,
  saveWishes,
  getWishById,
  toggleAccordion,
  renderWishAccordion,
  syncWishTitlesFromWoop,
  setOpenWishId,
  scrollToWish,
  focusWishInput,
} from './wishes.js';
import { renderHome } from './home.js';
import {
  openCheckSheet,
  closeCheckSheet,
  renderChecklist,
  toggleCheck,
  saveReason,
  saveDay,
} from './check.js';
import {
  dismissReturnBanner,
  initReturnFlow,
  hideReturnOverlay,
} from './returnUi.js';
import {
  openSettings,
  closeSettings,
  setLanguage,
  toggleSound,
} from './settings.js';

export function toggleWishAccordion(wishId) {
  toggleAccordion(wishId);
  renderWishAccordion('wish-accordion');
}

export function saveWoopField(wishId, field, value) {
  const wish = getWishById(wishId);
  if (!wish) return;
  wish.woop[field] = value;
  if (field === 'w') wish.title = value.trim() || wish.title;
  saveWishes();
  renderWishAccordion('wish-accordion');
  renderHome();
}

export function saveEnvDesign(wishId, value) {
  const wish = getWishById(wishId);
  if (!wish) return;
  wish.envDesign = value;
  saveWishes();
}

export function addRule(wishId) {
  const wish = getWishById(wishId);
  if (!wish) return;

  if (wish.rules.length >= MAX_IFTHEN_RULES) {
    showToast(t('ifthenLimit'), 'gentle');
    return;
  }

  const ifVal = document.getElementById(`new-if-${wishId}`)?.value.trim() ?? '';
  const thenVal = document.getElementById(`new-then-${wishId}`)?.value.trim() ?? '';

  if (!ifVal || !thenVal) {
    showToast(t('toastRuleRequired'), 'gentle');
    return;
  }

  wish.rules.push({
    id: Date.now(),
    if: ifVal,
    then: thenVal,
  });
  saveWishes();
  reloadWishes();

  document.getElementById(`new-if-${wishId}`).value = '';
  document.getElementById(`new-then-${wishId}`).value = '';

  renderWishAccordion('wish-accordion');
  renderHome();
  showToast(t('toastRuleAdded'), 'success');
}

export function deleteRule(wishId, ruleId) {
  const wish = getWishById(wishId);
  if (!wish) return;
  wish.rules = wish.rules.filter((r) => r.id !== ruleId);
  saveWishes();
  reloadWishes();
  renderWishAccordion('wish-accordion');
  renderHome();
  renderChecklist();
}

export function deleteWish(wishId) {
  reloadWishes();
  const list = getWishes();
  const index = list.findIndex((w) => w.id === wishId);
  if (index < 0) return;

  const [wish] = list.splice(index, 1);
  const deletedAt = new Date().toISOString();
  store.setWishes(list);
  store.setDeletedWishes([
    { deletedAt, wish },
    ...store.getDeletedWishes().filter((entry) => entry.wish.id !== wishId),
  ]);
  reloadWishes();
  renderHome();
  renderChecklist();

  showToast(t('toastWishDeleted'), 'gentle', {
    duration: 5000,
    actionLabel: t('undo'),
    onAction: () => restoreWish(wishId),
  });
}

export function restoreWish(wishId) {
  const deleted = store.getDeletedWishes();
  const entry = deleted.find((item) => item.wish.id === wishId);
  if (!entry) return;

  reloadWishes();
  const list = getWishes();
  if (!list.some((wish) => wish.id === wishId)) {
    list.push(entry.wish);
    store.setWishes(list);
  }
  store.setDeletedWishes(deleted.filter((item) => item.wish.id !== wishId));
  reloadWishes();
  setOpenWishId(wishId);
  renderHome();
  scrollToWish(wishId);
  showToast(t('toastWishRestored'), 'success');
}

export function openWishModal() {
  const modal = document.getElementById('wish-modal');
  if (!modal) return;
  modal.hidden = false;
  requestAnimationFrame(() => modal.classList.add('is-open'));
  document.getElementById('new-wish-title')?.focus();
}

export function closeWishModal() {
  const modal = document.getElementById('wish-modal');
  if (!modal) return;
  modal.classList.remove('is-open');
  setTimeout(() => {
    modal.hidden = true;
  }, 200);
  const input = document.getElementById('new-wish-title');
  if (input) input.value = '';
}

export function createWish() {
  const title = document.getElementById('new-wish-title')?.value.trim() ?? '';
  if (!title) {
    showToast(t('toastWishRequired'), 'gentle');
    return;
  }

  reloadWishes();
  const wish = {
    id: Date.now(),
    title,
    woop: { w: title, o: '', ob: '', p: '' },
    rules: [],
    envDesign: '',
  };

  const list = getWishes();
  list.push(wish);
  store.setWishes(list);
  reloadWishes();

  setOpenWishId(wish.id);
  closeWishModal();
  renderHome();
  requestAnimationFrame(() => {
    scrollToWish(wish.id);
    focusWishInput(wish.id);
  });
  showToast(t('toastWishAdded'), 'success');
}

function boot() {
  initI18n();
  reloadWishes();
  syncWishTitlesFromWoop();

  const wishes = getWishes();
  const ui = store.getUiState();
  if (wishes.length && !ui.expandedWishIds?.length && !ui.openWishId) {
    store.setUiState({
      ...ui,
      expandedWishIds: [wishes[0].id],
    });
  }

  initReturnFlow();
  applyI18nToDom();
  renderHome();
}

Object.assign(window, {
  toggleWishAccordion,
  saveWoopField,
  saveEnvDesign,
  addRule,
  deleteRule,
  deleteWish,
  restoreWish,
  openWishModal,
  closeWishModal,
  createWish,
  openCheckSheet,
  closeCheckSheet,
  toggleCheck,
  saveReason,
  saveDay,
  dismissReturnBanner,
  dismissReturnOverlay: hideReturnOverlay,
  openSettings,
  closeSettings,
  setLanguage,
  toggleSound,
});

boot();

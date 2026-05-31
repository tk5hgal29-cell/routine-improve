import { today } from './utils.js';
import { store } from './store.js';
import { renderWishAccordion } from './wishes.js';
import { shouldShowReturnBanner } from './returnUi.js';
import { t, applyI18nToDom } from './i18n.js';

export function renderReturnBanner() {
  const el = document.getElementById('return-banner');
  if (!el) return;

  if (!shouldShowReturnBanner()) {
    el.hidden = true;
    el.classList.remove('is-visible');
    return;
  }

  el.hidden = false;
  el.classList.add('is-visible');
  el.innerHTML = `
    <div class="return-banner-inner">
      <div class="return-banner-copy">
        <p class="return-banner-welcome">${t('returnWelcome')}</p>
      </div>
      <button type="button" class="return-banner-close" onclick="dismissReturnBanner()"
        aria-label="${t('cancel')}">×</button>
    </div>`;

  setTimeout(() => {
    el.classList.remove('is-visible');
    dismissReturnBanner();
    setTimeout(() => {
      el.hidden = true;
    }, 220);
  }, 3600);
}

export function renderHome() {
  applyI18nToDom();
  renderReturnBanner();
  renderWishAccordion('wish-accordion');

  const checkBtn = document.getElementById('btn-open-check');
  const rules = store.getAllRules();
  if (checkBtn) {
    checkBtn.disabled = !rules.length;
    checkBtn.classList.toggle('is-disabled', checkBtn.disabled);
    checkBtn.textContent = t('todayCheck');
  }
}

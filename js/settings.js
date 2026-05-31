import { getLang, setLang, t, applyI18nToDom } from './i18n.js';
import { store } from './store.js';
import { renderHome } from './home.js';
import { renderChecklist } from './check.js';
import { escHtml } from './utils.js';

export function isSoundEnabled() {
  return store.getSettings().soundOn !== false;
}

export function openSettings() {
  const sheet = document.getElementById('settings-sheet');
  if (!sheet) return;
  renderSettingsContent();
  sheet.hidden = false;
  requestAnimationFrame(() => sheet.classList.add('is-open'));
  document.body.classList.add('sheet-open');
}

export function closeSettings() {
  const sheet = document.getElementById('settings-sheet');
  if (!sheet) return;
  sheet.classList.remove('is-open');
  setTimeout(() => {
    sheet.hidden = true;
  }, 200);
  document.body.classList.remove('sheet-open');
}

function renderSettingsContent() {
  const lang = getLang();
  const settings = store.getSettings();
  const deletedWishes = store.getDeletedWishes();
  const body = document.getElementById('settings-body');
  if (!body) return;

  body.innerHTML = `
    <section class="settings-section card-glass">
      <h3 class="settings-section-title" data-i18n="settingsLang">${t('settingsLang')}</h3>
      <div class="settings-lang-row">
        <button type="button" class="settings-lang-btn ${lang === 'ja' ? 'is-active' : ''}"
          onclick="setLanguage('ja')">${t('langJa')}</button>
        <button type="button" class="settings-lang-btn ${lang === 'en' ? 'is-active' : ''}"
          onclick="setLanguage('en')">${t('langEn')}</button>
      </div>
    </section>
    <section class="settings-section card-glass">
      <h3 class="settings-section-title" data-i18n="settingsSound">${t('settingsSound')}</h3>
      <label class="settings-sound-row">
        <input type="checkbox" ${settings.soundOn !== false ? 'checked' : ''}
          onchange="toggleSound(this.checked)" />
        <span id="settings-sound-label">${settings.soundOn !== false ? t('settingsSoundOn') : t('settingsSoundOff')}</span>
      </label>
    </section>
    <section class="settings-section card-glass settings-section--muted">
      <h3 class="settings-section-title" data-i18n="settingsData">${t('settingsData')}</h3>
      <p class="settings-hint" data-i18n="settingsDataHint">${t('settingsDataHint')}</p>
    </section>
    <section class="settings-section card-glass settings-section--muted">
      <h3 class="settings-section-title">${t('settingsDeletedWishes')}</h3>
      <div class="deleted-wish-list">
        ${
          deletedWishes.length
            ? deletedWishes
                .map(
                  (entry) => `
            <div class="deleted-wish-item">
              <span class="deleted-wish-title">${escHtml(entry.wish.title || entry.wish.woop.w || 'Wish')}</span>
              <span class="deleted-wish-date">${t('deletedAt')} ${formatDeletedAt(entry.deletedAt)}</span>
            </div>`
                )
                .join('')
            : `<p class="settings-hint">${t('settingsDeletedEmpty')}</p>`
        }
      </div>
    </section>`;
}

function formatDeletedAt(iso) {
  const locale = getLang() === 'en' ? 'en-US' : 'ja-JP';
  return new Date(iso).toLocaleString(locale, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function setLanguage(lang) {
  setLang(lang);
  applyI18nToDom();
  renderSettingsContent();
  renderHome();
  renderChecklist();
}

export function toggleSound(on) {
  const s = store.getSettings();
  store.setSettings({ ...s, soundOn: !!on });
  const label = document.getElementById('settings-sound-label');
  if (label) label.textContent = on ? t('settingsSoundOn') : t('settingsSoundOff');
}

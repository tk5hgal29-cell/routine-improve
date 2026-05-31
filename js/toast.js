const TOAST_DURATION_MS = 2800;

let toastEl = null;
let hideTimer = null;

function ensureToast() {
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.className = 'toast';
    toastEl.setAttribute('role', 'status');
    toastEl.setAttribute('aria-live', 'polite');
    document.body.appendChild(toastEl);
  }
  return toastEl;
}

/**
 * @param {string} message
 * @param {'default' | 'success' | 'gentle'} variant
 * @param {{ duration?: number, actionLabel?: string, onAction?: () => void }} [options]
 */
export function showToast(message, variant = 'default', options = {}) {
  const el = ensureToast();
  el.innerHTML = '';
  el.className = `toast toast--${variant} is-visible`;

  const text = document.createElement('span');
  text.textContent = message;
  el.appendChild(text);

  if (options.actionLabel && options.onAction) {
    const action = document.createElement('button');
    action.type = 'button';
    action.className = 'toast-action';
    action.textContent = options.actionLabel;
    action.addEventListener('click', () => {
      clearTimeout(hideTimer);
      el.classList.remove('is-visible');
      options.onAction?.();
    });
    el.appendChild(action);
  }

  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    el.classList.remove('is-visible');
  }, options.duration ?? TOAST_DURATION_MS);
}

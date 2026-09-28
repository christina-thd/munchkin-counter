import { $, escapeHtml } from './dom.js';

// In-page dialogs. Built in because some tablet browsers (and embedded web views) block
// window.prompt / window.confirm. The page needs: <div id="modal"><div class="sheet" id="sheet"></div></div>

/**
 * Opens a dialog and resolves with `{ value, checked }` when confirmed, or `null` when cancelled.
 *
 * @param {object}  options
 * @param {string}  options.title       HTML title
 * @param {string} [options.body]       HTML body
 * @param {string|null} [options.ok]    confirm button label (null: no confirm button)
 * @param {string|null} [options.cancel]
 * @param {boolean} [options.danger]    red confirm button
 * @param {{value?: string, placeholder?: string, maxLength?: number}} [options.input]
 * @param {{label: string, checked?: boolean}} [options.check]
 */
export function openDialog({ title, body = '', ok = 'OK', cancel = 'Cancel', danger = false, input = null, check = null }) {
  const modal = $('modal');
  const sheet = $('sheet');

  sheet.innerHTML = `
    <h3>${title}</h3>${body}
    ${input ? `<input type="text" id="dialogInput" maxlength="${input.maxLength ?? 30}"
                 placeholder="${escapeHtml(input.placeholder ?? '')}" value="${escapeHtml(input.value ?? '')}">` : ''}
    ${check ? `<label><input type="checkbox" id="dialogCheck" ${check.checked ? 'checked' : ''}>${check.label}</label>` : ''}
    <div class="actions">
      ${cancel ? `<button type="button" id="dialogCancel">${cancel}</button>` : ''}
      ${ok ? `<button type="button" class="confirm ${danger ? 'danger' : ''}" id="dialogOk">${ok}</button>` : ''}
    </div>`;
  modal.classList.add('open');

  return new Promise((resolve) => {
    const close = (result) => {
      modal.classList.remove('open');
      modal.onclick = null;
      resolve(result);
    };
    const confirm = () => close({
      value: input ? $('dialogInput').value : null,
      checked: check ? $('dialogCheck').checked : null,
    });

    $('dialogOk')?.addEventListener('click', confirm);
    $('dialogCancel')?.addEventListener('click', () => close(null));
    modal.onclick = (e) => { if (e.target === modal) close(null); };

    if (input) {
      const field = $('dialogInput');
      field.focus();
      field.select();
      field.addEventListener('keydown', (e) => { if (e.key === 'Enter') confirm(); });
    }
  });
}

export function closeDialog() {
  $('modal').classList.remove('open');
}

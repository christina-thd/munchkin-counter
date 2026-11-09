import { $, escapeHtml, input as field } from './dom.js';

// In-page dialogs. Built in because some tablet browsers (and embedded web views) block
// window.prompt / window.confirm. The page needs: <div id="modal"><div class="sheet" id="sheet"></div></div>

/**
 * One-of-several buttons, as radio inputs (styled by `.choice` in base.css). Shared with phone.html's join form.
 * @param {string} name
 * @param {{ value: string, label: string, title?: string, className?: string }[]} options
 *        label is HTML; title names an icon-only option for screen readers and as a tooltip
 * @param {{ selected?: string, className?: string }} [settings]   selected: the first option if not given
 */
export function choiceHtml(name, options, { selected = options[0]?.value, className = '' } = {}) {
  return `<div class="choice ${className}" role="radiogroup">${options.map((o) => `
    <label class="${o.className ?? ''}" ${o.title ? `title="${escapeHtml(o.title)}"` : ''}><input type="radio"
      name="${name}" value="${escapeHtml(o.value)}" ${o.title ? `aria-label="${escapeHtml(o.title)}"` : ''}
      ${o.value === selected ? 'checked' : ''}>${o.label}</label>`).join('')}</div>`;
}

let closeOpen = null;

/** Closes the open dialog as if cancelled (e.g. the win popup once the win was undone elsewhere). */
export function closeDialog() {
  closeOpen?.(null);
}

/**
 * Opens a dialog and resolves with `{ value, checked, choice, button }` when confirmed, or `null` when cancelled.
 *
 * @param {object}  options
 * @param {string}  options.title       HTML title
 * @param {string} [options.body]       HTML body
 * @param {string|null} [options.ok]    confirm button label (null: no confirm button)
 * @param {string|null} [options.cancel]
 * @param {boolean} [options.danger]    red confirm button
 * @param {{value?: string, placeholder?: string, maxLength?: number, suggest?: (current: string) => string}} [options.input]
 *        suggest: a 🎲 beside the field fills it with another suggestion
 * @param {{label: string, checked?: boolean}} [options.check]
 * @param {{ options: { value: string, label: string, className?: string }[], value?: string }} [options.choice]
 * @param {boolean} [options.wide]      room for a chart (the game report)
 * @param {{ value: string, label: string, primary?: boolean }[]} [options.buttons]   more buttons, before
 *        cancel / confirm; the one tapped comes back as `button`
 * @param {string} [options.className]  on the sheet, for dialogs with their own look (the win popup)
 * @param {boolean} [options.closeX]    a ✕ in the top-right corner that cancels (instead of a cancel button)
 */
export function openDialog({
  title, body = '', ok = 'OK', cancel = 'Cancel', danger = false, input = null, check = null, choice = null, wide = false,
  buttons = [], className = '', closeX = false,
}) {
  const modal = $('modal');
  const sheet = $('sheet');
  closeOpen?.(null);            // a dialog opened over another one replaces it
  sheet.className = ['sheet', wide && 'wide', className].filter(Boolean).join(' ');

  sheet.innerHTML = `
    ${closeX ? '<button type="button" class="sheet-close" id="dialogClose" aria-label="Close" title="Close">✕</button>' : ''}
    ${title ? `<h3>${title}</h3>` : ''}${body}
    ${input ? `<div class="input-row"><input type="text" id="dialogInput" maxlength="${input.maxLength ?? 30}"
                 placeholder="${escapeHtml(input.placeholder ?? '')}" value="${escapeHtml(input.value ?? '')}">
                 ${input.suggest ? '<button type="button" class="suggest" id="dialogSuggest" title="Another name" aria-label="Another name">🎲</button>' : ''}</div>` : ''}
    ${choice ? choiceHtml('dialogChoice', choice.options, { selected: choice.value }) : ''}
    ${check ? `<label><input type="checkbox" id="dialogCheck" ${check.checked ? 'checked' : ''}>${check.label}</label>` : ''}
    <div class="actions">
      ${buttons.map((b) => `<button type="button" class="${b.primary ? 'confirm' : ''}" data-button="${escapeHtml(b.value)}">${b.label}</button>`).join('')}
      ${cancel ? `<button type="button" id="dialogCancel">${cancel}</button>` : ''}
      ${ok ? `<button type="button" class="confirm ${danger ? 'danger' : ''}" id="dialogOk">${ok}</button>` : ''}
    </div>`;
  modal.classList.add('open');

  return new Promise((resolve) => {
    const close = (result) => {
      closeOpen = null;
      modal.classList.remove('open');
      modal.onclick = null;
      resolve(result);
    };
    closeOpen = close;
    const confirm = (button = null) => close({
      value: input ? field('dialogInput').value : null,
      checked: check ? field('dialogCheck').checked : null,
      choice: choice ? /** @type {HTMLInputElement} */ (sheet.querySelector('input[name="dialogChoice"]:checked'))?.value ?? null : null,
      button,
    });

    $('dialogOk')?.addEventListener('click', () => confirm());
    for (const b of sheet.querySelectorAll('[data-button]')) {
      b.addEventListener('click', () => confirm(/** @type {HTMLElement} */ (b).dataset.button));
    }
    $('dialogCancel')?.addEventListener('click', () => close(null));
    $('dialogClose')?.addEventListener('click', () => close(null));
    modal.onclick = (e) => { if (e.target === modal) close(null); };

    if (input) {
      const text = field('dialogInput');
      text.focus();
      text.select();
      text.addEventListener('keydown', (e) => { if (e.key === 'Enter') confirm(); });
      $('dialogSuggest')?.addEventListener('click', () => {
        text.value = input.suggest(text.value);
        text.focus();
        text.select();
      });
    }
  });
}

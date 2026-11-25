'use strict';
// Show / hide toggle (eye) for every password input, including inputs created later (dialogs, admin panels).
// Display only: it changes input.type between "password" and "text". It never reads, stores, sends or logs the value,
// and does not touch any login rule, password rule or permission logic.
(() => {
  if (window.HRPasswordEyeInstalled) return;
  window.HRPasswordEyeInstalled = true;

  const WRAP = 'pw-eye-wrap', INPUT = 'pw-eye-input', BTN = 'pw-eye-btn', DONE = 'data-pw-eye';
  const LABEL_SHOW = '顯示密碼', LABEL_HIDE = '隱藏密碼';
  const ICON_SHOW = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12z"/><circle cx="12" cy="12" r="3.2"/></svg>';
  const ICON_HIDE = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M3 3l18 18"/><path d="M10.6 5.1A10.9 10.9 0 0 1 12 5c6.5 0 10.5 7 10.5 7a17.6 17.6 0 0 1-3.2 4"/><path d="M6.6 6.7C3.6 8.5 1.5 12 1.5 12S5.5 19 12 19c1.6 0 3-.4 4.3-1"/><path d="M9.9 9.9a3.2 3.2 0 0 0 4.2 4.2"/></svg>';

  // !important is deliberate: the site styles buttons inside cards (for example full-width with a top margin).
  const STYLE = '.' + WRAP + '{position:relative!important;display:block!important;width:100%!important}' +
    'input.' + INPUT + '{padding-inline-end:52px!important}' +
    'button.' + BTN + '{all:unset!important;box-sizing:border-box!important;position:absolute!important;top:50%!important;right:4px!important;inset-inline-end:4px!important;transform:translateY(-50%)!important;' +
    'width:44px!important;height:44px!important;min-height:0!important;margin:0!important;padding:0!important;display:flex!important;align-items:center!important;justify-content:center!important;' +
    'color:#526D78!important;background:transparent!important;border-radius:8px!important;cursor:pointer!important;-webkit-tap-highlight-color:transparent!important;touch-action:manipulation!important}' +
    'button.' + BTN + ':hover{color:#2f4a55!important;background:#eef3f5!important}' +
    'button.' + BTN + ':focus-visible{outline:3px solid #8dd1c7!important;outline-offset:0!important}' +
    'button.' + BTN + '[aria-pressed="true"]{color:#1f5f4f!important}';

  function addStyle() {
    if (document.getElementById('pw-eye-style')) return;
    const style = document.createElement('style');
    style.id = 'pw-eye-style';
    style.textContent = STYLE;
    (document.head || document.documentElement).appendChild(style);
  }

  function setShown(input, button, shown) {
    if (shown) {
      input.type = 'text';
      // keep phones and browsers from capitalising, correcting or learning the visible password
      input.setAttribute('autocapitalize', 'off');
      input.setAttribute('autocorrect', 'off');
      input.setAttribute('spellcheck', 'false');
    } else {
      input.type = 'password';
    }
    button.setAttribute('aria-pressed', shown ? 'true' : 'false');
    button.setAttribute('aria-label', shown ? LABEL_HIDE : LABEL_SHOW);
    button.title = shown ? LABEL_HIDE : LABEL_SHOW;
    button.innerHTML = shown ? ICON_HIDE : ICON_SHOW;
  }

  const enhanced = new Set();

  function enhance(input) {
    if (!input || input.getAttribute(DONE) || input.hasAttribute('data-no-eye') || !input.parentNode) return;
    input.setAttribute(DONE, '1');
    const wrap = document.createElement('span');
    wrap.className = WRAP;
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);
    input.classList.add(INPUT);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = BTN;
    setShown(input, button, false);
    // mousedown is cancelled so a click on the eye does not take focus (and the caret) away from the password box
    button.addEventListener('mousedown', (e) => e.preventDefault());
    button.addEventListener('click', () => { const shown = input.type !== 'text'; setShown(input, button, shown); });
    wrap.appendChild(button);
    const form = input.form;
    if (form && !form.getAttribute('data-pw-eye-form')) {
      form.setAttribute('data-pw-eye-form', '1');
      form.addEventListener('submit', hideAll, true);
    }
    enhanced.add({ input, button });
  }

  // Hide again whenever the password could be left on screen unattended.
  function hideAll() {
    for (const item of enhanced) {
      if (!item.input.isConnected) { enhanced.delete(item); continue; }
      if (item.input.type === 'text') setShown(item.input, item.button, false);
    }
  }

  function scan(root) {
    if (!root || root.nodeType !== 1) return;
    if (root.matches && root.matches('input[type="password"]')) enhance(root);
    if (root.querySelectorAll) for (const input of root.querySelectorAll('input[type="password"]')) enhance(input);
  }

  function start() {
    addStyle();
    scan(document.documentElement);
    new MutationObserver((records) => { for (const r of records) for (const n of r.addedNodes) scan(n); })
      .observe(document.documentElement, { childList: true, subtree: true });
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') hideAll(); });
    window.addEventListener('pagehide', hideAll);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();

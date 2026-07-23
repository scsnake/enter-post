/*
 * enter-post content script.
 *
 * Runs on every supported platform (see platforms.js). Intercepts Enter /
 * Shift+Enter / Ctrl+Enter keydown events in the composer, remaps them to
 * the user's chosen global convention, and shows an on-page hint bubble
 * that always reflects the current effective mapping.
 */
(function () {
  const EP = self.ENTER_POST;
  if (!EP || !EP.findPlatform) return;
  const platform = EP.findPlatform(location.hostname);
  if (!platform) return;

  const IS_MAC = /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);
  const DEFAULTS = {
    globalMode: 'ctrl-enter-send',
    siteEnabled: {},
    showHint: true,
  };

  const state = {
    mode: DEFAULTS.globalMode,
    enabled: true,
    showHint: true,
    lastError: null,
  };

  // ---- Settings load + live update -----------------------------------------

  chrome.storage.sync.get(null, (data) => {
    applySettings(data || {});
    installKeyListener();
    installFocusWatcher();
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync') return;
    const patch = {};
    for (const k of Object.keys(changes)) patch[k] = changes[k].newValue;
    applySettings({ ...currentSettings(), ...patch });
    if (!state.showHint) {
      hideHint();
    } else if (currentComposer && document.activeElement && findComposer(document.activeElement)) {
      // Composer still focused; refresh content + reposition.
      updateHintContent();
      showHint(4000);
    }
  });

  function currentSettings() {
    return {
      globalMode: state.mode,
      siteEnabled: { [platform.id]: state.enabled },
      showHint: state.showHint,
    };
  }

  function applySettings(data) {
    state.mode = data.globalMode === 'enter-send' ? 'enter-send' : 'ctrl-enter-send';
    state.showHint = data.showHint !== false;
    const siteEnabled = data.siteEnabled || {};
    state.enabled = siteEnabled[platform.id] !== false;
  }

  // ---- Key handling --------------------------------------------------------

  function isSendCombo(e) {
    if (e.key !== 'Enter') return false;
    if (e.altKey) return false;
    const ctrlish = IS_MAC ? e.metaKey : e.ctrlKey;
    if (state.mode === 'ctrl-enter-send') {
      return ctrlish && !e.shiftKey;
    }
    // enter-send: plain Enter, OR Ctrl/Cmd+Enter (permissive)
    return !e.shiftKey;
  }

  function isNewlineCombo(e) {
    if (e.key !== 'Enter') return false;
    if (e.altKey) return false;
    const ctrlish = IS_MAC ? e.metaKey : e.ctrlKey;
    if (state.mode === 'ctrl-enter-send') {
      // Plain Enter = newline; Shift+Enter = newline (permissive).
      return !ctrlish;
    }
    // enter-send: Shift+Enter is newline.
    return e.shiftKey && !ctrlish;
  }

  function nativeWouldSend(e) {
    if (e.key !== 'Enter' || e.altKey) return false;
    const ctrlish = IS_MAC ? e.metaKey : e.ctrlKey;
    if (platform.nativeSend === 'Ctrl+Enter') return ctrlish && !e.shiftKey;
    // nativeSend === 'Enter'
    return !e.shiftKey && !ctrlish;
  }

  function findComposer(target) {
    if (!target || target.nodeType !== 1) return null;
    if (target.matches && target.matches(platform.composerSelector)) return target;
    if (target.closest) {
      try { return target.closest(platform.composerSelector); }
      catch (_) { return null; }
    }
    return null;
  }

  function onKeydown(e) {
    if (!state.enabled) return;
    if (e.key !== 'Enter') return;
    if (e.isComposing || e.keyCode === 229) return; // CJK IME
    const composer = findComposer(e.target);
    if (!composer) return;

    const wantsSend = isSendCombo(e);
    const wantsNewline = isNewlineCombo(e);
    if (!wantsSend && !wantsNewline) return;

    if (wantsNewline) {
      // Always intercept newline intents. Different composers on the same
      // platform can have different native behaviors (e.g. Threads' reply
      // input under a post sends on plain Enter, while the top-level
      // composer inserts a newline). Intercepting unconditionally is the
      // only safe way to prevent accidental sends across every composer
      // variant a site may ship.
      e.preventDefault();
      e.stopImmediatePropagation();
      insertNewline(composer);
    } else {
      // Send intent. If the site's native combo matches, let its own send
      // flow run — it handles validation / attachments / etc. better than
      // our synthesized click or keypress can. Otherwise intercept.
      if (nativeWouldSend(e)) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      state.lastError = null;
      try {
        triggerSend(composer);
      } catch (err) {
        state.lastError = (err && err.message) || String(err);
      }
    }
    // Re-show hint briefly on any Enter combo we handled so the user
    // sees feedback about what the extension just did.
    if (state.showHint) {
      currentComposer = composer;
      ensureHintReady();
      updateHintContent();
      showHint(2500);
    }
  }

  function installKeyListener() {
    // Capture phase so we run before the site's own handlers.
    document.addEventListener('keydown', onKeydown, true);
  }

  // ---- Newline insertion ---------------------------------------------------

  function insertNewline(el) {
    if (platform.insertNewline === 'textarea' || el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
      insertNewlineTextarea(el);
    } else {
      insertNewlineContenteditable(el);
    }
  }

  function insertNewlineTextarea(el) {
    try {
      el.focus();
      if (document.execCommand && document.execCommand('insertText', false, '\n')) return;
    } catch (_) { /* fall through */ }
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const before = el.value.slice(0, start);
    const after = el.value.slice(end);
    el.value = before + '\n' + after;
    el.selectionStart = el.selectionEnd = start + 1;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function insertNewlineContenteditable(el) {
    el.focus();
    // Editors built on Slate/Lexical/ProseMirror listen to beforeinput.
    const evt = new InputEvent('beforeinput', {
      bubbles: true,
      cancelable: true,
      inputType: 'insertLineBreak',
      data: null,
    });
    const handled = !el.dispatchEvent(evt); // true means default was prevented by editor
    if (handled) return;
    try {
      if (document.execCommand && document.execCommand('insertLineBreak')) return;
    } catch (_) { /* fall through */ }
    try {
      if (document.execCommand && document.execCommand('insertText', false, '\n')) return;
    } catch (_) { /* fall through */ }
    // Last-resort DOM insertion.
    const sel = window.getSelection();
    if (sel && sel.rangeCount) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      const br = document.createElement('br');
      range.insertNode(br);
      range.setStartAfter(br);
      range.setEndAfter(br);
      sel.removeAllRanges();
      sel.addRange(range);
    }
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }

  // ---- Send dispatch -------------------------------------------------------

  function isVisible(el) {
    if (!el || !el.isConnected) return false;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return false;
    const cs = getComputedStyle(el);
    return cs.visibility !== 'hidden' && cs.display !== 'none';
  }

  function resolveSendButton(composer) {
    if (!platform.sendButtonSelector) return null;
    // Search from the composer's nearest form-ish ancestor downwards.
    const candidates = [
      composer.closest('form'),
      composer.closest('[role="dialog"]'),
      composer.closest('article'),
      composer.parentElement,
      document,
    ];
    for (const root of candidates) {
      if (!root || !root.querySelector) continue;
      let btn = null;
      try { btn = root.querySelector(platform.sendButtonSelector); }
      catch (_) { continue; }
      if (btn && isVisible(btn) && !btn.disabled) return btn;
    }
    return null;
  }

  function triggerSend(composer) {
    const btn = resolveSendButton(composer);
    if (btn) {
      btn.click();
      return;
    }
    // Fallback: synthesize the site's native send combo on the composer.
    const useCtrl = platform.nativeSend === 'Ctrl+Enter';
    const init = {
      key: 'Enter',
      code: 'Enter',
      keyCode: 13,
      which: 13,
      bubbles: true,
      cancelable: true,
      ctrlKey: useCtrl && !IS_MAC,
      metaKey: useCtrl && IS_MAC,
    };
    composer.focus();
    composer.dispatchEvent(new KeyboardEvent('keydown', init));
    composer.dispatchEvent(new KeyboardEvent('keypress', init));
    composer.dispatchEvent(new KeyboardEvent('keyup', init));
  }

  // ---- Hint bubble ---------------------------------------------------------
  //
  // Only appears while a composer element has focus. Anchors itself to the
  // send button (preferred) or to the composer, and re-positions on every
  // animation frame while visible so it tracks scrolling and layout changes.

  let hintEl = null;
  let hintHideTimer = null;
  let positionRAF = null;
  let currentComposer = null;
  let currentAnchor = null;
  let currentPlacement = 'above';

  const KEY_LABELS = (() => {
    const cmd = IS_MAC ? '⌘' : 'Ctrl';
    return { Enter: 'Enter', Shift: 'Shift', Ctrl: cmd };
  })();

  const t = (key) => (chrome.i18n && chrome.i18n.getMessage(key)) || key;

  function combosForMode(mode) {
    if (mode === 'enter-send') {
      return { send: ['Enter'], newline: ['Shift', 'Enter'] };
    }
    return { send: ['Ctrl', 'Enter'], newline: ['Enter'] };
  }

  function nativeCombos() {
    if (platform.nativeSend === 'Ctrl+Enter') {
      return { send: ['Ctrl', 'Enter'], newline: ['Enter'] };
    }
    return { send: ['Enter'], newline: ['Shift', 'Enter'] };
  }

  function combosEqual(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  }

  function ensureHintStylesheet() {
    const id = 'enterpost-hint-css';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = chrome.runtime.getURL('hint.css');
    (document.head || document.documentElement).appendChild(link);
  }

  function ensureHintReady() {
    if (window.top !== window.self) return false; // hint only in top frame
    ensureHintStylesheet();
    if (!hintEl) buildHint();
    return true;
  }

  function installFocusWatcher() {
    if (window.top !== window.self) return;
    document.addEventListener('focusin', onFocusIn, true);
    document.addEventListener('focusout', onFocusOut, true);
  }

  function buildHint() {
    hintEl = document.createElement('div');
    hintEl.className = 'enterpost-hint';
    hintEl.setAttribute('role', 'status');
    hintEl.innerHTML = `
      <div class="enterpost-hint__head">
        <span class="enterpost-hint__brand">enter-post</span>
        <span class="enterpost-hint__sep">·</span>
        <span class="enterpost-hint__platform"></span>
        <button class="enterpost-hint__close" type="button">×</button>
      </div>
      <div class="enterpost-hint__row">
        <span class="enterpost-hint__label" data-slot="label-send"></span>
        <span class="enterpost-hint__combo" data-slot="send"></span>
      </div>
      <div class="enterpost-hint__row">
        <span class="enterpost-hint__label" data-slot="label-newline"></span>
        <span class="enterpost-hint__combo" data-slot="newline"></span>
      </div>
      <div class="enterpost-hint__note" data-slot="note"></div>
    `;
    (document.body || document.documentElement).appendChild(hintEl);
    hintEl.querySelector('[data-slot="label-send"]').textContent = t('hintLabelSend');
    hintEl.querySelector('[data-slot="label-newline"]').textContent = t('hintLabelNewline');
    const closeBtn = hintEl.querySelector('.enterpost-hint__close');
    closeBtn.setAttribute('aria-label', t('hintDismiss'));
    closeBtn.addEventListener('click', hideHint);
    hintEl.addEventListener('mouseenter', clearHintTimer);
    hintEl.addEventListener('mouseleave', () => scheduleHintHide(1500));
  }

  function renderCombo(slotEl, keys, changed) {
    slotEl.innerHTML = '';
    keys.forEach((k, i) => {
      if (i > 0) {
        const plus = document.createElement('span');
        plus.className = 'enterpost-hint__plus';
        plus.textContent = '+';
        slotEl.appendChild(plus);
      }
      const kbd = document.createElement('kbd');
      kbd.className = 'enterpost-hint__kbd' + (changed ? ' enterpost-hint__kbd--changed' : '');
      kbd.textContent = KEY_LABELS[k] || k;
      slotEl.appendChild(kbd);
    });
  }

  function updateHintContent() {
    if (!hintEl) return;
    const effective = state.enabled ? combosForMode(state.mode) : nativeCombos();
    const native = nativeCombos();
    const sendChanged = state.enabled && !combosEqual(effective.send, native.send);
    const newlineChanged = state.enabled && !combosEqual(effective.newline, native.newline);
    hintEl.querySelector('.enterpost-hint__platform').textContent = platform.label;
    renderCombo(hintEl.querySelector('[data-slot="send"]'), effective.send, sendChanged);
    renderCombo(hintEl.querySelector('[data-slot="newline"]'), effective.newline, newlineChanged);
    const note = hintEl.querySelector('[data-slot="note"]');
    if (!state.enabled) {
      note.textContent = t('hintNoteDisabled');
      note.className = 'enterpost-hint__note enterpost-hint__note--muted';
    } else if (state.lastError) {
      note.textContent = t('hintNoteError');
      note.className = 'enterpost-hint__note enterpost-hint__note--warn';
    } else if (!sendChanged && !newlineChanged) {
      note.textContent = t('hintNoteNative');
      note.className = 'enterpost-hint__note enterpost-hint__note--muted';
    } else {
      note.textContent = '';
      note.className = 'enterpost-hint__note';
    }
  }

  function refreshAnchor() {
    if (!currentComposer || !currentComposer.isConnected) {
      currentAnchor = null;
      return;
    }
    const btn = resolveSendButton(currentComposer);
    currentAnchor = (btn && isVisible(btn)) ? btn : currentComposer;
  }

  function positionHintNear(anchor) {
    if (!hintEl || !anchor) return;
    const ar = anchor.getBoundingClientRect();
    // If the anchor is completely offscreen, hide the hint until it returns.
    if (ar.bottom < 0 || ar.top > window.innerHeight || ar.right < 0 || ar.left > window.innerWidth) {
      hintEl.classList.add('enterpost-hint--offscreen');
      return;
    }
    hintEl.classList.remove('enterpost-hint--offscreen');
    // Measure hint by temporarily making sure it has layout.
    const hr = hintEl.getBoundingClientRect();
    const margin = 8;
    const vpW = window.innerWidth;
    const vpH = window.innerHeight;

    // Prefer above the anchor; fall back to below.
    let top = ar.top - hr.height - margin;
    let placement = 'above';
    if (top < margin) {
      const belowTop = ar.bottom + margin;
      if (belowTop + hr.height <= vpH - margin) {
        top = belowTop;
        placement = 'below';
      } else {
        // Neither fits fully; clamp to whichever gives more room.
        top = Math.max(margin, Math.min(top, vpH - hr.height - margin));
      }
    }

    // Right-align with anchor, clamp inside viewport.
    let left = ar.right - hr.width;
    if (left < margin) left = ar.left; // shift under-left edge if right-align pushes offscreen
    if (left + hr.width > vpW - margin) left = vpW - hr.width - margin;
    if (left < margin) left = margin;

    hintEl.style.top = `${Math.round(top)}px`;
    hintEl.style.left = `${Math.round(left)}px`;
    hintEl.style.right = 'auto';
    hintEl.style.bottom = 'auto';

    if (placement !== currentPlacement) {
      hintEl.classList.toggle('enterpost-hint--above', placement === 'above');
      hintEl.classList.toggle('enterpost-hint--below', placement === 'below');
      currentPlacement = placement;
    }
  }

  function startPositioning() {
    if (positionRAF != null) return;
    const tick = () => {
      if (!hintEl || !hintEl.classList.contains('enterpost-hint--visible')) {
        positionRAF = null;
        return;
      }
      refreshAnchor();
      if (currentAnchor) positionHintNear(currentAnchor);
      else hintEl.classList.add('enterpost-hint--offscreen');
      positionRAF = requestAnimationFrame(tick);
    };
    positionRAF = requestAnimationFrame(tick);
  }

  function showHint(durationMs) {
    if (!hintEl) return;
    hintEl.classList.add('enterpost-hint--visible');
    startPositioning();
    scheduleHintHide(durationMs);
  }

  function hideHint() {
    if (!hintEl) return;
    hintEl.classList.remove('enterpost-hint--visible');
    hintEl.classList.remove('enterpost-hint--offscreen');
    clearHintTimer();
  }

  function scheduleHintHide(durationMs) {
    clearHintTimer();
    hintHideTimer = setTimeout(hideHint, Math.max(500, durationMs || 4000));
  }

  function clearHintTimer() {
    if (hintHideTimer) {
      clearTimeout(hintHideTimer);
      hintHideTimer = null;
    }
  }

  function onFocusIn(e) {
    if (!state.showHint) return;
    const composer = findComposer(e.target);
    if (!composer) return;
    if (!ensureHintReady()) return;
    currentComposer = composer;
    refreshAnchor();
    updateHintContent();
    showHint(4000);
  }

  function onFocusOut(e) {
    if (!hintEl) return;
    // Wait a tick — focusout fires before focusin on the next element.
    setTimeout(() => {
      const active = document.activeElement;
      if (active && findComposer(active)) {
        // Focus moved within composer area; keep hint, just refresh anchor.
        currentComposer = findComposer(active);
        refreshAnchor();
        return;
      }
      hideHint();
      currentComposer = null;
      currentAnchor = null;
    }, 0);
  }
})();

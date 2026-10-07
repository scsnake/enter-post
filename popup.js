(function () {
  const EP = self.ENTER_POST;
  const DEFAULTS = { postMode: 'ctrl-enter-send', chatMode: 'enter-send', siteEnabled: {}, showHint: true };
  const t = (key, ...subs) => chrome.i18n.getMessage(key, subs.length ? subs : undefined) || key;

  const $ = (sel) => document.querySelector(sel);
  const postModeInputs = () => document.querySelectorAll('input[name="post-mode"]');
  const chatModeInputs = () => document.querySelectorAll('input[name="chat-mode"]');
  const showHintInput = () => $('#show-hint');
  const siteList = () => $('#site-list');
  const siteStatus = () => $('#site-status');

  function applyStaticI18n() {
    document.documentElement.lang = (chrome.i18n.getUILanguage() || 'en').replace('_', '-');
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const msg = t(el.dataset.i18n);
      if (msg) el.textContent = msg;
    });
    const ver = $('#version');
    if (ver) ver.textContent = 'v' + chrome.runtime.getManifest().version;
  }

  function load() {
    chrome.storage.sync.get(null, (data) => {
      const settings = { ...DEFAULTS, ...(data || {}) };
      const postMode = settings.postMode === 'enter-send' ? 'enter-send' : 'ctrl-enter-send';
      postModeInputs().forEach((r) => { r.checked = r.value === postMode; });

      const chatMode = settings.chatMode === 'ctrl-enter-send' ? 'ctrl-enter-send' : 'enter-send';
      chatModeInputs().forEach((r) => { r.checked = r.value === chatMode; });
      showHintInput().checked = settings.showHint !== false;
      renderSites(settings.siteEnabled || {});
      updateSiteStatus(settings);
    });
  }

  function renderSites(siteEnabled) {
    const ul = siteList();
    ul.innerHTML = '';
    const sorted = [...EP.platforms].sort((a, b) => a.label.localeCompare(b.label));
    for (const p of sorted) {
      const li = document.createElement('li');
      const label = document.createElement('label');
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = siteEnabled[p.id] !== false;
      cb.dataset.id = p.id;
      cb.addEventListener('change', () => {
        chrome.storage.sync.get('siteEnabled', ({ siteEnabled }) => {
          const next = { ...(siteEnabled || {}) };
          next[p.id] = cb.checked;
          chrome.storage.sync.set({ siteEnabled: next });
        });
      });
      const name = document.createElement('span');
      name.className = 'site-name';
      name.textContent = p.label;
      const native = document.createElement('span');
      native.className = 'site-native';
      native.textContent = p.nativeSend === 'Ctrl+Enter' ? t('popupNativeCtrlEnter') : t('popupNativeEnter');
      label.appendChild(cb);
      label.appendChild(name);
      label.appendChild(native);
      li.appendChild(label);
      ul.appendChild(li);
    }
  }

  function updateSiteStatus(settings) {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      const el = siteStatus();
      if (!tab || !tab.url) { el.textContent = ''; return; }
      let host = '';
      try { host = new URL(tab.url).hostname; } catch (_) { host = ''; }
      const p = EP.findPlatform(host);
      if (!p) {
        el.textContent = t('popupStatusUnsupported');
        el.className = 'site-status site-status--inactive';
        return;
      }
      const enabled = (settings.siteEnabled || {})[p.id] !== false;
      if (!enabled) {
        el.textContent = t('popupStatusDisabled', p.label);
        el.className = 'site-status site-status--off';
      } else {
        el.textContent = t('popupStatusActive', p.label);
        el.className = 'site-status site-status--on';
      }
      // Highlight matching row.
      const row = siteList().querySelector(`input[data-id="${p.id}"]`);
      if (row) row.closest('li').classList.add('site-current');
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    applyStaticI18n();
    load();
    postModeInputs().forEach((r) => {
      r.addEventListener('change', () => {
        if (r.checked) chrome.storage.sync.set({ postMode: r.value });
      });
    });
    chatModeInputs().forEach((r) => {
      r.addEventListener('change', () => {
        if (r.checked) chrome.storage.sync.set({ chatMode: r.value });
      });
    });
    showHintInput().addEventListener('change', () => {
      chrome.storage.sync.set({ showHint: showHintInput().checked });
    });
  });
})();

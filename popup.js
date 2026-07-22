(function () {
  const EP = self.ENTER_POST;
  const DEFAULTS = { globalMode: 'ctrl-enter-send', siteEnabled: {}, showHint: true };

  const $ = (sel) => document.querySelector(sel);
  const modeInputs = () => document.querySelectorAll('input[name="mode"]');
  const showHintInput = () => $('#show-hint');
  const siteList = () => $('#site-list');
  const siteStatus = () => $('#site-status');

  function load() {
    chrome.storage.sync.get(null, (data) => {
      const settings = { ...DEFAULTS, ...(data || {}) };
      const mode = settings.globalMode === 'enter-send' ? 'enter-send' : 'ctrl-enter-send';
      modeInputs().forEach((r) => { r.checked = r.value === mode; });
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
      native.textContent = p.nativeSend === 'Ctrl+Enter' ? '(native: Ctrl+Enter)' : '(native: Enter)';
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
        el.textContent = 'Not a supported site';
        el.className = 'site-status site-status--inactive';
        return;
      }
      const enabled = (settings.siteEnabled || {})[p.id] !== false;
      if (!enabled) {
        el.textContent = `Disabled on ${p.label}`;
        el.className = 'site-status site-status--off';
      } else {
        el.textContent = `Active on ${p.label}`;
        el.className = 'site-status site-status--on';
      }
      // Highlight matching row.
      const row = siteList().querySelector(`input[data-id="${p.id}"]`);
      if (row) row.closest('li').classList.add('site-current');
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    load();
    modeInputs().forEach((r) => {
      r.addEventListener('change', () => {
        if (r.checked) chrome.storage.sync.set({ globalMode: r.value });
      });
    });
    showHintInput().addEventListener('change', () => {
      chrome.storage.sync.set({ showHint: showHintInput().checked });
    });
  });
})();

(function () {
  if (document.getElementById('kea-panel')) return;

  const qs = (id) => document.getElementById(id);
  const send = (type, payload = {}) => new Promise((resolve) => chrome.runtime.sendMessage({ type, ...payload }, resolve));
  const tickerGuess = location.pathname.split('/').find((part) => part.startsWith('KX')) || '';

  const panel = document.createElement('div');
  panel.id = 'kea-panel';
  panel.innerHTML = `
    <div class="kea-header"><span>Kalshi Exit Assistant</span><button id="kea-close" class="kea-close">×</button></div>
    <div class="kea-body">
      <div class="kea-status"><span id="kea-engine">Engine: checking...</span><span class="kea-pill">Local V1</span></div>
      <div class="kea-row"><label>Market ticker</label><input id="kea-ticker" value="${tickerGuess}" placeholder="KX..." /></div>
      <div class="kea-grid">
        <div class="kea-row"><label>Held side</label><select id="kea-side"><option value="yes">YES</option><option value="no">NO</option></select></div>
        <div class="kea-row"><label>Position size</label><input id="kea-position" type="number" value="1000" min="1" /></div>
      </div>
      <div class="kea-grid">
        <div class="kea-row"><label>Chunk size ≤500</label><input id="kea-chunk" type="number" value="500" min="1" max="500" /></div>
        <div class="kea-row"><label>Min level size</label><input id="kea-minlevel" type="number" value="50" min="0" /></div>
      </div>
      <div class="kea-grid">
        <div class="kea-row"><label>Tail sweep threshold</label><input id="kea-tail" type="number" value="500" min="1" /></div>
        <div class="kea-row"><label>Dry run</label><select id="kea-dry"><option value="true" selected>TRUE</option><option value="false">FALSE</option></select></div>
      </div>
      <div class="kea-row"><label><input id="kea-adaptive" type="checkbox" /> Mild adaptive chunking</label></div>
      <div class="kea-actions"><button id="kea-preview" class="kea-secondary">Preview</button><button id="kea-start" class="kea-primary">Start</button><button id="kea-stop" class="kea-danger">Stop</button></div>
      <div id="kea-output" class="kea-note">Start local engine first: npm run server -- --config ./config.example.json</div>
      <div id="kea-progress-wrap" class="kea-progress-wrap" style="display:none">
        <div class="kea-progress-bar-bg"><div id="kea-progress-bar" class="kea-progress-bar"></div></div>
        <div id="kea-progress-label" class="kea-progress-label">0 of 0 filled</div>
      </div>
      <div id="kea-summary" class="kea-summary" style="display:none"></div>
    </div>`;
  document.body.appendChild(panel);

  // ── Confirmation modal (injected into body, not panel) ──────────────────────
  const modal = document.createElement('div');
  modal.id = 'kea-modal';
  modal.className = 'kea-modal-overlay';
  modal.style.display = 'none';
  modal.innerHTML = `
    <div class="kea-modal">
      <div class="kea-modal-title">⚠ Confirm Real Orders</div>
      <div id="kea-modal-body" class="kea-modal-body"></div>
      <label class="kea-modal-check">
        <input type="checkbox" id="kea-modal-confirm-cb" />
        I understand this will place real orders
      </label>
      <div class="kea-modal-actions">
        <button id="kea-modal-cancel" class="kea-secondary">Cancel</button>
        <button id="kea-modal-confirm" class="kea-primary">Confirm</button>
      </div>
    </div>`;
  document.body.appendChild(modal);

  let _modalResolve = null;

  function showModal(cfg) {
    qs('kea-modal-body').innerHTML =
      `<div class="kea-modal-row"><span>Ticker</span><strong>${cfg.marketTicker || '—'}</strong></div>` +
      `<div class="kea-modal-row"><span>Side</span><strong>${cfg.heldSide}</strong></div>` +
      `<div class="kea-modal-row"><span>Position size</span><strong>${cfg.positionSize}</strong></div>` +
      `<div class="kea-modal-row"><span>Chunk size</span><strong>${cfg.chunkSize}</strong></div>`;
    qs('kea-modal-confirm-cb').checked = false;
    modal.style.display = 'flex';
    return new Promise((resolve) => { _modalResolve = resolve; });
  }

  function closeModal(result) {
    modal.style.display = 'none';
    if (_modalResolve) { _modalResolve(result); _modalResolve = null; }
  }

  qs('kea-modal-cancel').addEventListener('click', () => closeModal(false));
  qs('kea-modal-confirm').addEventListener('click', () => {
    if (!qs('kea-modal-confirm-cb').checked) {
      qs('kea-modal-confirm-cb').classList.add('kea-modal-check-error');
      setTimeout(() => qs('kea-modal-confirm-cb').classList.remove('kea-modal-check-error'), 800);
      return;
    }
    closeModal(true);
  });
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(false); });

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function configFromUi() {
    return {
      marketTicker: qs('kea-ticker').value.trim(),
      heldSide: qs('kea-side').value,
      positionSize: Number(qs('kea-position').value),
      chunkSize: Math.min(500, Number(qs('kea-chunk').value)),
      minLevelSize: Number(qs('kea-minlevel').value),
      tailSweepThreshold: Number(qs('kea-tail').value),
      mildAdaptive: qs('kea-adaptive').checked,
      dryRun: qs('kea-dry').value === 'true',
    };
  }

  function formatResponse(label, response) {
    if (!response?.ok) return `${label} failed: ${response?.error || 'unknown error'}`;
    const data = response.data;
    if (label === 'Preview') {
      return `Preview OK\nprice: ${data.decision.priceCents}¢\nchunk: ${data.decision.chunkSize}\nreason: ${data.decision.reason}\npayload: ${JSON.stringify(data.payload, null, 2)}`;
    }
    if (label === 'Status') {
      return `Status\nrunning: ${data.running}\nremaining: ${data.remaining ?? 'n/a'}\norders: ${data.ordersAttempted ?? 0}\nlast: ${data.lastDecision ? JSON.stringify(data.lastDecision) : 'none'}\nerror: ${data.lastError || 'none'}`;
    }
    return `${label} OK\n${JSON.stringify(data, null, 2)}`;
  }

  function fmtDuration(startedAt, finishedAt) {
    if (!startedAt || !finishedAt) return '—';
    const ms = new Date(finishedAt) - new Date(startedAt);
    if (isNaN(ms) || ms < 0) return '—';
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
  }

  // ── Progress bar ─────────────────────────────────────────────────────────────
  function updateProgress(data) {
    const wrap = qs('kea-progress-wrap');
    const bar = qs('kea-progress-bar');
    const label = qs('kea-progress-label');
    if (!data || (!data.running && !data.stopped)) { wrap.style.display = 'none'; return; }
    const filled = data.filledTotal ?? 0;
    const total = data.initialPosition ?? 0;
    const pct = total > 0 ? Math.min(100, Math.round((filled / total) * 100)) : 0;
    wrap.style.display = '';
    bar.style.width = pct + '%';
    label.textContent = `${filled} of ${total} filled (${pct}%)`;
  }

  // ── Exec summary ─────────────────────────────────────────────────────────────
  function renderSummary(data) {
    const el = qs('kea-summary');
    if (!data || !data.stopped || !(data.ordersAttempted > 0)) { el.style.display = 'none'; return; }
    const dur = fmtDuration(data.startedAt, data.finishedAt);
    el.style.display = '';
    el.innerHTML =
      `<div class="kea-summary-title">Run Complete</div>` +
      `<div class="kea-summary-row"><span>Orders attempted</span><strong>${data.ordersAttempted}</strong></div>` +
      `<div class="kea-summary-row"><span>Filled total</span><strong>${data.filledTotal ?? 0}</strong></div>` +
      `<div class="kea-summary-row"><span>Canceled total</span><strong>${data.canceledTotal ?? 0}</strong></div>` +
      `<div class="kea-summary-row"><span>Duration</span><strong>${dur}</strong></div>` +
      (data.lastError ? `<div class="kea-summary-error">Last error: ${data.lastError}</div>` : '');
    // Hide the plain status output when summary is shown
    qs('kea-output').style.display = 'none';
  }

  // ── Health & status refresh ───────────────────────────────────────────────────
  async function refreshHealth() {
    const response = await send('KEA_HEALTH');
    qs('kea-engine').textContent = response?.ok ? 'Engine: connected' : 'Engine: offline';
    qs('kea-engine').className = response?.ok ? '' : 'kea-warn';
  }

  async function refreshStatus() {
    const response = await send('KEA_STATUS');
    if (!response?.ok) return;
    const data = response.data;

    // Summary: stopped + ordersAttempted > 0 → show summary, hide status text
    if (data.stopped && data.ordersAttempted > 0) {
      renderSummary(data);
      updateProgress(data);
      return;
    }

    // Running: show status text + progress bar
    if (data.running) {
      qs('kea-output').style.display = '';
      qs('kea-output').textContent = formatResponse('Status', response);
      qs('kea-summary').style.display = 'none';
    }
    updateProgress(data);
  }

  // ── Button listeners ──────────────────────────────────────────────────────────
  qs('kea-close').addEventListener('click', () => panel.remove());

  qs('kea-preview').addEventListener('click', async () => {
    qs('kea-output').style.display = '';
    qs('kea-output').textContent = 'Previewing...';
    qs('kea-output').textContent = formatResponse('Preview', await send('KEA_PREVIEW', { config: configFromUi() }));
  });

  qs('kea-start').addEventListener('click', async () => {
    const cfg = configFromUi();

    // Confirmation modal for real orders only
    if (!cfg.dryRun) {
      const confirmed = await showModal(cfg);
      if (!confirmed) {
        qs('kea-output').style.display = '';
        qs('kea-output').textContent = 'Start cancelled.';
        return;
      }
    }

    // Reset summary + progress for new run
    qs('kea-summary').style.display = 'none';
    qs('kea-output').style.display = '';
    qs('kea-output').textContent = 'Starting...';
    qs('kea-output').textContent = formatResponse('Start', await send('KEA_START', { config: cfg }));
  });

  qs('kea-stop').addEventListener('click', async () => {
    qs('kea-output').style.display = '';
    qs('kea-output').textContent = formatResponse('Stop', await send('KEA_STOP'));
  });

  refreshHealth();
  setInterval(refreshHealth, 5000);
  setInterval(refreshStatus, 1500);
})();

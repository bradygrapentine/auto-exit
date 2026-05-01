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
    </div>`;
  document.body.appendChild(panel);

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

  async function refreshHealth() {
    const response = await send('KEA_HEALTH');
    qs('kea-engine').textContent = response?.ok ? 'Engine: connected' : 'Engine: offline';
    qs('kea-engine').className = response?.ok ? '' : 'kea-warn';
  }

  async function refreshStatus() {
    const response = await send('KEA_STATUS');
    if (response?.ok && response.data?.running) qs('kea-output').textContent = formatResponse('Status', response);
  }

  qs('kea-close').addEventListener('click', () => panel.remove());
  qs('kea-preview').addEventListener('click', async () => { qs('kea-output').textContent = 'Previewing...'; qs('kea-output').textContent = formatResponse('Preview', await send('KEA_PREVIEW', { config: configFromUi() })); });
  qs('kea-start').addEventListener('click', async () => { qs('kea-output').textContent = 'Starting...'; qs('kea-output').textContent = formatResponse('Start', await send('KEA_START', { config: configFromUi() })); });
  qs('kea-stop').addEventListener('click', async () => { qs('kea-output').textContent = formatResponse('Stop', await send('KEA_STOP')); });

  refreshHealth();
  setInterval(refreshHealth, 5000);
  setInterval(refreshStatus, 1500);
})();

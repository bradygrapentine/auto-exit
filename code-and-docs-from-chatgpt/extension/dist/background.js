const ENGINE_BASE = 'http://127.0.0.1:7777';

async function callEngine(path, method = 'GET', body = undefined) {
  const res = await fetch(`${ENGINE_BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
  if (!res.ok) throw new Error(json.error || `${res.status} ${res.statusText}`);
  return json;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    if (message?.type === 'KEA_HEALTH') {
      return await callEngine('/health');
    }
    if (message?.type === 'KEA_STATUS') {
      return await callEngine('/status');
    }
    if (message?.type === 'KEA_PREVIEW') {
      return await callEngine('/preview', 'POST', { config: message.config });
    }
    if (message?.type === 'KEA_START') {
      return await callEngine('/start', 'POST', { config: message.config });
    }
    if (message?.type === 'KEA_STOP') {
      return await callEngine('/stop', 'POST', {});
    }
    return { ok: false, error: 'Unknown message type' };
  })()
    .then((data) => sendResponse({ ok: true, data }))
    .catch((err) => sendResponse({ ok: false, error: err.message || String(err) }));
  return true;
});

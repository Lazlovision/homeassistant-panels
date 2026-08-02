const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

function loadSecrets() {
  const p = 'f:/Homeassistant/secrets.json';
  if (fs.existsSync(p)) {
    try {
      return JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch(e) {}
  }
  return {
    HA_IP: 'YOUR_HA_IP',
    PANEL_USER: 'office_panel',
    PANEL_PASS: 'YOUR_PASSWORD'
  };
}

async function run() {
  const secrets = loadSecrets();
  const haIp = secrets.HA_IP || 'YOUR_HA_IP';
  const panelUser = secrets.PANEL_USER || 'office_panel';
  const panelPass = secrets.PANEL_PASS || 'YOUR_PASSWORD';

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const tmpDir = path.join(os.tmpdir(), 'chrome_dash_snap_' + Date.now());

  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--window-size=1280,800',
    '--force-device-scale-factor=1',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=' + tmpDir,
    `http://${haIp}:8123/office-panel`
  ]);

  // Chrome process cleanup on any exit
  let chromeKilled = false;
  process.on('exit', () => {
    if (!chromeKilled) {
      chrome.kill();
      chromeKilled = true;
    }
  });

  // Screenshot timeout (30s)
  const timeout = setTimeout(() => {
    console.error('ERROR: Screenshot timeout after 30s');
    chrome.kill();
    chromeKilled = true;
    process.exit(1);
  }, 30000);

  await new Promise(r => setTimeout(r, 4000));

  const resp = await fetch('http://127.0.0.1:9222/json');
  const tabs = await resp.json();
  const pageTab = tabs.find(t => t.type === 'page');

  if (!pageTab) {
    console.error("Could not find Home Assistant page tab");
    chrome.kill();
    chromeKilled = true;
    process.exit(1);
  }

  // Import WebSocket (ws package)
  const WebSocket = (await import('ws')).default;
  const ws = new WebSocket(pageTab.webSocketDebuggerUrl);

  // WebSocket connect timeout (10s)
  await Promise.race([
    new Promise(r => ws.onopen = r),
    new Promise((_, reject) => setTimeout(() => reject(new Error('WebSocket connect timeout')), 10000))
  ]);

  ws.onmessage = (msg) => {
    try {
      const data = JSON.parse(msg.data);
      if (data.id === 5 && data.result && data.result.data) {
        const buf = Buffer.from(data.result.data, 'base64');
        fs.writeFileSync('f:/Homeassistant/dash_snap.png', buf);
        console.log('SNAPSHOT_SAVED_SUCCESSFULLY to f:/Homeassistant/dash_snap.png');
        clearTimeout(timeout);
        chrome.kill();
        chromeKilled = true;
        // Clean up temp directory
        if (fs.existsSync(tmpDir)) {
          fs.rmSync(tmpDir, { recursive: true, force: true });
        }
        process.exit(0);
      }
    } catch(e) {
      console.error(e);
    }
  };

  const fillJs = `
    (function() {
      function setFieldValues(root) {
        if (!root) return;
        const els = root.querySelectorAll ? Array.from(root.querySelectorAll('*')) : [];
        for (const el of els) {
          if (el.tagName === 'HA-TEXTFIELD' || el.tagName === 'MWC-TEXTFIELD' || el.tagName === 'PAPER-INPUT') {
            if (el.name === 'username' || el.type === 'text' || (el.label && el.label.toLowerCase().includes('user'))) {
              el.value = '${panelUser}';
            }
            if (el.name === 'password' || el.type === 'password' || (el.label && el.label.toLowerCase().includes('pass'))) {
              el.value = '${panelPass}';
            }
          }
          if (el.tagName === 'INPUT') {
            if (el.type === 'text') { el.value = '${panelUser}'; el.dispatchEvent(new Event('input', {bubbles:true, composed:true})); }
            if (el.type === 'password') { el.value = '${panelPass}'; el.dispatchEvent(new Event('input', {bubbles:true, composed:true})); }
          }
          if (el.shadowRoot) setFieldValues(el.shadowRoot);
        }
      }
      setFieldValues(document);
    })();
  `;

  const submitJs = `
    (function() {
      function clickAnyBtn(root) {
        if (!root) return;
        const els = root.querySelectorAll ? Array.from(root.querySelectorAll('*')) : [];
        for (const el of els) {
          if (el.shadowRoot) clickAnyBtn(el.shadowRoot);
          const txt = (el.innerText || el.textContent || '').toLowerCase();
          if (txt.includes('log in') || el.tagName === 'HA-PROGRESS-BUTTON' || el.tagName === 'MWC-BUTTON') {
            el.click();
          }
          if (el.tagName === 'INPUT' && el.type === 'password') {
            el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, composed: true }));
          }
        }
      }
      clickAnyBtn(document);
    })();
  `;

  const fixLayoutJs = `
    (function() {
      // Force kiosk mode header hide & window resize
      var header = document.querySelector('app-header') || document.querySelector('ch-header');
      if (header) header.style.display = 'none';
      window.dispatchEvent(new Event('resize'));
    })();
  `;

  ws.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression: fillJs, returnByValue: true } }));
  await new Promise(r => setTimeout(r, 600));
  ws.send(JSON.stringify({ id: 2, method: 'Runtime.evaluate', params: { expression: submitJs, returnByValue: true } }));

  await new Promise(r => setTimeout(r, 8000));

  ws.send(JSON.stringify({ id: 3, method: 'Runtime.evaluate', params: { expression: fixLayoutJs, returnByValue: true } }));
  await new Promise(r => setTimeout(r, 1200));

  ws.send(JSON.stringify({ id: 4, method: 'Emulation.setDeviceMetricsOverride', params: { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false } }));
  await new Promise(r => setTimeout(r, 500));

  ws.send(JSON.stringify({ id: 5, method: 'Page.captureScreenshot', params: { format: 'png' } }));
}

run().catch(console.error);

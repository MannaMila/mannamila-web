// Renders og.html at 1200x630 in headless Chrome and writes a PNG.
// Usage: node og-render.mjs <out.png>
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createServer} from 'node:http';
import {readFile, writeFile, mkdtemp} from 'node:fs/promises';
import {join, extname, dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const out = process.argv[2];
assert.ok(out, 'usage: node og-render.mjs <out.png>');

const types = {'.html': 'text/html', '.css': 'text/css', '.png': 'image/png', '.woff2': 'font/woff2'};
const server = createServer(async (req, res) => {
  try {
    const p = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const body = await readFile(join(root, p));
    res.setHeader('content-type', types[extname(p)] || 'application/octet-stream');
    res.end(body);
  } catch {
    res.statusCode = 404;
    res.end();
  }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const site = `http://127.0.0.1:${server.address().port}`;

const portProbe = createServer();
await new Promise(r => portProbe.listen(0, '127.0.0.1', r));
const port = portProbe.address().port;
await new Promise(r => portProbe.close(r));

const profile = await mkdtemp(join(tmpdir(), 'skald-og-'));
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', '--disable-background-networking', '--disable-extensions', '--no-first-run',
  '--no-default-browser-check', '--hide-scrollbars', '--force-color-profile=srgb',
  `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, 'about:blank',
], {stdio: 'ignore'});
const delay = ms => new Promise(r => setTimeout(r, ms));

let ws;
try {
  for (let i = 0; i < 100; i++) {
    try { await fetch(`http://127.0.0.1:${port}/json/version`); break; } catch { await delay(100); }
  }
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about%3Ablank`, {method: 'PUT'})).json();
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r, {once: true}));
  let id = 0;
  const pending = new Map();
  ws.onmessage = e => {
    const d = JSON.parse(e.data);
    if (!d.id) return;
    const p = pending.get(d.id);
    pending.delete(d.id);
    d.error ? p.reject(Error(d.error.message)) : p.resolve(d.result);
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const n = ++id;
    pending.set(n, {resolve, reject});
    ws.send(JSON.stringify({id: n, method, params}));
  });
  const ev = async expression =>
    (await send('Runtime.evaluate', {expression, returnByValue: true, awaitPromise: true})).result.value;

  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', {width: 1200, height: 630, deviceScaleFactor: 1, mobile: false});
  await send('Page.navigate', {url: `${site}/og.html`});
  for (let i = 0; i < 100; i++) {
    if (await ev('document.readyState === "complete"')) break;
    await delay(100);
  }
  await ev('document.fonts.ready.then(() => true)');
  const state = JSON.parse(await ev(`JSON.stringify({
    serif: document.fonts.check('600 104px "Cormorant Garamond"') && document.fonts.check('italic 600 104px "Cormorant Garamond"'),
    sans: document.fonts.check('500 19px Inter'),
    loaded: [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family + ' ' + f.style + ' ' + f.weight),
    img: [document.images[0].naturalWidth, document.images[0].naturalHeight],
    text: document.body.innerText.replace(/\\s+/g, ' ').trim(),
    scroll: [document.documentElement.scrollWidth, document.documentElement.scrollHeight],
    shot: document.querySelector('.shot').getBoundingClientRect().toJSON(),
    copy: document.querySelector('.copy').getBoundingClientRect().toJSON(),
    img_box: document.images[0].getBoundingClientRect().toJSON(),
  })`));
  assert.ok(state.serif && state.sans, `fonts not loaded: ${JSON.stringify(state.loaded)}`);
  // 03-parallel.png stores 2064x2752 pixels with EXIF Orientation 8; Chrome displays it 2752x2064.
  assert.deepEqual(state.img, [2752, 2064]);
  assert.equal(state.text, 'Skald: Odyssey Spend some time with the Odyssey.');
  assert.deepEqual(state.scroll, [1200, 630]);
  assert.ok(state.shot.top >= 0 && state.shot.bottom <= 630 && state.shot.right <= 1200, 'screenshot must fit uncropped');
  assert.ok(state.copy.right <= state.shot.left, 'copy must not overlap the screenshot');
  const shot = await send('Page.captureScreenshot', {format: 'png', clip: {x: 0, y: 0, width: 1200, height: 630, scale: 1}});
  await writeFile(out, Buffer.from(shot.data, 'base64'));
  console.log(JSON.stringify(state));
} finally {
  ws?.close();
  chrome.kill('SIGTERM');
  server.close();
}

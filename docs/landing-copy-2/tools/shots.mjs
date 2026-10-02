// Final evidence for copy round 2 and the 0.7.10 screenshots.
// Usage: node shots.mjs <mannamila-web root> <baseline skald dir (origin/main export)> <dir holding the capture lane's web/*.webp>
import { createRequire } from 'node:module';
import { writeFileSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
const require = createRequire('/Volumes/Dev/Code/notetaker/node_modules/');
const { chromium } = require('playwright');
const [W, BASE, SRC] = process.argv.slice(2), out = W + '/docs/landing-copy-2';
const serve = (dir, port) => spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1', '--directory', dir], { stdio: 'ignore' });
const srvNew = serve(W + '/skald', 8761), srvOld = serve(BASE, 8762);
await new Promise((r) => setTimeout(r, 1500));
const sha = (b) => createHash('sha256').update(b).digest('hex');
const IMGS = ['reader-art', 'greek-split', 'nostos-route', 'museum-guide'];
const browser = await chromium.launch({ channel: 'chrome' });
const report = { viewports: [], servedImages: [] };
const settle = (page, sel, text) => page.evaluate(([sel, text]) => {
  const el = text ? [...document.querySelectorAll(sel)].find((e) => e.textContent.includes(text)) : document.querySelector(sel);
  el.scrollIntoView({ block: 'center', behavior: 'instant' });
  return new Promise((res) => setTimeout(() => { el.scrollIntoView({ block: 'center', behavior: 'instant' }); setTimeout(() => { const r = el.getBoundingClientRect(), h = document.querySelector('.site-header').getBoundingClientRect(); res(r.bottom > h.bottom && r.top < innerHeight); }, 1200); }, 1500));
}, [sel, text]);
const boxes = (page) => page.evaluate((names) => Object.fromEntries(names.map((n) => { const i = document.querySelector(`img[src*="${n}.webp"]`), r = i.getBoundingClientRect();
  return [n, { src: i.getAttribute('src'), attrs: [+i.getAttribute('width'), +i.getAttribute('height')], natural: [i.naturalWidth, i.naturalHeight], rendered: [Math.round(r.width * 10) / 10, Math.round(r.height * 10) / 10], alt: i.alt, caption: i.closest('figure').querySelector('figcaption').textContent }]; })), IMGS);
try {
  for (const width of [390, 1280]) {
    const opts = { viewport: { width, height: width === 390 ? 844 : 900 }, isMobile: width === 390, hasTouch: width === 390, deviceScaleFactor: 1 };
    const ctx = await browser.newContext(opts); const page = await ctx.newPage(); const failed = [], served = {};
    page.on('requestfailed', (r) => failed.push(r.url()));
    page.on('response', async (r) => { const m = r.url().match(/assets\/([a-z-]+)\.webp\?v=(.+)$/); if (m && IMGS.includes(m[1])) { try { served[m[1]] = { query: m[2], sha256: sha(await r.body()) }; } catch {} } });
    await page.goto('http://127.0.0.1:8761/', { waitUntil: 'networkidle' });
    await page.evaluate(() => { document.querySelectorAll('img[loading="lazy"]').forEach((i) => (i.loading = 'eager')); document.querySelectorAll('#faq details').forEach((d) => (d.open = true)); });
    await page.waitForFunction((names) => names.every((n) => { const i = document.querySelector(`img[src*="${n}.webp"]`); return i.complete && i.naturalWidth > 0; }), IMGS);
    const shots = [];
    await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(600);
    await page.screenshot({ path: `${out}/landing-${width}-hero.png` }); shots.push(`landing-${width}-hero.png`);
    if (width === 390) { await settle(page, 'img[src*="reader-art.webp"]'); await page.screenshot({ path: `${out}/landing-390-hero-image.png` }); shots.push('landing-390-hero-image.png'); }
    for (const [name, sel, text] of [['greek-split', 'img[src*="greek-split.webp"]'], ['nostos-route', 'img[src*="nostos-route.webp"]'], ['museum-guide', 'img[src*="museum-guide.webp"]'],
      ['translations-copy', 'p', 'choose Parallel mode'], ['offline-list', 'p', 'Ancient Greek with its word cards'], ['faq-language', 'summary', 'What language is Skald in?'], ['faq-greek', 'p', 'tap any Greek word to open its word card']]) {
      await settle(page, sel, text); await page.screenshot({ path: `${out}/landing-${width}-${name}.png` }); shots.push(`landing-${width}-${name}.png`);
    }
    const now = await boxes(page);
    const m = await page.evaluate(() => { const p = [...document.querySelectorAll('#faq p')].find((e) => e.textContent.includes('interface, notes and retellings')), r = p.getBoundingClientRect();
      return { clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth, languageAnswerRight: Math.round(r.right), languageAnswerScrollWidth: p.scrollWidth, languageAnswerClientWidth: p.clientWidth, pageHeight: document.documentElement.scrollHeight }; });
    const octx = await browser.newContext(opts); const old = await octx.newPage(); await old.goto('http://127.0.0.1:8762/', { waitUntil: 'networkidle' });
    await old.evaluate(() => document.querySelectorAll('img[loading="lazy"]').forEach((i) => (i.loading = 'eager')));
    await old.waitForFunction((names) => names.every((n) => { const i = document.querySelector(`img[src*="${n}.webp"]`); return i.complete && i.naturalWidth > 0; }), IMGS);
    const before = await boxes(old); await octx.close();
    const same = Object.fromEntries(IMGS.map((n) => [n, { renderedBoxSameAsLive: JSON.stringify(now[n].rendered) === JSON.stringify(before[n].rendered), attrsEqualNatural: JSON.stringify(now[n].attrs) === JSON.stringify(now[n].natural), naturalSameAsLive: JSON.stringify(now[n].natural) === JSON.stringify(before[n].natural), altSameAsLive: now[n].alt === before[n].alt, captionSameAsLive: now[n].caption === before[n].caption, rendered: now[n].rendered, liveRendered: before[n].rendered, src: now[n].src }]));
    for (const n of IMGS) report.servedImages.push({ viewport: width, image: n, query: served[n]?.query, servedSha256: served[n]?.sha256, captureLaneSha256: sha(readFileSync(`${SRC}/${n}.webp`)), match: served[n]?.sha256 === sha(readFileSync(`${SRC}/${n}.webp`)) });
    report.viewports.push({ viewport: width, ...m, horizontalOverflow: m.scrollWidth > m.clientWidth, languageAnswerOverflows: m.languageAnswerScrollWidth > m.languageAnswerClientWidth || m.languageAnswerRight > m.clientWidth, images: same, failedRequests: failed, screenshots: shots });
    await ctx.close();
  }
} finally { await browser.close(); srvNew.kill(); srvOld.kill(); }
writeFileSync(out + '/visual-report.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ served: report.servedImages.map((s) => [s.viewport, s.image, s.query, s.match]), views: report.viewports.map((v) => ({ w: v.viewport, overflow: v.horizontalOverflow, langOverflow: v.languageAnswerOverflows, failed: v.failedRequests, images: Object.fromEntries(Object.entries(v.images).map(([k, x]) => [k, [x.renderedBoxSameAsLive, x.attrsEqualNatural, x.naturalSameAsLive, x.altSameAsLive, x.captionSameAsLive]])) })) }, null, 1));

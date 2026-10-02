// Screenshots of the regions changed by the copy-2 candidate. Usage: node shots.mjs <mannamila-web root>
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
const require = createRequire('/Volumes/Dev/Code/notetaker/node_modules/');
const { chromium } = require('playwright');
const W = process.argv[2], out = W + '/docs/landing-copy-2', port = 8757, base = `http://127.0.0.1:${port}`;
const srv = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1', '--directory', W + '/skald'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 1200));
const browser = await chromium.launch({ channel: 'chrome' });
const report = [];
const regions = [['translations', 'Choose Parallel to read two translations together.'], ['faq-language', 'What language is Skald in?'], ['faq-greek', 'open the on-device Greek word cards']];
try {
  for (const width of [390, 1280]) {
    const ctx = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 }, isMobile: width === 390, hasTouch: width === 390, deviceScaleFactor: 1 });
    const page = await ctx.newPage(); const failed = [];
    page.on('requestfailed', (r) => failed.push(r.url()));
    await page.goto(base + '/', { waitUntil: 'networkidle' });
    await page.evaluate(() => document.querySelectorAll('#faq details').forEach((d) => (d.open = true)));
    const shots = [], clear = {};
    for (const [name, text] of regions) {
      clear[name] = await page.evaluate((text) => {
        const el = [...document.querySelectorAll('p, summary')].find((e) => e.textContent.includes(text));
        el.scrollIntoView({ block: 'center', behavior: 'instant' });
        // Reveal animations shift the layout; settle, then centre again before measuring.
        return new Promise((res) => setTimeout(() => { el.scrollIntoView({ block: 'center', behavior: 'instant' }); setTimeout(() => { const r = el.getBoundingClientRect(), h = document.querySelector('.site-header').getBoundingClientRect(); res(r.top >= h.bottom && r.bottom <= innerHeight); }, 1200); }, 1500));
      }, text);
      await page.screenshot({ path: `${out}/landing-${width}-${name}.png` }); shots.push(`landing-${width}-${name}.png`);
    }
    const m = await page.evaluate(() => ({ clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth, faqQuestions: [...document.querySelectorAll('#faq summary')].map((s) => s.textContent) }));
    report.push({ viewport: width, ...m, horizontalOverflow: m.scrollWidth > m.clientWidth, changedTextClearOfHeader: clear, failedRequests: failed, screenshots: shots });
    await ctx.close();
  }
} finally { await browser.close(); srv.kill(); }
writeFileSync(out + '/visual-report.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 1));

// Screenshots of the candidate landing page and /get/. Usage: node shots.mjs <mannamila-web root>
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
const require = createRequire('/Volumes/Dev/Code/notetaker/node_modules/');
const { chromium } = require('playwright');
const W = process.argv[2], out = W + '/docs/landing-facts-0.7.10', port = 8753, base = `http://127.0.0.1:${port}`;
const srv = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1', '--directory', W + '/skald'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 1200));
const browser = await chromium.launch({ channel: 'chrome' });
const report = [];
try {
  for (const width of [390, 1280]) {
    const ctx = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 }, isMobile: width === 390, hasTouch: width === 390, deviceScaleFactor: 1 });
    const page = await ctx.newPage(); const failed = [], requests = [];
    page.on('requestfailed', (r) => failed.push(r.url())); page.on('request', (r) => requests.push(r.url().replace(base, '')));
    await page.goto(base + '/', { waitUntil: 'networkidle' });
    await page.screenshot({ path: `${out}/landing-${width}-top.png` });
    const shots = [`landing-${width}-top.png`];
    await page.evaluate(() => document.querySelectorAll('#faq details').forEach((d) => (d.open = true)));
    for (const [name, sel] of [['totals', '.proof-strip'], ['final-cta', '.final-cta']]) {
      const el = page.locator(sel).first();
      await el.scrollIntoViewIfNeeded(); await page.waitForTimeout(900);
      await el.screenshot({ path: `${out}/landing-${width}-${name}.png` }); shots.push(`landing-${width}-${name}.png`);
    }
    // FAQ: centre the availability answer in the viewport so the sticky header cannot cover it.
    await page.evaluate(() => document.querySelector('[data-availability-faq]').scrollIntoView({ block: 'center' })); await page.waitForTimeout(900);
    const faqClear = await page.evaluate(() => { const r = document.querySelector('[data-availability-faq]').getBoundingClientRect(); const h = document.querySelector('.site-header').getBoundingClientRect(); return r.top >= h.bottom && r.bottom <= innerHeight; });
    await page.screenshot({ path: `${out}/landing-${width}-faq.png` }); shots.push(`landing-${width}-faq.png`);
    const m = await page.evaluate(() => {
      const de = document.documentElement, card = document.querySelector('.availability-card'), q = (s) => document.querySelector(s);
      const r = card.getBoundingClientRect(), first = card.firstElementChild;
      return { clientWidth: de.clientWidth, scrollWidth: de.scrollWidth, releaseNoticePresent: !!q('.release-preview'),
        availabilityCardFirstChild: first.className, availabilityCard: [Math.round(r.width), Math.round(r.height)],
        availabilityCopy: q('[data-availability-copy]').textContent, faq: q('[data-availability-faq]').textContent, kicker: q('[data-availability-kicker]').textContent,
        iosLinks: [...document.querySelectorAll('[data-store-link="ios"]')].map((a) => a.href), androidLinks: [...document.querySelectorAll('[data-store-link="android"]')].map((a) => a.href),
        scripts: [...document.scripts].map((s) => s.getAttribute('src')), ogImage: q('meta[property="og:image"]').content,
        brokenImages: [...document.images].filter((i) => i.complete && !i.naturalWidth).map((i) => i.src) };
    });
    report.push({ page: '/', viewport: width, availabilityAnswerClearOfHeader: faqClear, ...m, horizontalOverflow: m.scrollWidth > m.clientWidth, thirdPartyRequests: requests.filter((u) => /^https?:/.test(u)), failedRequests: failed, screenshots: shots });
    const g = await ctx.newPage(); await g.goto(base + '/get/', { waitUntil: 'networkidle' });
    await g.screenshot({ path: `${out}/get-${width}.png`, fullPage: true });
    const gm = await g.evaluate(() => ({ clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth, links: [...document.links].map((a) => a.getAttribute('href')), note: document.querySelector('.get-note').innerText }));
    report.push({ page: '/get/', viewport: width, ...gm, horizontalOverflow: gm.scrollWidth > gm.clientWidth, screenshots: [`get-${width}.png`] });
    await ctx.close();
  }
} finally { await browser.close(); srv.kill(); }
writeFileSync(out + '/visual-report.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report.map((r) => ({ page: r.page, viewport: r.viewport, overflow: r.horizontalOverflow, notice: r.releaseNoticePresent, faqClear: r.availabilityAnswerClearOfHeader, first: r.availabilityCardFirstChild, ios: r.iosLinks, faq: r.faq, failed: r.failedRequests, broken: r.brokenImages, note: r.note })), null, 1));

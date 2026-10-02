// Screenshots and layout facts for the 0.7.10 post. Usage: node shots.mjs <mannamila-web root> [post id]
// Installed Chrome via Playwright (channel 'chrome'); adapted from docs/privacy-0.7.10-eu27/tools/shots.mjs.
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
const require = createRequire('/Volumes/Dev/Code/notetaker/node_modules/');
const { chromium } = require('playwright');
const W = process.argv[2], id = process.argv[3] || '2026-10-02', out = W + '/docs/updates-0.7.10', port = 8751, base = `http://127.0.0.1:${port}`;
const srv = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1', '--directory', W + '/skald'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 1200));
const browser = await chromium.launch({ channel: 'chrome' });
const report = [];
try {
  for (const width of [390, 1280]) {
    const ctx = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 }, isMobile: width === 390, hasTouch: width === 390, deviceScaleFactor: 1 });
    const page = await ctx.newPage(); const failed = [], requests = [];
    page.on('requestfailed', (r) => failed.push(r.url())); page.on('request', (r) => requests.push(r.url().replace(base, '')));
    await page.goto(base + '/updates/', { waitUntil: 'networkidle' });
    await page.screenshot({ path: `${out}/updates-${width}-top.png` });
    const post = page.locator(`article[id="${id}"]`);
    await post.locator('.art-carousel').scrollIntoViewIfNeeded();
    await page.waitForFunction((id) => [...document.querySelectorAll(`article[id="${id}"] img`)].every((i) => i.complete && i.naturalWidth > 0), id);
    await post.screenshot({ path: `${out}/post-${width}.png` });
    await post.locator('.art-carousel').screenshot({ path: `${out}/post-${width}-coins.png` });
    const m = await page.evaluate((id) => {
      const de = document.documentElement, a = document.getElementById(id), vw = de.clientWidth;
      const outside = [...a.querySelectorAll('*')].filter((e) => !e.closest('.art-track')).filter((e) => { const r = e.getBoundingClientRect(); return r.right > vw + 0.5 || r.left < -0.5; }).map((e) => e.tagName + '.' + e.className);
      return { innerWidth, clientWidth: vw, scrollWidth: de.scrollWidth, bodyScrollWidth: document.body.scrollWidth, firstArticle: document.querySelector('article.post').id,
        elementsOutsideViewportExcludingCarouselTrack: outside,
        images: [...a.querySelectorAll('img')].map((i) => { const r = i.getBoundingClientRect(); return { src: i.getAttribute('src'), complete: i.complete, natural: [i.naturalWidth, i.naturalHeight], rendered: [Math.round(r.width), Math.round(r.height)] }; }),
        scripts: [...document.scripts].map((s) => s.getAttribute('src')), ogDescription: document.querySelector('meta[property="og:description"]').content, title: document.title };
    }, id);
    await post.locator('[data-art-next]').click(); await page.waitForTimeout(900);
    await post.locator('.art-carousel').screenshot({ path: `${out}/post-${width}-coins-second.png` });
    report.push({ viewport: width, ...m, horizontalOverflow: m.scrollWidth > m.clientWidth,
      thirdPartyRequests: requests.filter((u) => /^https?:/.test(u)), requests, failedRequests: failed,
      screenshots: [`updates-${width}-top.png`, `post-${width}.png`, `post-${width}-coins.png`, `post-${width}-coins-second.png`] });
    await ctx.close();
  }
} finally { await browser.close(); srv.kill(); }
writeFileSync(out + '/visual-report.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 1));

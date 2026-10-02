import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
const require = createRequire('/Volumes/Dev/Code/notetaker/node_modules/');
const { chromium } = require('playwright');
const W='/Volumes/Dev/Code/mannamila-web-eu27', out=W+'/docs/privacy-0.7.10-eu27';
const srv = spawn('python3',['-m','http.server','8747','--bind','127.0.0.1','--directory',W+'/skald'],{stdio:'ignore'});
await new Promise(r=>setTimeout(r,1200));
const browser = await chromium.launch({ channel:'chrome' });
const report=[];
try {
for (const [lang,path,eu] of [['en','/privacy/','If you are in the European Union'],['fr','/privacy/fr/','Si vous êtes dans l’Union européenne']])
  for (const width of [390,1280]) {
    const ctx = await browser.newContext({ viewport:{width,height: width===390?844:900}, isMobile: width===390, hasTouch: width===390, deviceScaleFactor: 1 });
    const page = await ctx.newPage(); const failed=[]; const requests=[];
    page.on('requestfailed',r=>failed.push(r.url())); page.on('request',r=>requests.push(r.url().replace('http://127.0.0.1:8747','')));
    await page.goto('http://127.0.0.1:8747'+path,{waitUntil:'networkidle'});
    await page.screenshot({path:`${out}/${lang}-${width}.png`});
    const m = await page.evaluate((eu)=>{ const de=document.documentElement; const h=[...document.querySelectorAll('h2')].find(x=>x.textContent===eu); h&&h.scrollIntoView();
      return {innerWidth, clientWidth:de.clientWidth, scrollWidth:de.scrollWidth, title:document.title, lang:de.lang, h1:document.querySelector('h1').textContent,
        lastUpdated:(document.querySelector('.meta').textContent.match(/\d{4}-\d\d-\d\d/)||[])[0], euSectionHeadingFound:!!h,
        headings:document.querySelectorAll('h2,h3').length, scripts:[...document.scripts].map(s=>s.getAttribute('src'))}; }, eu);
    await page.screenshot({path:`${out}/${lang}-${width}-eu-section.png`});
    report.push({lang,viewport:width,width:m.innerWidth,clientWidth:m.clientWidth,scrollWidth:m.scrollWidth,horizontalOverflow:m.scrollWidth>m.clientWidth,
      title:m.title,htmlLang:m.lang,h1:m.h1,lastUpdated:m.lastUpdated,headings:m.headings,euSectionHeadingFound:m.euSectionHeadingFound,scripts:m.scripts,
      requests,failedRequests:failed,screenshot:`${lang}-${width}.png`,euSectionScreenshot:`${lang}-${width}-eu-section.png`});
    await ctx.close();
  }
} finally { await browser.close(); srv.kill(); }
writeFileSync(out+'/visual-report.json', JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report.map(r=>[r.lang,r.viewport,r.width,r.scrollWidth,r.horizontalOverflow,r.lastUpdated,r.headings,r.euSectionHeadingFound,r.requests,r.failedRequests])));

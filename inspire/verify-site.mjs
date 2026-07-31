#!/usr/bin/env node

// Mila Inspire — full product-site verifier (replaces the coming-soon stub
// verifier). Modeled on squash/verify-site.mjs, adapted for a child-directed
// site: no forms, no iframes, no third-party requests, weight budget.

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { access, readdir, readFile, stat } from "node:fs/promises";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const read = (path) => readFile(join(root, path), "utf8");
const toPosix = (path) => path.split(sep).join("/");

const requiredFiles = [
  "index.html",
  "styles.css",
  "app.js",
  "retire-analytics.js",
  "availability.json",
  "site-config.json",
  "privacy/index.html",
  "support/index.html",
  "assets/mila-inspire-og.jpg",
  "assets/launcher-tiles.jpg",
  "assets/echo-typing.jpg",
  "assets/shop-real-money.jpg",
  "assets/sorting-by-color.jpg",
  "assets/parent-stats.jpg",
];

await Promise.all(requiredFiles.map((path) => access(join(root, path))));

const [index, styles, app, privacy, support, availabilityRaw, configRaw] = await Promise.all([
  read("index.html"),
  read("styles.css"),
  read("app.js"),
  read("privacy/index.html"),
  read("support/index.html"),
  read("availability.json"),
  read("site-config.json"),
]);

// --- availability.json: two store platforms, safe states only. ---
const availability = JSON.parse(availabilityRaw);
const allowedStates = new Set(["review", "available"]);
const storeUrlRules = {
  play: /^https:\/\/play\.google\.com\/store\/apps\//,
  appstore: /^https:\/\/apps\.apple\.com\//,
};
for (const platform of ["play", "appstore"]) {
  assert.equal(typeof availability[platform], "object", `${platform} availability is required`);
  assert.ok(
    allowedStates.has(availability[platform].state),
    `${platform} state must be review or available`,
  );
  if (availability[platform].state === "available") {
    assert.match(
      availability[platform].storeUrl ?? "",
      storeUrlRules[platform],
      `${platform} needs a trusted store URL when available`,
    );
  }
}
assert.match(availability.lastVerifiedAt, /^\d{4}-\d{2}-\d{2}T/, "lastVerifiedAt must be ISO-8601");

// --- site-config.json: squash schema minus the Google-Form field. This site
// deliberately has no waitlist form (child-directed; no data collection). ---
const config = JSON.parse(configRaw);
assert.equal(config.product, "Mila Inspire");
assert.equal(config.canonicalOrigin, "https://inspire.mannamila.com");
assert.equal(config.waitlistFormUrl, null, "this site must not configure a waitlist form");

// --- Route-level contracts shared by every HTML page. ---
const routes = [
  { name: "index.html", html: index, canonical: "https://inspire.mannamila.com/", loader: "./retire-analytics.js" },
  { name: "privacy/index.html", html: privacy, canonical: "https://inspire.mannamila.com/privacy/", loader: "../retire-analytics.js" },
  { name: "support/index.html", html: support, canonical: "https://inspire.mannamila.com/support/", loader: "../retire-analytics.js" },
];

for (const route of routes) {
  assert.match(route.html, /<html lang="en">/, `${route.name} must declare lang`);
  assert.match(
    route.html,
    new RegExp(`<link rel="canonical" href="${route.canonical.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")}">`),
    `${route.name} must carry its canonical URL`,
  );
  assert.match(
    route.html,
    new RegExp(`<script src="${route.loader.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")}" defer></script>`),
    `${route.name} must load the analytics-retirement script`,
  );
  assert.match(route.html, /<meta name="theme-color" content="#f4f1eb">/, `${route.name} must keep the calm cream theme-color`);

  // Child-directed hard bans: no forms, no iframes, no embeds, no autoplay,
  // no analytics, and no third-party subresources of any kind.
  for (const forbidden of [
    /<form\b/i,
    /<iframe\b/i,
    /<embed\b/i,
    /<object\b/i,
    /<video\b/i,
    /<audio\b/i,
    /autoplay/i,
    /googletagmanager|google-analytics|\bgtag\b|\bG-[A-Z0-9]{8,}\b/i,
    /fonts\.googleapis|fonts\.gstatic|preconnect/i,
    /<(?:script|img)\b[^>]*src="(?:https?:)?\/\//i,
    /<link\b(?![^>]*rel="canonical")[^>]*href="(?:https?:)?\/\//i,
  ]) {
    assert.doesNotMatch(route.html, forbidden, `${route.name} contains forbidden markup: ${forbidden}`);
  }

  // Every image needs meaningful alt text.
  for (const [tag] of route.html.matchAll(/<img\b[^>]*>/g)) {
    assert.match(tag, /\balt="[^"]+"/, `${route.name} image needs meaningful alt text: ${tag}`);
  }

  // Every same-directory-relative reference must resolve to a real file.
  const routeDir = dirname(join(root, route.name));
  for (const match of route.html.matchAll(/(?:src|href)="(\.{1,2}\/[^"#?]*)"/g)) {
    const target = match[1].endsWith("/") ? `${match[1]}index.html` : match[1];
    await access(join(routeDir, target));
  }
}

// --- Landing page content. ---
const expectedIndexText = [
  "Mila Inspire",
  "MannaMila LLC",
  "A calm home screen full of learning activities.",
  "designed with autistic children in mind",
  "welcoming to every young learner",
  "ages 6 and up",
  "Sixteen activities",
  "No ads. No accounts. No timers.",
  "Everything stays on your tablet.",
  "Wrong answers are silent",
  "not a medical or therapeutic product",
  "4-digit PIN",
  "Parent Stats",
  "completely offline",
  "One-time purchase",
  "No in-app purchases in this version.",
  "Android tablets",
  "iPad",
  "Google Play",
  "App Store",
];
for (const expected of expectedIndexText) {
  assert.ok(index.includes(expected), `index.html must include: ${expected}`);
}

const activityNames = [
  "Mila Echo",
  "Mila Objects",
  "Mila Direction",
  "Mila Sequence",
  "Mila Sorting",
  "Mila Positions",
  "Mila Puzzle",
  "Mila Mirror",
  "Mila Enantiomorphs",
  "Mila Visual Memory",
  "Mila Snake",
  "Mila Maze",
  "Mila Launch",
  "Mila Chemistry",
  "Mila Math",
  "Mila Shop",
];
for (const name of activityNames) {
  assert.ok(index.includes(`<h3>${name}</h3>`), `index.html activity grid must include ${name}`);
}
assert.equal(
  [...index.matchAll(/<ul class="activity-grid"[^>]*>([\s\S]*?)<\/ul>/g)][0][1].match(/<li>/g).length,
  16,
  "the activity grid must hold exactly 16 tiles",
);

for (const id of ["what-it-is", "activities", "privacy-promise", "parents", "stores"]) {
  assert.match(index, new RegExp(`id="${id}"`), `index.html must expose #${id}`);
}

assert.match(index, /class="skip-link"/, "index.html must keep the skip link");
assert.match(index, /<meta property="og:url" content="https:\/\/inspire\.mannamila\.com\/">/);
assert.match(index, /<meta property="og:image" content="https:\/\/inspire\.mannamila\.com\/assets\/mila-inspire-og\.jpg">/);
assert.match(index, /data-availability-copy/);
assert.match(index, /data-availability-kicker/);
assert.match(index, /data-store-link="play"/);
assert.match(index, /data-store-link="appstore"/);
assert.match(index, /href="https:\/\/www\.mannamila\.com\/"/);
assert.match(index, /<footer class="site-footer">[\s\S]*href="\.\/privacy\/"[\s\S]*<\/footer>/, "footer must link ./privacy/");
assert.match(index, /<footer class="site-footer">[\s\S]*href="\.\/support\/"[\s\S]*<\/footer>/, "footer must link ./support/");
assert.doesNotMatch(index, /mailto:/i, "landing page contact goes through ./support/, not mailto");
assert.doesNotMatch(
  index,
  /<meta\b[^>]+(?:property="og:description"|name="twitter:description")[^>]+content="[^"]*Coming soon/i,
  "social metadata must stay release-neutral",
);

// --- Styles: calm identity and accessibility affordances. ---
assert.match(styles, /#f4f1eb/i, "styles must keep the warm cream background");
assert.match(styles, /:focus-visible/);
assert.match(styles, /prefers-reduced-motion/);
assert.match(styles, /@media \(max-width: 560px\)/);
assert.doesNotMatch(styles, /@import\b/i);
assert.doesNotMatch(styles, /url\(\s*["']?https?:/i, "styles must not fetch external resources");
assert.doesNotMatch(styles, /@keyframes|animation:/i, "no keyframe animation on a low-stimulation site");

// --- app.js: fail-safe availability loader with trusted store hosts only. ---
assert.match(app, /REVIEW_AVAILABILITY/);
assert.match(app, /normalizePlatform/);
assert.match(app, /play\.google\.com/);
assert.match(app, /apps\.apple\.com/);
assert.match(app, /availability\.json/);
assert.match(app, /\.catch\(/, "runtime configuration must fail safely");
assert.doesNotMatch(app, /createElement\(\s*["']iframe/i);
assert.doesNotMatch(app, /IntersectionObserver/, "no scroll-reveal animation on this site");

// --- Privacy page: verbatim anchors from the legally reviewed policy. ---
const expectedPrivacyText = [
  "Mila Inspire — Privacy Policy",
  "<strong>Effective date:</strong> July 17, 2026",
  "<strong>Last updated:</strong> July 17, 2026",
  "https://inspire.mannamila.com/privacy/",
  "we collect no personal information from anyone, including children, and the app transmits nothing.",
  "The app sends <strong>nothing</strong> off your device. It works fully offline.",
  "COPPA (the U.S. Children's Online Privacy Protection Act)",
  "Photos are stored on the device and never uploaded anywhere.",
  "No analytics or crash reporting.",
  "Permissions we request and why",
  "Backups and device transfer",
  "Delete all child data",
  "privacy@mannamila.com",
  "support@mannamila.com",
  "Mila Inspire is an educational app, not a medical or therapeutic product.",
];
for (const expected of expectedPrivacyText) {
  assert.ok(privacy.includes(expected), `privacy/index.html must include: ${expected}`);
}
assert.match(privacy, /<table>[\s\S]*Camera[\s\S]*Photo library[\s\S]*Vibration[\s\S]*<\/table>/, "the permissions table must survive verbatim");
assert.match(privacy, /href="\.\.\/"/, "privacy page must link back to the landing page");
assert.doesNotMatch(privacy, /www\.mannamila\.com\/mila-inspire\/privacy/, "the canonical-URL line must point at this site");
assert.doesNotMatch(privacy, /TODO/i, "no internal TODO markers on the public policy");

// --- Support page. ---
assert.match(support, /mailto:support@mannamila\.com\?subject=Mila%20Inspire%20support/);
assert.match(support, /mailto:privacy@mannamila\.com/);
assert.match(support, /href="\.\.\/privacy\/"/);
assert.match(support, /href="\.\.\/"/);
assert.ok(support.includes("fully offline"), "support page must state the app is fully offline");
assert.ok(
  support.includes("The default PIN is documented inside the app"),
  "support page must point at the in-app PIN documentation without printing the PIN",
);
assert.doesNotMatch(support, /\b1111\b/, "never print the default PIN on the public site");

// --- Weight budget: the whole site stays modest. ---
const walk = async (dir) => {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(absolute)));
    else if (entry.isFile()) files.push(absolute);
  }
  return files;
};
let totalBytes = 0;
for (const file of await walk(root)) {
  if (toPosix(relative(root, file)) === "verify-site.mjs") continue;
  totalBytes += (await stat(file)).size;
}
assert.ok(
  totalBytes < 1_500_000,
  `total site weight must stay under 1.5 MB (currently ${totalBytes} bytes)`,
);

// --- Shared analytics-retirement contract. ---
const analyticsVerification = spawnSync(
  process.execPath,
  [join(root, "../scripts/test-analytics-contract.mjs")],
  {
    cwd: root,
    encoding: "utf8",
  },
);
if (analyticsVerification.status !== 0) {
  throw new Error(
    `Analytics verification failed:\n${analyticsVerification.stderr || analyticsVerification.stdout}`,
  );
}
process.stdout.write(analyticsVerification.stdout);

console.log(`Mila Inspire site verification passed (${totalBytes} bytes across the public tree).`);

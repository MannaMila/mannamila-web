import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const read = (path) => readFile(join(root, path), "utf8");

const requiredFiles = [
  "index.html",
  "styles.css",
  "app.js",
  "availability.json",
  "site-config.json",
  "privacy/index.html",
  "updates-privacy/index.html",
  "waitlist-privacy/index.html",
  "support/index.html",
  "assets/app-store-badge.svg",
  "assets/google-play-badge.png",
  "assets/reader-art.webp",
  "assets/greek-split.webp",
  "assets/museum-guide.webp",
  "assets/nostos-route.webp",
  "assets/skald-odyssey-og.jpg",
];

await Promise.all(requiredFiles.map((path) => access(join(root, path))));

const [index, styles, app, privacy, updatesPrivacy, waitlistPrivacy, support, availabilityRaw, configRaw] =
  await Promise.all([
    read("index.html"),
    read("styles.css"),
    read("app.js"),
    read("privacy/index.html"),
    read("updates-privacy/index.html"),
    read("waitlist-privacy/index.html"),
    read("support/index.html"),
    read("availability.json"),
    read("site-config.json"),
  ]);

const availability = JSON.parse(availabilityRaw);
const config = JSON.parse(configRaw);
for (const platform of ["android", "ios"]) {
  assert.equal(typeof availability[platform], "object", `${platform} availability is required`);
  assert.equal(availability[platform].state, "available", `${platform} must be launched`);
}
assert.equal(
  availability.android.storeUrl,
  "https://play.google.com/store/apps/details?id=com.mannamila.skald",
);
assert.equal(
  availability.ios.storeUrl,
  "https://apps.apple.com/us/app/skald-odyssey/id6790579937",
);
assert.match(availability.lastVerifiedAt, /^\d{4}-\d{2}-\d{2}T/, "lastVerifiedAt must be ISO-8601");

assert.equal(typeof config.updatesFormUrl, "string", "updatesFormUrl must be centralized in site-config.json");
assert.match(config.updatesFormUrl, /^https:\/\/docs\.google\.com\/forms\//, "updatesFormUrl must be a Google Forms URL");
if (!process.env.SKALD_ALLOW_PLACEHOLDER_FORM) {
  assert.doesNotMatch(
    config.updatesFormUrl,
    /REPLACE_WITH_PUBLIC_FORM_ID/,
    "replace the temporary public Google Form URL before publishing",
  );
}

const expectedIndexText = [
  "One Odyssey.",
  "A shelf of ways through.",
  "Launched July 22, 2026",
  "Available now on Android, iPhone, and iPad.",
  "all 24 books",
  "1-, 5-, or 20-minute",
  "nine historical public-domain translations",
  "six English translations",
  "Spanish, French, and German",
  "One-time purchase",
  "No subscription, ads, app account, or in-app purchases.",
  "United States, Canada, Australia, and New Zealand",
  "Get the app",
  "Product updates",
  "Keep following the voyage.",
  "Questions before you set sail",
];
for (const expected of expectedIndexText) {
  assert.ok(index.includes(expected), `index.html must include: ${expected}`);
}

for (const id of ["get-skald", "inside", "depth", "translations", "journey", "art", "offline", "edition", "updates", "waitlist", "faq"]) {
  assert.match(index, new RegExp(`id=["']${id}["']`), `index.html must expose #${id}`);
}

assert.match(index, /<link rel="canonical" href="https:\/\/skald\.mannamila\.com\/">/);
assert.match(index, /href="\.\/styles\.css\?v=20260722"/);
assert.match(index, /data-availability-copy/);
assert.match(
  index,
  /data-store-link="android" href="https:\/\/play\.google\.com\/store\/apps\/details\?id=com\.mannamila\.skald"/,
);
assert.match(
  index,
  /data-store-link="ios" href="https:\/\/apps\.apple\.com\/us\/app\/skald-odyssey\/id6790579937"/,
);
assert.match(index, /src="\.\/assets\/app-store-badge\.svg"/);
assert.match(index, /src="\.\/assets\/google-play-badge\.png"/);
assert.match(index, /data-updates-container/);
assert.match(index, /src="\.\/assets\/nostos-route\.webp"/);
assert.match(index, /alt="Skald voyage map tracing Odysseus's route from Troy across the Mediterranean and back to Ithaca\."/);
assert.match(index, /href="\.\/updates-privacy\/"/);
assert.match(index, /href="https:\/\/www\.mannamila\.com\/"/);
assert.match(index, /<meta property="og:image" content="https:\/\/skald\.mannamila\.com\/assets\/skald-odyssey-og\.jpg">/);
assert.doesNotMatch(
  index,
  /<meta\b[^>]+(?:property="og:description"|name="twitter:description")[^>]+content="[^"]*Coming to/i,
  "social metadata must stay release-neutral",
);

const forbiddenIndexText = [
  /coming soon/i,
  /under store review/i,
  /planned for/i,
  />[^<]*waitlist[^<]*</i,
  /android beta/i,
  /join the beta/i,
  /\$\s*\d/,
  /Folio Society/i,
  /Emily Wilson/i,
  /Loeb Classical/i,
  /Gareth Hinds/i,
  /157\s+art images/i,
  /265\s+in-text placements/i,
  /152\s+catalogued works/i,
  /26\s+marked on view/i,
  /href="mailto:support@mannamila\.com/i,
];
for (const forbidden of forbiddenIndexText) {
  assert.doesNotMatch(index, forbidden, `index.html contains forbidden launch copy: ${forbidden}`);
}

const images = [...index.matchAll(/<img\b[^>]*>/g)].map(([tag]) => tag);
assert.ok(images.length >= 3, "landing page should retain real product imagery");
for (const image of images) {
  assert.match(image, /\balt="[^"]+"/, `image needs meaningful alt text: ${image}`);
}

for (const match of index.matchAll(/(?:src|href)="\.\/([^"#?]+)"/g)) {
  const target = match[1].endsWith("/") ? `${match[1]}index.html` : match[1];
  await access(join(root, target));
}

assert.match(app, /LAUNCHED_AVAILABILITY/);
assert.doesNotMatch(app, /REVIEW_AVAILABILITY/);
assert.match(app, /normalizePlatform/);
assert.match(app, /availability\.json/);
assert.match(app, /site-config\.json/);
assert.match(app, /\.catch\(/, "runtime configuration must fail safely");
assert.match(styles, /:focus-visible/);
assert.match(styles, /prefers-reduced-motion/);
assert.match(styles, /@media \(max-width: 560px\)/);
assert.match(styles, /main\s*\{[^}]*overflow-x:\s*clip;/s);

assert.match(privacy, /https:\/\/skald\.mannamila\.com\/privacy\//g);
assert.match(privacy, /\.\.\/updates-privacy\//);
assert.match(updatesPrivacy, /https:\/\/skald\.mannamila\.com\/updates-privacy\//g);
assert.match(updatesPrivacy, /Google Forms and Google Sheets/);
assert.match(updatesPrivacy, /once per calendar month/i);
assert.match(updatesPrivacy, /24 months after you sign up/i);
assert.match(updatesPrivacy, /90 days after we notified you that your selected platform was available/i);
assert.match(updatesPrivacy, /responses submitted before July 22, 2026/i);
assert.doesNotMatch(updatesPrivacy, /consent text or version associated with it/i);
assert.match(updatesPrivacy, /unsubscribe/i);
assert.match(waitlistPrivacy, /http-equiv="refresh"/i);
assert.match(waitlistPrivacy, /url=\.\.\/updates-privacy\//i);
assert.match(waitlistPrivacy, /rel="canonical" href="https:\/\/skald\.mannamila\.com\/updates-privacy\/"/);
assert.match(support, /https:\/\/skald\.mannamila\.com\/support\//g);
assert.match(support, /href="\.\.\/"/);
assert.match(support, /href="\.\.\/privacy\/"/);
assert.match(support, /href="\.\.\/updates-privacy\/"/);

console.log("Skald site verification passed.");

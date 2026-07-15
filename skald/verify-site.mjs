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
  "waitlist-privacy/index.html",
  "support/index.html",
  "assets/reader-art.webp",
  "assets/greek-split.webp",
  "assets/museum-guide.webp",
  "assets/nostos-route.webp",
  "assets/skald-odyssey-og.jpg",
];

await Promise.all(requiredFiles.map((path) => access(join(root, path))));

const [index, styles, app, privacy, waitlistPrivacy, support, availabilityRaw, configRaw] =
  await Promise.all([
    read("index.html"),
    read("styles.css"),
    read("app.js"),
    read("privacy/index.html"),
    read("waitlist-privacy/index.html"),
    read("support/index.html"),
    read("availability.json"),
    read("site-config.json"),
  ]);

const availability = JSON.parse(availabilityRaw);
const config = JSON.parse(configRaw);
const allowedStates = new Set(["review", "available"]);

for (const platform of ["android", "ios"]) {
  assert.equal(typeof availability[platform], "object", `${platform} availability is required`);
  assert.ok(allowedStates.has(availability[platform].state), `${platform} state must be review or available`);
  if (availability[platform].state === "available") {
    assert.match(
      availability[platform].storeUrl ?? "",
      /^https:\/\//,
      `${platform} needs an HTTPS store URL when available`,
    );
  }
}
assert.match(availability.lastVerifiedAt, /^\d{4}-\d{2}-\d{2}T/, "lastVerifiedAt must be ISO-8601");

assert.equal(typeof config.waitlistFormUrl, "string", "waitlistFormUrl must be centralized in site-config.json");
assert.match(config.waitlistFormUrl, /^https:\/\/docs\.google\.com\/forms\//, "waitlistFormUrl must be a Google Forms URL");
if (!process.env.SKALD_ALLOW_PLACEHOLDER_FORM) {
  assert.doesNotMatch(
    config.waitlistFormUrl,
    /REPLACE_WITH_PUBLIC_FORM_ID/,
    "replace the temporary public Google Form URL before publishing",
  );
}

const expectedIndexText = [
  "One Odyssey.",
  "A shelf of ways through.",
  "Coming soon to Android, iPhone, and iPad.",
  "Currently under store review.",
  "all 24 books",
  "1-, 5-, or 20-minute",
  "nine historical public-domain translations",
  "six English translations",
  "Spanish, French, and German",
  "One-time purchase",
  "No subscription, ads, app account, or in-app purchases.",
  "United States, Canada, Australia, and New Zealand",
  "Join the launch waitlist",
  "Questions before you set sail",
];
for (const expected of expectedIndexText) {
  assert.ok(index.includes(expected), `index.html must include: ${expected}`);
}

for (const id of ["inside", "depth", "translations", "journey", "art", "offline", "edition", "waitlist", "faq"]) {
  assert.match(index, new RegExp(`id=["']${id}["']`), `index.html must expose #${id}`);
}

assert.match(index, /<link rel="canonical" href="https:\/\/skald\.mannamila\.com\/">/);
assert.match(index, /data-availability-copy/);
assert.match(index, /data-store-link="android"/);
assert.match(index, /data-store-link="ios"/);
assert.match(index, /data-waitlist-container/);
assert.match(index, /src="\.\/assets\/nostos-route\.webp"/);
assert.match(index, /alt="Skald voyage map tracing Odysseus's route from Troy across the Mediterranean and back to Ithaca\."/);
assert.match(index, /href="\.\/waitlist-privacy\/"/);
assert.match(index, /href="https:\/\/www\.mannamila\.com\/"/);
assert.match(index, /<meta property="og:image" content="https:\/\/skald\.mannamila\.com\/assets\/skald-odyssey-og\.jpg">/);
assert.doesNotMatch(
  index,
  /<meta\b[^>]+(?:property="og:description"|name="twitter:description")[^>]+content="[^"]*Coming to/i,
  "social metadata must stay release-neutral",
);

const forbiddenIndexText = [
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

assert.match(app, /REVIEW_AVAILABILITY/);
assert.match(app, /normalizePlatform/);
assert.match(app, /availability\.json/);
assert.match(app, /site-config\.json/);
assert.match(app, /\.catch\(/, "runtime configuration must fail safely");
assert.match(styles, /:focus-visible/);
assert.match(styles, /prefers-reduced-motion/);
assert.match(styles, /@media \(max-width: 560px\)/);

assert.match(privacy, /https:\/\/skald\.mannamila\.com\/privacy\//g);
assert.match(privacy, /\.\.\/waitlist-privacy\//);
assert.match(waitlistPrivacy, /https:\/\/skald\.mannamila\.com\/waitlist-privacy\//g);
assert.match(waitlistPrivacy, /Google Forms and Google Sheets/);
assert.match(waitlistPrivacy, /once per calendar month/i);
assert.match(waitlistPrivacy, /unsubscribe/i);
assert.match(support, /https:\/\/skald\.mannamila\.com\/support\//g);
assert.match(support, /href="\.\.\/"/);
assert.match(support, /href="\.\.\/privacy\/"/);

console.log("Skald site verification passed.");

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
  "assets/mila-squash-og.jpg",
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

assert.equal(typeof availability.quest, "object", "quest availability is required");
assert.ok(allowedStates.has(availability.quest.state), "quest state must be review or available");
if (availability.quest.state === "available") {
  assert.match(
    availability.quest.storeUrl ?? "",
    /^https:\/\/www\.meta\.com\//,
    "quest needs a Meta Horizon Store URL when available",
  );
}
assert.match(availability.lastVerifiedAt, /^\d{4}-\d{2}-\d{2}T/, "lastVerifiedAt must be ISO-8601");

assert.equal(typeof config.waitlistFormUrl, "string", "waitlistFormUrl must be centralized in site-config.json");
assert.match(config.waitlistFormUrl, /^https:\/\/docs\.google\.com\/forms\//, "waitlistFormUrl must be a Google Forms URL");
if (!process.env.SQUASH_ALLOW_PLACEHOLDER_FORM) {
  assert.doesNotMatch(
    config.waitlistFormUrl,
    /REPLACE_WITH_PUBLIC_FORM_ID/,
    "replace the temporary public Google Form URL before publishing",
  );
}

const expectedIndexText = [
  "Mila Squash",
  "Coming soon to Meta Quest 3.",
  "Currently in store review.",
  "regulation-size",
  "WSF",
  "double-yellow ball",
  "depth, tightness, and tempo",
  "legal-or-fault",
  "saved privately on your headset",
  "Built for realism over arcade fun.",
  "Standing play, controllers, solo focus.",
  "Join the launch waitlist",
  "MannaMila LLC",
];
for (const expected of expectedIndexText) {
  assert.ok(index.includes(expected), `index.html must include: ${expected}`);
}

for (const id of ["inside", "coaching", "realism", "privacy-first", "scope", "waitlist", "faq"]) {
  assert.match(index, new RegExp(`id=["']${id}["']`), `index.html must expose #${id}`);
}

assert.match(index, /<link rel="canonical" href="https:\/\/squash\.mannamila\.com\/">/);
assert.match(index, /data-availability-copy/);
assert.match(index, /data-store-link="quest"/);
assert.match(index, /data-availability-faq/);
assert.match(index, /data-waitlist-container/);
assert.match(index, /href="\.\/waitlist-privacy\/"/);
assert.match(index, /href="\.\/privacy\/"/);
assert.match(index, /href="https:\/\/www\.mannamila\.com\/"/);
assert.match(index, /<meta property="og:image" content="https:\/\/squash\.mannamila\.com\/assets\/mila-squash-og\.jpg">/);
assert.doesNotMatch(
  index,
  /<meta\b[^>]+(?:property="og:description"|name="twitter:description")[^>]+content="[^"]*Coming to/i,
  "social metadata must stay release-neutral",
);

const forbiddenIndexText = [
  /multiplayer mode/i,
  /play (rallies|rally|matches)/i,
  /\bBoast\b/,
  /hand.?tracking/i,
  /room.?scale/i,
  /full.?court play/i,
  /trends dashboard/i,
  /history export/i,
  /early access price/i,
  /\$\s*\d/,
  /join the beta/i,
  /href="mailto:support@mannamila\.com/i,
];
for (const forbidden of forbiddenIndexText) {
  assert.doesNotMatch(index, forbidden, `index.html contains forbidden launch copy: ${forbidden}`);
}

const images = [...index.matchAll(/<img\b[^>]*>/g)].map(([tag]) => tag);
for (const image of images) {
  assert.match(image, /\balt="[^"]+"/, `image needs meaningful alt text: ${image}`);
}
assert.match(index, /role="img" aria-label="[^"]+"/, "CSS visuals must carry img roles with labels");

for (const match of index.matchAll(/(?:src|href)="\.\/([^"#?]+)"/g)) {
  const target = match[1].endsWith("/") ? `${match[1]}index.html` : match[1];
  await access(join(root, target));
}

assert.match(app, /REVIEW_AVAILABILITY/);
assert.match(app, /normalizePlatform/);
assert.match(app, /www\.meta\.com/);
assert.match(app, /availability\.json/);
assert.match(app, /site-config\.json/);
assert.match(app, /\.catch\(/, "runtime configuration must fail safely");
assert.match(styles, /:focus-visible/);
assert.match(styles, /prefers-reduced-motion/);
assert.match(styles, /@media \(max-width: 560px\)/);

assert.match(privacy, /https:\/\/squash\.mannamila\.com\/privacy\//g);
assert.match(privacy, /\.\.\/waitlist-privacy\//);
assert.match(privacy, /com\.mannamila\.milasquash/);
assert.match(privacy, /never uploaded/i);
assert.match(waitlistPrivacy, /https:\/\/squash\.mannamila\.com\/waitlist-privacy\//g);
assert.match(waitlistPrivacy, /Google Forms and Google Sheets/);
assert.match(waitlistPrivacy, /once per calendar month/i);
assert.match(waitlistPrivacy, /unsubscribe/i);
assert.match(support, /https:\/\/squash\.mannamila\.com\/support\//g);
assert.match(support, /href="\.\.\/"/);
assert.match(support, /href="\.\.\/privacy\/"/);

console.log("Mila Squash site verification passed.");

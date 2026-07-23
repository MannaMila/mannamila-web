import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
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
  "feedback/index.html",
  "feedback/privacy/index.html",
  "feedback/styles.css",
  "assets/reader-art.webp",
  "assets/greek-split.webp",
  "assets/museum-guide.webp",
  "assets/nostos-route.webp",
  "assets/skald-odyssey-og.jpg",
];

await Promise.all(requiredFiles.map((path) => access(join(root, path))));

const [
  index,
  styles,
  app,
  privacy,
  waitlistPrivacy,
  support,
  feedback,
  feedbackPrivacy,
  feedbackStyles,
  availabilityRaw,
  configRaw,
] =
  await Promise.all([
    read("index.html"),
    read("styles.css"),
    read("app.js"),
    read("privacy/index.html"),
    read("waitlist-privacy/index.html"),
    read("support/index.html"),
    read("feedback/index.html"),
    read("feedback/privacy/index.html"),
    read("feedback/styles.css"),
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

const feedbackFormBase =
  "https://docs.google.com/forms/d/e/1FAIpQLScGu1umz6mnHZlqETLozIl0cxc4qgZ61wVpJLrOoPbo0PcBLA/viewform";
assert.match(feedback, /https:\/\/skald\.mannamila\.com\/feedback\//g);
assert.ok(feedback.includes(feedbackFormBase), "feedback page must link to the public form");
assert.match(feedback, /entry\.1597449040=I\+was\+on\+the\+waitlist/);
assert.match(feedback, /entry\.1597449040=Press\+or\+review\+copy/);
assert.match(feedback, /entry\.1597449040=Another\+route/);
assert.doesNotMatch(
  feedback,
  /entry\.1597449040=(?:Apple\+early\+reader|Android\+early\+reader|Skald\+website)/,
);
assert.doesNotMatch(feedback, /Apple early reader|Android early reader|Skald website/);
assert.match(feedback, /Each link only preselects a visible source answer/);
assert.match(feedback, /Prefer to begin without a preselected source/);
assert.match(feedback, /U\.S\. \$9\.99 price and a written explanation are optional/);
assert.match(feedback, /without signing in to Google/i);
assert.match(feedback, /does not collect your email address automatically/i);
assert.match(feedback, /rating or review/i);
assert.match(feedback, /href="\.\/privacy\/"/);
assert.match(feedback, /href="\.\.\/support\/"/);

assert.match(feedbackPrivacy, /https:\/\/skald\.mannamila\.com\/feedback\/privacy\//g);
assert.match(feedbackPrivacy, /within 12 months of submission/i);
assert.match(feedbackPrivacy, /Google Forms? and Google Sheets?/i);
assert.match(feedbackPrivacy, /Amplitude/);
assert.match(feedbackPrivacy, /Sentry/);
assert.match(feedbackPrivacy, /privacy@mannamila\.com/);
assert.match(feedbackPrivacy, /correct, or delete/i);
assert.match(feedbackPrivacy, /optional quotation permission/i);
assert.match(feedbackPrivacy, /quote your written feedback anonymously/i);
assert.match(
  feedbackPrivacy,
  /U\.S\. \$9\.99 price feels too high, too low, or just right, and an optional written explanation/,
);
assert.match(
  feedbackPrivacy,
  /whether you were on the waitlist, received a press or review copy, or reached the form by another route/,
);
assert.doesNotMatch(feedbackPrivacy, /Apple early reader|Android early reader|the public site/);
assert.match(feedbackPrivacy, /href="\.\.\/"/);
assert.match(feedbackStyles, /:focus-visible/);
assert.match(feedbackStyles, /prefers-reduced-motion/);
assert.match(feedbackStyles, /@media \(max-width: 640px\)/);
assert.match(
  feedbackStyles,
  /--page:\s*min\(calc\(100% - 32px\),\s*1160px\)/,
  "mobile page width must use a valid calc() expression",
);
assert.doesNotMatch(
  feedbackStyles,
  /overflow-x:\s*(?:hidden|clip)/,
  "feedback layout defects must not be hidden or clipped",
);
assert.match(feedbackStyles, /\.hero-copy[\s\S]*?min-width:\s*0/, "hero copy must be allowed to shrink on mobile");

const renderedVerification = spawnSync(process.execPath, [join(root, "verify-feedback-render.mjs")], {
  cwd: root,
  encoding: "utf8",
});
if (renderedVerification.status !== 0) {
  throw new Error(
    `Rendered feedback verification failed:\n${renderedVerification.stderr || renderedVerification.stdout}`,
  );
}
process.stdout.write(renderedVerification.stdout);

console.log("Skald site verification passed.");

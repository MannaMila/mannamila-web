import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { access, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const read = (path) => readFile(join(root, path), "utf8");

// The verified Meta enrollment page for the private Alpha channel (manual approval, 18+,
// 200 people). Both the HTML and availability.json must carry exactly this URL.
const ALPHA_INVITE_URL = "https://www.meta.com/s/8gekrWSxj";

const mediaClips = [
  "serve-practice",
  "hand-racket-ball-control",
  "progress-and-consistency",
];

const requiredFiles = [
  "index.html",
  "styles.css",
  "app.js",
  "analytics.js",
  "availability.json",
  "site-config.json",
  "privacy/index.html",
  "waitlist-privacy/index.html",
  "support/index.html",
  "list/index.html",
  "list/list.js",
  "assets/mila-squash-og.jpg",
  "assets/favicon.svg",
  ...mediaClips.flatMap((clip) => [`media/${clip}.mp4`, `media/${clip}.jpg`]),
];

await Promise.all(requiredFiles.map((path) => access(join(root, path))));
await assert.rejects(
  access(join(root, "retire-analytics.js")),
  "squash no longer ships the analytics retirement script; analytics.js is the only loader",
);

const [index, styles, app, privacy, listPrivacy, support, listPage, listScript, availabilityRaw, configRaw] =
  await Promise.all([
    read("index.html"),
    read("styles.css"),
    read("app.js"),
    read("privacy/index.html"),
    read("waitlist-privacy/index.html"),
    read("support/index.html"),
    read("list/index.html"),
    read("list/list.js"),
    read("availability.json"),
    read("site-config.json"),
  ]);

const availability = JSON.parse(availabilityRaw);
const config = JSON.parse(configRaw);
const allowedStates = new Set(["alpha", "review", "available"]);

assert.equal(typeof availability.quest, "object", "quest availability is required");
assert.ok(allowedStates.has(availability.quest.state), "quest state must be alpha, review or available");
if (availability.quest.state === "alpha") {
  assert.equal(availability.quest.inviteUrl, ALPHA_INVITE_URL, "alpha needs the verified Meta invite URL");
  assert.equal(availability.quest.storeUrl, null, "alpha has no store URL");
}
if (availability.quest.state === "available") {
  assert.match(
    availability.quest.storeUrl ?? "",
    /^https:\/\/www\.meta\.com\//,
    "quest needs a Meta Horizon Store URL when available",
  );
}
assert.match(availability.lastVerifiedAt, /^\d{4}-\d{2}-\d{2}T/, "lastVerifiedAt must be ISO-8601");

const inviteLinks = [...index.matchAll(/data-invite-link(?:="[^"]*")?\s+href="([^"]+)"/g)].map((m) => m[1]);
assert.ok(inviteLinks.length >= 3, "the page needs invite links in the header, hero and alpha section");
for (const href of inviteLinks) {
  assert.equal(href, ALPHA_INVITE_URL, `invite links must point at the verified Meta page, got ${href}`);
}
assert.doesNotMatch(index, /meta\.com\/s\/(?!8gekrWSxj)/, "only the verified invite short link may appear");

assert.equal(typeof config.signupEnabled, "boolean", "signupEnabled must be explicit in site-config.json");
if (config.signupEnabled) {
  assert.equal(typeof config.signupFormUrl, "string", "an enabled signup needs a form URL");
  assert.match(config.signupFormUrl, /^https:\/\/docs\.google\.com\/forms\//, "signupFormUrl must be a Google Forms URL");
  if (!process.env.SQUASH_ALLOW_PLACEHOLDER_FORM) {
    assert.doesNotMatch(config.signupFormUrl, /REPLACE_WITH_PUBLIC_FORM_ID/, "replace the placeholder form URL before publishing");
  }
} else {
  assert.equal(config.signupFormUrl, null, "a disabled signup must not retain a form URL");
}
const signupLinks = [...index.matchAll(/<a[^>]*data-signup-link[^>]*>/g)].map(([tag]) => tag);
assert.ok(signupLinks.length >= 2, "the landing page links to the email list page in the hero and alpha section");
for (const tag of signupLinks) {
  assert.match(tag, /href="\.\/list\/"/, `email-list links point at ./list/: ${tag}`);
  assert.match(tag, /\shidden\b/, `email-list links stay hidden until app.js confirms a configured form: ${tag}`);
}
assert.doesNotMatch(index, /<iframe/i, "the landing page never embeds the form; it links to ./list/");
assert.doesNotMatch(index, /data-signup-container/, "the form mounts only on the list page");
if (config.signupEnabled) {
  assert.ok(listPage.includes(config.signupFormUrl), "the list page's no-script link must match site-config.json");
}
assert.match(listPage, /<script src="\.\.\/analytics\.js" defer><\/script>/, "the list page must count visits too");
assert.match(listPage, /data-signup-container/);
assert.match(listPage, /href="\.\.\/waitlist-privacy\/"/);
assert.match(listPage, /<link rel="canonical" href="https:\/\/squash\.mannamila\.com\/list\/">/);
assert.doesNotMatch(listPage, /<iframe/i, "the list page mounts the iframe at runtime from site-config.json");
assert.match(listScript, /site-config\.json/);
assert.match(listScript, /docs\.google\.com/);
assert.match(listScript, /embedded/);
assert.doesNotMatch(listScript, /G-[A-Z0-9]{8,}|googletagmanager/, "the GA loader lives only in analytics.js");

const expectedIndexText = [
  "Mila Squash",
  "We modeled the physics, the sound and the rules.",
  "Private alpha on Meta Quest 3",
  "Requests are reviewed by hand",
  "18 and over",
  "Quest 3 or Quest 3S with controllers",
  "200 places",
  "WSF",
  "double-yellow",
  "Magnus",
  "207 Hz",
  "200 frames per second",
  "depth, tightness and tempo",
  "legal or fault",
  "never uploaded",
  "no server",
  "not promising them",
  "Store pricing is not set",
  "World Squash Federation",
  "MannaMila LLC",
];
for (const expected of expectedIndexText) {
  assert.ok(index.includes(expected), `index.html must include: ${expected}`);
}

for (const id of ["facts", "privacy", "alpha"]) {
  assert.match(index, new RegExp(`id=["']${id}["']`), `index.html must expose #${id}`);
}

assert.match(index, /<link rel="canonical" href="https:\/\/squash\.mannamila\.com\/">/);
assert.match(index, /<script src="\.\/analytics\.js" defer><\/script>/);
assert.match(index, /data-availability-copy/);
assert.match(index, /href="\.\/waitlist-privacy\/"/);
assert.match(index, /href="\.\/privacy\/"/);
assert.match(index, /href="\.\/list\/"/);
assert.match(index, /role="img" aria-label="Illustration of a Meta Quest 3 headset/, "the alpha section carries the Quest 3 illustration");
assert.doesNotMatch(index, /<h[12][^>]*>(?:(?!<\/h[12]>)[\s\S])*<em>/, "headings carry no italic taglines");
assert.match(index, /href="\.\/support\/"/);
assert.match(index, /href="https:\/\/www\.mannamila\.com\/"/);
assert.match(index, /<meta property="og:image" content="https:\/\/squash\.mannamila\.com\/assets\/mila-squash-og\.jpg(?:\?v=\d+)?">/);

const forbiddenIndexText = [
  /coming soon to/i,
  /currently in store review/i,
  /free forever|permanently free|lifetime access/i,
  /launch credit|purchase credit|early access price/i,
  /\$\s*\d/,
  /join the beta/i,
  /hand.?tracking/i,
  /room.?scale/i,
  /multiplayer (?:mode|is coming|will|soon)/i,
  /full matches (?:are|will be) (?:coming|next)/i,
  /Quest 3S (?:runs|performance|frames)/i,
  /retire-analytics/,
  /href="mailto:/i,
  /\bwaitlist\b(?!-)/i,
  /seamless|elevate|unlock|dive in|game.?changer|not just .* but|whether you.re/i,
];
for (const forbidden of forbiddenIndexText) {
  assert.doesNotMatch(index, forbidden, `index.html contains forbidden copy: ${forbidden}`);
}
assert.doesNotMatch(
  index,
  /<meta\b[^>]+(?:property="og:description"|name="twitter:description")[^>]+content="[^"]*Coming to/i,
  "social metadata must not announce a store release",
);

const images = [...index.matchAll(/<img\b[^>]*>/g)].map(([tag]) => tag);
for (const image of images) {
  assert.match(image, /\balt="[^"]+"/, `image needs meaningful alt text: ${image}`);
}

const videos = [...index.matchAll(/<video\b[^>]*>/g)].map(([tag]) => tag);
assert.equal(videos.length, 2, "index.html embeds one hero video (with a clip switcher) and one Stats video");
const clipTabs = [...index.matchAll(/<button[^>]*data-clip="([a-z0-9-]+)"[^>]*>/g)].map((m) => m[1]);
assert.deepEqual(clipTabs, ["serve-practice", "hand-racket-ball-control"], "the hero switcher offers the serve clip first, then the racket clip");
for (const clip of clipTabs) {
  assert.ok(mediaClips.includes(clip), `clip tab ${clip} must map to a shipped media file`);
}
assert.match(index, /data-hero-video[^>]*poster="\.\/media\/serve-practice\.jpg"/, "the hero opens on the serve clip");
assert.match(index, /Turn the sound on\./, "the hero caption tells visitors to turn the sound on");
assert.match(index, /<link rel="icon" href="\.\/assets\/favicon\.svg"/);
for (const video of videos) {
  assert.match(video, /\bcontrols\b/, `video needs native controls: ${video}`);
  assert.match(video, /\bplaysinline\b/, `video needs playsinline: ${video}`);
  assert.match(video, /preload="metadata"/, `video must not preload media: ${video}`);
  assert.match(video, /poster="\.\/media\/[a-z-]+\.jpg"/, `video needs a poster frame: ${video}`);
  assert.doesNotMatch(video, /\bautoplay\b|\bmuted\b|\bloop\b/, `clips play on request, with sound: ${video}`);
}
assert.equal(
  [...index.matchAll(/<figure class="video-card[^"]*">/g)].length,
  videos.length,
  "every clip sits in a captioned video card",
);
assert.equal(
  [...index.matchAll(/<figure class="video-card[^"]*">(?:(?!<\/figure>)[\s\S])*<figcaption>/g)].length,
  videos.length,
  "every clip has a caption",
);

for (const match of index.matchAll(/(?:src|href|poster)="\.\/([^"#?]+)(?:\?v=\d+)?"/g)) {
  const target = match[1].endsWith("/") ? `${match[1]}index.html` : match[1];
  await access(join(root, target));
}

assert.ok(app.includes(`"${ALPHA_INVITE_URL}"`), "app.js must fall back to the verified invite URL");
assert.match(app, /ALPHA_AVAILABILITY/);
assert.match(app, /normalizePlatform/);
assert.match(app, /www\.meta\.com/);
assert.match(app, /availability\.json/);
assert.match(app, /site-config\.json/);
assert.match(app, /signupEnabled/);
assert.match(app, /\.catch\(/, "runtime configuration must fail safely");
assert.doesNotMatch(app, /G-[A-Z0-9]{8,}|googletagmanager/, "the GA loader lives only in analytics.js");
assert.match(styles, /:focus-visible/);
assert.match(styles, /prefers-reduced-motion/);
assert.match(styles, /@media \(max-width: 560px\)/);
assert.match(styles, /\.video-card/);
assert.match(styles, /\.alpha-steps/);
assert.match(styles, /\.privacy-list/);
assert.match(styles, /\.clip-tab/);
assert.match(app, /data-hero-video/);
assert.doesNotMatch(styles, /Cormorant/, "the Squash site does not share Skald's serif");

assert.match(privacy, /https:\/\/squash\.mannamila\.com\/privacy\//g);
assert.match(privacy, /<script src="\.\.\/analytics\.js" defer><\/script>/);
assert.match(privacy, /\.\.\/waitlist-privacy\//);
assert.match(privacy, /com\.mannamila\.milasquash/);
assert.match(privacy, /never uploaded/i);
assert.match(privacy, /id="website"/, "the privacy policy must describe website analytics");
assert.match(privacy, /Google Analytics 4/);
assert.match(privacy, /id="store-access"/);
assert.match(privacy, /18 or older/);
assert.match(listPrivacy, /https:\/\/squash\.mannamila\.com\/waitlist-privacy\//g);
assert.match(listPrivacy, /<script src="\.\.\/analytics\.js" defer><\/script>/);
assert.match(listPrivacy, /Google Forms and Google Sheets/);
assert.match(listPrivacy, /per calendar month/i);
assert.doesNotMatch(index, /\u2014/, "no em dashes in the landing copy");
assert.match(listPrivacy, /unsubscribe/i);
assert.match(listPrivacy, /18 or older/);
assert.match(support, /https:\/\/squash\.mannamila\.com\/support\//g);
assert.match(support, /<script src="\.\.\/analytics\.js" defer><\/script>/);
assert.match(support, /href="\.\.\/"/);
assert.match(support, /href="\.\.\/privacy\/"/);
assert.match(support, /Alpha testers/);

const analyticsVerification = spawnSync(
  process.execPath,
  [join(root, "../scripts/test-analytics-contract.mjs"), "--site", "squash"],
  { cwd: root, encoding: "utf8" },
);
if (analyticsVerification.status !== 0) {
  throw new Error(`Analytics verification failed:\n${analyticsVerification.stderr || analyticsVerification.stdout}`);
}
process.stdout.write(analyticsVerification.stdout);

const releaseState = spawnSync(
  process.execPath,
  [join(root, "../scripts/test-squash-release-state.mjs")],
  { cwd: root, encoding: "utf8" },
);
if (releaseState.status !== 0) {
  throw new Error(`Release-state verification failed:\n${releaseState.stderr || releaseState.stdout}`);
}
process.stdout.write(releaseState.stdout);

console.log("Mila Squash site verification passed.");

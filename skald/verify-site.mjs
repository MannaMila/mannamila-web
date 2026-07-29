import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertNoPlaintextRasterImages,
  decryptAndVerifyMosaicBytes,
  decryptAndVerifyMosaicCatalogBytes,
  MOSAIC_SCHEMA_VERSION,
  validateMosaicConfig,
} from "../scripts/encrypt-skald-mosaic.mjs";

const root = dirname(fileURLToPath(import.meta.url));
const read = (path) => readFile(join(root, path), "utf8");
const mosaicRoute = "mosaic";
const mosaicConfigPath = `${mosaicRoute}/mosaic-config.json`;
const mosaicCipherPath = `${mosaicRoute}/assets/skald-museum-art-mosaic.enc`;
const mosaicCatalogCipherPath = `${mosaicRoute}/assets/skald-museum-art-map.enc`;
const mosaicPlaintextMapPath = `${mosaicRoute}/mosaic-map.json`;
const expectedMosaicMapSha256 = "7ccce31e953b83f1a265b0c7878b50e2a51f735c454624e46bdc9cb911e58895";
const allowMissingMosaic = process.env.SKALD_ALLOW_MISSING_MOSAIC === "1";

const pathExists = (path) =>
  access(join(root, path))
    .then(() => true)
    .catch(() => false);

const requiredFiles = [
  "index.html",
  "styles.css",
  "app.js",
  "availability.json",
  "site-config.json",
  `${mosaicRoute}/index.html`,
  `${mosaicRoute}/attribution.html`,
  `${mosaicRoute}/styles.css`,
  `${mosaicRoute}/viewer.js`,
  "privacy/index.html",
  "updates-privacy/index.html",
  "waitlist-privacy/index.html",
  "support/index.html",
  "feedback/index.html",
  "feedback/privacy/index.html",
  "feedback/styles.css",
  "assets/app-store-badge.svg",
  "assets/google-play-badge.png",
  "assets/reader-art.webp",
  "assets/greek-split.webp",
  "assets/museum-guide.webp",
  "assets/nostos-route.webp",
  "assets/skald-odyssey-og.jpg",
];

await Promise.all(requiredFiles.map((path) => access(join(root, path))));
await assertNoPlaintextRasterImages(join(root, mosaicRoute));
assert.equal(
  await pathExists(mosaicPlaintextMapPath),
  false,
  "the reviewed artwork map must not be published as bot-readable plaintext",
);
const [mosaicConfigExists, mosaicCipherExists, mosaicCatalogCipherExists] = await Promise.all([
  pathExists(mosaicConfigPath),
  pathExists(mosaicCipherPath),
  pathExists(mosaicCatalogCipherPath),
]);
assert.equal(
  mosaicConfigExists && mosaicCipherExists && mosaicCatalogCipherExists,
  mosaicConfigExists || mosaicCipherExists || mosaicCatalogCipherExists,
  "the encrypted mosaic config, image ciphertext, and artwork-map ciphertext must be installed together",
);
if (!mosaicConfigExists && !allowMissingMosaic) {
  throw new Error(
    "Encrypted mosaic bundle is missing. Run scripts/encrypt-skald-mosaic.mjs, or set SKALD_ALLOW_MISSING_MOSAIC=1 only while preparing the route.",
  );
}
if (mosaicConfigExists && !process.env.SKALD_MOSAIC_PASSWORD) {
  throw new Error("Set SKALD_MOSAIC_PASSWORD so Chrome can verify the encrypted mosaic before promotion.");
}

const [
  index,
  styles,
  app,
  privacy,
  updatesPrivacy,
  waitlistPrivacy,
  support,
  feedback,
  feedbackPrivacy,
  feedbackStyles,
  availabilityRaw,
  configRaw,
  mosaicIndex,
  mosaicAttribution,
  mosaicStyles,
  mosaicViewer,
] =
  await Promise.all([
    read("index.html"),
    read("styles.css"),
    read("app.js"),
    read("privacy/index.html"),
    read("updates-privacy/index.html"),
    read("waitlist-privacy/index.html"),
    read("support/index.html"),
    read("feedback/index.html"),
    read("feedback/privacy/index.html"),
    read("feedback/styles.css"),
    read("availability.json"),
    read("site-config.json"),
    read(`${mosaicRoute}/index.html`),
    read(`${mosaicRoute}/attribution.html`),
    read(`${mosaicRoute}/styles.css`),
    read(`${mosaicRoute}/viewer.js`),
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
  "ten public-domain translations",
  "seven English translations",
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
assert.doesNotMatch(
  index,
  /href=["'](?:https:\/\/skald\.mannamila\.com\/|\/|\.\/)?mosaic\/(?:[^"']*)["']/i,
  "the private /mosaic/ route must remain unlinked",
);

for (const directive of ["noindex", "nofollow", "noarchive", "nosnippet", "noimageindex"]) {
  assert.match(
    mosaicIndex,
    new RegExp(`<meta name="robots" content="[^"]*${directive}[^"]*">`),
    `mosaic route must include the ${directive} robots directive`,
  );
}
assert.match(mosaicIndex, /href="\.\/attribution\.html"/);
assert.match(
  mosaicIndex,
  /public-domain and openly licensed museum art/,
  "mosaic alt text must acknowledge openly licensed works",
);
for (const directive of ["noindex", "nofollow", "noarchive", "nosnippet", "noimageindex"]) {
  assert.match(
    mosaicAttribution,
    new RegExp(`<meta name="robots" content="[^"]*${directive}[^"]*">`),
    `mosaic attribution page must include the ${directive} robots directive`,
  );
}
for (const requiredAttribution of [
  "Photo: Sailko / CC BY 3.0",
  "Photo: Dguendel / CC BY 4.0",
  "Photo: Marie-Lan Nguyen (Jastrow) / CC BY 2.5",
  "https://creativecommons.org/licenses/by/3.0/",
  "https://creativecommons.org/licenses/by/4.0/",
  "https://creativecommons.org/licenses/by/2.5/",
]) {
  assert.ok(
    mosaicAttribution.includes(requiredAttribution),
    `mosaic attribution page must include: ${requiredAttribution}`,
  );
}
assert.match(mosaicIndex, /<input\b[^>]*type="password"[^>]*>/);
assert.match(mosaicIndex, /<section\b[^>]*data-mosaic-viewer[^>]*hidden/);
assert.match(mosaicIndex, /<aside\b[^>]*data-artwork-info[^>]*hidden/);
assert.match(mosaicIndex, /data-artwork-title/);
assert.match(mosaicIndex, /data-artwork-source-links/);
assert.match(mosaicIndex, /data-artwork-picker/);
assert.match(mosaicIndex, /Scroll or pinch/);
assert.doesNotMatch(
  mosaicIndex,
  /<img\b[^>]*\bsrc=/,
  "the mosaic asset must not load before client-side access is granted",
);
assert.match(
  mosaicIndex,
  /<img\b(?=[^>]*data-mosaic-image)(?=[^>]*hidden)[^>]*>/,
  "the mosaic image must stay hidden until its asset loads successfully",
);
assert.doesNotMatch(mosaicViewer, /ACCESS_WORD/);
assert.doesNotMatch(mosaicViewer, /sessionStorage/);
assert.doesNotMatch(mosaicViewer, /innerHTML/);
assert.doesNotMatch(mosaicViewer, /["']\.\/[^"']+\.jpg["']/i);
assert.match(mosaicViewer, /PBKDF2/);
assert.match(mosaicViewer, /AES-GCM/);
assert.match(mosaicViewer, /crypto\.subtle/);
assert.match(mosaicViewer, /\.\/mosaic-config\.json/);
assert.match(mosaicViewer, /config\.catalog\.cipher\.url/);
assert.doesNotMatch(mosaicViewer, /\.\/mosaic-map\.json/);
assert.match(mosaicViewer, /skald-mosaic-v2/);
assert.match(mosaicViewer, /config\.plaintext\.sha256/);
assert.match(mosaicViewer, /image\.naturalWidth !== config\.plaintext\.width/);
assert.match(mosaicViewer, /image\.naturalHeight !== config\.plaintext\.height/);
assert.match(mosaicViewer, /URL\.createObjectURL/);
assert.match(mosaicViewer, /URL\.revokeObjectURL/);
assert.match(mosaicViewer, /new Map\(\)/);
assert.match(mosaicViewer, /type:\s*"pinch"/);
assert.match(mosaicViewer, /data-artwork-title/);
assert.match(mosaicStyles, /:focus-visible/);
assert.match(mosaicStyles, /prefers-reduced-motion/);
assert.match(mosaicStyles, /\.artwork-info/);

const validateArtworkMap = (mosaicMap) => {
  assert.equal(mosaicMap.width, 16_000);
  assert.equal(mosaicMap.height, 8_000);
  assert.equal(mosaicMap.artworks?.length, 200);
  assert.equal(mosaicMap.tiles?.length, 8);
  const artworkIds = new Set();
  const artworkCells = new Set();
  for (const [offset, artwork] of mosaicMap.artworks.entries()) {
    assert.equal(artwork.index, offset + 1, "artwork indices must remain sequential");
    assert.match(artwork.id, /^[a-z0-9][a-z0-9-]*$/);
    assert.equal(artworkIds.has(artwork.id), false, `duplicate artwork id: ${artwork.id}`);
    artworkIds.add(artwork.id);
    for (const field of ["x", "y", "width", "height"]) {
      assert.ok(Number.isSafeInteger(artwork[field]), `${artwork.id}.${field} must be an integer`);
    }
    assert.ok(artwork.x >= 0 && artwork.y >= 0);
    assert.equal(artwork.width, 800);
    assert.equal(artwork.height, 800);
    assert.ok(artwork.x + artwork.width <= mosaicMap.width);
    assert.ok(artwork.y + artwork.height <= mosaicMap.height);
    const cell = `${artwork.x}:${artwork.y}:${artwork.width}:${artwork.height}`;
    assert.equal(artworkCells.has(cell), false, `duplicate artwork cell: ${cell}`);
    artworkCells.add(cell);
    for (const field of ["title", "creator", "date", "source_provider", "license"]) {
      assert.equal(typeof artwork[field], "string", `${artwork.id}.${field} must be text`);
      assert.ok(artwork[field].trim(), `${artwork.id}.${field} must not be empty`);
    }
    assert.equal(typeof artwork.on_view, "boolean");
    assert.ok(
      [artwork.museum_url, artwork.file_page_url].some((value) => /^https:\/\//.test(value)),
      `${artwork.id} must retain at least one secure source URL`,
    );
    for (const field of ["museum_url", "file_page_url"]) {
      if (artwork[field]) assert.match(artwork[field], /^https?:\/\//);
    }
    if (artwork.on_view) {
      for (const field of ["museum", "gallery", "as_of"]) {
        assert.ok(artwork[field]?.trim(), `${artwork.id}.${field} is required for on-view claims`);
      }
    }
  }
  assert.equal(artworkCells.size, 200);
};

if (mosaicConfigExists) {
  const mosaicConfigRaw = await read(mosaicConfigPath);
  const mosaicConfig = JSON.parse(mosaicConfigRaw);
  const mosaicCipher = await readFile(join(root, mosaicCipherPath));
  const mosaicCatalogCipher = await readFile(join(root, mosaicCatalogCipherPath));
  assert.equal(mosaicConfig.schemaVersion, MOSAIC_SCHEMA_VERSION);
  assert.equal(mosaicConfig.plaintext?.mediaType, "image/jpeg");
  assert.ok(Number.isSafeInteger(mosaicConfig.plaintext?.bytes));
  assert.match(mosaicConfig.plaintext?.sha256 ?? "", /^[a-f0-9]{64}$/);
  assert.ok(Number.isSafeInteger(mosaicConfig.plaintext?.width));
  assert.ok(Number.isSafeInteger(mosaicConfig.plaintext?.height));
  assert.equal(mosaicConfig.kdf?.name, "PBKDF2");
  assert.equal(mosaicConfig.kdf?.hash, "SHA-256");
  assert.ok(mosaicConfig.kdf?.iterations >= 600_000);
  assert.equal(Buffer.from(mosaicConfig.kdf?.salt ?? "", "base64").length, 16);
  assert.equal(mosaicConfig.verifier?.hash, "SHA-256");
  assert.equal(Buffer.from(mosaicConfig.verifier?.value ?? "", "base64").length, 32);
  assert.equal(mosaicConfig.cipher?.name, "AES-GCM");
  assert.equal(Buffer.from(mosaicConfig.cipher?.iv ?? "", "base64").length, 12);
  assert.equal(mosaicConfig.cipher?.url, "./assets/skald-museum-art-mosaic.enc");
  assert.equal(mosaicConfig.catalog?.plaintext?.mediaType, "application/json");
  assert.equal(mosaicConfig.catalog?.plaintext?.sha256, expectedMosaicMapSha256);
  assert.equal(mosaicConfig.catalog?.plaintext?.width, mosaicConfig.plaintext.width);
  assert.equal(mosaicConfig.catalog?.plaintext?.height, mosaicConfig.plaintext.height);
  assert.equal(mosaicConfig.catalog?.plaintext?.artworkCount, 200);
  assert.equal(mosaicConfig.catalog?.cipher?.name, "AES-GCM");
  assert.equal(Buffer.from(mosaicConfig.catalog?.cipher?.iv ?? "", "base64").length, 12);
  assert.equal(mosaicConfig.catalog?.cipher?.url, "./assets/skald-museum-art-map.enc");
  assert.notEqual(mosaicConfig.catalog.cipher.iv, mosaicConfig.cipher.iv);
  assert.doesNotMatch(mosaicConfigRaw, /"password"\s*:/i);
  assert.doesNotMatch(mosaicConfigRaw, /\.jpg/i);
  assert.ok(mosaicCipher.length > 16, "encrypted mosaic must include ciphertext and a GCM tag");
  assert.ok(
    mosaicCatalogCipher.length > 16,
    "encrypted artwork map must include ciphertext and a GCM tag",
  );
  assert.notEqual(
    mosaicCatalogCipher[0],
    "{".charCodeAt(0),
    "the deployed artwork map must not be readable JSON",
  );
  assert.notDeepEqual(
    mosaicCipher.subarray(0, 3),
    Buffer.from([0xff, 0xd8, 0xff]),
    "the deployed mosaic asset must not be a readable JPEG",
  );
  validateMosaicConfig(mosaicConfig);
  const decryptedMosaic = decryptAndVerifyMosaicBytes(
    mosaicCipher,
    process.env.SKALD_MOSAIC_PASSWORD,
    mosaicConfig,
  );
  assert.equal(
    decryptedMosaic.length,
    mosaicConfig.plaintext.bytes,
    "the decrypted mosaic must match the approved plaintext byte count",
  );
  const decryptedCatalog = decryptAndVerifyMosaicCatalogBytes(
    mosaicCatalogCipher,
    process.env.SKALD_MOSAIC_PASSWORD,
    mosaicConfig,
  );
  assert.equal(
    createHash("sha256").update(decryptedCatalog).digest("hex"),
    expectedMosaicMapSha256,
    "the decrypted artwork map must remain byte-identical to the reviewed package map",
  );
  const mosaicMap = JSON.parse(decryptedCatalog.toString("utf8"));
  validateArtworkMap(mosaicMap);
  assert.equal(mosaicMap.width, mosaicConfig.plaintext.width);
  assert.equal(mosaicMap.height, mosaicConfig.plaintext.height);
}

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
assert.match(privacy, /Beginning with version 0\.4\.1, Skald does not send usage analytics or crash diagnostics/);
assert.match(privacy, /The app does not transmit the ID or create a replacement/);
assert.match(privacy, /No Analytics ID exists on this installation/);
assert.match(privacy, /Request deletion of previously shared data/);
assert.match(privacy, /The public Skald website is also separate from the app/);
assert.match(privacy, /United Kingdom information — pending before UK distribution/);
assert.doesNotMatch(privacy, /product analytics and crash diagnostics are required/);
assert.doesNotMatch(privacy, /Share usage analytics and crash diagnostics/);
assert.doesNotMatch(privacy, /Android grants only <strong>INTERNET<\/strong>/);
assert.match(index, /Skald 0\.4\.1 does not send usage analytics or crash diagnostics/);
assert.doesNotMatch(index, /Disclosed analytics and diagnostics send/);
assert.doesNotMatch(index, /analytics, and diagnostics need a connection/);
assert.match(support, /deletion of data shared by an earlier version/);
assert.doesNotMatch(support, /telemetry data deletion request/);
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

const feedbackFormBase =
  "https://docs.google.com/forms/d/e/1FAIpQLSdHuak6kgyQNb3jyt2wxv_0YVPgX0Mp2nap1M3iKy5ZJG3emw/viewform";
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
assert.match(feedback, /Your device, and one honest thought/);
assert.doesNotMatch(feedback, /app version/i);
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
assert.doesNotMatch(feedbackPrivacy, /app version/i);
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

const encryptionVerification = spawnSync(
  process.execPath,
  [join(root, "../scripts/test-encrypt-skald-mosaic.mjs")],
  {
    cwd: root,
    encoding: "utf8",
  },
);
if (encryptionVerification.status !== 0) {
  throw new Error(
    `Mosaic encryption verification failed:\n${encryptionVerification.stderr || encryptionVerification.stdout}`,
  );
}
process.stdout.write(encryptionVerification.stdout);

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

console.log("Skald site verification passed.");

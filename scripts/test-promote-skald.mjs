import assert from "node:assert/strict";
import { mkdtemp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const script = join(repoRoot, "scripts/promote-skald.mjs");
const target = await mkdtemp(join(tmpdir(), "skald-web-promotion-"));
const mosaicRoute = "mosaic";
const retiredMosaicRoute = "folio-24b3206ad4eceb1abe0c";

const run = (...args) =>
  spawnSync(process.execPath, [script, "--target", target, ...args], {
    cwd: repoRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      SKALD_ALLOW_MISSING_MOSAIC: "1",
    },
  });

const snapshotNonFeedbackFiles = async (current = target, prefix = "") => {
  const snapshot = {};
  for (const entry of await readdir(current, { withFileTypes: true })) {
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (relativePath === "feedback") continue;
    if (entry.isDirectory()) {
      Object.assign(snapshot, await snapshotNonFeedbackFiles(join(current, entry.name), relativePath));
    } else if (entry.isFile()) {
      snapshot[relativePath] = (await readFile(join(current, entry.name))).toString("base64");
    }
  }
  return snapshot;
};

try {
  await mkdir(join(target, ".git"));
  await mkdir(join(target, ".github/workflows"), { recursive: true });
  await mkdir(join(target, "docs"));
  await mkdir(join(target, "feedback"));
  await mkdir(join(target, retiredMosaicRoute));
  await writeFile(join(target, "CNAME"), "skald.mannamila.com\n");
  await writeFile(join(target, ".nojekyll"), "");
  await writeFile(join(target, ".github/workflows/pages.yml"), "name: Pages\n");
  await writeFile(join(target, "docs/deploy.md"), "deployment notes\n");
  await writeFile(join(target, "feedback/index.html"), "Feedback form\n");
  await writeFile(join(target, retiredMosaicRoute, "obsolete.html"), "retired mosaic route\n");
  await writeFile(join(target, "analytics.js"), "legacy analytics loader\n");
  await writeFile(join(target, "README.md"), "Skald web deployment\n");

  const dryRun = run("--dry-run", "--allow-placeholder-form", "--allow-dirty-source");
  assert.equal(dryRun.status, 0, dryRun.stderr);
  assert.match(dryRun.stdout, /Dry run/);
  assert.match(dryRun.stdout, /remove\s+analytics\.js/);
  await assert.rejects(readFile(join(target, "index.html")));
  assert.equal(await readFile(join(target, "analytics.js"), "utf8"), "legacy analytics loader\n");

  const unsafeFeedbackBeforeRetirement = run(
    "--feedback-only",
    "--dry-run",
    "--allow-placeholder-form",
    "--allow-dirty-source",
  );
  assert.notEqual(unsafeFeedbackBeforeRetirement.status, 0);
  assert.match(unsafeFeedbackBeforeRetirement.stderr, /retire-analytics\.js/);

  const apply = run("--apply", "--allow-placeholder-form", "--allow-dirty-source");
  assert.equal(apply.status, 0, apply.stderr);
  assert.match(await readFile(join(target, "index.html"), "utf8"), /One Odyssey\./);
  await assert.rejects(readFile(join(target, "analytics.js"), "utf8"));
  assert.match(await readFile(join(target, "feedback/index.html"), "utf8"), /Share feedback about Skald/);
  assert.match(
    await readFile(join(target, "feedback/privacy/index.html"), "utf8"),
    /within 12 months of submission/i,
  );
  assert.match(await readFile(join(target, "feedback/styles.css"), "utf8"), /\.route-card/);
  assert.match(
    await readFile(join(target, "updates-privacy/index.html"), "utf8"),
    /Product Updates Privacy Notice/,
  );
  assert.match(
    await readFile(join(target, mosaicRoute, "index.html"), "utf8"),
    /noindex, nofollow, noarchive, nosnippet, noimageindex/,
  );
  const promotedMosaicIndex = await readFile(
    join(target, mosaicRoute, "index.html"),
    "utf8",
  );
  assert.match(promotedMosaicIndex, /data-action="fullscreen"/);
  assert.match(promotedMosaicIndex, /data-fullscreen-label/);
  assert.match(promotedMosaicIndex, /data-fullscreen-exit-icon/);
  assert.match(promotedMosaicIndex, /<dialog\b[^>]*data-artwork-info/);
  assert.match(promotedMosaicIndex, /data-artwork-books/);
  assert.match(promotedMosaicIndex, /data-artwork-preview-detail/);
  assert.match(
    await readFile(join(target, mosaicRoute, "attribution.html"), "utf8"),
    /Photo: Sailko \/ CC BY 3\.0/,
  );
  const promotedMosaicViewer = await readFile(
    join(target, mosaicRoute, "viewer.js"),
    "utf8",
  );
  assert.match(promotedMosaicViewer, /PBKDF2/);
  assert.match(promotedMosaicViewer, /requestFullscreen/);
  assert.match(promotedMosaicViewer, /dataset\.fullscreen/);
  assert.match(promotedMosaicViewer, /showModal\(\)/);
  const promotedMosaicStyles = await readFile(
    join(target, mosaicRoute, "styles.css"),
    "utf8",
  );
  assert.match(promotedMosaicStyles, /\[data-fullscreen="true"\]/);
  assert.match(promotedMosaicStyles, /\[data-fullscreen-exit-icon\]/);
  const promotedMosaicConfig = JSON.parse(
    await readFile(join(target, mosaicRoute, "mosaic-config.json"), "utf8"),
  );
  assert.ok(promotedMosaicConfig.plaintext.width > 0);
  assert.ok(promotedMosaicConfig.plaintext.height > 0);
  assert.equal(
    promotedMosaicConfig.cipher.url,
    "./assets/skald-museum-art-mosaic.enc",
  );
  assert.equal(
    promotedMosaicConfig.catalog.plaintext.width,
    promotedMosaicConfig.plaintext.width,
  );
  assert.equal(
    promotedMosaicConfig.catalog.plaintext.height,
    promotedMosaicConfig.plaintext.height,
  );
  assert.ok(promotedMosaicConfig.catalog.plaintext.artworkCount > 0);
  assert.equal(
    promotedMosaicConfig.catalog.plaintext.sha256,
    "7ccce31e953b83f1a265b0c7878b50e2a51f735c454624e46bdc9cb911e58895",
  );
  assert.equal(
    promotedMosaicConfig.viewer.plaintext.mediaType,
    "application/vnd.skald.mosaic-viewer-pack",
  );
  assert.equal(
    promotedMosaicConfig.viewer.plaintext.width,
    promotedMosaicConfig.plaintext.width,
  );
  assert.equal(
    promotedMosaicConfig.viewer.plaintext.height,
    promotedMosaicConfig.plaintext.height,
  );
  assert.ok(promotedMosaicConfig.viewer.plaintext.layerCount > 1);
  assert.equal(
    promotedMosaicConfig.viewer.plaintext.manifestSha256,
    "0f04131c1e29fc2262fce1dbbe8eece15f058ac1065c7ec8dee77e402fc33003",
  );
  assert.equal(
    promotedMosaicConfig.viewer.cipher.url,
    "./assets/skald-museum-art-viewer.enc",
  );
  const promotedViewerLayers = promotedMosaicConfig.viewer.manifest.layers;
  assert.equal(
    promotedViewerLayers.length,
    promotedMosaicConfig.viewer.plaintext.layerCount,
  );
  const promotedOverviewLayers = promotedViewerLayers.filter(
    (layer) => layer.role === "overview",
  );
  const promotedTileLayers = promotedViewerLayers.filter(
    (layer) => layer.role === "tile",
  );
  assert.equal(promotedOverviewLayers.length, 1);
  assert.equal(promotedOverviewLayers[0].naturalWidth, 4_096);
  assert.equal(promotedOverviewLayers[0].naturalHeight, 2_048);
  assert.equal(
    promotedOverviewLayers[0].width,
    promotedMosaicConfig.plaintext.width,
  );
  assert.equal(
    promotedOverviewLayers[0].height,
    promotedMosaicConfig.plaintext.height,
  );
  assert.ok(promotedTileLayers.length > 0);
  assert.ok(
    promotedTileLayers.every(
      (layer) =>
        layer.naturalWidth === layer.width &&
        layer.naturalHeight === layer.height,
    ),
  );
  assert.equal(
    new Set(promotedTileLayers.map((layer) => layer.id)).size,
    promotedTileLayers.length,
  );
  assert.equal(
    promotedTileLayers.reduce(
      (area, layer) => area + layer.width * layer.height,
      0,
    ),
    promotedMosaicConfig.plaintext.width *
      promotedMosaicConfig.plaintext.height,
  );
  const promotedViewerCipher = await readFile(
    join(target, mosaicRoute, "assets/skald-museum-art-viewer.enc"),
  );
  assert.ok(
    promotedViewerCipher.length > 16,
    "the promoted viewer pack must include ciphertext and an authentication tag",
  );
  assert.notDeepEqual(
    promotedViewerCipher.subarray(0, 3),
    Buffer.from([0xff, 0xd8, 0xff]),
    "the promoted overview and tile pack must not expose readable JPEG bytes",
  );
  const unlockFlowStart = promotedMosaicViewer.indexOf("const decryptMosaic");
  const unlockFlowEnd = promotedMosaicViewer.indexOf(
    "const triggerFullResolutionDownload",
  );
  assert.ok(unlockFlowStart >= 0 && unlockFlowEnd > unlockFlowStart);
  const unlockFlow = promotedMosaicViewer.slice(
    unlockFlowStart,
    unlockFlowEnd,
  );
  assert.match(unlockFlow, /loadEncryptedBytes\(config\.viewer\.assetUrl\)/);
  assert.match(unlockFlow, /loadEncryptedBytes\(config\.catalog\.assetUrl\)/);
  assert.doesNotMatch(
    unlockFlow,
    /config\.image\.assetUrl/,
    "unlocking the progressive viewer must not fetch the 16K master",
  );
  const fullResolutionDownloadFlowStart = promotedMosaicViewer.indexOf(
    "const downloadFullResolutionImage",
  );
  const fullResolutionDownloadFlowEnd = promotedMosaicViewer.indexOf(
    "const unlock",
    fullResolutionDownloadFlowStart,
  );
  assert.ok(
    fullResolutionDownloadFlowStart >= 0 &&
      fullResolutionDownloadFlowEnd > fullResolutionDownloadFlowStart,
  );
  const fullResolutionDownloadFlow = promotedMosaicViewer.slice(
    fullResolutionDownloadFlowStart,
    fullResolutionDownloadFlowEnd,
  );
  assert.match(
    fullResolutionDownloadFlow,
    /loadEncryptedBytes\(view\.config\.image\.assetUrl\)/,
    "the 16K master must remain an explicit full-resolution download",
  );
  assert.doesNotMatch(
    promotedMosaicViewer,
    /ACCESS_WORD|["']\.\/[^"']+\.jpg["']/,
  );
  await assert.rejects(readFile(join(target, retiredMosaicRoute, "obsolete.html")));
  await assert.rejects(readFile(join(target, "verify-site.mjs")));
  assert.equal(await readFile(join(target, "CNAME"), "utf8"), "skald.mannamila.com\n");
  assert.equal(await readFile(join(target, ".github/workflows/pages.yml"), "utf8"), "name: Pages\n");
  assert.equal(await readFile(join(target, "docs/deploy.md"), "utf8"), "deployment notes\n");

  const manifest = JSON.parse(await readFile(join(target, ".skald-source.json"), "utf8"));
  assert.equal(manifest.sourceRepository, "MannaMila/mannamila-web");
  assert.equal(typeof manifest.sourceCommit, "string");
  assert.equal(typeof manifest.sourceTreeDirty, "boolean");
  assert.ok(manifest.files["index.html"]);
  assert.ok(manifest.files["retire-analytics.js"]);
  assert.equal(manifest.files["analytics.js"], undefined);
  assert.ok(manifest.files["feedback/index.html"]);
  assert.ok(manifest.files["feedback/privacy/index.html"]);
  assert.ok(manifest.files["feedback/styles.css"]);
  assert.ok(manifest.files["updates-privacy/index.html"]);
  assert.ok(manifest.files[`${mosaicRoute}/index.html`]);
  assert.ok(manifest.files[`${mosaicRoute}/attribution.html`]);
  assert.ok(manifest.files[`${mosaicRoute}/styles.css`]);
  assert.ok(manifest.files[`${mosaicRoute}/viewer.js`]);
  assert.ok(manifest.files[`${mosaicRoute}/mosaic-config.json`]);
  assert.ok(manifest.files[`${mosaicRoute}/assets/skald-museum-art-mosaic.enc`]);
  assert.ok(manifest.files[`${mosaicRoute}/assets/skald-museum-art-map.enc`]);
  assert.ok(manifest.files[`${mosaicRoute}/assets/skald-museum-art-viewer.enc`]);
  assert.equal(manifest.files[`${mosaicRoute}/mosaic-map.json`], undefined);
  assert.equal(manifest.files[`${retiredMosaicRoute}/index.html`], undefined);
  assert.equal(manifest.files["verify-site.mjs"], undefined);

  const check = run("--check", "--allow-placeholder-form", "--allow-dirty-source");
  assert.equal(check.status, 0, check.stderr);
  assert.match(check.stdout, /Parity check passed/);

  await writeFile(join(target, "index.html"), "deployment landing must survive\n");
  await writeFile(join(target, "availability.json"), '{"deployment":"availability must survive"}\n');
  await writeFile(join(target, "feedback/obsolete.html"), "remove only from feedback\n");
  const beforeFeedbackOnly = await snapshotNonFeedbackFiles();

  const feedbackDryRun = run(
    "--feedback-only",
    "--dry-run",
    "--allow-placeholder-form",
    "--allow-dirty-source",
  );
  assert.equal(feedbackDryRun.status, 0, feedbackDryRun.stderr);
  assert.match(feedbackDryRun.stdout, /Feedback-only dry run/);
  assert.deepEqual(await snapshotNonFeedbackFiles(), beforeFeedbackOnly);
  assert.equal(await readFile(join(target, "feedback/obsolete.html"), "utf8"), "remove only from feedback\n");

  const feedbackApply = run(
    "--feedback-only",
    "--apply",
    "--allow-placeholder-form",
    "--allow-dirty-source",
  );
  assert.equal(feedbackApply.status, 0, feedbackApply.stderr);
  assert.match(feedbackApply.stdout, /Promoted 3 feedback files/);
  assert.deepEqual(await snapshotNonFeedbackFiles(), beforeFeedbackOnly);
  assert.match(await readFile(join(target, "feedback/index.html"), "utf8"), /Share feedback about Skald/);
  await assert.rejects(readFile(join(target, "feedback/obsolete.html")));

  const feedbackCheck = run(
    "--feedback-only",
    "--check",
    "--allow-placeholder-form",
    "--allow-dirty-source",
  );
  assert.equal(feedbackCheck.status, 0, feedbackCheck.stderr);
  assert.match(feedbackCheck.stdout, /Feedback parity check passed/);
  assert.deepEqual(await snapshotNonFeedbackFiles(), beforeFeedbackOnly);

  await writeFile(join(target, "feedback/index.html"), "changed feedback\n");
  const brokenFeedbackCheck = run(
    "--feedback-only",
    "--check",
    "--allow-placeholder-form",
    "--allow-dirty-source",
  );
  assert.notEqual(brokenFeedbackCheck.status, 0);
  assert.match(brokenFeedbackCheck.stderr, /feedback parity/i);
  assert.deepEqual(await snapshotNonFeedbackFiles(), beforeFeedbackOnly);

  await writeFile(join(target, "index.html"), "changed\n");
  const brokenCheck = run("--check", "--allow-placeholder-form", "--allow-dirty-source");
  assert.notEqual(brokenCheck.status, 0);
  assert.match(brokenCheck.stderr, /parity/i);
} finally {
  await rm(target, { recursive: true, force: true });
}

console.log("Skald promotion script tests passed.");

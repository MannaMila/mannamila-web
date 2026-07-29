#!/usr/bin/env node

import assert from "node:assert/strict";
import {
  createDecipheriv,
  createHash,
  pbkdf2Sync,
} from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  assertPlaintextMatchesContract,
  buildMosaicViewerPack,
  decryptAndVerifyMosaicBytes,
  decryptAndVerifyMosaicCatalogBytes,
  decryptAndVerifyMosaicViewerPackBytes,
  encryptMosaicViewerPackBytes,
  inspectJpeg,
  inspectMosaicCatalog,
  mosaicViewerManifestSha256,
  validateMosaicViewerConfig,
  validateMosaicViewerLayerManifest,
} from "./encrypt-skald-mosaic.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const script = join(repoRoot, "scripts/encrypt-skald-mosaic.mjs");
const input = join(repoRoot, "skald/assets/skald-odyssey-og.jpg");
const output = await mkdtemp(join(tmpdir(), "skald-mosaic-encryption-"));
const catalogInputRoot = await mkdtemp(join(tmpdir(), "skald-mosaic-catalog-input-"));
const catalogInput = join(catalogInputRoot, "mosaic-map.json");
const viewerRoot = join(catalogInputRoot, "viewer-root");
const viewerManifestPath = join(catalogInputRoot, "viewer-layers.json");
const testPassword = "test-only-mosaic-password";
const plaintext = await readFile(input);
const approvedPlaintext = {
  sha256: createHash("sha256").update(plaintext).digest("hex"),
  width: 1200,
  height: 630,
};
const catalogPlaintext = Buffer.from(`${JSON.stringify({
  width: approvedPlaintext.width,
  height: approvedPlaintext.height,
  tiles: [],
  artworks: [{
    index: 1,
    id: "test-artwork",
    x: 0,
    y: 0,
    width: approvedPlaintext.width,
    height: approvedPlaintext.height,
    title: "Test artwork",
    creator: "Test creator",
    date: "2026",
    museum: "Test museum",
    source_provider: "Test source",
    on_view: true,
    gallery: "Gallery 1",
    as_of: "2026-07",
    license: "Test fixture only",
    museum_url: "https://example.com/artwork",
    file_page_url: "https://example.com/artwork",
  }],
})}\n`);
const approvedCatalogSha256 = createHash("sha256").update(catalogPlaintext).digest("hex");
await writeFile(catalogInput, catalogPlaintext);
await mkdir(viewerRoot, { recursive: true });
await Promise.all([
  writeFile(join(viewerRoot, "overview.jpg"), plaintext),
  writeFile(join(viewerRoot, "tile.jpg"), plaintext),
]);

const viewerManifest = {
  schemaVersion: 1,
  width: approvedPlaintext.width,
  height: approvedPlaintext.height,
  layers: [
    {
      role: "overview",
      id: "overview",
      sourcePath: "overview.jpg",
      sha256: approvedPlaintext.sha256,
      offset: 0,
      bytes: plaintext.length,
      naturalWidth: approvedPlaintext.width,
      naturalHeight: approvedPlaintext.height,
      x: 0,
      y: 0,
      width: approvedPlaintext.width,
      height: approvedPlaintext.height,
    },
    {
      role: "tile",
      id: "tile",
      sourcePath: "tile.jpg",
      sha256: approvedPlaintext.sha256,
      offset: plaintext.length,
      bytes: plaintext.length,
      naturalWidth: approvedPlaintext.width,
      naturalHeight: approvedPlaintext.height,
      x: 0,
      y: 0,
      width: approvedPlaintext.width,
      height: approvedPlaintext.height,
    },
  ],
};
const approvedViewerManifestSha256 = mosaicViewerManifestSha256(viewerManifest);
await writeFile(viewerManifestPath, `${JSON.stringify(viewerManifest, null, 2)}\n`);

const environmentFor = (password) => {
  const environment = { ...process.env };
  delete environment.SKALD_MOSAIC_PASSWORD;
  if (password) environment.SKALD_MOSAIC_PASSWORD = password;
  return environment;
};

const run = (password, approval = approvedPlaintext) =>
  spawnSync(
    process.execPath,
    [
      script,
      "--input",
      input,
      "--output-dir",
      output,
      "--approved-sha256",
      approval.sha256,
      "--approved-width",
      String(approval.width),
      "--approved-height",
      String(approval.height),
      "--catalog-input",
      catalogInput,
      "--approved-catalog-sha256",
      approvedCatalogSha256,
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: environmentFor(password),
    },
  );

const runViewer = (
  password,
  {
    manifestPath = viewerManifestPath,
    root = viewerRoot,
    approvedManifestSha256 = approvedViewerManifestSha256,
    extraArgs = [],
  } = {},
) =>
  spawnSync(
    process.execPath,
    [
      script,
      "--viewer-pack-only",
      "--output-dir",
      output,
      "--viewer-manifest",
      manifestPath,
      "--viewer-root",
      root,
      "--approved-viewer-manifest-sha256",
      approvedManifestSha256,
      ...extraArgs,
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: environmentFor(password),
    },
  );

try {
  const missingApproval = spawnSync(
    process.execPath,
    [script, "--input", input, "--output-dir", output],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: environmentFor(testPassword),
    },
  );
  assert.notEqual(missingApproval.status, 0);
  assert.match(missingApproval.stderr, /approved-sha256/i);

  const missingCatalog = spawnSync(
    process.execPath,
    [
      script,
      "--input",
      input,
      "--output-dir",
      output,
      "--approved-sha256",
      approvedPlaintext.sha256,
      "--approved-width",
      String(approvedPlaintext.width),
      "--approved-height",
      String(approvedPlaintext.height),
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: environmentFor(testPassword),
    },
  );
  assert.notEqual(missingCatalog.status, 0);
  assert.match(missingCatalog.stderr, /catalog-input/i);

  const missingPassword = run(null);
  assert.notEqual(missingPassword.status, 0);
  assert.match(missingPassword.stderr, /SKALD_MOSAIC_PASSWORD/);

  const encrypted = run(testPassword);
  assert.equal(encrypted.status, 0, encrypted.stderr);
  assert.match(encrypted.stdout, /Encrypted Skald mosaic/);

  const configRaw = await readFile(join(output, "mosaic-config.json"), "utf8");
  const config = JSON.parse(configRaw);
  const ciphertext = await readFile(join(output, "assets/skald-museum-art-mosaic.enc"));
  const catalogCiphertext = await readFile(join(output, "assets/skald-museum-art-map.enc"));

  assert.equal(config.schemaVersion, 2);
  assert.deepEqual(config.plaintext, {
    mediaType: "image/jpeg",
    bytes: plaintext.length,
    sha256: approvedPlaintext.sha256,
    width: approvedPlaintext.width,
    height: approvedPlaintext.height,
  });
  assert.deepEqual(assertPlaintextMatchesContract(plaintext, config.plaintext), config.plaintext);
  assert.equal(config.kdf.name, "PBKDF2");
  assert.equal(config.kdf.hash, "SHA-256");
  assert.ok(config.kdf.iterations >= 600_000);
  assert.equal(Buffer.from(config.kdf.salt, "base64").length, 16);
  assert.equal(config.verifier.hash, "SHA-256");
  assert.equal(Buffer.from(config.verifier.value, "base64").length, 32);
  assert.equal(config.cipher.name, "AES-GCM");
  assert.equal(Buffer.from(config.cipher.iv, "base64").length, 12);
  assert.equal(config.cipher.url, "./assets/skald-museum-art-mosaic.enc");
  assert.deepEqual(config.catalog.plaintext, {
    mediaType: "application/json",
    bytes: catalogPlaintext.length,
    sha256: approvedCatalogSha256,
    width: approvedPlaintext.width,
    height: approvedPlaintext.height,
    artworkCount: 1,
  });
  assert.equal(config.catalog.cipher.name, "AES-GCM");
  assert.equal(Buffer.from(config.catalog.cipher.iv, "base64").length, 12);
  assert.notEqual(config.catalog.cipher.iv, config.cipher.iv);
  assert.equal(config.catalog.cipher.url, "./assets/skald-museum-art-map.enc");
  assert.doesNotMatch(configRaw, new RegExp(testPassword));
  assert.doesNotMatch(configRaw, /\.jpg/i);
  assert.notDeepEqual(ciphertext.subarray(0, 3), Buffer.from([0xff, 0xd8, 0xff]));
  assert.notEqual(catalogCiphertext[0], "{".charCodeAt(0));
  assert.deepEqual(inspectMosaicCatalog(catalogPlaintext), config.catalog.plaintext);

  const derived = pbkdf2Sync(
    testPassword.normalize("NFKC"),
    Buffer.from(config.kdf.salt, "base64"),
    config.kdf.iterations,
    64,
    "sha256",
  );
  const verifier = createHash("sha256").update(derived.subarray(32)).digest();
  assert.equal(verifier.toString("base64"), config.verifier.value);

  const authTag = ciphertext.subarray(ciphertext.length - 16);
  const decipher = createDecipheriv(
    "aes-256-gcm",
    derived.subarray(0, 32),
    Buffer.from(config.cipher.iv, "base64"),
  );
  decipher.setAAD(
    Buffer.from(
      [
        "skald-mosaic-v2",
        `mediaType=${config.plaintext.mediaType}`,
        `bytes=${config.plaintext.bytes}`,
        `sha256=${config.plaintext.sha256}`,
        `width=${config.plaintext.width}`,
        `height=${config.plaintext.height}`,
      ].join("\n"),
    ),
  );
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([
    decipher.update(ciphertext.subarray(0, -16)),
    decipher.final(),
  ]);
  assert.deepEqual(decrypted, plaintext);
  assert.deepEqual(
    decryptAndVerifyMosaicBytes(ciphertext, testPassword, config),
    plaintext,
  );
  assert.deepEqual(
    decryptAndVerifyMosaicCatalogBytes(catalogCiphertext, testPassword, config),
    catalogPlaintext,
  );
  assert.throws(
    () => decryptAndVerifyMosaicBytes(ciphertext, "wrong-password", config),
    /access word/i,
  );
  assert.throws(
    () => decryptAndVerifyMosaicCatalogBytes(catalogCiphertext, "wrong-password", config),
    /access word/i,
  );

  for (const args of [
    ["--viewer-pack-only", "--output-dir", output],
    [
      "--viewer-pack-only",
      "--output-dir",
      output,
      "--viewer-manifest",
      viewerManifestPath,
      "--approved-viewer-manifest-sha256",
      approvedViewerManifestSha256,
    ],
    [
      "--viewer-pack-only",
      "--output-dir",
      output,
      "--viewer-manifest",
      viewerManifestPath,
      "--viewer-root",
      viewerRoot,
    ],
  ]) {
    const incompleteViewer = spawnSync(process.execPath, [script, ...args], {
      cwd: repoRoot,
      encoding: "utf8",
      env: environmentFor(testPassword),
    });
    assert.notEqual(incompleteViewer.status, 0);
    assert.match(incompleteViewer.stderr, /viewer-(?:manifest|root)|approved-viewer/i);
  }

  const masterCipherSha256 = createHash("sha256").update(ciphertext).digest("hex");
  const catalogCipherSha256 = createHash("sha256")
    .update(catalogCiphertext)
    .digest("hex");
  const viewerEncrypted = runViewer(testPassword);
  assert.equal(viewerEncrypted.status, 0, viewerEncrypted.stderr);
  assert.match(viewerEncrypted.stdout, /Encrypted Skald mosaic viewer pack/);

  const viewerConfigRaw = await readFile(
    join(output, "mosaic-config.json"),
    "utf8",
  );
  const viewerConfig = JSON.parse(viewerConfigRaw);
  const viewerCiphertext = await readFile(
    join(output, "assets/skald-museum-art-viewer.enc"),
  );
  assert.equal(
    createHash("sha256")
      .update(await readFile(join(output, "assets/skald-museum-art-mosaic.enc")))
      .digest("hex"),
    masterCipherSha256,
    "viewer-pack mode must preserve the master ciphertext byte-for-byte",
  );
  assert.equal(
    createHash("sha256")
      .update(await readFile(join(output, "assets/skald-museum-art-map.enc")))
      .digest("hex"),
    catalogCipherSha256,
    "viewer-pack mode must preserve the catalog ciphertext byte-for-byte",
  );
  assert.deepEqual(viewerConfig.plaintext, config.plaintext);
  assert.deepEqual(viewerConfig.catalog, config.catalog);
  assert.deepEqual(
    validateMosaicViewerConfig(viewerConfig).manifest,
    viewerManifest,
  );
  assert.equal(
    viewerConfig.viewer.plaintext.manifestSha256,
    approvedViewerManifestSha256,
  );
  assert.equal(viewerConfig.viewer.plaintext.layerCount, 2);
  assert.equal(viewerConfig.viewer.plaintext.bytes, plaintext.length * 2);
  assert.equal(viewerConfig.viewer.cipher.name, "AES-GCM");
  assert.equal(
    viewerConfig.viewer.cipher.url,
    "./assets/skald-museum-art-viewer.enc",
  );
  assert.equal(Buffer.from(viewerConfig.viewer.cipher.iv, "base64").length, 12);
  assert.notEqual(viewerConfig.viewer.cipher.iv, viewerConfig.cipher.iv);
  assert.notEqual(
    viewerConfig.viewer.cipher.iv,
    viewerConfig.catalog.cipher.iv,
  );
  assert.doesNotMatch(viewerConfigRaw, new RegExp(testPassword));

  const decryptedViewer = decryptAndVerifyMosaicViewerPackBytes(
    viewerCiphertext,
    testPassword,
    viewerConfig,
  );
  assert.deepEqual(
    decryptedViewer.plaintext,
    Buffer.concat([plaintext, plaintext]),
  );
  assert.deepEqual(decryptedViewer.layers[0].data, plaintext);
  assert.deepEqual(decryptedViewer.layers[1].data, plaintext);
  assert.throws(
    () =>
      decryptAndVerifyMosaicViewerPackBytes(
        viewerCiphertext,
        "wrong-password",
        viewerConfig,
      ),
    /access word/i,
  );

  const tamperedViewerCiphertext = Buffer.from(viewerCiphertext);
  tamperedViewerCiphertext[0] ^= 1;
  assert.throws(
    () =>
      decryptAndVerifyMosaicViewerPackBytes(
        tamperedViewerCiphertext,
        testPassword,
        viewerConfig,
      ),
    /authentication failed/i,
  );

  const tamperedViewerContractConfig = structuredClone(viewerConfig);
  tamperedViewerContractConfig.viewer.plaintext.sha256 = "0".repeat(64);
  assert.throws(
    () =>
      decryptAndVerifyMosaicViewerPackBytes(
        viewerCiphertext,
        testPassword,
        tamperedViewerContractConfig,
      ),
    /authentication failed/i,
  );

  const tamperedViewerManifestConfig = structuredClone(viewerConfig);
  tamperedViewerManifestConfig.viewer.manifest.layers[0].id =
    "different-overview";
  tamperedViewerManifestConfig.viewer.plaintext.manifestSha256 =
    mosaicViewerManifestSha256(
      tamperedViewerManifestConfig.viewer.manifest,
    );
  assert.throws(
    () =>
      decryptAndVerifyMosaicViewerPackBytes(
        viewerCiphertext,
        testPassword,
        tamperedViewerManifestConfig,
      ),
    /authentication failed/i,
  );

  for (const duplicateIv of [
    viewerConfig.cipher.iv,
    viewerConfig.catalog.cipher.iv,
  ]) {
    const duplicateIvConfig = structuredClone(viewerConfig);
    duplicateIvConfig.viewer.cipher.iv = duplicateIv;
    assert.throws(
      () => validateMosaicViewerConfig(duplicateIvConfig),
      /distinct AES-GCM IVs/i,
    );
  }

  const preservedViewerCipherSha256 = createHash("sha256")
    .update(viewerCiphertext)
    .digest("hex");
  const preservedViewerConfigSha256 = createHash("sha256")
    .update(viewerConfigRaw)
    .digest("hex");
  const failedViewer = runViewer(testPassword, {
    approvedManifestSha256: "0".repeat(64),
  });
  assert.notEqual(failedViewer.status, 0);
  assert.match(failedViewer.stderr, /approved SHA-256/i);
  assert.equal(
    createHash("sha256")
      .update(
        await readFile(join(output, "assets/skald-museum-art-viewer.enc")),
      )
      .digest("hex"),
    preservedViewerCipherSha256,
    "a failed viewer-pack run must preserve its ciphertext",
  );
  assert.equal(
    createHash("sha256")
      .update(await readFile(join(output, "mosaic-config.json")))
      .digest("hex"),
    preservedViewerConfigSha256,
    "a failed viewer-pack run must preserve its config",
  );

  const twoTileManifest = structuredClone(viewerManifest);
  twoTileManifest.layers.splice(
    1,
    1,
    {
      ...viewerManifest.layers[1],
      id: "tile-left",
      sourcePath: "tile-left.jpg",
      width: approvedPlaintext.width / 2,
      naturalWidth: approvedPlaintext.width / 2,
    },
    {
      ...viewerManifest.layers[1],
      id: "tile-right",
      sourcePath: "tile-right.jpg",
      offset: plaintext.length * 2,
      x: approvedPlaintext.width / 2,
      width: approvedPlaintext.width / 2,
      naturalWidth: approvedPlaintext.width / 2,
    },
  );
  assert.deepEqual(
    validateMosaicViewerLayerManifest(twoTileManifest),
    twoTileManifest,
  );

  for (const mutateManifest of [
    (manifest) => {
      manifest.layers[1].id = manifest.layers[0].id;
    },
    (manifest) => {
      manifest.layers[1].sourcePath = manifest.layers[0].sourcePath;
    },
    (manifest) => {
      manifest.layers[1].offset = 0;
    },
    (manifest) => {
      manifest.layers[2].x -= 1;
    },
    (manifest) => {
      manifest.layers[2].width -= 1;
      manifest.layers[2].naturalWidth -= 1;
    },
    (manifest) => {
      manifest.layers[1].naturalWidth -= 1;
    },
    (manifest) => {
      manifest.layers[1].sourcePath = "../tile-left.jpg";
    },
  ]) {
    const invalidManifest = structuredClone(twoTileManifest);
    mutateManifest(invalidManifest);
    assert.throws(
      () => validateMosaicViewerLayerManifest(invalidManifest),
      /viewer/i,
    );
  }

  const wrongLayerHashManifest = structuredClone(viewerManifest);
  wrongLayerHashManifest.layers[1].sha256 = "0".repeat(64);
  await assert.rejects(
    buildMosaicViewerPack(viewerRoot, wrongLayerHashManifest, {
      approvedManifestSha256: mosaicViewerManifestSha256(
        wrongLayerHashManifest,
      ),
    }),
    /does not match its approval/i,
  );

  const builtViewerPack = await buildMosaicViewerPack(
    viewerRoot,
    viewerManifest,
    { approvedManifestSha256: approvedViewerManifestSha256 },
  );
  for (const duplicateIv of [
    Buffer.from(config.cipher.iv, "base64"),
    Buffer.from(config.catalog.cipher.iv, "base64"),
  ]) {
    assert.throws(
      () =>
        encryptMosaicViewerPackBytes(
          builtViewerPack.plaintext,
          testPassword,
          config,
          viewerManifest,
          {
            approvedManifestSha256: approvedViewerManifestSha256,
            iv: duplicateIv,
          },
        ),
      /distinct AES-GCM IVs/i,
    );
  }

  const tamperedCatalogConfig = structuredClone(config);
  tamperedCatalogConfig.catalog.plaintext.sha256 = "0".repeat(64);
  assert.throws(
    () => decryptAndVerifyMosaicCatalogBytes(catalogCiphertext, testPassword, tamperedCatalogConfig),
    /authentication failed/i,
  );

  for (const mutateContract of [
    (contract) => {
      contract.sha256 = "0".repeat(64);
    },
    (contract) => {
      contract.width += 1;
    },
    (contract) => {
      contract.height += 1;
    },
    (contract) => {
      contract.bytes += 1;
    },
  ]) {
    const tamperedConfig = structuredClone(config);
    mutateContract(tamperedConfig.plaintext);
    assert.throws(
      () => assertPlaintextMatchesContract(plaintext, tamperedConfig.plaintext),
      /approved plaintext contract/i,
    );
    assert.throws(
      () => decryptAndVerifyMosaicBytes(ciphertext, testPassword, tamperedConfig),
      /authentication failed/i,
    );
  }

  const frameMarkerOffset = plaintext.findIndex(
    (byte, index) =>
      byte === 0xff &&
      [0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]
        .includes(plaintext[index + 1]),
  );
  assert.ok(frameMarkerOffset > 0, "the JPEG fixture must contain a start-of-frame marker");
  const invalidFrame = Buffer.from(plaintext);
  invalidFrame.writeUInt16BE(7, frameMarkerOffset + 2);
  assert.throws(() => inspectJpeg(invalidFrame), /invalid JPEG frame/i);

  const progressiveFrame = Buffer.from(plaintext);
  progressiveFrame[frameMarkerOffset + 1] = 0xc2;
  assert.deepEqual(inspectJpeg(progressiveFrame), {
    ...config.plaintext,
    sha256: createHash("sha256").update(progressiveFrame).digest("hex"),
  });

  const wrongHash = run(testPassword, {
    ...approvedPlaintext,
    sha256: "0".repeat(64),
  });
  assert.notEqual(wrongHash.status, 0);
  assert.match(wrongHash.stderr, /approved SHA-256/i);

  const wrongDimensions = run(testPassword, {
    ...approvedPlaintext,
    width: approvedPlaintext.width + 1,
  });
  assert.notEqual(wrongDimensions.status, 0);
  assert.match(wrongDimensions.stderr, /approved dimensions/i);

  const nestedLeakDir = join(output, "nested/plaintext/leak");
  await mkdir(nestedLeakDir, { recursive: true });
  for (const rasterName of [
    "mosaic.jpg",
    "mosaic.JPEG",
    "mosaic.PnG",
    "mosaic.WeBp",
    "mosaic.GIF",
  ]) {
    const rasterPath = join(nestedLeakDir, rasterName);
    await writeFile(rasterPath, "not-even-a-valid-image");
    const plaintextLeak = run(testPassword);
    assert.notEqual(plaintextLeak.status, 0);
    assert.match(plaintextLeak.stderr, /plaintext raster image/i);
    await rm(rasterPath);
  }
} finally {
  await Promise.all([
    rm(output, { recursive: true, force: true }),
    rm(catalogInputRoot, { recursive: true, force: true }),
  ]);
}

console.log("Skald mosaic encryption tests passed.");

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
  decryptAndVerifyMosaicBytes,
  decryptAndVerifyMosaicCatalogBytes,
  inspectJpeg,
  inspectMosaicCatalog,
} from "./encrypt-skald-mosaic.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const script = join(repoRoot, "scripts/encrypt-skald-mosaic.mjs");
const input = join(repoRoot, "skald/assets/skald-odyssey-og.jpg");
const output = await mkdtemp(join(tmpdir(), "skald-mosaic-encryption-"));
const catalogInputRoot = await mkdtemp(join(tmpdir(), "skald-mosaic-catalog-input-"));
const catalogInput = join(catalogInputRoot, "mosaic-map.json");
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

#!/usr/bin/env node

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  pbkdf2Sync,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import {
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const defaultOutputDir = join(repoRoot, "skald/mosaic");
const encryptedAssetName = "skald-museum-art-mosaic.enc";
const encryptedCatalogAssetName = "skald-museum-art-map.enc";
const encryptedViewerAssetName = "skald-museum-art-viewer.enc";
const configName = "mosaic-config.json";

export const MOSAIC_PBKDF2_ITERATIONS = 600_000;
export const MOSAIC_SCHEMA_VERSION = 2;
export const MOSAIC_VIEWER_MANIFEST_SCHEMA_VERSION = 1;
export const MOSAIC_VIEWER_PACK_MEDIA_TYPE =
  "application/vnd.skald.mosaic-viewer-pack";

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const plaintextRasterPattern = /\.(?:jpe?g|png|webp|gif)$/i;

export const assertNoPlaintextRasterImages = async (root) => {
  const plaintextRasters = [];

  const walk = async (current, prefix = "") => {
    const entries = await readdir(current, { withFileTypes: true }).catch((error) => {
      if (error.code === "ENOENT") return [];
      throw error;
    });
    for (const entry of entries) {
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (plaintextRasterPattern.test(entry.name)) plaintextRasters.push(relativePath);
      if (entry.isDirectory()) await walk(join(current, entry.name), relativePath);
    }
  };

  await walk(root);
  if (plaintextRasters.length > 0) {
    throw new Error(
      `Plaintext raster image files are forbidden in the deployable mosaic route: ${plaintextRasters.sort().join(", ")}`,
    );
  }
};

const parseArgs = () => {
  const args = process.argv.slice(2);
  const options = {
    input: null,
    catalogInput: null,
    catalogOnly: false,
    viewerPackOnly: false,
    viewerManifest: null,
    viewerRoot: null,
    approvedViewerManifestSha256: null,
    outputDir: defaultOutputDir,
    approvedSha256: null,
    approvedCatalogSha256: null,
    approvedWidth: null,
    approvedHeight: null,
  };

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--input") {
      options.input = args[index + 1] ?? null;
      index += 1;
    } else if (argument === "--catalog-input") {
      options.catalogInput = args[index + 1] ?? null;
      index += 1;
    } else if (argument === "--catalog-only") {
      options.catalogOnly = true;
    } else if (argument === "--viewer-pack-only") {
      options.viewerPackOnly = true;
    } else if (argument === "--viewer-manifest") {
      options.viewerManifest = args[index + 1] ?? null;
      index += 1;
    } else if (argument === "--viewer-root") {
      options.viewerRoot = args[index + 1] ?? null;
      index += 1;
    } else if (argument === "--approved-viewer-manifest-sha256") {
      options.approvedViewerManifestSha256 = args[index + 1] ?? null;
      index += 1;
    } else if (argument === "--output-dir") {
      options.outputDir = args[index + 1] ?? null;
      index += 1;
    } else if (argument === "--approved-sha256") {
      options.approvedSha256 = args[index + 1] ?? null;
      index += 1;
    } else if (argument === "--approved-catalog-sha256") {
      options.approvedCatalogSha256 = args[index + 1] ?? null;
      index += 1;
    } else if (argument === "--approved-width") {
      options.approvedWidth = Number(args[index + 1]);
      index += 1;
    } else if (argument === "--approved-height") {
      options.approvedHeight = Number(args[index + 1]);
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  if (!options.outputDir) throw new Error("--output-dir requires a path");
  if (options.catalogOnly && options.viewerPackOnly) {
    throw new Error("--catalog-only and --viewer-pack-only are mutually exclusive.");
  }
  if (options.viewerPackOnly) {
    if (
      options.input ||
      options.catalogInput ||
      options.approvedSha256 ||
      options.approvedCatalogSha256 ||
      options.approvedWidth !== null ||
      options.approvedHeight !== null
    ) {
      throw new Error("--viewer-pack-only cannot be combined with mosaic or catalog inputs.");
    }
    if (!options.viewerManifest) {
      throw new Error("--viewer-manifest is required with --viewer-pack-only.");
    }
    if (!options.viewerRoot) {
      throw new Error("--viewer-root is required with --viewer-pack-only.");
    }
    if (!/^[a-f0-9]{64}$/i.test(options.approvedViewerManifestSha256 ?? "")) {
      throw new Error(
        "--approved-viewer-manifest-sha256 requires a 64-character SHA-256 digest.",
      );
    }
  } else if (
    options.viewerManifest ||
    options.viewerRoot ||
    options.approvedViewerManifestSha256
  ) {
    throw new Error(
      "--viewer-manifest, --viewer-root, and --approved-viewer-manifest-sha256 require --viewer-pack-only.",
    );
  }
  if (options.catalogOnly) {
    if (options.input || options.approvedSha256 || options.approvedWidth || options.approvedHeight) {
      throw new Error("--catalog-only cannot be combined with mosaic image input or approvals.");
    }
  } else if (!options.viewerPackOnly) {
    if (!options.input) throw new Error("--input is required");
    if (!/^[a-f0-9]{64}$/i.test(options.approvedSha256 ?? "")) {
      throw new Error("--approved-sha256 requires a 64-character SHA-256 digest.");
    }
    if (!Number.isSafeInteger(options.approvedWidth) || options.approvedWidth <= 0) {
      throw new Error("--approved-width requires a positive integer.");
    }
    if (!Number.isSafeInteger(options.approvedHeight) || options.approvedHeight <= 0) {
      throw new Error("--approved-height requires a positive integer.");
    }
  }
  if (!options.viewerPackOnly && !options.catalogInput) {
    throw new Error("--catalog-input is required for every encrypted mosaic bundle.");
  }
  if (options.catalogInput && !/^[a-f0-9]{64}$/i.test(options.approvedCatalogSha256 ?? "")) {
    throw new Error("--approved-catalog-sha256 requires a 64-character SHA-256 digest.");
  }
  if (!options.catalogInput && options.approvedCatalogSha256) {
    throw new Error("--approved-catalog-sha256 requires --catalog-input.");
  }

  const resolveFromCwd = (path) =>
    path && (isAbsolute(path) ? path : resolve(process.cwd(), path));
  return {
    input: resolveFromCwd(options.input),
    catalogInput: resolveFromCwd(options.catalogInput),
    catalogOnly: options.catalogOnly,
    viewerPackOnly: options.viewerPackOnly,
    viewerManifest: resolveFromCwd(options.viewerManifest),
    viewerRoot: resolveFromCwd(options.viewerRoot),
    outputDir: isAbsolute(options.outputDir)
      ? options.outputDir
      : resolve(process.cwd(), options.outputDir),
    approvedPlaintext: options.catalogOnly || options.viewerPackOnly
      ? null
      : {
          sha256: options.approvedSha256.toLowerCase(),
          width: options.approvedWidth,
          height: options.approvedHeight,
        },
    approvedCatalogSha256: options.approvedCatalogSha256?.toLowerCase() ?? null,
    approvedViewerManifestSha256:
      options.approvedViewerManifestSha256?.toLowerCase() ?? null,
  };
};

const jpegStartOfFrameMarkers = new Set([
  0xc0,
  0xc1,
  0xc2,
  0xc3,
  0xc5,
  0xc6,
  0xc7,
  0xc9,
  0xca,
  0xcb,
  0xcd,
  0xce,
  0xcf,
]);

export const inspectJpeg = (plaintext) => {
  if (
    plaintext.length < 4 ||
    plaintext[0] !== 0xff ||
    plaintext[1] !== 0xd8 ||
    plaintext[2] !== 0xff ||
    plaintext.at(-2) !== 0xff ||
    plaintext.at(-1) !== 0xd9
  ) {
    throw new Error("The mosaic input must be a complete JPEG file.");
  }

  let offset = 2;
  while (offset < plaintext.length - 1) {
    if (plaintext[offset] !== 0xff) {
      throw new Error("The mosaic input contains invalid JPEG marker data.");
    }
    while (plaintext[offset] === 0xff) offset += 1;
    const marker = plaintext[offset];
    offset += 1;

    if (marker === 0xd9 || marker === 0xda) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (offset + 2 > plaintext.length) {
      throw new Error("The mosaic input contains a truncated JPEG segment.");
    }

    const segmentLength = plaintext.readUInt16BE(offset);
    if (segmentLength < 2 || offset + segmentLength > plaintext.length) {
      throw new Error("The mosaic input contains an invalid JPEG segment.");
    }
    if (jpegStartOfFrameMarkers.has(marker)) {
      if (segmentLength < 8) {
        throw new Error("The mosaic input contains an invalid JPEG frame.");
      }
      const componentCount = plaintext[offset + 7];
      if (componentCount <= 0 || segmentLength !== 8 + 3 * componentCount) {
        throw new Error("The mosaic input contains an invalid JPEG frame.");
      }
      const height = plaintext.readUInt16BE(offset + 3);
      const width = plaintext.readUInt16BE(offset + 5);
      if (width <= 0 || height <= 0) {
        throw new Error("The mosaic input contains invalid JPEG dimensions.");
      }
      return {
        mediaType: "image/jpeg",
        bytes: plaintext.length,
        sha256: sha256(plaintext),
        width,
        height,
      };
    }
    offset += segmentLength;
  }

  throw new Error("The mosaic input does not declare JPEG dimensions.");
};

export const mosaicAdditionalData = (plaintextContract) =>
  Buffer.from(
    [
      "skald-mosaic-v2",
      `mediaType=${plaintextContract.mediaType}`,
      `bytes=${plaintextContract.bytes}`,
      `sha256=${plaintextContract.sha256}`,
      `width=${plaintextContract.width}`,
      `height=${plaintextContract.height}`,
    ].join("\n"),
  );

export const inspectMosaicCatalog = (plaintext) => {
  const bytes = Buffer.from(plaintext);
  let catalog;
  try {
    catalog = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    throw new Error("The mosaic catalog input must be valid UTF-8 JSON.");
  }

  if (
    !catalog ||
    Array.isArray(catalog) ||
    !Number.isSafeInteger(catalog.width) ||
    catalog.width <= 0 ||
    !Number.isSafeInteger(catalog.height) ||
    catalog.height <= 0 ||
    !Array.isArray(catalog.tiles) ||
    !Array.isArray(catalog.artworks) ||
    catalog.artworks.length <= 0
  ) {
    throw new Error("The mosaic catalog must declare dimensions, tiles, and artworks.");
  }

  const indexes = new Set();
  const ids = new Set();
  for (const artwork of catalog.artworks) {
    if (
      !Number.isSafeInteger(artwork?.index) ||
      artwork.index <= 0 ||
      typeof artwork?.id !== "string" ||
      artwork.id.length === 0 ||
      !Number.isSafeInteger(artwork?.x) ||
      artwork.x < 0 ||
      !Number.isSafeInteger(artwork?.y) ||
      artwork.y < 0 ||
      !Number.isSafeInteger(artwork?.width) ||
      artwork.width <= 0 ||
      !Number.isSafeInteger(artwork?.height) ||
      artwork.height <= 0 ||
      artwork.x + artwork.width > catalog.width ||
      artwork.y + artwork.height > catalog.height ||
      typeof artwork?.title !== "string"
    ) {
      throw new Error("The mosaic catalog contains an invalid artwork record.");
    }
    if (indexes.has(artwork.index) || ids.has(artwork.id)) {
      throw new Error("The mosaic catalog contains duplicate artwork identities.");
    }
    indexes.add(artwork.index);
    ids.add(artwork.id);
  }

  return {
    mediaType: "application/json",
    bytes: bytes.length,
    sha256: sha256(bytes),
    width: catalog.width,
    height: catalog.height,
    artworkCount: catalog.artworks.length,
  };
};

export const mosaicCatalogAdditionalData = (plaintextContract) =>
  Buffer.from(
    [
      "skald-mosaic-catalog-v2",
      `mediaType=${plaintextContract.mediaType}`,
      `bytes=${plaintextContract.bytes}`,
      `sha256=${plaintextContract.sha256}`,
      `width=${plaintextContract.width}`,
      `height=${plaintextContract.height}`,
      `artworkCount=${plaintextContract.artworkCount}`,
    ].join("\n"),
  );

const canonicalJson = (value) => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
    .join(",")}}`;
};

const hasExactKeys = (value, expectedKeys) => {
  if (!value || Array.isArray(value) || typeof value !== "object") return false;
  const actual = Object.keys(value).sort();
  const expected = [...expectedKeys].sort();
  return actual.length === expected.length &&
    actual.every((key, index) => key === expected[index]);
};

const viewerLayerKeys = [
  "role",
  "id",
  "sourcePath",
  "sha256",
  "offset",
  "bytes",
  "naturalWidth",
  "naturalHeight",
  "x",
  "y",
  "width",
  "height",
];

const rectanglesOverlap = (left, right) =>
  left.x < right.x + right.width &&
  left.x + left.width > right.x &&
  left.y < right.y + right.height &&
  left.y + left.height > right.y;

export const validateMosaicViewerLayerManifest = (manifest) => {
  if (
    !hasExactKeys(manifest, ["schemaVersion", "width", "height", "layers"]) ||
    manifest.schemaVersion !== MOSAIC_VIEWER_MANIFEST_SCHEMA_VERSION ||
    !Number.isSafeInteger(manifest.width) ||
    manifest.width <= 0 ||
    !Number.isSafeInteger(manifest.height) ||
    manifest.height <= 0 ||
    !Array.isArray(manifest.layers) ||
    manifest.layers.length < 2
  ) {
    throw new Error("Invalid mosaic viewer layer manifest.");
  }

  const ids = new Set();
  const sourcePaths = new Set();
  const tiles = [];
  let overview = null;
  let expectedOffset = 0;
  for (const layer of manifest.layers) {
    if (
      !hasExactKeys(layer, viewerLayerKeys) ||
      !["overview", "tile"].includes(layer.role) ||
      typeof layer.id !== "string" ||
      !/^[a-z0-9][a-z0-9-]*$/.test(layer.id) ||
      typeof layer.sourcePath !== "string" ||
      !/^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))(?!.*\/\/)[A-Za-z0-9._/-]+\.jpe?g$/i.test(
        layer.sourcePath,
      ) ||
      layer.sourcePath.split("/").some((segment) => segment === "." || segment === "..") ||
      layer.sourcePath.includes("\\") ||
      !/^[a-f0-9]{64}$/.test(layer.sha256 ?? "") ||
      !Number.isSafeInteger(layer.offset) ||
      layer.offset !== expectedOffset ||
      !Number.isSafeInteger(layer.bytes) ||
      layer.bytes <= 0 ||
      !["naturalWidth", "naturalHeight", "width", "height"].every(
        (field) => Number.isSafeInteger(layer[field]) && layer[field] > 0,
      ) ||
      !["x", "y"].every(
        (field) => Number.isSafeInteger(layer[field]) && layer[field] >= 0,
      ) ||
      layer.x + layer.width > manifest.width ||
      layer.y + layer.height > manifest.height
    ) {
      throw new Error("Invalid mosaic viewer layer record.");
    }
    if (ids.has(layer.id) || sourcePaths.has(layer.sourcePath)) {
      throw new Error("The mosaic viewer manifest contains duplicate layers.");
    }
    ids.add(layer.id);
    sourcePaths.add(layer.sourcePath);
    expectedOffset += layer.bytes;

    if (layer.role === "overview") {
      if (overview) {
        throw new Error("The mosaic viewer manifest must contain one overview.");
      }
      if (
        layer.x !== 0 ||
        layer.y !== 0 ||
        layer.width !== manifest.width ||
        layer.height !== manifest.height ||
        layer.naturalWidth * layer.height !== layer.naturalHeight * layer.width
      ) {
        throw new Error("The mosaic viewer overview dimensions are invalid.");
      }
      overview = layer;
    } else {
      if (
        layer.naturalWidth !== layer.width ||
        layer.naturalHeight !== layer.height
      ) {
        throw new Error("The mosaic viewer tile dimensions are invalid.");
      }
      if (tiles.some((tile) => rectanglesOverlap(tile, layer))) {
        throw new Error("The mosaic viewer tiles overlap.");
      }
      tiles.push(layer);
    }
  }

  if (!overview) {
    throw new Error("The mosaic viewer manifest must contain one overview.");
  }
  const tileArea = tiles.reduce(
    (total, tile) => total + tile.width * tile.height,
    0,
  );
  if (tileArea !== manifest.width * manifest.height) {
    throw new Error("The mosaic viewer tiles must cover the complete mosaic.");
  }
  return manifest;
};

export const canonicalizeMosaicViewerLayerManifest = (manifest) =>
  Buffer.from(canonicalJson(validateMosaicViewerLayerManifest(manifest)));

export const mosaicViewerManifestSha256 = (manifest) =>
  sha256(canonicalizeMosaicViewerLayerManifest(manifest));

export const inspectMosaicViewerPack = (plaintext, manifest) => {
  const validatedManifest = validateMosaicViewerLayerManifest(manifest);
  const pack = Buffer.from(plaintext);
  const expectedBytes = validatedManifest.layers.reduce(
    (total, layer) => total + layer.bytes,
    0,
  );
  if (pack.length !== expectedBytes) {
    throw new Error("The mosaic viewer pack byte length is invalid.");
  }
  for (const layer of validatedManifest.layers) {
    const layerBytes = pack.subarray(layer.offset, layer.offset + layer.bytes);
    const jpeg = inspectJpeg(layerBytes);
    if (
      jpeg.bytes !== layer.bytes ||
      jpeg.sha256 !== layer.sha256 ||
      jpeg.width !== layer.naturalWidth ||
      jpeg.height !== layer.naturalHeight
    ) {
      throw new Error(`Mosaic viewer layer ${layer.id} does not match its approval.`);
    }
  }
  return {
    mediaType: MOSAIC_VIEWER_PACK_MEDIA_TYPE,
    bytes: pack.length,
    sha256: sha256(pack),
    width: validatedManifest.width,
    height: validatedManifest.height,
    layerCount: validatedManifest.layers.length,
    manifestSha256: mosaicViewerManifestSha256(validatedManifest),
  };
};

export const buildMosaicViewerPack = async (
  viewerRoot,
  manifest,
  { approvedManifestSha256 } = {},
) => {
  const validatedManifest = validateMosaicViewerLayerManifest(manifest);
  const actualManifestSha256 = mosaicViewerManifestSha256(validatedManifest);
  if (
    !approvedManifestSha256 ||
    actualManifestSha256 !== approvedManifestSha256.toLowerCase()
  ) {
    throw new Error("The mosaic viewer manifest does not match the approved SHA-256.");
  }

  const layers = [];
  for (const layer of validatedManifest.layers) {
    const layerPath = resolve(viewerRoot, layer.sourcePath);
    const relativePath = relative(resolve(viewerRoot), layerPath);
    if (
      relativePath.startsWith("..") ||
      isAbsolute(relativePath)
    ) {
      throw new Error("Mosaic viewer layer paths must remain inside --viewer-root.");
    }
    layers.push(await readFile(layerPath));
  }
  const plaintext = Buffer.concat(layers);
  const plaintextContract = inspectMosaicViewerPack(
    plaintext,
    validatedManifest,
  );
  return {
    plaintext,
    plaintextContract,
    manifest: validatedManifest,
  };
};

export const mosaicViewerPackAdditionalData = (plaintextContract, manifest) =>
  Buffer.from(
    [
      "skald-mosaic-viewer-pack-v1",
      `mediaType=${plaintextContract.mediaType}`,
      `bytes=${plaintextContract.bytes}`,
      `sha256=${plaintextContract.sha256}`,
      `width=${plaintextContract.width}`,
      `height=${plaintextContract.height}`,
      `layerCount=${plaintextContract.layerCount}`,
      `manifestSha256=${plaintextContract.manifestSha256}`,
      `manifest=${canonicalizeMosaicViewerLayerManifest(manifest).toString("utf8")}`,
    ].join("\n"),
  );

const decodeBase64 = (value, expectedLength, label) => {
  if (typeof value !== "string") throw new Error(`Invalid ${label}.`);
  const decoded = Buffer.from(value, "base64");
  if (decoded.length !== expectedLength) throw new Error(`Invalid ${label}.`);
  return decoded;
};

export const validateMosaicConfig = (config) => {
  if (config?.schemaVersion !== MOSAIC_SCHEMA_VERSION) {
    throw new Error("Invalid encrypted mosaic schema.");
  }
  const plaintextContract = config.plaintext;
  if (
    plaintextContract?.mediaType !== "image/jpeg" ||
    !Number.isSafeInteger(plaintextContract?.bytes) ||
    plaintextContract.bytes <= 0 ||
    !/^[a-f0-9]{64}$/.test(plaintextContract?.sha256 ?? "") ||
    !Number.isSafeInteger(plaintextContract?.width) ||
    plaintextContract.width <= 0 ||
    !Number.isSafeInteger(plaintextContract?.height) ||
    plaintextContract.height <= 0
  ) {
    throw new Error("Invalid encrypted mosaic plaintext contract.");
  }
  if (
    config?.kdf?.name !== "PBKDF2" ||
    config?.kdf?.hash !== "SHA-256" ||
    !Number.isSafeInteger(config?.kdf?.iterations) ||
    config.kdf.iterations < MOSAIC_PBKDF2_ITERATIONS ||
    config?.verifier?.hash !== "SHA-256" ||
    config?.cipher?.name !== "AES-GCM" ||
    config?.cipher?.url !== `./assets/${encryptedAssetName}`
  ) {
    throw new Error("Invalid encrypted mosaic cryptographic contract.");
  }

  return {
    plaintextContract,
    salt: decodeBase64(config.kdf.salt, 16, "PBKDF2 salt"),
    verifier: decodeBase64(config.verifier.value, 32, "access verifier"),
    iv: decodeBase64(config.cipher.iv, 12, "AES-GCM IV"),
  };
};

export const validateMosaicCatalogConfig = (config) => {
  const base = validateMosaicConfig(config);
  const plaintextContract = config?.catalog?.plaintext;
  if (
    plaintextContract?.mediaType !== "application/json" ||
    !Number.isSafeInteger(plaintextContract?.bytes) ||
    plaintextContract.bytes <= 0 ||
    !/^[a-f0-9]{64}$/.test(plaintextContract?.sha256 ?? "") ||
    !Number.isSafeInteger(plaintextContract?.width) ||
    plaintextContract.width <= 0 ||
    !Number.isSafeInteger(plaintextContract?.height) ||
    plaintextContract.height <= 0 ||
    !Number.isSafeInteger(plaintextContract?.artworkCount) ||
    plaintextContract.artworkCount <= 0
  ) {
    throw new Error("Invalid encrypted mosaic catalog plaintext contract.");
  }
  if (
    plaintextContract.width !== config.plaintext.width ||
    plaintextContract.height !== config.plaintext.height ||
    config?.catalog?.cipher?.name !== "AES-GCM" ||
    config?.catalog?.cipher?.url !== `./assets/${encryptedCatalogAssetName}`
  ) {
    throw new Error("Invalid encrypted mosaic catalog cryptographic contract.");
  }

  const iv = decodeBase64(config.catalog.cipher.iv, 12, "catalog AES-GCM IV");
  if (timingSafeEqual(iv, base.iv)) {
    throw new Error("The mosaic and catalog must use distinct AES-GCM IVs.");
  }
  return {
    ...base,
    plaintextContract,
    iv,
  };
};

export const validateMosaicViewerConfig = (config) => {
  const base = validateMosaicCatalogConfig(config);
  const plaintextContract = config?.viewer?.plaintext;
  const manifest = config?.viewer?.manifest;
  if (
    !hasExactKeys(plaintextContract, [
      "mediaType",
      "bytes",
      "sha256",
      "width",
      "height",
      "layerCount",
      "manifestSha256",
    ]) ||
    plaintextContract.mediaType !== MOSAIC_VIEWER_PACK_MEDIA_TYPE ||
    !Number.isSafeInteger(plaintextContract.bytes) ||
    plaintextContract.bytes <= 0 ||
    !/^[a-f0-9]{64}$/.test(plaintextContract.sha256 ?? "") ||
    !Number.isSafeInteger(plaintextContract.width) ||
    plaintextContract.width <= 0 ||
    !Number.isSafeInteger(plaintextContract.height) ||
    plaintextContract.height <= 0 ||
    !Number.isSafeInteger(plaintextContract.layerCount) ||
    plaintextContract.layerCount <= 1 ||
    !/^[a-f0-9]{64}$/.test(plaintextContract.manifestSha256 ?? "")
  ) {
    throw new Error("Invalid encrypted mosaic viewer plaintext contract.");
  }

  validateMosaicViewerLayerManifest(manifest);
  const manifestBytes = manifest.layers.reduce(
    (total, layer) => total + layer.bytes,
    0,
  );
  if (
    plaintextContract.width !== config.plaintext.width ||
    plaintextContract.height !== config.plaintext.height ||
    plaintextContract.width !== manifest.width ||
    plaintextContract.height !== manifest.height ||
    plaintextContract.layerCount !== manifest.layers.length ||
    plaintextContract.bytes !== manifestBytes ||
    plaintextContract.manifestSha256 !== mosaicViewerManifestSha256(manifest) ||
    config?.viewer?.cipher?.name !== "AES-GCM" ||
    config?.viewer?.cipher?.url !== `./assets/${encryptedViewerAssetName}`
  ) {
    throw new Error("Invalid encrypted mosaic viewer cryptographic contract.");
  }

  const iv = decodeBase64(config.viewer.cipher.iv, 12, "viewer AES-GCM IV");
  if (timingSafeEqual(iv, base.iv)) {
    throw new Error("The catalog and viewer must use distinct AES-GCM IVs.");
  }
  const mosaicIv = decodeBase64(config.cipher.iv, 12, "AES-GCM IV");
  if (timingSafeEqual(iv, mosaicIv)) {
    throw new Error("The mosaic and viewer must use distinct AES-GCM IVs.");
  }
  return {
    ...base,
    plaintextContract,
    manifest,
    iv,
  };
};

export const assertPlaintextMatchesContract = (plaintext, plaintextContract) => {
  const actualContract = inspectJpeg(plaintext);
  if (
    actualContract.mediaType !== plaintextContract.mediaType ||
    actualContract.bytes !== plaintextContract.bytes ||
    actualContract.sha256 !== plaintextContract.sha256 ||
    actualContract.width !== plaintextContract.width ||
    actualContract.height !== plaintextContract.height
  ) {
    throw new Error("Decrypted mosaic does not match its approved plaintext contract.");
  }
  return actualContract;
};

const deriveAndVerifyMosaicKey = (password, config, validatedConfig) => {
  if (!password) throw new Error("SKALD_MOSAIC_PASSWORD must not be empty.");
  const derived = pbkdf2Sync(
    password.normalize("NFKC"),
    validatedConfig.salt,
    config.kdf.iterations,
    64,
    "sha256",
  );
  const actualVerifier = createHash("sha256").update(derived.subarray(32)).digest();
  if (!timingSafeEqual(actualVerifier, validatedConfig.verifier)) {
    throw new Error("The mosaic access word does not match the encrypted bundle.");
  }
  return derived;
};

export const decryptAndVerifyMosaicBytes = (ciphertext, password, config) => {
  if (ciphertext.length <= 16) {
    throw new Error("Encrypted mosaic ciphertext is incomplete.");
  }
  const validatedConfig = validateMosaicConfig(config);
  const { plaintextContract, iv } = validatedConfig;
  const derived = deriveAndVerifyMosaicKey(password, config, validatedConfig);

  const authTag = ciphertext.subarray(ciphertext.length - 16);
  const decipher = createDecipheriv("aes-256-gcm", derived.subarray(0, 32), iv);
  decipher.setAAD(mosaicAdditionalData(plaintextContract));
  decipher.setAuthTag(authTag);

  let plaintext;
  try {
    plaintext = Buffer.concat([
      decipher.update(ciphertext.subarray(0, -16)),
      decipher.final(),
    ]);
  } catch {
    throw new Error("Encrypted mosaic authentication failed.");
  }

  assertPlaintextMatchesContract(plaintext, plaintextContract);
  return plaintext;
};

export const decryptAndVerifyMosaicCatalogBytes = (ciphertext, password, config) => {
  if (ciphertext.length <= 16) {
    throw new Error("Encrypted mosaic catalog ciphertext is incomplete.");
  }
  const validatedConfig = validateMosaicCatalogConfig(config);
  const { plaintextContract, iv } = validatedConfig;
  const derived = deriveAndVerifyMosaicKey(password, config, validatedConfig);
  const authTag = ciphertext.subarray(ciphertext.length - 16);
  const decipher = createDecipheriv("aes-256-gcm", derived.subarray(0, 32), iv);
  decipher.setAAD(mosaicCatalogAdditionalData(plaintextContract));
  decipher.setAuthTag(authTag);

  let plaintext;
  try {
    plaintext = Buffer.concat([
      decipher.update(ciphertext.subarray(0, -16)),
      decipher.final(),
    ]);
  } catch {
    throw new Error("Encrypted mosaic catalog authentication failed.");
  }

  const actualContract = inspectMosaicCatalog(plaintext);
  if (
    actualContract.mediaType !== plaintextContract.mediaType ||
    actualContract.bytes !== plaintextContract.bytes ||
    actualContract.sha256 !== plaintextContract.sha256 ||
    actualContract.width !== plaintextContract.width ||
    actualContract.height !== plaintextContract.height ||
    actualContract.artworkCount !== plaintextContract.artworkCount
  ) {
    throw new Error("Decrypted mosaic catalog does not match its approved plaintext contract.");
  }
  return plaintext;
};

export const decryptAndVerifyMosaicViewerPackBytes = (
  ciphertext,
  password,
  config,
) => {
  if (ciphertext.length <= 16) {
    throw new Error("Encrypted mosaic viewer ciphertext is incomplete.");
  }
  const validatedConfig = validateMosaicViewerConfig(config);
  const { plaintextContract, manifest, iv } = validatedConfig;
  const derived = deriveAndVerifyMosaicKey(password, config, validatedConfig);
  const authTag = ciphertext.subarray(ciphertext.length - 16);
  const decipher = createDecipheriv("aes-256-gcm", derived.subarray(0, 32), iv);
  decipher.setAAD(mosaicViewerPackAdditionalData(plaintextContract, manifest));
  decipher.setAuthTag(authTag);

  let plaintext;
  try {
    plaintext = Buffer.concat([
      decipher.update(ciphertext.subarray(0, -16)),
      decipher.final(),
    ]);
  } catch {
    throw new Error("Encrypted mosaic viewer authentication failed.");
  }

  const actualContract = inspectMosaicViewerPack(plaintext, manifest);
  if (
    Object.keys(actualContract).some(
      (key) => actualContract[key] !== plaintextContract[key],
    )
  ) {
    throw new Error(
      "Decrypted mosaic viewer pack does not match its approved plaintext contract.",
    );
  }
  return {
    plaintext,
    manifest,
    layers: manifest.layers.map((layer) => ({
      ...layer,
      data: plaintext.subarray(layer.offset, layer.offset + layer.bytes),
    })),
  };
};

export const encryptMosaicBytes = (
  plaintext,
  password,
  {
    approvedPlaintext,
    iterations = MOSAIC_PBKDF2_ITERATIONS,
    salt = randomBytes(16),
    iv = randomBytes(12),
  } = {},
) => {
  if (!password) throw new Error("SKALD_MOSAIC_PASSWORD must not be empty.");
  if (!Number.isSafeInteger(iterations) || iterations < MOSAIC_PBKDF2_ITERATIONS) {
    throw new Error(`PBKDF2 iterations must be at least ${MOSAIC_PBKDF2_ITERATIONS}.`);
  }
  if (salt.length !== 16) throw new Error("PBKDF2 salt must be 16 bytes.");
  if (iv.length !== 12) throw new Error("AES-GCM IV must be 12 bytes.");

  const plaintextContract = inspectJpeg(plaintext);
  if (!approvedPlaintext || plaintextContract.sha256 !== approvedPlaintext.sha256?.toLowerCase()) {
    throw new Error("The mosaic input does not match the approved SHA-256.");
  }
  if (
    plaintextContract.width !== approvedPlaintext.width ||
    plaintextContract.height !== approvedPlaintext.height
  ) {
    throw new Error("The mosaic input does not match the approved dimensions.");
  }

  const derived = pbkdf2Sync(
    password.normalize("NFKC"),
    salt,
    iterations,
    64,
    "sha256",
  );
  const encryptionKey = derived.subarray(0, 32);
  const verificationKey = derived.subarray(32);
  const verifier = createHash("sha256").update(verificationKey).digest();
  const cipher = createCipheriv("aes-256-gcm", encryptionKey, iv);
  cipher.setAAD(mosaicAdditionalData(plaintextContract));
  const encrypted = Buffer.concat([
    cipher.update(plaintext),
    cipher.final(),
    cipher.getAuthTag(),
  ]);

  return {
    encrypted,
    config: {
      schemaVersion: MOSAIC_SCHEMA_VERSION,
      plaintext: plaintextContract,
      kdf: {
        name: "PBKDF2",
        hash: "SHA-256",
        iterations,
        salt: salt.toString("base64"),
      },
      verifier: {
        hash: "SHA-256",
        value: verifier.toString("base64"),
      },
      cipher: {
        name: "AES-GCM",
        iv: iv.toString("base64"),
        url: `./assets/${encryptedAssetName}`,
      },
    },
  };
};

export const encryptMosaicCatalogBytes = (
  plaintext,
  password,
  config,
  {
    approvedCatalogSha256,
    iv = randomBytes(12),
  } = {},
) => {
  const validatedConfig = validateMosaicConfig(config);
  const derived = deriveAndVerifyMosaicKey(password, config, validatedConfig);
  if (iv.length !== 12) throw new Error("Catalog AES-GCM IV must be 12 bytes.");
  if (timingSafeEqual(iv, validatedConfig.iv)) {
    throw new Error("The mosaic and catalog must use distinct AES-GCM IVs.");
  }

  const plaintextContract = inspectMosaicCatalog(plaintext);
  if (
    !approvedCatalogSha256 ||
    plaintextContract.sha256 !== approvedCatalogSha256.toLowerCase()
  ) {
    throw new Error("The mosaic catalog input does not match the approved SHA-256.");
  }
  if (
    plaintextContract.width !== config.plaintext.width ||
    plaintextContract.height !== config.plaintext.height
  ) {
    throw new Error("The mosaic catalog dimensions do not match the approved mosaic.");
  }

  const cipher = createCipheriv("aes-256-gcm", derived.subarray(0, 32), iv);
  cipher.setAAD(mosaicCatalogAdditionalData(plaintextContract));
  const encrypted = Buffer.concat([
    cipher.update(plaintext),
    cipher.final(),
    cipher.getAuthTag(),
  ]);
  return {
    encrypted,
    config: {
      plaintext: plaintextContract,
      cipher: {
        name: "AES-GCM",
        iv: iv.toString("base64"),
        url: `./assets/${encryptedCatalogAssetName}`,
      },
    },
  };
};

export const encryptMosaicViewerPackBytes = (
  plaintext,
  password,
  config,
  manifest,
  {
    approvedManifestSha256,
    iv = randomBytes(12),
  } = {},
) => {
  const validatedConfig = validateMosaicCatalogConfig(config);
  const derived = deriveAndVerifyMosaicKey(password, config, validatedConfig);
  if (iv.length !== 12) throw new Error("Viewer AES-GCM IV must be 12 bytes.");
  const mosaicIv = decodeBase64(config.cipher.iv, 12, "AES-GCM IV");
  const catalogIv = decodeBase64(config.catalog.cipher.iv, 12, "catalog AES-GCM IV");
  if (timingSafeEqual(iv, mosaicIv) || timingSafeEqual(iv, catalogIv)) {
    throw new Error("The mosaic, catalog, and viewer must use distinct AES-GCM IVs.");
  }

  const actualManifestSha256 = mosaicViewerManifestSha256(manifest);
  if (
    !approvedManifestSha256 ||
    actualManifestSha256 !== approvedManifestSha256.toLowerCase()
  ) {
    throw new Error("The mosaic viewer manifest does not match the approved SHA-256.");
  }
  const plaintextContract = inspectMosaicViewerPack(plaintext, manifest);
  if (
    plaintextContract.width !== config.plaintext.width ||
    plaintextContract.height !== config.plaintext.height
  ) {
    throw new Error("The mosaic viewer dimensions do not match the approved mosaic.");
  }

  const cipher = createCipheriv("aes-256-gcm", derived.subarray(0, 32), iv);
  cipher.setAAD(mosaicViewerPackAdditionalData(plaintextContract, manifest));
  const encrypted = Buffer.concat([
    cipher.update(plaintext),
    cipher.final(),
    cipher.getAuthTag(),
  ]);
  return {
    encrypted,
    config: {
      plaintext: plaintextContract,
      manifest,
      cipher: {
        name: "AES-GCM",
        iv: iv.toString("base64"),
        url: `./assets/${encryptedViewerAssetName}`,
      },
    },
  };
};

const main = async () => {
  const {
    input,
    catalogInput,
    catalogOnly,
    viewerPackOnly,
    viewerManifest,
    viewerRoot,
    outputDir,
    approvedPlaintext,
    approvedCatalogSha256,
    approvedViewerManifestSha256,
  } = parseArgs();
  const password = process.env.SKALD_MOSAIC_PASSWORD;
  if (!password) {
    throw new Error("Set SKALD_MOSAIC_PASSWORD to the out-of-band access word.");
  }

  const assertInputOutsideOutput = (path, label) => {
    if (!path) return;
    const inputWithinOutput = relative(outputDir, path);
    if (!inputWithinOutput.startsWith("..") && !isAbsolute(inputWithinOutput)) {
      throw new Error(`The plaintext ${label} input must remain outside the deployable mosaic route.`);
    }
  };
  assertInputOutsideOutput(input, "mosaic");
  assertInputOutsideOutput(catalogInput, "catalog");
  assertInputOutsideOutput(viewerManifest, "viewer manifest");
  assertInputOutsideOutput(viewerRoot, "viewer root");
  await assertNoPlaintextRasterImages(outputDir);

  const assetsDir = join(outputDir, "assets");
  const configPath = join(outputDir, configName);
  const catalogPath = join(assetsDir, encryptedCatalogAssetName);
  const viewerPath = join(assetsDir, encryptedViewerAssetName);
  const configTemp = `${configPath}.tmp-${process.pid}`;
  const catalogTemp = `${catalogPath}.tmp-${process.pid}`;
  const viewerTemp = `${viewerPath}.tmp-${process.pid}`;

  await mkdir(assetsDir, { recursive: true });
  if (viewerPackOnly) {
    const existingConfig = JSON.parse(await readFile(configPath, "utf8"));
    validateMosaicCatalogConfig(existingConfig);
    let manifest;
    try {
      manifest = JSON.parse(
        new TextDecoder("utf-8", { fatal: true }).decode(
          await readFile(viewerManifest),
        ),
      );
    } catch {
      throw new Error("The mosaic viewer manifest must be valid UTF-8 JSON.");
    }
    const pack = await buildMosaicViewerPack(viewerRoot, manifest, {
      approvedManifestSha256: approvedViewerManifestSha256,
    });
    const viewer = encryptMosaicViewerPackBytes(
      pack.plaintext,
      password,
      existingConfig,
      pack.manifest,
      { approvedManifestSha256: approvedViewerManifestSha256 },
    );
    const config = { ...existingConfig, viewer: viewer.config };
    validateMosaicViewerConfig(config);
    const configBytes = Buffer.from(`${JSON.stringify(config, null, 2)}\n`);
    try {
      await Promise.all([
        writeFile(viewerTemp, viewer.encrypted),
        writeFile(configTemp, configBytes),
      ]);
      await rename(viewerTemp, viewerPath);
      await rename(configTemp, configPath);
    } finally {
      await Promise.all([
        rm(viewerTemp, { force: true }),
        rm(configTemp, { force: true }),
      ]);
    }
    console.log(
      `Encrypted Skald mosaic viewer pack: ${pack.plaintext.length} plaintext bytes -> ${viewer.encrypted.length} encrypted bytes.`,
    );
    console.log(`Viewer manifest SHA-256: ${approvedViewerManifestSha256}`);
    console.log(`Viewer plaintext SHA-256: ${sha256(pack.plaintext)}`);
    console.log(`Viewer ciphertext SHA-256: ${sha256(viewer.encrypted)}`);
    console.log(`Preserved ${join(assetsDir, encryptedAssetName)}`);
    console.log(`Preserved ${join(assetsDir, encryptedCatalogAssetName)}`);
    console.log(`Wrote ${configPath}`);
    console.log(`Wrote ${viewerPath}`);
    return;
  }

  if (catalogOnly) {
    const existingConfig = JSON.parse(await readFile(configPath, "utf8"));
    const catalogPlaintext = await readFile(catalogInput);
    const catalog = encryptMosaicCatalogBytes(catalogPlaintext, password, existingConfig, {
      approvedCatalogSha256,
    });
    const config = { ...existingConfig, catalog: catalog.config };
    const configBytes = Buffer.from(`${JSON.stringify(config, null, 2)}\n`);
    try {
      await Promise.all([
        writeFile(catalogTemp, catalog.encrypted),
        writeFile(configTemp, configBytes),
      ]);
      await rename(catalogTemp, catalogPath);
      await rename(configTemp, configPath);
    } finally {
      await Promise.all([
        rm(catalogTemp, { force: true }),
        rm(configTemp, { force: true }),
      ]);
    }
    console.log(
      `Encrypted Skald mosaic catalog: ${catalogPlaintext.length} plaintext bytes -> ${catalog.encrypted.length} encrypted bytes.`,
    );
    console.log(`Catalog plaintext SHA-256: ${sha256(catalogPlaintext)}`);
    console.log(`Catalog ciphertext SHA-256: ${sha256(catalog.encrypted)}`);
    console.log(`Preserved ${join(assetsDir, encryptedAssetName)}`);
    console.log(`Wrote ${configPath}`);
    console.log(`Wrote ${catalogPath}`);
    return;
  }

  const plaintext = await readFile(input);
  const mosaic = encryptMosaicBytes(plaintext, password, {
    approvedPlaintext,
  });
  let config = mosaic.config;
  let catalog = null;
  if (catalogInput) {
    const catalogPlaintext = await readFile(catalogInput);
    catalog = encryptMosaicCatalogBytes(catalogPlaintext, password, config, {
      approvedCatalogSha256,
    });
    config = { ...config, catalog: catalog.config };
  }

  const configBytes = Buffer.from(`${JSON.stringify(config, null, 2)}\n`);
  const encryptedPath = join(assetsDir, encryptedAssetName);
  const encryptedTemp = `${encryptedPath}.tmp-${process.pid}`;
  try {
    await Promise.all([
      writeFile(encryptedTemp, mosaic.encrypted),
      catalog ? writeFile(catalogTemp, catalog.encrypted) : Promise.resolve(),
      writeFile(configTemp, configBytes),
    ]);
    await rename(encryptedTemp, encryptedPath);
    if (catalog) await rename(catalogTemp, catalogPath);
    await rename(configTemp, configPath);
  } finally {
    await Promise.all([
      rm(encryptedTemp, { force: true }),
      rm(catalogTemp, { force: true }),
      rm(viewerTemp, { force: true }),
      rm(configTemp, { force: true }),
    ]);
  }

  console.log(
    `Encrypted Skald mosaic: ${plaintext.length} plaintext bytes -> ${mosaic.encrypted.length} encrypted bytes.`,
  );
  console.log(`Plaintext SHA-256: ${sha256(plaintext)}`);
  console.log(`Ciphertext SHA-256: ${sha256(mosaic.encrypted)}`);
  if (catalog) {
    console.log(`Catalog ciphertext SHA-256: ${sha256(catalog.encrypted)}`);
    console.log(`Wrote ${catalogPath}`);
  }
  console.log(`Wrote ${configPath}`);
  console.log(`Wrote ${encryptedPath}`);
};

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

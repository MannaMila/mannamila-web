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
const configName = "mosaic-config.json";

export const MOSAIC_PBKDF2_ITERATIONS = 600_000;
export const MOSAIC_SCHEMA_VERSION = 2;

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
    outputDir: defaultOutputDir,
    approvedSha256: null,
    approvedWidth: null,
    approvedHeight: null,
  };

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--input") {
      options.input = args[index + 1] ?? null;
      index += 1;
    } else if (argument === "--output-dir") {
      options.outputDir = args[index + 1] ?? null;
      index += 1;
    } else if (argument === "--approved-sha256") {
      options.approvedSha256 = args[index + 1] ?? null;
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

  if (!options.input) throw new Error("--input is required");
  if (!options.outputDir) throw new Error("--output-dir requires a path");
  if (!/^[a-f0-9]{64}$/i.test(options.approvedSha256 ?? "")) {
    throw new Error("--approved-sha256 requires a 64-character SHA-256 digest.");
  }
  if (!Number.isSafeInteger(options.approvedWidth) || options.approvedWidth <= 0) {
    throw new Error("--approved-width requires a positive integer.");
  }
  if (!Number.isSafeInteger(options.approvedHeight) || options.approvedHeight <= 0) {
    throw new Error("--approved-height requires a positive integer.");
  }
  return {
    input: isAbsolute(options.input) ? options.input : resolve(process.cwd(), options.input),
    outputDir: isAbsolute(options.outputDir)
      ? options.outputDir
      : resolve(process.cwd(), options.outputDir),
    approvedPlaintext: {
      sha256: options.approvedSha256.toLowerCase(),
      width: options.approvedWidth,
      height: options.approvedHeight,
    },
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

export const decryptAndVerifyMosaicBytes = (ciphertext, password, config) => {
  if (!password) throw new Error("SKALD_MOSAIC_PASSWORD must not be empty.");
  if (ciphertext.length <= 16) {
    throw new Error("Encrypted mosaic ciphertext is incomplete.");
  }
  const {
    plaintextContract,
    salt,
    verifier,
    iv,
  } = validateMosaicConfig(config);
  const derived = pbkdf2Sync(
    password.normalize("NFKC"),
    salt,
    config.kdf.iterations,
    64,
    "sha256",
  );
  const actualVerifier = createHash("sha256").update(derived.subarray(32)).digest();
  if (!timingSafeEqual(actualVerifier, verifier)) {
    throw new Error("The mosaic access word does not match the encrypted bundle.");
  }

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

const main = async () => {
  const { input, outputDir, approvedPlaintext } = parseArgs();
  const password = process.env.SKALD_MOSAIC_PASSWORD;
  if (!password) {
    throw new Error("Set SKALD_MOSAIC_PASSWORD to the out-of-band access word.");
  }

  const inputWithinOutput = relative(outputDir, input);
  if (!inputWithinOutput.startsWith("..") && !isAbsolute(inputWithinOutput)) {
    throw new Error("The plaintext input must remain outside the deployable mosaic route.");
  }
  await assertNoPlaintextRasterImages(outputDir);

  const plaintext = await readFile(input);
  const { encrypted, config } = encryptMosaicBytes(plaintext, password, {
    approvedPlaintext,
  });
  const configBytes = Buffer.from(`${JSON.stringify(config, null, 2)}\n`);
  const assetsDir = join(outputDir, "assets");
  const encryptedPath = join(assetsDir, encryptedAssetName);
  const configPath = join(outputDir, configName);
  const encryptedTemp = `${encryptedPath}.tmp-${process.pid}`;
  const configTemp = `${configPath}.tmp-${process.pid}`;

  await mkdir(assetsDir, { recursive: true });
  try {
    await Promise.all([
      writeFile(encryptedTemp, encrypted),
      writeFile(configTemp, configBytes),
    ]);
    await rename(encryptedTemp, encryptedPath);
    await rename(configTemp, configPath);
  } finally {
    await Promise.all([
      rm(encryptedTemp, { force: true }),
      rm(configTemp, { force: true }),
    ]);
  }

  console.log(`Encrypted Skald mosaic: ${plaintext.length} plaintext bytes -> ${encrypted.length} encrypted bytes.`);
  console.log(`Plaintext SHA-256: ${sha256(plaintext)}`);
  console.log(`Ciphertext SHA-256: ${sha256(encrypted)}`);
  console.log(`Wrote ${configPath}`);
  console.log(`Wrote ${encryptedPath}`);
};

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

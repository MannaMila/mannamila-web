#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { inflateSync } from "node:zlib";
import {
  decryptAndVerifyMosaicCatalogBytes,
  encryptMosaicCatalogBytes,
  encryptMosaicBytes,
  encryptMosaicViewerPackBytes,
  inspectJpeg,
  mosaicViewerManifestSha256,
} from "../scripts/encrypt-skald-mosaic.mjs";

const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const skaldRoot = dirname(fileURLToPath(import.meta.url));
const defaultTimeoutMs = 10_000;
const mosaicRoute = "mosaic";
const mosaicConfig = `${mosaicRoute}/mosaic-config.json`;
const mosaicAsset = `${mosaicRoute}/assets/skald-museum-art-mosaic.enc`;
const mosaicCatalog = `${mosaicRoute}/assets/skald-museum-art-map.enc`;
const mosaicViewerPack = `${mosaicRoute}/assets/skald-museum-art-viewer.enc`;
const mosaicConfigInstalled = await access(join(skaldRoot, mosaicConfig))
  .then(() => true)
  .catch(() => false);
const mosaicAssetInstalled = await access(join(skaldRoot, mosaicAsset))
  .then(() => true)
  .catch(() => false);
const mosaicCatalogInstalled = await access(join(skaldRoot, mosaicCatalog))
  .then(() => true)
  .catch(() => false);
const mosaicViewerPackInstalled = await access(join(skaldRoot, mosaicViewerPack))
  .then(() => true)
  .catch(() => false);
assert.equal(
  mosaicConfigInstalled && mosaicAssetInstalled && mosaicCatalogInstalled && mosaicViewerPackInstalled,
  mosaicConfigInstalled || mosaicAssetInstalled || mosaicCatalogInstalled || mosaicViewerPackInstalled,
  "the encrypted mosaic config, download, catalog, and progressive viewer ciphertext must be installed together",
);

let mosaicPassword;
let mosaicConfigContent;
let mosaicAssetContent;
let mosaicCatalogContent;
let mosaicViewerPackContent;
if (mosaicAssetInstalled) {
  mosaicPassword = process.env.SKALD_MOSAIC_PASSWORD;
  assert.ok(mosaicPassword, "SKALD_MOSAIC_PASSWORD is required to verify the encrypted mosaic");
  [mosaicConfigContent, mosaicAssetContent, mosaicCatalogContent, mosaicViewerPackContent] = await Promise.all([
    readFile(join(skaldRoot, mosaicConfig)),
    readFile(join(skaldRoot, mosaicAsset)),
    readFile(join(skaldRoot, mosaicCatalog)),
    readFile(join(skaldRoot, mosaicViewerPack)),
  ]);
} else {
  mosaicPassword = "render-test-only-password";
  const plaintext = await readFile(join(skaldRoot, "assets/skald-odyssey-og.jpg"));
  const plaintextContract = inspectJpeg(plaintext);
  const catalogPlaintext = Buffer.from(`${JSON.stringify({
    width: 1200,
    height: 630,
    tiles: [{
      path: "tiles/render-test.jpg",
      x: 0,
      y: 0,
      width: 1200,
      height: 630,
    }],
    artworks: [{
      index: 1,
      id: "render-test-artwork",
      catalog_class: "museum-artifact",
      x: 0,
      y: 0,
      width: 1200,
      height: 630,
      title: "Render test artwork",
      creator: "Test fixture",
      date: "2026",
      museum: "Test museum",
      city: "Test city, Test country",
      source_provider: "Test source",
      books: [1, 13],
      on_view: false,
      gallery: "",
      as_of: "2026-07",
      license: "Test fixture only",
      museum_url: "https://example.com/artwork",
      file_page_url: "https://example.com/artwork",
    }],
  })}\n`);
  const encrypted = encryptMosaicBytes(plaintext, mosaicPassword, {
    approvedPlaintext: plaintextContract,
  });
  const encryptedCatalog = encryptMosaicCatalogBytes(
    catalogPlaintext,
    mosaicPassword,
    encrypted.config,
    {
      approvedCatalogSha256: createHash("sha256").update(catalogPlaintext).digest("hex"),
    },
  );
  const viewerManifest = {
    schemaVersion: 1,
    width: plaintextContract.width,
    height: plaintextContract.height,
    layers: [
      {
        role: "overview",
        id: "render-test-overview",
        sourcePath: "overview.jpg",
        sha256: plaintextContract.sha256,
        offset: 0,
        bytes: plaintext.length,
        naturalWidth: plaintextContract.width,
        naturalHeight: plaintextContract.height,
        x: 0,
        y: 0,
        width: plaintextContract.width,
        height: plaintextContract.height,
      },
      {
        role: "tile",
        id: "render-test-tile",
        sourcePath: "viewer/tiles/render-test.jpg",
        sha256: plaintextContract.sha256,
        offset: plaintext.length,
        bytes: plaintext.length,
        naturalWidth: plaintextContract.width,
        naturalHeight: plaintextContract.height,
        x: 0,
        y: 0,
        width: plaintextContract.width,
        height: plaintextContract.height,
      },
    ],
  };
  const viewerPackPlaintext = Buffer.concat([plaintext, plaintext]);
  const configWithCatalog = { ...encrypted.config, catalog: encryptedCatalog.config };
  const encryptedViewer = encryptMosaicViewerPackBytes(
    viewerPackPlaintext,
    mosaicPassword,
    configWithCatalog,
    viewerManifest,
    {
      approvedManifestSha256: mosaicViewerManifestSha256(viewerManifest),
    },
  );
  const config = { ...configWithCatalog, viewer: encryptedViewer.config };
  mosaicConfigContent = Buffer.from(`${JSON.stringify(config, null, 2)}\n`);
  mosaicAssetContent = encrypted.encrypted;
  mosaicCatalogContent = encryptedCatalog.encrypted;
  mosaicViewerPackContent = encryptedViewer.encrypted;
}
const expectedMosaicConfig = JSON.parse(mosaicConfigContent.toString("utf8"));
const expectedMosaicMap = JSON.parse(
  decryptAndVerifyMosaicCatalogBytes(
    mosaicCatalogContent,
    mosaicPassword,
    expectedMosaicConfig,
  ).toString("utf8"),
);
const firstArtwork = expectedMosaicMap.artworks[0];
const lastArtwork = expectedMosaicMap.artworks.at(-1);
const bookNumerals = [
  "",
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII",
  "XIII",
  "XIV",
  "XV",
  "XVI",
  "XVII",
  "XVIII",
  "XIX",
  "XX",
  "XXI",
  "XXII",
  "XXIII",
  "XXIV",
];
const expectedCollection = (artwork) =>
  [artwork.museum || artwork.source_provider, artwork.city].filter(Boolean).join(" · ");
const expectedBookReferences = (artwork) => {
  if (artwork.books.length === 0) return "Browse all Odyssey art";
  const references = new Intl.ListFormat("en", {
    style: "long",
    type: "conjunction",
  }).format(artwork.books.map((book) => bookNumerals[book]));
  return `${artwork.books.length === 1 ? "Book" : "Books"} ${references}`;
};

const parseArgs = () => {
  const args = process.argv.slice(2);
  const options = { screenshotsDir: null };
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === "--screenshots-dir") {
      options.screenshotsDir = resolve(args[index + 1] ?? "");
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${args[index]}`);
    }
  }
  return options;
};

const delay = (milliseconds) => new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds));

const listen = (server) =>
  new Promise((resolveListen, rejectListen) => {
    server.once("error", rejectListen);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", rejectListen);
      resolveListen(server.address().port);
    });
  });

const closeServer = (server) =>
  new Promise((resolveClose, rejectClose) => {
    server.close((error) => (error ? rejectClose(error) : resolveClose()));
  });

const staticFiles = new Map([
  ["/retire-analytics.js", ["retire-analytics.js", "text/javascript; charset=utf-8"]],
  ["/feedback/", ["feedback/index.html", "text/html; charset=utf-8"]],
  ["/feedback/index.html", ["feedback/index.html", "text/html; charset=utf-8"]],
  ["/feedback/styles.css", ["feedback/styles.css", "text/css; charset=utf-8"]],
  ["/feedback/privacy/", ["feedback/privacy/index.html", "text/html; charset=utf-8"]],
  ["/feedback/privacy/index.html", ["feedback/privacy/index.html", "text/html; charset=utf-8"]],
  [`/${mosaicRoute}/`, [`${mosaicRoute}/index.html`, "text/html; charset=utf-8"]],
  [`/${mosaicRoute}/index.html`, [`${mosaicRoute}/index.html`, "text/html; charset=utf-8"]],
  [`/${mosaicRoute}/styles.css`, [`${mosaicRoute}/styles.css`, "text/css; charset=utf-8"]],
  [`/${mosaicRoute}/viewer.js`, [`${mosaicRoute}/viewer.js`, "text/javascript; charset=utf-8"]],
  [`/${mosaicConfig}`, [mosaicConfigContent, "application/json; charset=utf-8"]],
  [`/${mosaicAsset}`, [mosaicAssetContent, "application/octet-stream"]],
  [`/${mosaicCatalog}`, [mosaicCatalogContent, "application/octet-stream"]],
  [`/${mosaicViewerPack}`, [mosaicViewerPackContent, "application/octet-stream"]],
]);

const startStaticServer = async () => {
  const requests = [];
  const server = createServer(async (request, response) => {
    const pathname = new URL(request.url, "http://127.0.0.1").pathname;
    requests.push(pathname);
    const entry = staticFiles.get(pathname);
    if (!entry) {
      response.writeHead(404).end("Not found\n");
      return;
    }

    try {
      const content = typeof entry[0] === "string"
        ? await readFile(join(skaldRoot, entry[0]))
        : entry[0];
      response.writeHead(200, { "content-type": entry[1], "cache-control": "no-store" });
      response.end(content);
    } catch (error) {
      response.writeHead(error.code === "ENOENT" ? 404 : 500).end(`${error.message}\n`);
    }
  });
  return { server, port: await listen(server), requests };
};

const getAvailablePort = async () => {
  const server = createServer();
  const port = await listen(server);
  await closeServer(server);
  return port;
};

const waitForJson = async (url) => {
  const deadline = Date.now() + defaultTimeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return response.json();
    } catch {
      await delay(100);
    }
  }
  throw new Error(`Timed out waiting for Chrome DevTools at ${url}`);
};

class CdpClient {
  constructor(url) {
    this.socket = new WebSocket(url);
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Map();
    this.subscriptions = new Map();
    this.socket.addEventListener("message", (event) => this.onMessage(JSON.parse(event.data)));
  }

  async open() {
    if (this.socket.readyState === WebSocket.OPEN) return;
    await new Promise((resolveOpen, rejectOpen) => {
      this.socket.addEventListener("open", resolveOpen, { once: true });
      this.socket.addEventListener("error", rejectOpen, { once: true });
    });
  }

  onMessage(message) {
    if (message.id) {
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(message.error.message));
      else pending.resolve(message.result);
      return;
    }

    for (const listener of this.subscriptions.get(message.method) ?? []) {
      listener(message.params);
    }
    const listeners = this.listeners.get(message.method) ?? [];
    this.listeners.delete(message.method);
    for (const listener of listeners) listener.resolve(message.params);
  }

  send(method, params = {}) {
    const id = this.nextId;
    this.nextId += 1;
    return new Promise((resolveSend, rejectSend) => {
      this.pending.set(id, { resolve: resolveSend, reject: rejectSend });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  waitFor(method) {
    return new Promise((resolveEvent, rejectEvent) => {
      const timeout = setTimeout(() => rejectEvent(new Error(`Timed out waiting for ${method}`)), defaultTimeoutMs);
      const listener = {
        resolve: (params) => {
          clearTimeout(timeout);
          resolveEvent(params);
        },
      };
      this.listeners.set(method, [...(this.listeners.get(method) ?? []), listener]);
    });
  }

  subscribe(method, listener) {
    this.subscriptions.set(method, [
      ...(this.subscriptions.get(method) ?? []),
      listener,
    ]);
    return () => {
      const remaining = (this.subscriptions.get(method) ?? [])
        .filter((candidate) => candidate !== listener);
      if (remaining.length) this.subscriptions.set(method, remaining);
      else this.subscriptions.delete(method);
    };
  }

  close() {
    this.socket.close();
  }
}

const createPage = async (debugPort) => {
  const response = await fetch(`http://127.0.0.1:${debugPort}/json/new?about%3Ablank`, { method: "PUT" });
  assert.equal(response.ok, true, `Chrome target creation failed: ${response.status}`);
  const target = await response.json();
  const client = new CdpClient(target.webSocketDebuggerUrl);
  await client.open();
  await client.send("Page.enable");
  await client.send("Runtime.enable");
  return client;
};

const emulate = async (client, { width, height, mobile }) => {
  await client.send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    screenWidth: width,
    screenHeight: height,
    deviceScaleFactor: mobile ? 3 : 1,
    mobile,
  });
  await client.send("Emulation.setTouchEmulationEnabled", { enabled: mobile, maxTouchPoints: mobile ? 5 : 1 });
};

const navigate = async (client, url) => {
  const loaded = client.waitFor("Page.loadEventFired");
  await client.send("Page.navigate", { url });
  await loaded;
  await client.send("Runtime.evaluate", {
    expression: "document.fonts ? document.fonts.ready : Promise.resolve()",
    awaitPromise: true,
  });
};

const evaluate = async (client, expression) => {
  const result = await client.send("Runtime.evaluate", { expression, returnByValue: true });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
  }
  return result.result.value;
};

const waitUntil = async (client, expression, label) => {
  const deadline = Date.now() + defaultTimeoutMs;
  while (Date.now() < deadline) {
    if (await evaluate(client, expression)) return;
    await delay(50);
  }
  throw new Error(`Timed out waiting for ${label}`);
};

const layoutSnapshot = async (client, selectors) => {
  const expression = `(() => {
    const selectors = ${JSON.stringify(selectors)};
    const elements = selectors.flatMap((selector) =>
      [...document.querySelectorAll(selector)].map((element, index) => {
        const rect = element.getBoundingClientRect();
        return {
          selector: document.querySelectorAll(selector).length > 1 ? selector + "[" + index + "]" : selector,
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height,
        };
      }),
    );
    return {
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      documentScrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      documentOverflowX: getComputedStyle(document.documentElement).overflowX,
      bodyOverflowX: getComputedStyle(document.body).overflowX,
      elements,
    };
  })()`;
  const result = await client.send("Runtime.evaluate", { expression, returnByValue: true });
  return result.result.value;
};

const assertMobileLayout = (
  label,
  snapshot,
  expectedSelectors,
  { width = 390, height = 844 } = {},
) => {
  assert.equal(
    snapshot.innerWidth,
    width,
    `${label}: device emulation must produce a ${width} CSS-pixel viewport`,
  );
  assert.equal(
    snapshot.innerHeight,
    height,
    `${label}: device emulation must produce a ${height} CSS-pixel viewport`,
  );
  assert.ok(
    snapshot.documentScrollWidth <= snapshot.innerWidth,
    `${label}: document scroll width ${snapshot.documentScrollWidth} exceeds inner width ${snapshot.innerWidth}`,
  );
  assert.ok(
    snapshot.bodyScrollWidth <= snapshot.innerWidth,
    `${label}: body scroll width ${snapshot.bodyScrollWidth} exceeds inner width ${snapshot.innerWidth}`,
  );
  assert.equal(snapshot.documentOverflowX, "visible", `${label}: document overflow must not be hidden or clipped`);
  assert.equal(snapshot.bodyOverflowX, "visible", `${label}: body overflow must not hide or clip layout defects`);
  assert.ok(snapshot.elements.length >= expectedSelectors.length, `${label}: expected rendered elements are missing`);
  for (const element of snapshot.elements) {
    assert.ok(element.width > 0 && element.height > 0, `${label}: ${element.selector} is not rendered`);
    assert.ok(element.left >= -0.5, `${label}: ${element.selector} clips ${Math.abs(element.left)}px past the left edge`);
    assert.ok(
      element.right <= snapshot.innerWidth + 0.5,
      `${label}: ${element.selector} clips ${element.right - snapshot.innerWidth}px past the right edge`,
    );
  }
};

const capture = async (client, path) => {
  const result = await client.send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: false,
  });
  await writeFile(path, Buffer.from(result.data, "base64"));
};

const capturePngBytes = async (client) => {
  const result = await client.send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: false,
  });
  return Buffer.from(result.data, "base64");
};

const decodePng = (source) => {
  assert.deepEqual(
    source.subarray(0, 8),
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    "Chrome screencast frames must be PNG images",
  );
  let offset = 8;
  let width;
  let height;
  let channels;
  const imageDataChunks = [];
  while (offset < source.length) {
    const length = source.readUInt32BE(offset);
    const type = source.subarray(offset + 4, offset + 8).toString("ascii");
    const data = source.subarray(offset + 8, offset + 8 + length);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      assert.equal(data[8], 8, "Chrome PNG frames must use 8-bit channels");
      assert.ok([2, 6].includes(data[9]), "Chrome PNG frames must use RGB or RGBA");
      assert.deepEqual(
        [...data.subarray(10, 13)],
        [0, 0, 0],
        "Chrome PNG frames must use standard non-interlaced encoding",
      );
      channels = data[9] === 2 ? 3 : 4;
    } else if (type === "IDAT") {
      imageDataChunks.push(data);
    }
    offset += length + 12;
  }

  assert.ok(width && height && channels && imageDataChunks.length);
  const stride = width * channels;
  const raw = inflateSync(Buffer.concat(imageDataChunks));
  const pixels = Buffer.alloc(stride * height);
  const paeth = (left, up, upLeft) => {
    const prediction = left + up - upLeft;
    const leftDistance = Math.abs(prediction - left);
    const upDistance = Math.abs(prediction - up);
    const upLeftDistance = Math.abs(prediction - upLeft);
    if (leftDistance <= upDistance && leftDistance <= upLeftDistance) return left;
    return upDistance <= upLeftDistance ? up : upLeft;
  };
  for (let y = 0; y < height; y += 1) {
    const filter = raw[y * (stride + 1)];
    const sourceRow = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const row = pixels.subarray(y * stride, (y + 1) * stride);
    const prior = y ? pixels.subarray((y - 1) * stride, y * stride) : null;
    for (let x = 0; x < stride; x += 1) {
      const left = x >= channels ? row[x - channels] : 0;
      const up = prior?.[x] ?? 0;
      const upLeft = x >= channels ? prior?.[x - channels] ?? 0 : 0;
      if (filter === 0) row[x] = sourceRow[x];
      else if (filter === 1) row[x] = sourceRow[x] + left;
      else if (filter === 2) row[x] = sourceRow[x] + up;
      else if (filter === 3) row[x] = sourceRow[x] + Math.floor((left + up) / 2);
      else if (filter === 4) row[x] = sourceRow[x] + paeth(left, up, upLeft);
      else assert.fail(`Unsupported Chrome PNG row filter ${filter}`);
    }
  }
  return { width, height, channels, pixels };
};

const hasMagentaMarker = (image) => {
  for (let y = 2; y < 10; y += 1) {
    for (let x = 2; x < 10; x += 1) {
      const offset = (y * image.width + x) * image.channels;
      if (
        image.pixels[offset] < 240 ||
        image.pixels[offset + 1] > 20 ||
        image.pixels[offset + 2] < 240
      ) {
        return false;
      }
    }
  }
  return true;
};

const unexpectedlyDarkBlocks = (baseline, actual, rect) => {
  assert.equal(actual.width, baseline.width);
  assert.equal(actual.height, baseline.height);
  const left = Math.max(0, Math.floor(rect.left));
  const top = Math.max(0, Math.floor(rect.top));
  const right = Math.min(actual.width, Math.ceil(rect.right));
  const bottom = Math.min(actual.height, Math.ceil(rect.bottom));
  const blocks = new Map();
  for (let y = top; y < bottom; y += 1) {
    for (let x = left; x < right; x += 1) {
      const baselineOffset = (y * baseline.width + x) * baseline.channels;
      const actualOffset = (y * actual.width + x) * actual.channels;
      const baselineSum =
        baseline.pixels[baselineOffset] +
        baseline.pixels[baselineOffset + 1] +
        baseline.pixels[baselineOffset + 2];
      const actualSum =
        actual.pixels[actualOffset] +
        actual.pixels[actualOffset + 1] +
        actual.pixels[actualOffset + 2];
      if (actualSum < 100 && actualSum + 90 < baselineSum) {
        const block = `${Math.floor((x - left) / 32)}:${Math.floor((y - top) / 32)}`;
        blocks.set(block, (blocks.get(block) ?? 0) + 1);
      }
    }
  }
  return [...blocks.values()].filter((count) => count >= 512).length;
};

const recordScreencast = async (client, action, durationMs = 500) => {
  const frames = [];
  const acknowledgements = [];
  const unsubscribe = client.subscribe("Page.screencastFrame", (frame) => {
    frames.push(Buffer.from(frame.data, "base64"));
    acknowledgements.push(
      client.send("Page.screencastFrameAck", { sessionId: frame.sessionId }),
    );
  });
  await client.send("Page.startScreencast", {
    format: "png",
    quality: 100,
    maxWidth: 1440,
    maxHeight: 1000,
    everyNthFrame: 1,
  });
  await waitUntil(
    client,
    "document.readyState === 'complete'",
    "initial compositor frame",
  );
  const initialDeadline = Date.now() + defaultTimeoutMs;
  while (!frames.length && Date.now() < initialDeadline) await delay(10);
  assert.ok(frames.length, "Chrome must emit an initial compositor frame");
  frames.length = 0;
  const actionResult = await action();
  await delay(durationMs);
  await client.send("Page.stopScreencast");
  unsubscribe();
  await Promise.all(acknowledgements);
  return { frames, actionResult };
};

const terminate = async (child) => {
  if (child.exitCode !== null) return;
  child.kill("SIGTERM");
  await Promise.race([
    new Promise((resolveExit) => child.once("exit", resolveExit)),
    delay(2_000).then(() => child.kill("SIGKILL")),
  ]);
};

const main = async () => {
  const options = parseArgs();
  await access(chromePath);
  if (options.screenshotsDir) await access(options.screenshotsDir);

  const profile = await mkdtemp(join(tmpdir(), "skald-feedback-chrome-"));
  const { server, port: sitePort, requests } = await startStaticServer();
  const debugPort = await getAvailablePort();
  const chrome = spawn(
    chromePath,
    [
      "--headless=new",
      "--disable-background-networking",
      "--disable-default-apps",
      "--disable-extensions",
      "--no-first-run",
      "--no-default-browser-check",
      `--remote-debugging-port=${debugPort}`,
      `--user-data-dir=${profile}`,
      "about:blank",
    ],
    { stdio: "ignore" },
  );

  try {
    await waitForJson(`http://127.0.0.1:${debugPort}/json/version`);
    const client = await createPage(debugPort);
    try {
      await emulate(client, { width: 1440, height: 1000, mobile: false });
      await navigate(client, `http://127.0.0.1:${sitePort}/feedback/`);
      if (options.screenshotsDir) {
        await capture(client, join(options.screenshotsDir, "skald-feedback-desktop-1440x1000.png"));
      }

      await navigate(client, `http://127.0.0.1:${sitePort}/${mosaicRoute}/`);
      const lockedMosaic = await evaluate(
        client,
        `(() => ({
          gateHidden: document.querySelector("[data-access-gate]").hidden,
          viewerHidden: document.querySelector("[data-mosaic-viewer]").hidden,
          atlasHidden: document.querySelector("[data-mosaic-atlas]").hidden,
          overviewHasSource: document.querySelector("[data-mosaic-overview]").hasAttribute("src"),
          artworkInfoHidden: document.querySelector("[data-artwork-info]").hidden,
          artworkInfoOpen: document.querySelector("[data-artwork-info]").open,
          modalImageSources: [
            document.querySelector("[data-artwork-preview-overview]"),
            document.querySelector("[data-artwork-preview-detail]"),
          ].filter((image) => image?.hasAttribute("src")).length,
          robots: document.querySelector('meta[name="robots"]').content,
        }))()`,
      );
      assert.equal(lockedMosaic.gateHidden, false, "mosaic gate must render before access");
      assert.equal(lockedMosaic.viewerHidden, true, "mosaic viewer must remain hidden before access");
      assert.equal(lockedMosaic.atlasHidden, true, "mosaic atlas must remain hidden before access");
      assert.equal(lockedMosaic.overviewHasSource, false, "mosaic viewer must not be decoded before access");
      assert.equal(lockedMosaic.artworkInfoHidden, true, "artwork details must stay hidden before access");
      assert.equal(lockedMosaic.artworkInfoOpen, false, "artwork dialog must be closed before access");
      assert.equal(lockedMosaic.modalImageSources, 0, "artwork dialog images must be source-free before access");
      assert.equal(
        requests.includes(`/${mosaicConfig}`),
        false,
        "encrypted metadata must not be requested before access is attempted",
      );
      assert.equal(
        requests.includes(`/${mosaicAsset}`),
        false,
        "encrypted mosaic bytes must not be requested before access is accepted",
      );
      assert.equal(
        requests.includes(`/${mosaicCatalog}`),
        false,
        "artwork metadata must not be requested before access is accepted",
      );
      assert.equal(
        requests.includes(`/${mosaicViewerPack}`),
        false,
        "progressive viewer bytes must not be requested before access is accepted",
      );
      for (const directive of ["noindex", "nofollow", "noarchive", "nosnippet", "noimageindex"]) {
        assert.match(lockedMosaic.robots, new RegExp(`(?:^|, )${directive}(?:,|$)`));
      }

      await evaluate(
        client,
        `(() => {
          document.querySelector("[data-access-input]").value = "wrong";
          document.querySelector("[data-access-form]").requestSubmit();
        })()`,
      );
      await waitUntil(
        client,
        `!document.querySelector("[data-access-submit]").disabled`,
        "wrong-password rejection",
      );
      const rejectedMosaic = await evaluate(
        client,
        `(() => ({
          errorHidden: document.querySelector("[data-access-error]").hidden,
          viewerHidden: document.querySelector("[data-mosaic-viewer]").hidden,
          overviewHasSource: document.querySelector("[data-mosaic-overview]").hasAttribute("src"),
        }))()`,
      );
      assert.equal(rejectedMosaic.errorHidden, false, "wrong mosaic access word must show an error");
      assert.equal(rejectedMosaic.viewerHidden, true, "wrong mosaic access word must keep the viewer locked");
      assert.equal(rejectedMosaic.overviewHasSource, false, "wrong access must not decode the viewer");
      assert.equal(requests.includes(`/${mosaicConfig}`), true, "an access attempt must load only encryption metadata");
      assert.equal(
        requests.includes(`/${mosaicAsset}`),
        false,
        "a wrong access word must be rejected before the encrypted mosaic is downloaded",
      );
      assert.equal(
        requests.includes(`/${mosaicCatalog}`),
        false,
        "a wrong access word must be rejected before artwork metadata is downloaded",
      );
      assert.equal(
        requests.includes(`/${mosaicViewerPack}`),
        false,
        "a wrong access word must be rejected before progressive viewer bytes are downloaded",
      );

      await evaluate(
        client,
        `(() => {
          document.querySelector("[data-access-input]").value = ${JSON.stringify(mosaicPassword)};
          document.querySelector("[data-access-form]").requestSubmit();
        })()`,
      );
      await waitUntil(
        client,
        `!document.querySelector("[data-access-submit]").disabled`,
        "encrypted mosaic decryption",
      );
      const unlockedMosaic = await evaluate(
        client,
        `(() => {
          const stage = document.querySelector("[data-mosaic-stage]");
          const atlas = document.querySelector("[data-mosaic-atlas]");
          const overview = document.querySelector("[data-mosaic-overview]");
          const tiles = document.querySelector("[data-mosaic-tiles]");
          const atlasStyle = getComputedStyle(atlas);
          return {
            gateHidden: document.querySelector("[data-access-gate]").hidden,
            viewerHidden: document.querySelector("[data-mosaic-viewer]").hidden,
            atlasHidden: atlas.hidden,
            atlasFillsStage: (() => {
              const atlasRect = atlas.getBoundingClientRect();
              const stageRect = stage.getBoundingClientRect();
              return Math.abs(atlasRect.width - stageRect.width) < 0.5 &&
                Math.abs(atlasRect.height - stageRect.height) < 0.5;
            })(),
            atlasWillChange: atlasStyle.willChange,
            atlasContain: atlasStyle.contain,
            atlasBackfaceVisibility: atlasStyle.backfaceVisibility,
            atlasTransform: atlasStyle.transform,
            overviewSource: overview.getAttribute("src"),
            overviewHidden: overview.hidden,
            overviewWidth: overview.naturalWidth,
            overviewHeight: overview.naturalHeight,
            overviewLayoutWidth: overview.offsetWidth,
            overviewParentIsStage: overview.parentElement === stage,
            tilesParentIsStage: tiles.parentElement === stage,
            tileCount: document.querySelectorAll("[data-tile-id]").length,
            sourcedTileCount: [...document.querySelectorAll("[data-tile-id]")]
              .filter((tile) => tile.hasAttribute("src")).length,
            placeholderHidden: document.querySelector("[data-asset-placeholder]").hidden,
            status: document.querySelector("[data-asset-status]").textContent,
            downloadHidden: document.querySelector("[data-download]").hidden,
            downloadDisabled: document.querySelector("[data-download]").disabled,
            pickerDisabled: document.querySelector("[data-artwork-picker]").disabled,
            pickerOptionCount: document.querySelector("[data-artwork-picker]").options.length,
            error: document.querySelector("[data-access-error]").textContent,
          };
        })()`,
      );
      assert.equal(unlockedMosaic.gateHidden, true, `correct access must hide the gate: ${unlockedMosaic.error}`);
      assert.equal(unlockedMosaic.viewerHidden, false, `correct access must open the viewer: ${unlockedMosaic.error}`);
      assert.equal(unlockedMosaic.atlasHidden, false, "the progressive mosaic atlas must render after access");
      assert.match(unlockedMosaic.overviewSource, /^blob:/, "the overview must use a decrypted Blob URL");
      assert.equal(unlockedMosaic.overviewHidden, false, "the progressive overview must render after access");
      assert.equal(
        unlockedMosaic.atlasFillsStage,
        true,
        "the semantic atlas plane must stay viewport-sized",
      );
      const expectedOverview = expectedMosaicConfig.viewer.manifest.layers.find(
        (layer) => layer.role === "overview",
      );
      assert.equal(unlockedMosaic.overviewWidth, expectedOverview.naturalWidth);
      assert.equal(unlockedMosaic.overviewHeight, expectedOverview.naturalHeight);
      assert.equal(
        unlockedMosaic.overviewLayoutWidth,
        expectedOverview.naturalWidth,
        "the fallback overview must keep its intrinsic layout width",
      );
      assert.equal(
        unlockedMosaic.overviewParentIsStage,
        true,
        "the fallback overview must be independent of the logical atlas",
      );
      assert.equal(
        unlockedMosaic.tilesParentIsStage,
        true,
        "detail tiles must render in an independent viewport overlay",
      );
      assert.equal(
        unlockedMosaic.atlasWillChange,
        "auto",
        "the semantic atlas plane must not be forced into a permanent compositor layer",
      );
      assert.equal(unlockedMosaic.atlasContain, "none");
      assert.equal(unlockedMosaic.atlasBackfaceVisibility, "visible");
      assert.equal(
        unlockedMosaic.atlasTransform,
        "none",
        "the viewport-sized semantic plane must not be transformed",
      );
      assert.equal(
        unlockedMosaic.tileCount,
        expectedMosaicMap.tiles.length,
        "the atlas must expose every reviewed high-resolution tile",
      );
      assert.equal(
        unlockedMosaic.sourcedTileCount,
        0,
        "fit view must avoid decoding high-resolution tiles",
      );
      assert.equal(unlockedMosaic.placeholderHidden, true, "the decrypted mosaic must replace its placeholder");
      assert.match(unlockedMosaic.status, /\d[\d,]* × \d[\d,]* pixels · progressive encrypted viewer/);
      assert.equal(unlockedMosaic.downloadHidden, false, "full-resolution download must remain available");
      assert.equal(unlockedMosaic.downloadDisabled, false, "full-resolution download must be actionable");
      assert.equal(unlockedMosaic.pickerDisabled, false, "the keyboard artwork picker must unlock");
      assert.equal(
        unlockedMosaic.pickerOptionCount,
        expectedMosaicMap.artworks.length + 1,
        "the keyboard artwork picker must expose every decrypted artwork",
      );
      assert.equal(
        requests.includes(`/${mosaicAsset}`),
        false,
        "opening the viewer must not fetch the monolithic full-resolution download",
      );
      assert.equal(
        requests.includes(`/${mosaicCatalog}`),
        true,
        "correct access must fetch encrypted artwork metadata",
      );
      assert.equal(
        requests.includes(`/${mosaicViewerPack}`),
        true,
        "correct access must fetch the progressive viewer pack",
      );

      const fullscreenEntered = await evaluate(
        client,
        `(() => {
          const workspace = document.querySelector("[data-mosaic-viewer]");
          const button = document.querySelector("[data-action='fullscreen']");
          const visible = (element) => {
            const style = getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            return style.display !== "none" &&
              style.visibility !== "hidden" &&
              rect.width > 0 &&
              rect.height > 0;
          };
          let activeElement = null;
          Object.defineProperty(document, "fullscreenElement", {
            configurable: true,
            get: () => activeElement,
          });
          Object.defineProperty(workspace, "requestFullscreen", {
            configurable: true,
            value: async () => {
              activeElement = workspace;
              document.dispatchEvent(new Event("fullscreenchange"));
            },
          });
          Object.defineProperty(document, "exitFullscreen", {
            configurable: true,
            value: async () => {
              activeElement = null;
              document.dispatchEvent(new Event("fullscreenchange"));
            },
          });
          button.click();
          const stageRect = document.querySelector("[data-mosaic-stage]").getBoundingClientRect();
          const buttonRect = button.getBoundingClientRect();
          return {
            active: document.fullscreenElement === workspace,
            pressed: button.getAttribute("aria-pressed"),
            label: button.textContent.trim(),
            state: workspace.dataset.fullscreen,
            ariaLabel: button.getAttribute("aria-label"),
            titleVisible: visible(document.querySelector(".viewer-title")),
            otherControlsVisible: [...document.querySelector(".viewer-controls").children]
              .filter((element) => element !== button)
              .some(visible),
            footerVisible: visible(document.querySelector(".viewer-footer")),
            statusVisible: visible(document.querySelector("[data-asset-status]")),
            exitIconVisible: visible(document.querySelector("[data-fullscreen-exit-icon]")),
            textLabelVisible: visible(document.querySelector("[data-fullscreen-label]")),
            buttonWidth: buttonRect.width,
            buttonHeight: buttonRect.height,
            buttonTop: buttonRect.top,
            buttonRight: buttonRect.right,
            stageLeft: stageRect.left,
            stageTop: stageRect.top,
            stageRight: stageRect.right,
            stageBottom: stageRect.bottom,
            innerWidth,
            innerHeight,
          };
        })()`,
      );
      assert.equal(fullscreenEntered.active, true, "fullscreen control must target the complete viewer");
      assert.equal(fullscreenEntered.pressed, "true");
      assert.match(fullscreenEntered.label, /Exit full screen/i);
      assert.equal(fullscreenEntered.state, "true");
      assert.equal(fullscreenEntered.ariaLabel, "Exit full screen");
      assert.equal(fullscreenEntered.titleVisible, false);
      assert.equal(fullscreenEntered.otherControlsVisible, false);
      assert.equal(fullscreenEntered.footerVisible, false);
      assert.equal(fullscreenEntered.statusVisible, false);
      assert.equal(fullscreenEntered.exitIconVisible, true);
      assert.equal(fullscreenEntered.textLabelVisible, false);
      assert.ok(fullscreenEntered.buttonWidth <= 44.5);
      assert.ok(fullscreenEntered.buttonHeight <= 44.5);
      assert.ok(fullscreenEntered.buttonTop >= 0 && fullscreenEntered.buttonTop <= 26);
      assert.ok(
        fullscreenEntered.innerWidth - fullscreenEntered.buttonRight >= 0 &&
          fullscreenEntered.innerWidth - fullscreenEntered.buttonRight <= 26,
      );
      assert.ok(Math.abs(fullscreenEntered.stageLeft) < 1);
      assert.ok(Math.abs(fullscreenEntered.stageTop) < 1);
      assert.ok(Math.abs(fullscreenEntered.stageRight - fullscreenEntered.innerWidth) < 1);
      assert.ok(Math.abs(fullscreenEntered.stageBottom - fullscreenEntered.innerHeight) < 1);
      if (options.screenshotsDir) {
        await capture(
          client,
          join(options.screenshotsDir, "skald-mosaic-fullscreen-desktop-1440x1000.png"),
        );
      }
      const fullscreenExited = await evaluate(
        client,
        `(() => {
          const button = document.querySelector("[data-action='fullscreen']");
          const visible = (element) => {
            const style = getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            return style.display !== "none" &&
              style.visibility !== "hidden" &&
              rect.width > 0 &&
              rect.height > 0;
          };
          button.click();
          return {
            active: document.fullscreenElement !== null,
            pressed: button.getAttribute("aria-pressed"),
            label: button.textContent.trim(),
            state: document.querySelector("[data-mosaic-viewer]").dataset.fullscreen,
            ariaLabel: button.getAttribute("aria-label"),
            titleVisible: visible(document.querySelector(".viewer-title")),
            otherControlsVisible: [...document.querySelector(".viewer-controls").children]
              .filter((element) => element !== button)
              .some(visible),
            footerVisible: visible(document.querySelector(".viewer-footer")),
            statusVisible: visible(document.querySelector("[data-asset-status]")),
            exitIconVisible: visible(document.querySelector("[data-fullscreen-exit-icon]")),
            textLabelVisible: visible(document.querySelector("[data-fullscreen-label]")),
          };
        })()`,
      );
      assert.equal(fullscreenExited.active, false, "fullscreen control must exit the viewer");
      assert.equal(fullscreenExited.pressed, "false");
      assert.match(fullscreenExited.label, /^Full screen$/i);
      assert.equal(fullscreenExited.state, "false");
      assert.equal(fullscreenExited.ariaLabel, "Enter full screen");
      assert.equal(fullscreenExited.titleVisible, true);
      assert.equal(fullscreenExited.otherControlsVisible, true);
      assert.equal(fullscreenExited.footerVisible, true);
      assert.equal(fullscreenExited.statusVisible, true);
      assert.equal(fullscreenExited.exitIconVisible, false);
      assert.equal(fullscreenExited.textLabelVisible, true);

      const desktopStage = await evaluate(
        client,
        `(() => {
          const rect = document.querySelector("[data-mosaic-stage]").getBoundingClientRect();
          return {
            x: Math.round(rect.left + rect.width / 2),
            y: Math.round(rect.top + rect.height / 2),
            beforeZoom: Number.parseFloat(document.querySelector("[data-zoom-output]").value),
            beforeTransform: document.querySelector("[data-mosaic-overview]").style.transform,
          };
        })()`,
      );
      await client.send("Input.dispatchMouseEvent", {
        type: "mouseWheel",
        x: desktopStage.x,
        y: desktopStage.y,
        deltaX: 0,
        deltaY: -240,
      });
      await delay(50);
      const desktopAfterWheel = await evaluate(
        client,
        `(() => ({
          zoom: Number.parseFloat(document.querySelector("[data-zoom-output]").value),
          transform: document.querySelector("[data-mosaic-overview]").style.transform,
        }))()`,
      );
      assert.ok(desktopAfterWheel.zoom > desktopStage.beforeZoom, "mouse-wheel input must zoom in");
      assert.notEqual(
        desktopAfterWheel.transform,
        desktopStage.beforeTransform,
        "mouse-wheel input must transform the mosaic",
      );
      await evaluate(client, `document.querySelector("[data-action='fit']").click()`);
      await delay(50);

      const wheelBurstBefore = await evaluate(
        client,
        `(() => {
          const stage = document.querySelector("[data-mosaic-stage]");
          const overview = document.querySelector("[data-mosaic-overview]");
          const rect = stage.getBoundingClientRect();
          const originalGetBoundingClientRect = stage.getBoundingClientRect.bind(stage);
          const scale = Number.parseFloat(
            overview.style.transform.match(/scale\\(([^)]+)\\)/)?.[1] ?? "0",
          );
          window.__mosaicStageRectReads = 0;
          window.__mosaicOriginalStageRect = originalGetBoundingClientRect;
          stage.getBoundingClientRect = () => {
            window.__mosaicStageRectReads += 1;
            return originalGetBoundingClientRect();
          };
          window.__mosaicZoomRenderMutations = 0;
          window.__mosaicZoomRenderObserver?.disconnect();
          window.__mosaicZoomRenderObserver = new MutationObserver((records) => {
            window.__mosaicZoomRenderMutations += records.filter(
              (record) => record.type === "attributes" && record.attributeName === "style",
            ).length;
          });
          window.__mosaicZoomRenderObserver.observe(overview, {
            attributes: true,
            attributeFilter: ["style"],
          });
          for (let index = 0; index < 120; index += 1) {
            stage.dispatchEvent(new WheelEvent("wheel", {
              bubbles: true,
              cancelable: true,
              clientX: rect.left + rect.width / 2,
              clientY: rect.top + rect.height / 2,
              deltaY: -1,
              deltaMode: WheelEvent.DOM_DELTA_PIXEL,
            }));
          }
          return scale;
        })()`,
      );
      await delay(50);
      const wheelBurstAfter = await evaluate(
        client,
        `(() => {
          window.__mosaicZoomRenderObserver?.disconnect();
          const stage = document.querySelector("[data-mosaic-stage]");
          stage.getBoundingClientRect = window.__mosaicOriginalStageRect;
          const transform = document.querySelector("[data-mosaic-overview]").style.transform;
          return {
            scale: Number.parseFloat(transform.match(/scale\\(([^)]+)\\)/)?.[1] ?? "0"),
            mutations: window.__mosaicZoomRenderMutations,
            rectReads: window.__mosaicStageRectReads,
          };
        })()`,
      );
      assert.ok(
        wheelBurstAfter.scale >= wheelBurstBefore * 1.3,
        `fine-grained wheel input must zoom responsively (${wheelBurstAfter.scale} after ${wheelBurstBefore})`,
      );
      assert.ok(
        wheelBurstAfter.mutations <= 2,
        `wheel bursts must coalesce into display-frame renders, got ${wheelBurstAfter.mutations} image transforms`,
      );
      assert.ok(
        wheelBurstAfter.rectReads <= 1,
        `wheel bursts must reuse cached stage geometry, got ${wheelBurstAfter.rectReads} layout reads`,
      );
      await evaluate(client, `document.querySelector("[data-action='fit']").click()`);
      await delay(50);
      const lineWheelBefore = await evaluate(
        client,
        `Number.parseFloat(
          document.querySelector("[data-mosaic-overview]").style.transform.match(/scale\\(([^)]+)\\)/)?.[1] ?? "0"
        )`,
      );
      await evaluate(
        client,
        `(() => {
          const stage = document.querySelector("[data-mosaic-stage]");
          const rect = stage.getBoundingClientRect();
          stage.dispatchEvent(new WheelEvent("wheel", {
            bubbles: true,
            cancelable: true,
            clientX: rect.left + rect.width / 2,
            clientY: rect.top + rect.height / 2,
            deltaY: -3,
            deltaMode: WheelEvent.DOM_DELTA_LINE,
          }));
        })()`,
      );
      await delay(50);
      const lineWheelAfter = await evaluate(
        client,
        `Number.parseFloat(
          document.querySelector("[data-mosaic-overview]").style.transform.match(/scale\\(([^)]+)\\)/)?.[1] ?? "0"
        )`,
      );
      assert.ok(
        lineWheelAfter >= lineWheelBefore * 1.1,
        `line-mode wheel input must be normalized (${lineWheelAfter} after ${lineWheelBefore})`,
      );
      await evaluate(client, `document.querySelector("[data-action='fit']").click()`);

      await client.send("Input.dispatchMouseEvent", {
        type: "mousePressed",
        button: "left",
        buttons: 1,
        clickCount: 1,
        x: desktopStage.x,
        y: desktopStage.y,
      });
      await client.send("Input.dispatchMouseEvent", {
        type: "mouseMoved",
        button: "left",
        buttons: 1,
        x: desktopStage.x + 24,
        y: desktopStage.y + 12,
      });
      await client.send("Input.dispatchMouseEvent", {
        type: "mouseReleased",
        button: "left",
        buttons: 0,
        clickCount: 1,
        x: desktopStage.x + 24,
        y: desktopStage.y + 12,
      });
      assert.equal(
        await evaluate(client, `document.querySelector("[data-artwork-info]").hidden`),
        true,
        "dragging the mosaic must not open artwork details",
      );
      await evaluate(client, `document.querySelector("[data-action='fit']").click()`);

      const firstArtworkPoint = await evaluate(
        client,
        `(() => {
          const rect = document.querySelector("[data-mosaic-overview]").getBoundingClientRect();
          return {
            x: Math.round(rect.left + rect.width * ${(firstArtwork.x + firstArtwork.width / 2) / expectedMosaicMap.width}),
            y: Math.round(rect.top + rect.height * ${(firstArtwork.y + firstArtwork.height / 2) / expectedMosaicMap.height}),
          };
        })()`,
      );
      await client.send("Input.dispatchMouseEvent", {
        type: "mousePressed",
        button: "left",
        buttons: 1,
        clickCount: 1,
        ...firstArtworkPoint,
      });
      await client.send("Input.dispatchMouseEvent", {
        type: "mouseReleased",
        button: "left",
        buttons: 0,
        clickCount: 1,
        ...firstArtworkPoint,
      });
      await waitUntil(
        client,
        `document.querySelector("[data-artwork-info]").open &&
          document.querySelector("[data-artwork-preview-detail]").dataset.ready === "true"`,
        "desktop artwork details",
      );
      const desktopArtworkDetails = await evaluate(
        client,
        `(() => {
          const panel = document.querySelector("[data-artwork-info]");
          const detail = document.querySelector("[data-artwork-preview-detail]");
          const rect = panel.getBoundingClientRect();
          return {
            open: panel.open,
            ariaModal: panel.getAttribute("aria-modal"),
            selectionHidden: document.querySelector("[data-artwork-selection]").hidden,
            index: document.querySelector("[data-artwork-index]").textContent,
            title: document.querySelector("[data-artwork-title]").textContent,
            creator: document.querySelector("[data-artwork-creator]").textContent,
            museum: document.querySelector("[data-artwork-museum]").textContent,
            books: document.querySelector("[data-artwork-books]").textContent,
            status: document.querySelector("[data-artwork-status]").textContent,
            license: document.querySelector("[data-artwork-license]").textContent,
            sourceHref: document.querySelector("[data-artwork-source-links] a")?.href ?? "",
            left: rect.left,
            top: rect.top,
            right: rect.right,
            bottom: rect.bottom,
            innerWidth,
            innerHeight,
            closeFocused:
              document.activeElement === document.querySelector("[data-action='close-details']"),
            detailSource: detail.getAttribute("src"),
            detailNaturalWidth: detail.naturalWidth,
            detailNaturalHeight: detail.naturalHeight,
            tileId: detail.dataset.sourceTile,
            cropX: Number(detail.dataset.cropX),
            cropY: Number(detail.dataset.cropY),
            cropWidth: Number(detail.dataset.cropWidth),
            cropHeight: Number(detail.dataset.cropHeight),
            sourcedStageTiles: document.querySelectorAll("[data-tile-id][src]").length,
          };
        })()`,
      );
      const firstArtworkTile = expectedMosaicMap.tiles.find(
        (tile) =>
          firstArtwork.x >= tile.x &&
          firstArtwork.y >= tile.y &&
          firstArtwork.x + firstArtwork.width <= tile.x + tile.width &&
          firstArtwork.y + firstArtwork.height <= tile.y + tile.height,
      );
      assert.equal(desktopArtworkDetails.open, true);
      assert.equal(desktopArtworkDetails.ariaModal, "true");
      assert.ok(Math.abs(desktopArtworkDetails.left) < 0.5);
      assert.ok(Math.abs(desktopArtworkDetails.top) < 0.5);
      assert.ok(Math.abs(desktopArtworkDetails.right - desktopArtworkDetails.innerWidth) < 0.5);
      assert.ok(Math.abs(desktopArtworkDetails.bottom - desktopArtworkDetails.innerHeight) < 0.5);
      assert.equal(desktopArtworkDetails.closeFocused, true);
      assert.equal(desktopArtworkDetails.selectionHidden, false);
      assert.equal(desktopArtworkDetails.index, "001");
      assert.equal(desktopArtworkDetails.title, firstArtwork.title);
      assert.match(desktopArtworkDetails.creator, /Pieter Lastman/);
      assert.match(desktopArtworkDetails.creator, /1625/);
      assert.equal(desktopArtworkDetails.museum, expectedCollection(firstArtwork));
      assert.equal(desktopArtworkDetails.books, expectedBookReferences(firstArtwork));
      assert.match(desktopArtworkDetails.status, /Collection record/);
      assert.match(desktopArtworkDetails.license, /Public Domain/);
      assert.equal(desktopArtworkDetails.sourceHref, firstArtwork.museum_url);
      assert.match(desktopArtworkDetails.detailSource, /^blob:/);
      assert.equal(desktopArtworkDetails.detailNaturalWidth, firstArtworkTile.width);
      assert.equal(desktopArtworkDetails.detailNaturalHeight, firstArtworkTile.height);
      assert.equal(desktopArtworkDetails.tileId, firstArtworkTile.path);
      assert.equal(desktopArtworkDetails.cropX, firstArtwork.x - firstArtworkTile.x);
      assert.equal(desktopArtworkDetails.cropY, firstArtwork.y - firstArtworkTile.y);
      assert.equal(desktopArtworkDetails.cropWidth, firstArtwork.width);
      assert.equal(desktopArtworkDetails.cropHeight, firstArtwork.height);
      assert.equal(
        desktopArtworkDetails.sourcedStageTiles,
        0,
        "full-screen detail must own the sole high-resolution tile decode",
      );
      assert.equal(
        requests.includes(`/${mosaicAsset}`),
        false,
        "full-screen artwork details must not fetch the monolithic download",
      );
      const refusedDismissal = await evaluate(
        client,
        `(() => {
          const panel = document.querySelector("[data-artwork-info]");
          const cancel = new Event("cancel", { bubbles: false, cancelable: true });
          panel.dispatchEvent(cancel);
          document.dispatchEvent(new KeyboardEvent("keydown", {
            key: "Escape",
            bubbles: true,
            cancelable: true,
          }));
          return {
            cancelPrevented: cancel.defaultPrevented,
            open: panel.open,
            hidden: panel.hidden,
          };
        })()`,
      );
      assert.equal(refusedDismissal.cancelPrevented, true);
      assert.equal(refusedDismissal.open, true);
      assert.equal(refusedDismissal.hidden, false);
      const closedArtworkDetails = await evaluate(
        client,
        `(() => {
          document.querySelector("[data-action='close-details']").click();
          return {
            infoHidden: document.querySelector("[data-artwork-info]").hidden,
            infoOpen: document.querySelector("[data-artwork-info]").open,
            selectionHidden: document.querySelector("[data-artwork-selection]").hidden,
            detailSource: document.querySelector("[data-artwork-preview-detail]").getAttribute("src"),
          };
        })()`,
      );
      assert.equal(closedArtworkDetails.infoHidden, true, "the close control must hide artwork details");
      assert.equal(closedArtworkDetails.infoOpen, false, "the X control must close the artwork dialog");
      assert.equal(closedArtworkDetails.selectionHidden, true, "the close control must clear the highlight");
      assert.equal(closedArtworkDetails.detailSource, null, "the X control must release the detail image");

      const lastArtworkPoint = await evaluate(
        client,
        `(() => {
          const rect = document.querySelector("[data-mosaic-overview]").getBoundingClientRect();
          return {
            x: Math.round(rect.left + rect.width * ${(lastArtwork.x + lastArtwork.width / 2) / expectedMosaicMap.width}),
            y: Math.round(rect.top + rect.height * ${(lastArtwork.y + lastArtwork.height / 2) / expectedMosaicMap.height}),
          };
        })()`,
      );
      await client.send("Input.dispatchMouseEvent", {
        type: "mousePressed",
        button: "left",
        buttons: 1,
        clickCount: 1,
        ...lastArtworkPoint,
      });
      await client.send("Input.dispatchMouseEvent", {
        type: "mouseReleased",
        button: "left",
        buttons: 0,
        clickCount: 1,
        ...lastArtworkPoint,
      });
      await waitUntil(
        client,
        `document.querySelector("[data-artwork-title]").textContent === ${JSON.stringify(lastArtwork.title)}`,
        "on-view artwork details",
      );
      const onViewArtworkDetails = await evaluate(
        client,
        `(() => ({
          title: document.querySelector("[data-artwork-title]").textContent,
          status: document.querySelector("[data-artwork-status]").textContent,
          sourceHref: document.querySelector("[data-artwork-source-links] a")?.href ?? "",
          target: document.querySelector("[data-artwork-source-links] a")?.target ?? "",
          rel: document.querySelector("[data-artwork-source-links] a")?.rel ?? "",
        }))()`,
      );
      assert.equal(onViewArtworkDetails.title, lastArtwork.title);
      assert.match(onViewArtworkDetails.status, /On view/);
      assert.match(onViewArtworkDetails.status, /Gallery 159/);
      assert.match(onViewArtworkDetails.status, /July 2026/);
      assert.match(onViewArtworkDetails.status, /check the museum before visiting/i);
      assert.equal(onViewArtworkDetails.sourceHref, lastArtwork.museum_url);
      assert.equal(onViewArtworkDetails.target, "_blank");
      assert.match(onViewArtworkDetails.rel, /noopener/);
      assert.match(onViewArtworkDetails.rel, /noreferrer/);
      const artworkHitTestFailures = await evaluate(
        client,
        `(() => {
          const artworks = ${JSON.stringify(
            expectedMosaicMap.artworks.map(({ index, title, x, y, width, height }) => ({
              index,
              title,
              x,
              y,
              width,
              height,
            })),
          )};
          const stage = document.querySelector("[data-mosaic-stage]");
          const overview = document.querySelector("[data-mosaic-overview]");
          const close = document.querySelector("[data-action='close-details']");
          const failures = [];
          for (const artwork of artworks) {
            const rect = overview.getBoundingClientRect();
            stage.dispatchEvent(new MouseEvent("click", {
              bubbles: true,
              clientX: rect.left + rect.width * ((artwork.x + artwork.width / 2) / ${expectedMosaicMap.width}),
              clientY: rect.top + rect.height * ((artwork.y + artwork.height / 2) / ${expectedMosaicMap.height}),
            }));
            if (
              document.querySelector("[data-artwork-index]").textContent !== String(artwork.index).padStart(3, "0") ||
              document.querySelector("[data-artwork-title]").textContent !== artwork.title
            ) {
              failures.push(artwork.index);
            }
            close.click();
          }
          return failures;
        })()`,
      );
      assert.deepEqual(
        artworkHitTestFailures,
        [],
        "every reviewed mosaic cell must open its matching artwork record",
      );
      await evaluate(
        client,
        `(() => {
          const picker = document.querySelector("[data-artwork-picker]");
          picker.value = ${JSON.stringify(lastArtwork.id)};
          picker.dispatchEvent(new Event("change", { bubbles: true }));
        })()`,
      );
      await waitUntil(
        client,
        `document.querySelector("[data-artwork-info]").open &&
          document.querySelector("[data-artwork-preview-detail]").dataset.ready === "true"`,
        "picker artwork details",
      );
      if (options.screenshotsDir) {
        await capture(client, join(options.screenshotsDir, "skald-mosaic-details-desktop-1440x1000.png"));
      }
      await evaluate(
        client,
        `document.querySelector("[data-action='close-details']").click()`,
      );
      await waitUntil(
        client,
        `[...document.querySelectorAll("[data-tile-id]")]
          .some((tile) => tile.hasAttribute("src") && tile.naturalWidth > 0 && !tile.hidden)`,
        "viewport high-resolution tile",
      );
      const loadedTiles = await evaluate(
        client,
        `(() => {
          const tiles = [...document.querySelectorAll("[data-tile-id]")];
          return {
            total: tiles.length,
            sourced: tiles.filter((tile) => tile.hasAttribute("src")).length,
            visible: tiles.filter((tile) => !tile.hidden).length,
            maximumWidth: Math.max(...tiles.map((tile) => tile.naturalWidth)),
            maximumHeight: Math.max(...tiles.map((tile) => tile.naturalHeight)),
            decodedPixels: tiles
              .filter((tile) => tile.hasAttribute("src"))
              .reduce((total, tile) => total + tile.naturalWidth * tile.naturalHeight, 0),
          };
        })()`,
      );
      assert.equal(loadedTiles.total, expectedMosaicMap.tiles.length);
      assert.ok(loadedTiles.sourced >= 1 && loadedTiles.sourced <= 2);
      assert.ok(loadedTiles.visible >= 1 && loadedTiles.visible <= 2);
      assert.ok(loadedTiles.maximumWidth <= 4000);
      assert.ok(loadedTiles.maximumHeight <= 4000);
      assert.ok(
        loadedTiles.decodedPixels <= 32_000_000,
        `detail tile budget must stay at or below 32 million pixels, got ${loadedTiles.decodedPixels}`,
      );
      assert.equal(
        requests.includes(`/${mosaicAsset}`),
        false,
        "high-resolution viewing must still avoid the monolithic download",
      );
      const heldGesturePoint = await evaluate(
        client,
        `(() => {
          const rect = document.querySelector("[data-mosaic-stage]").getBoundingClientRect();
          return {
            x: Math.round(rect.left + rect.width * 0.45),
            y: Math.round(rect.top + rect.height * 0.45),
          };
        })()`,
      );
      await client.send("Input.dispatchMouseEvent", {
        type: "mousePressed",
        button: "left",
        buttons: 1,
        clickCount: 1,
        ...heldGesturePoint,
      });
      await client.send("Input.dispatchMouseEvent", {
        type: "mouseMoved",
        button: "left",
        buttons: 1,
        x: heldGesturePoint.x + 140,
        y: heldGesturePoint.y + 90,
      });
      await delay(240);
      const heldGestureState = await evaluate(
        client,
        `(() => ({
          containerHidden: document.querySelector("[data-mosaic-tiles]").hidden,
          visibleTiles: [...document.querySelectorAll("[data-tile-id]")]
            .filter((tile) => !tile.hidden).length,
          selectionHidden: document.querySelector("[data-artwork-selection]").hidden,
        }))()`,
      );
      assert.equal(
        heldGestureState.containerHidden,
        true,
        "detail tiles must stay suppressed while a pointer gesture is held",
      );
      assert.equal(heldGestureState.visibleTiles, 0);
      assert.equal(
        heldGestureState.selectionHidden,
        true,
        "closing the full-screen artwork detail must leave no stale selection during gestures",
      );
      await client.send("Input.dispatchMouseEvent", {
        type: "mouseReleased",
        button: "left",
        buttons: 0,
        clickCount: 1,
        x: heldGesturePoint.x + 140,
        y: heldGesturePoint.y + 90,
      });
      await waitUntil(
        client,
        `[...document.querySelectorAll("[data-tile-id]")]
          .some((tile) => tile.hasAttribute("src") && tile.naturalWidth > 0 && !tile.hidden)`,
        "settled tiles after releasing the held gesture",
      );

      await evaluate(
        client,
        `(() => {
          document.querySelector("[data-action='fit']").click();
          const marker = document.createElement("div");
          marker.dataset.compositorMarker = "";
          marker.hidden = true;
          marker.style.cssText =
            "position:fixed;inset:0 auto auto 0;width:12px;height:12px;" +
            "z-index:2147483647;background:#ff00ff;pointer-events:none";
          document.body.append(marker);
        })()`,
      );
      await delay(150);
      const fitBaseline = decodePng(await capturePngBytes(client));
      const stressGeometry = await evaluate(
        client,
        `(() => {
          const stage = document.querySelector("[data-mosaic-stage]").getBoundingClientRect();
          const overview = document.querySelector("[data-mosaic-overview]").getBoundingClientRect();
          return {
            centerX: stage.left + stage.width / 2,
            centerY: stage.top + stage.height / 2,
            overview: {
              left: overview.left,
              top: overview.top,
              right: overview.right,
              bottom: overview.bottom,
            },
          };
        })()`,
      );
      for (let index = 0; index < 7; index += 1) {
        await client.send("Input.dispatchMouseEvent", {
          type: "mouseWheel",
          x: stressGeometry.centerX,
          y: stressGeometry.centerY,
          deltaX: 0,
          deltaY: -240,
        });
        await delay(18);
      }
      await waitUntil(
        client,
        `[...document.querySelectorAll("[data-tile-id]")]
          .some((tile) => tile.hasAttribute("src") && tile.naturalWidth > 0 && !tile.hidden)`,
        "decoded tiles before compositor recovery stress",
      );
      for (const [deltaX, deltaY] of [
        [340, 200],
        [-520, -240],
        [420, -180],
      ]) {
        await client.send("Input.dispatchMouseEvent", {
          type: "mousePressed",
          button: "left",
          buttons: 1,
          clickCount: 1,
          x: stressGeometry.centerX,
          y: stressGeometry.centerY,
        });
        await client.send("Input.dispatchMouseEvent", {
          type: "mouseMoved",
          button: "left",
          buttons: 1,
          x: stressGeometry.centerX + deltaX,
          y: stressGeometry.centerY + deltaY,
        });
        await client.send("Input.dispatchMouseEvent", {
          type: "mouseReleased",
          button: "left",
          buttons: 0,
          clickCount: 1,
          x: stressGeometry.centerX + deltaX,
          y: stressGeometry.centerY + deltaY,
        });
        await delay(18);
      }
      for (const [index, deltaY] of [-120, 160, -160, 120].entries()) {
        await client.send("Input.dispatchMouseEvent", {
          type: "mouseWheel",
          x: stressGeometry.centerX + (index - 1.5) * 80,
          y: stressGeometry.centerY + (index % 2 ? 70 : -70),
          deltaX: 0,
          deltaY,
        });
        await delay(18);
      }
      await waitUntil(
        client,
        `[...document.querySelectorAll("[data-tile-id]")]
          .some((tile) => tile.hasAttribute("src") && tile.naturalWidth > 0 && !tile.hidden)`,
        "settled tiles after pan and alternating-zoom stress",
      );
      await delay(180);
      const compositorRecovery = await recordScreencast(
        client,
        async () => client.send("Runtime.evaluate", {
          expression: `new Promise((resolve) => {
            document.querySelector("[data-action='fit']").click();
            const marker = document.querySelector("[data-compositor-marker]");
            marker.hidden = false;
            let alternate = false;
            window.__mosaicCompositorMarkerTimer = setInterval(() => {
              alternate = !alternate;
              marker.style.boxShadow = alternate ? "0 0 0 1px #ff00ff" : "none";
            }, 32);
            requestAnimationFrame(() => resolve({
              visibleTiles: [...document.querySelectorAll("[data-tile-id]")]
                .filter((tile) => tile.hasAttribute("src") && !tile.hidden).length,
              sourcedTiles: [...document.querySelectorAll("[data-tile-id][src]")].length,
              overviewComplete: document.querySelector("[data-mosaic-overview]").complete,
              overviewSource: document.querySelector("[data-mosaic-overview]").getAttribute("src"),
              selectionHidden: document.querySelector("[data-artwork-selection]").hidden,
            }));
          })`,
          returnByValue: true,
          awaitPromise: true,
        }),
      );
      await evaluate(
        client,
        `(() => {
          clearInterval(window.__mosaicCompositorMarkerTimer);
          document.querySelector("[data-compositor-marker]").hidden = true;
        })()`,
      );
      assert.equal(
        compositorRecovery.actionResult.result.value.visibleTiles,
        0,
        "Fit must suppress detail tiles before the first compositor frame",
      );
      assert.equal(
        compositorRecovery.actionResult.result.value.sourcedTiles,
        0,
        "Fit must unload detail tiles before the first compositor frame",
      );
      assert.equal(
        compositorRecovery.actionResult.result.value.overviewComplete,
        true,
        "the fallback overview must remain decoded during Fit recovery",
      );
      assert.match(
        compositorRecovery.actionResult.result.value.overviewSource,
        /^blob:/,
        "Fit recovery must preserve the decrypted overview source",
      );
      assert.equal(
        compositorRecovery.actionResult.result.value.selectionHidden,
        true,
        "Fit recovery must not restore an artwork selection after its detail view closes",
      );
      const markedFitFrames = compositorRecovery.frames
        .map(decodePng)
        .filter(hasMagentaMarker);
      assert.ok(
        markedFitFrames.length >= 2,
        `the stress gate needs at least two committed Fit frames, got ${markedFitFrames.length}`,
      );
      const checkerboardedFrames = markedFitFrames
        .map((frame) => unexpectedlyDarkBlocks(
          fitBaseline,
          frame,
          stressGeometry.overview,
        ))
        .filter((darkBlocks) => darkBlocks > 0);
      assert.deepEqual(
        checkerboardedFrames,
        [],
        `rapid zoom/Fit must not expose checkerboard blocks: ${checkerboardedFrames.join(", ")}`,
      );

      await evaluate(client, `document.querySelector("[data-download]").click()`);
      await waitUntil(
        client,
        `document.querySelector("[data-asset-status]").textContent.includes("full-resolution download ready")`,
        "lazy full-resolution download",
      );
      assert.equal(
        requests.filter((request) => request === `/${mosaicAsset}`).length,
        1,
        "the full-resolution ciphertext must be fetched once, only on download",
      );

      const relockedMosaic = await evaluate(
        client,
        `(() => {
          document.querySelector("[data-action='lock']").click();
          return {
            gateHidden: document.querySelector("[data-access-gate]").hidden,
            viewerHidden: document.querySelector("[data-mosaic-viewer]").hidden,
            atlasHidden: document.querySelector("[data-mosaic-atlas]").hidden,
            atlasTransform: document.querySelector("[data-mosaic-atlas]").style.transform,
            overviewHasSource: document.querySelector("[data-mosaic-overview]").hasAttribute("src"),
            sourcedTileCount: [...document.querySelectorAll("[data-tile-id]")]
              .filter((tile) => tile.hasAttribute("src")).length,
            downloadHidden: document.querySelector("[data-download]").hidden,
            artworkInfoHidden: document.querySelector("[data-artwork-info]").hidden,
            selectionHidden: document.querySelector("[data-artwork-selection]").hidden,
            sourceLinkCount: document.querySelector("[data-artwork-source-links]").childElementCount,
            pickerDisabled: document.querySelector("[data-artwork-picker]").disabled,
            pickerOptionCount: document.querySelector("[data-artwork-picker]").options.length,
          };
        })()`,
      );
      assert.equal(relockedMosaic.gateHidden, false, "locking must restore the encrypted access gate");
      assert.equal(relockedMosaic.viewerHidden, true, "locking must hide the decrypted viewer");
      assert.equal(relockedMosaic.atlasHidden, true, "locking must hide the progressive atlas");
      assert.equal(relockedMosaic.atlasTransform, "", "locking must clear the atlas transform");
      assert.equal(relockedMosaic.overviewHasSource, false, "locking must discard the overview URL");
      assert.equal(relockedMosaic.sourcedTileCount, 0, "locking must discard high-resolution tile URLs");
      assert.equal(relockedMosaic.downloadHidden, true, "locking must hide the full-resolution download");
      assert.equal(relockedMosaic.artworkInfoHidden, true, "locking must close artwork details");
      assert.equal(relockedMosaic.selectionHidden, true, "locking must clear the artwork highlight");
      assert.equal(relockedMosaic.sourceLinkCount, 0, "locking must clear artwork source links");
      assert.equal(relockedMosaic.pickerDisabled, true, "locking must disable the artwork picker");
      assert.equal(relockedMosaic.pickerOptionCount, 1, "locking must remove decrypted picker metadata");

      const feedbackSelectors = [
        ".site-header",
        ".header-inner",
        ".brand",
        ".site-nav",
        ".site-nav a",
        ".hero-copy",
        "#feedback-title",
        ".hero-dek",
        ".button",
        ".assurance",
      ];
      await emulate(client, { width: 390, height: 844, mobile: true });
      await navigate(client, `http://127.0.0.1:${sitePort}/feedback/`);
      const feedbackSnapshot = await layoutSnapshot(client, feedbackSelectors);
      assertMobileLayout("feedback page", feedbackSnapshot, feedbackSelectors);
      if (options.screenshotsDir) {
        await capture(client, join(options.screenshotsDir, "skald-feedback-mobile-390x844.png"));
      }

      const mosaicSelectors = [
        ".viewer-header",
        ".viewer-title",
        ".viewer-controls",
        ".viewer-controls > *",
        ".mosaic-stage",
        ".mosaic-atlas",
        ".mosaic-overview",
        ".viewer-footer",
        ".viewer-footer > *",
      ];
      await navigate(client, `http://127.0.0.1:${sitePort}/${mosaicRoute}/`);
      const reloadedMosaicState = await evaluate(
        client,
        `(() => ({
          gateHidden: document.querySelector("[data-access-gate]").hidden,
          viewerHidden: document.querySelector("[data-mosaic-viewer]").hidden,
        }))()`,
      );
      assert.equal(reloadedMosaicState.gateHidden, false, "reloading must restore the encrypted access gate");
      assert.equal(reloadedMosaicState.viewerHidden, true, "reloading must discard the decrypted viewer");
      await evaluate(
        client,
        `(() => {
          document.querySelector("[data-access-input]").value = ${JSON.stringify(mosaicPassword)};
          document.querySelector("[data-access-form]").requestSubmit();
        })()`,
      );
      await waitUntil(
        client,
        `!document.querySelector("[data-access-submit]").disabled`,
        "mobile encrypted mosaic decryption",
      );
      const mobileMosaicState = await evaluate(
        client,
        `(() => ({
          gateHidden: document.querySelector("[data-access-gate]").hidden,
          viewerHidden: document.querySelector("[data-mosaic-viewer]").hidden,
          overviewSource: document.querySelector("[data-mosaic-overview]").getAttribute("src"),
        }))()`,
      );
      assert.equal(mobileMosaicState.gateHidden, true, "correct mobile access must hide the gate");
      assert.equal(mobileMosaicState.viewerHidden, false, "correct mobile access must open the viewer");
      assert.match(mobileMosaicState.overviewSource, /^blob:/, "mobile viewer must use a decrypted overview Blob");

      const mobileFullscreenEntered = await evaluate(
        client,
        `(() => {
          const workspace = document.querySelector("[data-mosaic-viewer]");
          const button = document.querySelector("[data-action='fullscreen']");
          const visible = (element) => {
            const style = getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            return style.display !== "none" &&
              style.visibility !== "hidden" &&
              rect.width > 0 &&
              rect.height > 0;
          };
          let activeElement = null;
          Object.defineProperty(document, "fullscreenElement", {
            configurable: true,
            get: () => activeElement,
          });
          Object.defineProperty(workspace, "requestFullscreen", {
            configurable: true,
            value: async () => {
              activeElement = workspace;
              document.dispatchEvent(new Event("fullscreenchange"));
            },
          });
          Object.defineProperty(document, "exitFullscreen", {
            configurable: true,
            value: async () => {
              activeElement = null;
              document.dispatchEvent(new Event("fullscreenchange"));
            },
          });
          button.click();
          const stageRect = document.querySelector("[data-mosaic-stage]").getBoundingClientRect();
          const buttonRect = button.getBoundingClientRect();
          return {
            state: workspace.dataset.fullscreen,
            ariaLabel: button.getAttribute("aria-label"),
            titleVisible: visible(document.querySelector(".viewer-title")),
            otherControlsVisible: [...document.querySelector(".viewer-controls").children]
              .filter((element) => element !== button)
              .some(visible),
            footerVisible: visible(document.querySelector(".viewer-footer")),
            statusVisible: visible(document.querySelector("[data-asset-status]")),
            exitIconVisible: visible(document.querySelector("[data-fullscreen-exit-icon]")),
            textLabelVisible: visible(document.querySelector("[data-fullscreen-label]")),
            buttonWidth: buttonRect.width,
            buttonHeight: buttonRect.height,
            stageLeft: stageRect.left,
            stageTop: stageRect.top,
            stageRight: stageRect.right,
            stageBottom: stageRect.bottom,
            innerWidth,
            innerHeight,
          };
        })()`,
      );
      assert.equal(mobileFullscreenEntered.state, "true");
      assert.equal(mobileFullscreenEntered.ariaLabel, "Exit full screen");
      assert.equal(mobileFullscreenEntered.titleVisible, false);
      assert.equal(mobileFullscreenEntered.otherControlsVisible, false);
      assert.equal(mobileFullscreenEntered.footerVisible, false);
      assert.equal(mobileFullscreenEntered.statusVisible, false);
      assert.equal(mobileFullscreenEntered.exitIconVisible, true);
      assert.equal(mobileFullscreenEntered.textLabelVisible, false);
      assert.ok(mobileFullscreenEntered.buttonWidth <= 44.5);
      assert.ok(mobileFullscreenEntered.buttonHeight <= 44.5);
      assert.ok(Math.abs(mobileFullscreenEntered.stageLeft) < 1);
      assert.ok(Math.abs(mobileFullscreenEntered.stageTop) < 1);
      assert.ok(
        Math.abs(mobileFullscreenEntered.stageRight - mobileFullscreenEntered.innerWidth) < 1,
      );
      assert.ok(
        Math.abs(mobileFullscreenEntered.stageBottom - mobileFullscreenEntered.innerHeight) < 1,
      );
      if (options.screenshotsDir) {
        await capture(
          client,
          join(options.screenshotsDir, "skald-mosaic-fullscreen-mobile-390x844.png"),
        );
      }
      const mobileFullscreenExited = await evaluate(
        client,
        `(() => {
          const button = document.querySelector("[data-action='fullscreen']");
          button.click();
          return {
            state: document.querySelector("[data-mosaic-viewer]").dataset.fullscreen,
            ariaLabel: button.getAttribute("aria-label"),
          };
        })()`,
      );
      assert.equal(mobileFullscreenExited.state, "false");
      assert.equal(mobileFullscreenExited.ariaLabel, "Enter full screen");

      const mobileStage = await evaluate(
        client,
        `(() => {
          const rect = document.querySelector("[data-mosaic-stage]").getBoundingClientRect();
          return {
            x: Math.round(rect.left + rect.width / 2),
            y: Math.round(rect.top + rect.height / 2),
            beforeZoom: Number.parseFloat(document.querySelector("[data-zoom-output]").value),
          };
        })()`,
      );
      await client.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [
          { id: 1, x: mobileStage.x - 36, y: mobileStage.y },
          { id: 2, x: mobileStage.x + 36, y: mobileStage.y },
        ],
      });
      await client.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [
          { id: 1, x: mobileStage.x - 82, y: mobileStage.y },
          { id: 2, x: mobileStage.x + 82, y: mobileStage.y },
        ],
      });
      await delay(50);
      const mobileAfterPinchOut = await evaluate(
        client,
        `Number.parseFloat(document.querySelector("[data-zoom-output]").value)`,
      );
      assert.ok(mobileAfterPinchOut > mobileStage.beforeZoom, "two-finger pinch-out must zoom in");
      await delay(100);
      await client.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [
          { id: 1, x: mobileStage.x - 28, y: mobileStage.y },
          { id: 2, x: mobileStage.x + 28, y: mobileStage.y },
        ],
      });
      await delay(100);
      const mobileAfterPinchIn = await evaluate(
        client,
        `Number.parseFloat(document.querySelector("[data-zoom-output]").value)`,
      );
      assert.ok(
        mobileAfterPinchIn < mobileAfterPinchOut,
        `two-finger pinch-in must zoom out (${mobileAfterPinchIn}% after ${mobileAfterPinchOut}%)`,
      );
      await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      assert.equal(
        await evaluate(client, `document.querySelector("[data-artwork-info]").hidden`),
        true,
        "pinching must not open artwork details",
      );

      await evaluate(client, `document.querySelector("[data-action='fit']").click()`);
      const mobileArtworkPoint = await evaluate(
        client,
        `(() => {
          const rect = document.querySelector("[data-mosaic-overview]").getBoundingClientRect();
          return {
            x: Math.round(rect.left + rect.width * ${(firstArtwork.x + firstArtwork.width / 2) / expectedMosaicMap.width}),
            y: Math.round(rect.top + rect.height * ${(firstArtwork.y + firstArtwork.height / 2) / expectedMosaicMap.height}),
          };
        })()`,
      );
      await client.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ id: 1, x: mobileArtworkPoint.x, y: mobileArtworkPoint.y }],
      });
      await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      await waitUntil(
        client,
        `document.querySelector("[data-artwork-info]").open &&
          document.querySelector("[data-artwork-preview-detail]").dataset.ready === "true"`,
        "mobile artwork details",
      );
      const mobileArtworkDetails = await evaluate(
        client,
        `(() => {
          const panel = document.querySelector("[data-artwork-info]");
          const rect = panel.getBoundingClientRect();
          return {
            title: document.querySelector("[data-artwork-title]").textContent,
            museum: document.querySelector("[data-artwork-museum]").textContent,
            books: document.querySelector("[data-artwork-books]").textContent,
            left: rect.left,
            right: rect.right,
            top: rect.top,
            bottom: rect.bottom,
            innerWidth,
            innerHeight,
            detailSource: document.querySelector("[data-artwork-preview-detail]").getAttribute("src"),
          };
        })()`,
      );
      assert.equal(mobileArtworkDetails.title, firstArtwork.title);
      assert.equal(mobileArtworkDetails.museum, expectedCollection(firstArtwork));
      assert.equal(mobileArtworkDetails.books, expectedBookReferences(firstArtwork));
      assert.ok(Math.abs(mobileArtworkDetails.left) < 0.5);
      assert.ok(Math.abs(mobileArtworkDetails.right - mobileArtworkDetails.innerWidth) < 0.5);
      assert.ok(Math.abs(mobileArtworkDetails.top) < 0.5);
      assert.ok(Math.abs(mobileArtworkDetails.bottom - mobileArtworkDetails.innerHeight) < 0.5);
      assert.match(mobileArtworkDetails.detailSource, /^blob:/);
      const mosaicDetailsSelectors = [
        ...mosaicSelectors,
        ".artwork-info",
        ".artwork-info h2",
        ".artwork-info a",
      ];
      const mosaicSnapshot = await layoutSnapshot(client, mosaicDetailsSelectors);
      assertMobileLayout("mosaic viewer", mosaicSnapshot, mosaicDetailsSelectors);
      if (options.screenshotsDir) {
        await capture(client, join(options.screenshotsDir, "skald-mosaic-details-mobile-390x844.png"));
      }

      await emulate(client, { width: 844, height: 390, mobile: true });
      const mosaicLandscapeSnapshot = await layoutSnapshot(client, mosaicDetailsSelectors);
      assertMobileLayout(
        "mosaic viewer landscape",
        mosaicLandscapeSnapshot,
        mosaicDetailsSelectors,
        { width: 844, height: 390 },
      );
      if (options.screenshotsDir) {
        await capture(client, join(options.screenshotsDir, "skald-mosaic-details-landscape-844x390.png"));
      }

      const pagehideState = await evaluate(
        client,
        `(() => {
          window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: true }));
          return {
            gateHidden: document.querySelector("[data-access-gate]").hidden,
            viewerHidden: document.querySelector("[data-mosaic-viewer]").hidden,
            overviewSource: document.querySelector("[data-mosaic-overview]").getAttribute("src"),
            tileSources: [...document.querySelectorAll("[data-tile-id][src]")].length,
            modalOpen: document.querySelector("[data-artwork-info]").open,
            modalHidden: document.querySelector("[data-artwork-info]").hidden,
            modalSources: [
              document.querySelector("[data-artwork-preview-overview]"),
              document.querySelector("[data-artwork-preview-detail]"),
            ].filter((image) => image.hasAttribute("src")).length,
            pickerOptionCount: document.querySelector("[data-artwork-picker]").options.length,
          };
        })()`,
      );
      assert.equal(pagehideState.gateHidden, false, "pagehide must restore the encrypted access gate");
      assert.equal(pagehideState.viewerHidden, true, "pagehide must discard the decrypted viewer");
      assert.equal(pagehideState.overviewSource, null, "pagehide must revoke the overview");
      assert.equal(pagehideState.tileSources, 0, "pagehide must revoke viewport tiles");
      assert.equal(pagehideState.modalOpen, false, "pagehide must close the artwork dialog");
      assert.equal(pagehideState.modalHidden, true, "pagehide must hide the artwork dialog");
      assert.equal(pagehideState.modalSources, 0, "pagehide must revoke artwork detail sources");
      assert.equal(pagehideState.pickerOptionCount, 1, "pagehide must clear decrypted metadata");

      const privacySelectors = [
        ".site-header",
        ".header-inner",
        ".brand",
        ".site-nav",
        ".site-nav a",
        ".legal-layout",
        ".legal-aside",
        ".legal-header",
        ".legal-header h1",
        ".legal-copy",
      ];
      await emulate(client, { width: 390, height: 844, mobile: true });
      await navigate(client, `http://127.0.0.1:${sitePort}/feedback/privacy/`);
      const privacySnapshot = await layoutSnapshot(client, privacySelectors);
      assertMobileLayout("feedback privacy page", privacySnapshot, privacySelectors);
      if (options.screenshotsDir) {
        await capture(client, join(options.screenshotsDir, "skald-feedback-privacy-mobile-390x844.png"));
      }
    } finally {
      client.close();
    }
  } finally {
    await terminate(chrome);
    await closeServer(server);
    await rm(profile, { recursive: true, force: true });
  }

  console.log("Skald feedback and mosaic rendered layout verification passed in Chrome.");
};

main().catch((error) => {
  console.error(error.stack ?? error.message);
  process.exitCode = 1;
});

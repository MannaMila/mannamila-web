#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
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
      x: 0,
      y: 0,
      width: 1200,
      height: 630,
      title: "Render test artwork",
      creator: "Test fixture",
      date: "2026",
      museum: "Test museum",
      source_provider: "Test source",
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
    deviceScaleFactor: 1,
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
          robots: document.querySelector('meta[name="robots"]').content,
        }))()`,
      );
      assert.equal(lockedMosaic.gateHidden, false, "mosaic gate must render before access");
      assert.equal(lockedMosaic.viewerHidden, true, "mosaic viewer must remain hidden before access");
      assert.equal(lockedMosaic.atlasHidden, true, "mosaic atlas must remain hidden before access");
      assert.equal(lockedMosaic.overviewHasSource, false, "mosaic viewer must not be decoded before access");
      assert.equal(lockedMosaic.artworkInfoHidden, true, "artwork details must stay hidden before access");
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
        `(() => ({
          gateHidden: document.querySelector("[data-access-gate]").hidden,
          viewerHidden: document.querySelector("[data-mosaic-viewer]").hidden,
          atlasHidden: document.querySelector("[data-mosaic-atlas]").hidden,
          atlasWidth: Number.parseFloat(document.querySelector("[data-mosaic-atlas]").style.width),
          atlasHeight: Number.parseFloat(document.querySelector("[data-mosaic-atlas]").style.height),
          overviewSource: document.querySelector("[data-mosaic-overview]").getAttribute("src"),
          overviewHidden: document.querySelector("[data-mosaic-overview]").hidden,
          overviewWidth: document.querySelector("[data-mosaic-overview]").naturalWidth,
          overviewHeight: document.querySelector("[data-mosaic-overview]").naturalHeight,
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
        }))()`,
      );
      assert.equal(unlockedMosaic.gateHidden, true, `correct access must hide the gate: ${unlockedMosaic.error}`);
      assert.equal(unlockedMosaic.viewerHidden, false, `correct access must open the viewer: ${unlockedMosaic.error}`);
      assert.equal(unlockedMosaic.atlasHidden, false, "the progressive mosaic atlas must render after access");
      assert.match(unlockedMosaic.overviewSource, /^blob:/, "the overview must use a decrypted Blob URL");
      assert.equal(unlockedMosaic.overviewHidden, false, "the progressive overview must render after access");
      assert.equal(
        unlockedMosaic.atlasWidth,
        expectedMosaicConfig.plaintext.width,
        "the atlas must preserve the approved logical width",
      );
      assert.equal(
        unlockedMosaic.atlasHeight,
        expectedMosaicConfig.plaintext.height,
        "the atlas must preserve the approved logical height",
      );
      const expectedOverview = expectedMosaicConfig.viewer.manifest.layers.find(
        (layer) => layer.role === "overview",
      );
      assert.equal(unlockedMosaic.overviewWidth, expectedOverview.naturalWidth);
      assert.equal(unlockedMosaic.overviewHeight, expectedOverview.naturalHeight);
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

      const desktopStage = await evaluate(
        client,
        `(() => {
          const rect = document.querySelector("[data-mosaic-stage]").getBoundingClientRect();
          return {
            x: Math.round(rect.left + rect.width / 2),
            y: Math.round(rect.top + rect.height / 2),
            beforeZoom: Number.parseFloat(document.querySelector("[data-zoom-output]").value),
            beforeTransform: document.querySelector("[data-mosaic-atlas]").style.transform,
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
          transform: document.querySelector("[data-mosaic-atlas]").style.transform,
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
          const atlas = document.querySelector("[data-mosaic-atlas]");
          const rect = stage.getBoundingClientRect();
          const originalGetBoundingClientRect = stage.getBoundingClientRect.bind(stage);
          const scale = Number.parseFloat(
            atlas.style.transform.match(/scale\\(([^)]+)\\)/)?.[1] ?? "0",
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
          window.__mosaicZoomRenderObserver.observe(atlas, {
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
          const transform = document.querySelector("[data-mosaic-atlas]").style.transform;
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
          document.querySelector("[data-mosaic-atlas]").style.transform.match(/scale\\(([^)]+)\\)/)?.[1] ?? "0"
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
          document.querySelector("[data-mosaic-atlas]").style.transform.match(/scale\\(([^)]+)\\)/)?.[1] ?? "0"
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
          const rect = document.querySelector("[data-mosaic-atlas]").getBoundingClientRect();
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
        `!document.querySelector("[data-artwork-info]").hidden`,
        "desktop artwork details",
      );
      const desktopArtworkDetails = await evaluate(
        client,
        `(() => ({
          selectionHidden: document.querySelector("[data-artwork-selection]").hidden,
          index: document.querySelector("[data-artwork-index]").textContent,
          title: document.querySelector("[data-artwork-title]").textContent,
          creator: document.querySelector("[data-artwork-creator]").textContent,
          museum: document.querySelector("[data-artwork-museum]").textContent,
          status: document.querySelector("[data-artwork-status]").textContent,
          license: document.querySelector("[data-artwork-license]").textContent,
          sourceHref: document.querySelector("[data-artwork-source-links] a")?.href ?? "",
        }))()`,
      );
      assert.equal(desktopArtworkDetails.selectionHidden, false);
      assert.equal(desktopArtworkDetails.index, "001");
      assert.equal(desktopArtworkDetails.title, firstArtwork.title);
      assert.match(desktopArtworkDetails.creator, /Pieter Lastman/);
      assert.match(desktopArtworkDetails.creator, /1625/);
      assert.equal(desktopArtworkDetails.museum, firstArtwork.museum);
      assert.match(desktopArtworkDetails.status, /Collection record/);
      assert.match(desktopArtworkDetails.license, /Public Domain/);
      assert.equal(desktopArtworkDetails.sourceHref, firstArtwork.museum_url);
      const closedArtworkDetails = await evaluate(
        client,
        `(() => {
          document.querySelector("[data-action='close-details']").click();
          return {
            infoHidden: document.querySelector("[data-artwork-info]").hidden,
            selectionHidden: document.querySelector("[data-artwork-selection]").hidden,
          };
        })()`,
      );
      assert.equal(closedArtworkDetails.infoHidden, true, "the close control must hide artwork details");
      assert.equal(closedArtworkDetails.selectionHidden, true, "the close control must clear the highlight");

      const lastArtworkPoint = await evaluate(
        client,
        `(() => {
          const rect = document.querySelector("[data-mosaic-atlas]").getBoundingClientRect();
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
          const atlas = document.querySelector("[data-mosaic-atlas]");
          const failures = [];
          for (const artwork of artworks) {
            const rect = atlas.getBoundingClientRect();
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
          };
        })()`,
      );
      assert.equal(loadedTiles.total, expectedMosaicMap.tiles.length);
      assert.ok(loadedTiles.sourced >= 1 && loadedTiles.sourced <= 4);
      assert.ok(loadedTiles.visible >= 1 && loadedTiles.visible <= 4);
      assert.ok(loadedTiles.maximumWidth <= 4000);
      assert.ok(loadedTiles.maximumHeight <= 4000);
      assert.equal(
        requests.includes(`/${mosaicAsset}`),
        false,
        "high-resolution viewing must still avoid the monolithic download",
      );
      if (options.screenshotsDir) {
        await capture(client, join(options.screenshotsDir, "skald-mosaic-details-desktop-1440x1000.png"));
      }
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
          const rect = document.querySelector("[data-mosaic-atlas]").getBoundingClientRect();
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
        `!document.querySelector("[data-artwork-info]").hidden`,
        "mobile artwork details",
      );
      const mobileArtworkDetails = await evaluate(
        client,
        `(() => {
          const panel = document.querySelector("[data-artwork-info]");
          const rect = panel.getBoundingClientRect();
          return {
            title: document.querySelector("[data-artwork-title]").textContent,
            left: rect.left,
            right: rect.right,
            top: rect.top,
            bottom: rect.bottom,
            innerWidth,
            innerHeight,
          };
        })()`,
      );
      assert.equal(mobileArtworkDetails.title, firstArtwork.title);
      assert.ok(mobileArtworkDetails.left >= -0.5);
      assert.ok(mobileArtworkDetails.right <= mobileArtworkDetails.innerWidth + 0.5);
      assert.ok(mobileArtworkDetails.top >= -0.5);
      assert.ok(mobileArtworkDetails.bottom <= mobileArtworkDetails.innerHeight + 0.5);
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
            pickerOptionCount: document.querySelector("[data-artwork-picker]").options.length,
          };
        })()`,
      );
      assert.equal(pagehideState.gateHidden, false, "pagehide must restore the encrypted access gate");
      assert.equal(pagehideState.viewerHidden, true, "pagehide must discard the decrypted viewer");
      assert.equal(pagehideState.overviewSource, null, "pagehide must revoke the overview");
      assert.equal(pagehideState.tileSources, 0, "pagehide must revoke viewport tiles");
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

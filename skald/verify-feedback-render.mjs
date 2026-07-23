#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const skaldRoot = dirname(fileURLToPath(import.meta.url));
const defaultTimeoutMs = 10_000;

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
  ["/feedback/", ["feedback/index.html", "text/html; charset=utf-8"]],
  ["/feedback/index.html", ["feedback/index.html", "text/html; charset=utf-8"]],
  ["/feedback/styles.css", ["feedback/styles.css", "text/css; charset=utf-8"]],
  ["/feedback/privacy/", ["feedback/privacy/index.html", "text/html; charset=utf-8"]],
  ["/feedback/privacy/index.html", ["feedback/privacy/index.html", "text/html; charset=utf-8"]],
]);

const startStaticServer = async () => {
  const server = createServer(async (request, response) => {
    const pathname = new URL(request.url, "http://127.0.0.1").pathname;
    const entry = staticFiles.get(pathname);
    if (!entry) {
      response.writeHead(404).end("Not found\n");
      return;
    }

    try {
      response.writeHead(200, { "content-type": entry[1], "cache-control": "no-store" });
      response.end(await readFile(join(skaldRoot, entry[0])));
    } catch (error) {
      response.writeHead(500).end(`${error.message}\n`);
    }
  });
  return { server, port: await listen(server) };
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

const assertMobileLayout = (label, snapshot, expectedSelectors) => {
  assert.equal(snapshot.innerWidth, 390, `${label}: device emulation must produce a 390 CSS-pixel viewport`);
  assert.equal(snapshot.innerHeight, 844, `${label}: device emulation must produce an 844 CSS-pixel viewport`);
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
  const { server, port: sitePort } = await startStaticServer();
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

  console.log("Skald feedback rendered layout verification passed in Chrome.");
};

main().catch((error) => {
  console.error(error.stack ?? error.message);
  process.exitCode = 1;
});

#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sites = [
  {
    sourcePath: "skald",
    hostname: "skald.mannamila.com",
    pages: [
      "index.html",
      "get/index.html",
      "feedback/index.html",
      "feedback/privacy/index.html",
      "privacy/index.html",
      "support/index.html",
      "updates/index.html",
      "updates-privacy/index.html",
      "waitlist-privacy/index.html",
    ],
  },
  {
    sourcePath: "squash",
    hostname: "squash.mannamila.com",
    pages: [
      "index.html",
      "privacy/index.html",
      "support/index.html",
      "waitlist-privacy/index.html",
    ],
  },
  {
    sourcePath: "inspire",
    hostname: "inspire.mannamila.com",
    pages: ["index.html"],
  },
];

const toPosix = (path) => path.split(sep).join("/");
const measurementIds = new Set();
const loaders = [];

for (const site of sites) {
  const root = join(repoRoot, site.sourcePath);
  const loaderPath = join(root, "analytics.js");
  const loader = await readFile(loaderPath, "utf8");
  loaders.push(loader);

  const measurementId = loader.match(/\bG-[A-Z0-9]{8,}\b/)?.[0];
  assert.ok(measurementId, `${site.sourcePath}/analytics.js needs a GA4 measurement ID`);
  measurementIds.add(measurementId);

  assert.match(loader, /mannamila\.com/, "analytics must use the shared MannaMila cookie domain");
  assert.match(loader, /allow_google_signals:\s*false/, "Google Signals must stay disabled");
  assert.match(
    loader,
    /allow_ad_personalization_signals:\s*false/,
    "ad-personalization signals must stay disabled",
  );
  assert.match(loader, /https:\/\/www\.googletagmanager\.com\/gtag\/js/);

  for (const page of site.pages) {
    const pagePath = join(root, page);
    const html = await readFile(pagePath, "utf8");
    const loaderReference = toPosix(relative(dirname(pagePath), loaderPath));
    const htmlLoaderReference = loaderReference.includes("/")
      ? loaderReference
      : `./${loaderReference}`;
    assert.match(
      html,
      new RegExp(
        `<script\\s+src=["']${htmlLoaderReference.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']\\s+defer></script>`,
      ),
      `${site.sourcePath}/${page} must load ${htmlLoaderReference}`,
    );
  }

  const appendedScripts = [];
  const document = {
    createElement: () => ({}),
    head: {
      append: (node) => appendedScripts.push(node),
    },
  };
  const window = {
    dataLayer: [],
    location: {
      hostname: site.hostname,
      href: `https://${site.hostname}/`,
    },
  };
  vm.runInNewContext(loader, { document, window });

  assert.equal(appendedScripts.length, 1, `${site.hostname} must load the Google tag`);
  assert.equal(
    appendedScripts[0].src,
    `https://www.googletagmanager.com/gtag/js?id=${measurementId}`,
  );
  assert.equal(appendedScripts[0].async, true);
  const config = window.dataLayer
    .map((entry) => Array.from(entry))
    .find(([command]) => command === "config");
  assert.ok(config, `${site.hostname} must configure GA4`);
  assert.equal(config[1], measurementId);
  assert.equal(config[2].cookie_domain, "mannamila.com");
  assert.equal(config[2].allow_google_signals, false);
  assert.equal(config[2].allow_ad_personalization_signals, false);
}

assert.equal(measurementIds.size, 1, "all MannaMila sites must share one GA4 measurement ID");
assert.equal(new Set(loaders).size, 1, "all product sites must use the same analytics loader");

const embeddedScripts = [];
vm.runInNewContext(loaders[0], {
  document: {
    createElement: () => ({}),
    head: {
      append: (node) => embeddedScripts.push(node),
    },
  },
  window: {
    dataLayer: [],
    location: {
      hostname: "mannamila.github.io",
      href: "https://mannamila.github.io/mannamila-web/skald/",
    },
  },
});
assert.equal(
  embeddedScripts.length,
  0,
  "GitHub Pages embeds must not duplicate Google Sites page views",
);

console.log("MannaMila analytics contract tests passed.");

#!/usr/bin/env node

import assert from "node:assert/strict";
import { access, readdir, readFile } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sites = [
  { sourcePath: "skald", hostname: "skald.mannamila.com" },
  { sourcePath: "squash", hostname: "squash.mannamila.com" },
  { sourcePath: "inspire", hostname: "inspire.mannamila.com" },
];
const forbiddenAnalyticsSource =
  /\bG-[A-Z0-9]{8,}\b|googletagmanager|google-analytics|\bgtag\b|cookie_domain/i;
const toPosix = (path) => path.split(sep).join("/");

const walkFiles = async (root, current = root) => {
  const files = [];
  for (const entry of await readdir(current, { withFileTypes: true })) {
    const absolute = join(current, entry.name);
    if (entry.isDirectory()) files.push(...(await walkFiles(root, absolute)));
    else if (entry.isFile()) files.push(toPosix(relative(root, absolute)));
  }
  return files.sort();
};

for (const site of sites) {
  const root = join(repoRoot, site.sourcePath);
  const files = await walkFiles(root);
  const htmlPages = files.filter((file) => file.endsWith(".html"));
  const javascriptFiles = files.filter((file) => file.endsWith(".js"));
  const retirementLoaderPath = join(root, "retire-analytics.js");
  const retirementLoader = await readFile(retirementLoaderPath, "utf8");

  assert.ok(htmlPages.length > 0, `${site.sourcePath} must expose at least one HTML route`);
  await assert.rejects(
    access(join(root, "analytics.js")),
    `${site.sourcePath} must not ship a dormant analytics loader`,
  );

  for (const page of htmlPages) {
    const pagePath = join(root, page);
    const html = await readFile(pagePath, "utf8");
    const loaderReference = toPosix(relative(dirname(pagePath), retirementLoaderPath));
    const htmlLoaderReference = loaderReference.includes("/")
      ? loaderReference
      : `./${loaderReference}`;

    assert.doesNotMatch(
      html,
      forbiddenAnalyticsSource,
      `${site.sourcePath}/${page} must not initialize analytics`,
    );
    assert.doesNotMatch(
      html,
      /document\.cookie\s*=/,
      `${site.sourcePath}/${page} must not contain inline cookie-writing code`,
    );
    assert.match(
      html,
      new RegExp(
        `<script\\s+src=["']${htmlLoaderReference.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']\\s+defer></script>`,
      ),
      `${site.sourcePath}/${page} must retire legacy GA cookies with ${htmlLoaderReference}`,
    );
  }

  for (const file of javascriptFiles) {
    const source = await readFile(join(root, file), "utf8");
    assert.doesNotMatch(
      source,
      forbiddenAnalyticsSource,
      `${site.sourcePath}/${file} must not contain Google Analytics code`,
    );
    if (file !== "retire-analytics.js") {
      assert.doesNotMatch(
        source,
        /document\.cookie\s*=/,
        `${site.sourcePath}/${file} must not write browser cookies`,
      );
    }
  }

  assert.match(retirementLoader, /document\.cookie/);
  assert.match(retirementLoader, /Max-Age=0/);
  assert.match(retirementLoader, /Expires=Thu, 01 Jan 1970 00:00:00 GMT/);
  assert.doesNotMatch(retirementLoader, /\bfetch\s*\(|XMLHttpRequest|sendBeacon|createElement/);
  assert.equal(
    [...retirementLoader.matchAll(/document\.cookie\s*=/g)].length,
    2,
    `${site.sourcePath}/retire-analytics.js may only write the host and shared-domain expirations`,
  );

  const cookieWrites = [];
  const document = {};
  Object.defineProperty(document, "cookie", {
    get: () => "_ga=legacy; session=keep; _ga_TEST=legacy-stream; _gid=keep",
    set: (value) => cookieWrites.push(value),
  });
  vm.runInNewContext(retirementLoader, {
    document,
    window: { location: { hostname: site.hostname } },
  });

  assert.deepEqual(
    cookieWrites.map((value) => value.split("=")[0]),
    ["_ga", "_ga", "_ga_TEST", "_ga_TEST"],
    `${site.hostname} must expire only the legacy GA4 cookie names it can observe`,
  );
  for (const write of cookieWrites) {
    assert.match(write, /^_ga(?:_[A-Za-z0-9]+)?=;/);
    assert.match(write, /Max-Age=0/);
    assert.match(write, /Expires=Thu, 01 Jan 1970 00:00:00 GMT/);
    assert.match(write, /Path=\//);
    assert.match(write, /Secure/);
  }
  assert.equal(
    cookieWrites.filter((value) => /Domain=mannamila\.com/.test(value)).length,
    2,
    `${site.hostname} must expire the shared-domain copy of each observable GA cookie`,
  );

  const previewCookieWrites = [];
  const previewDocument = {};
  Object.defineProperty(previewDocument, "cookie", {
    get: () => "_ga=preview",
    set: (value) => previewCookieWrites.push(value),
  });
  vm.runInNewContext(retirementLoader, {
    document: previewDocument,
    window: { location: { hostname: "mannamila.github.io" } },
  });
  assert.deepEqual(previewCookieWrites, [], "preview hosts must not mutate cookies");
}

console.log("MannaMila analytics-retirement contract tests passed.");

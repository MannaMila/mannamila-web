#!/usr/bin/env node

// Per-site analytics contract.
//
// - "retire" sites (Skald, Inspire) ship no Google Analytics. Every HTML route loads only
//   retire-analytics.js, which expires legacy _ga cookies and makes no network request.
// - "ga4" sites (Mila Squash, since 2026-11-06) load exactly one hostname-gated GA4 loader,
//   analytics.js, on every HTML route, with Google Signals and ad personalization off and
//   a host-scoped cookie. Nothing else on the site may initialize analytics or write cookies.

import assert from "node:assert/strict";
import { access, readdir, readFile } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const allSites = [
  { sourcePath: "skald", hostname: "skald.mannamila.com", mode: "retire" },
  { sourcePath: "squash", hostname: "squash.mannamila.com", mode: "ga4", measurementId: "G-E0E4FPDPTB" },
  { sourcePath: "inspire", hostname: "inspire.mannamila.com", mode: "retire" },
];
const args = process.argv.slice(2);
assert.ok(
  args.length === 0 || (args.length === 2 && args[0] === "--site"),
  "usage: test-analytics-contract.mjs [--site skald|squash|inspire]",
);
const sites = args.length === 0 ? allSites : allSites.filter((site) => site.sourcePath === args[1]);
assert.ok(sites.length > 0, "unknown product site");

const forbiddenAnalyticsSource =
  /\bG-[A-Z0-9]{8,}\b|googletagmanager|google-analytics|\bgtag\b|cookie_domain/i;
// Non-loader scripts on a GA4 site may call window.gtag for an event, but must not carry
// a measurement ID, a tag loader, or cookie configuration of their own.
const forbiddenOutsideLoader = /\bG-[A-Z0-9]{8,}\b|googletagmanager|google-analytics|cookie_domain/i;
const toPosix = (path) => path.split(sep).join("/");
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const walkFiles = async (root, current = root) => {
  const files = [];
  for (const entry of await readdir(current, { withFileTypes: true })) {
    const absolute = join(current, entry.name);
    if (entry.isDirectory()) files.push(...(await walkFiles(root, absolute)));
    else if (entry.isFile()) files.push(toPosix(relative(root, absolute)));
  }
  return files.sort();
};

const loaderTag = (pagePath, loaderPath) => {
  const reference = toPosix(relative(dirname(pagePath), loaderPath));
  const htmlReference = reference.includes("/") ? reference : `./${reference}`;
  return new RegExp(`<script\\s+src=["']${escapeRegExp(htmlReference)}["']\\s+defer></script>`);
};

const verifyRetireSite = async (site, root, files) => {
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
    assert.doesNotMatch(html, forbiddenAnalyticsSource, `${site.sourcePath}/${page} must not initialize analytics`);
    assert.doesNotMatch(html, /document\.cookie\s*=/, `${site.sourcePath}/${page} must not contain inline cookie-writing code`);
    assert.match(
      html,
      loaderTag(pagePath, retirementLoaderPath),
      `${site.sourcePath}/${page} must retire legacy GA cookies with retire-analytics.js`,
    );
  }

  for (const file of javascriptFiles) {
    const source = await readFile(join(root, file), "utf8");
    assert.doesNotMatch(source, forbiddenAnalyticsSource, `${site.sourcePath}/${file} must not contain Google Analytics code`);
    if (file !== "retire-analytics.js") {
      assert.doesNotMatch(source, /document\.cookie\s*=/, `${site.sourcePath}/${file} must not write browser cookies`);
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
  vm.runInNewContext(retirementLoader, { document, window: { location: { hostname: site.hostname } } });

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
};

const runLoader = (source, hostname) => {
  const appended = [];
  const created = [];
  const document = {
    createElement(tag) {
      const element = { tag };
      created.push(element);
      return element;
    },
    head: { append: (...nodes) => appended.push(...nodes) },
  };
  Object.defineProperty(document, "cookie", {
    get: () => "",
    set: () => {
      throw new Error("the GA4 loader must not write cookies directly");
    },
  });
  const window = { location: { hostname } };
  vm.runInNewContext(source, { document, window, Date });
  return { window, appended, created };
};

const verifyGa4Site = async (site, root, files) => {
  const htmlPages = files.filter((file) => file.endsWith(".html"));
  const javascriptFiles = files.filter((file) => file.endsWith(".js"));
  const loaderPath = join(root, "analytics.js");
  const loader = await readFile(loaderPath, "utf8");

  assert.ok(htmlPages.length > 0, `${site.sourcePath} must expose at least one HTML route`);
  await assert.rejects(
    access(join(root, "retire-analytics.js")),
    `${site.sourcePath} must not ship the retirement script beside a live GA4 loader`,
  );

  for (const page of htmlPages) {
    const pagePath = join(root, page);
    const html = await readFile(pagePath, "utf8");
    assert.doesNotMatch(html, forbiddenAnalyticsSource, `${site.sourcePath}/${page} must not inline analytics; use analytics.js`);
    assert.doesNotMatch(html, /document\.cookie\s*=/, `${site.sourcePath}/${page} must not contain inline cookie-writing code`);
    assert.doesNotMatch(html, /retire-analytics\.js/, `${site.sourcePath}/${page} must not load the retirement script`);
    assert.match(html, loaderTag(pagePath, loaderPath), `${site.sourcePath}/${page} must load analytics.js with defer`);
    assert.equal(
      [...html.matchAll(/<script\s+src=["'][^"']*analytics\.js["']/g)].length,
      1,
      `${site.sourcePath}/${page} must load the analytics loader exactly once`,
    );
  }

  for (const file of javascriptFiles) {
    if (file === "analytics.js") continue;
    const source = await readFile(join(root, file), "utf8");
    assert.doesNotMatch(source, forbiddenOutsideLoader, `${site.sourcePath}/${file} must not carry its own analytics configuration`);
    assert.doesNotMatch(source, /document\.cookie\s*=/, `${site.sourcePath}/${file} must not write browser cookies`);
  }

  const idMatches = [...loader.matchAll(/\bG-[A-Z0-9]{8,}\b/g)].map((m) => m[0]);
  assert.deepEqual([...new Set(idMatches)], [site.measurementId], `${site.sourcePath}/analytics.js must use only ${site.measurementId}`);
  assert.match(loader, /allow_google_signals:\s*false/, "Google Signals must be off");
  assert.match(loader, /allow_ad_personalization_signals:\s*false/, "ad personalization must be off");
  assert.match(loader, new RegExp(`cookie_domain:\\s*"${escapeRegExp(site.hostname)}"`), "the GA cookie must be scoped to the product host");
  assert.match(loader, new RegExp(`hostname !== "${escapeRegExp(site.hostname)}"`), "the loader must be gated to the production hostname");
  assert.doesNotMatch(loader, /document\.cookie|\bfetch\s*\(|XMLHttpRequest|sendBeacon/, "the loader only configures gtag and appends the Google tag");

  const production = runLoader(loader, site.hostname);
  const dataLayer = (production.window.dataLayer ?? []).map((entry) => Array.from(entry));
  assert.equal(dataLayer[0]?.[0], "js", "the loader must stamp the data layer before configuring");
  assert.equal(dataLayer[1]?.[0], "config");
  assert.equal(dataLayer[1]?.[1], site.measurementId);
  assert.equal(dataLayer[1]?.[2]?.allow_google_signals, false);
  assert.equal(dataLayer[1]?.[2]?.allow_ad_personalization_signals, false);
  assert.equal(dataLayer[1]?.[2]?.cookie_domain, site.hostname);
  assert.equal(production.appended.length, 1, "the loader appends exactly one script tag");
  assert.equal(production.appended[0].tag, "script");
  assert.equal(production.appended[0].async, true);
  assert.equal(
    production.appended[0].src,
    `https://www.googletagmanager.com/gtag/js?id=${site.measurementId}`,
    "the Google tag must be requested for the configured measurement ID",
  );

  for (const hostname of ["mannamila.github.io", "localhost", "127.0.0.1", "skald.mannamila.com", "mannamila.com"]) {
    const other = runLoader(loader, hostname);
    assert.equal(other.created.length, 0, `${hostname} must not load the Google tag`);
    assert.equal(other.window.dataLayer, undefined, `${hostname} must not create a data layer`);
  }
};

for (const site of sites) {
  const root = join(repoRoot, site.sourcePath);
  const files = await walkFiles(root);
  if (site.mode === "retire") await verifyRetireSite(site, root, files);
  else if (site.mode === "ga4") await verifyGa4Site(site, root, files);
  else throw new Error(`unknown analytics mode for ${site.sourcePath}`);
  console.log(`${site.hostname}: ${site.mode} analytics contract passed.`);
}

console.log("MannaMila analytics contract tests passed.");

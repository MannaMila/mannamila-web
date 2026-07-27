import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const script = join(repoRoot, "scripts/promote-squash.mjs");
const target = await mkdtemp(join(tmpdir(), "squash-web-promotion-"));

const run = (...args) =>
  spawnSync(process.execPath, [script, "--target", target, ...args], {
    cwd: repoRoot,
    encoding: "utf8",
  });

try {
  await mkdir(join(target, ".git"));
  await mkdir(join(target, ".github/workflows"), { recursive: true });
  await mkdir(join(target, "docs"));
  await writeFile(join(target, "CNAME"), "squash.mannamila.com\n");
  await writeFile(join(target, ".nojekyll"), "");
  await writeFile(join(target, ".github/workflows/pages.yml"), "name: Pages\n");
  await writeFile(join(target, "docs/deploy.md"), "deployment notes\n");
  await writeFile(join(target, "README.md"), "Mila Squash web deployment\n");

  const dryRun = run("--dry-run", "--allow-placeholder-form", "--allow-dirty-source");
  assert.equal(dryRun.status, 0, dryRun.stderr);
  assert.match(dryRun.stdout, /Dry run/);
  await assert.rejects(readFile(join(target, "index.html")));

  const apply = run("--apply", "--allow-placeholder-form", "--allow-dirty-source");
  assert.equal(apply.status, 0, apply.stderr);
  assert.match(await readFile(join(target, "index.html"), "utf8"), /Mila Squash/);
  assert.match(await readFile(join(target, "analytics.js"), "utf8"), /\bG-[A-Z0-9]{8,}\b/);
  await assert.rejects(readFile(join(target, "verify-site.mjs")));
  assert.equal(await readFile(join(target, "CNAME"), "utf8"), "squash.mannamila.com\n");
  assert.equal(await readFile(join(target, ".github/workflows/pages.yml"), "utf8"), "name: Pages\n");
  assert.equal(await readFile(join(target, "docs/deploy.md"), "utf8"), "deployment notes\n");

  const manifest = JSON.parse(await readFile(join(target, ".squash-source.json"), "utf8"));
  assert.equal(manifest.sourceRepository, "MannaMila/mannamila-web");
  assert.equal(typeof manifest.sourceCommit, "string");
  assert.equal(typeof manifest.sourceTreeDirty, "boolean");
  assert.ok(manifest.files["index.html"]);
  assert.ok(manifest.files["analytics.js"]);
  assert.equal(manifest.files["verify-site.mjs"], undefined);

  const check = run("--check", "--allow-placeholder-form", "--allow-dirty-source");
  assert.equal(check.status, 0, check.stderr);
  assert.match(check.stdout, /Parity check passed/);

  await rm(join(target, "analytics.js"));
  for (const page of [
    "index.html",
    "privacy/index.html",
    "support/index.html",
    "waitlist-privacy/index.html",
  ]) {
    const pagePath = join(target, page);
    const html = await readFile(pagePath, "utf8");
    await writeFile(
      pagePath,
      html.replace(/^\s*<script src="(?:\.\/|\.\.\/)analytics\.js" defer><\/script>\n/m, ""),
    );
  }

  const analyticsDryRun = run("--analytics-only", "--dry-run", "--allow-dirty-source");
  assert.equal(analyticsDryRun.status, 0, analyticsDryRun.stderr);
  assert.match(analyticsDryRun.stdout, /Analytics-only dry run/);

  const analyticsApply = run("--analytics-only", "--apply", "--allow-dirty-source");
  assert.equal(analyticsApply.status, 0, analyticsApply.stderr);
  assert.match(await readFile(join(target, "analytics.js"), "utf8"), /\bG-[A-Z0-9]{8,}\b/);

  await writeFile(join(target, "app.js"), "changed outside analytics scope\n");
  const unsafeAnalyticsPromotion = run("--analytics-only", "--dry-run", "--allow-dirty-source");
  assert.notEqual(unsafeAnalyticsPromotion.status, 0);
  assert.match(unsafeAnalyticsPromotion.stderr, /outside analytics-only scope/i);

  const restore = run("--apply", "--allow-placeholder-form", "--allow-dirty-source");
  assert.equal(restore.status, 0, restore.stderr);

  await writeFile(join(target, "index.html"), "changed\n");
  const brokenCheck = run("--check", "--allow-placeholder-form", "--allow-dirty-source");
  assert.notEqual(brokenCheck.status, 0);
  assert.match(brokenCheck.stderr, /parity/i);
} finally {
  await rm(target, { recursive: true, force: true });
}

console.log("Mila Squash promotion script tests passed.");

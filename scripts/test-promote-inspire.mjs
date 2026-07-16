#!/usr/bin/env node

import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const script = join(repoRoot, "scripts/promote-inspire.mjs");
const target = await mkdtemp(join(tmpdir(), "inspire-web-promotion-"));

const run = (...args) =>
  spawnSync(process.execPath, [script, "--target", target, ...args], {
    cwd: repoRoot,
    encoding: "utf8",
  });

try {
  await mkdir(join(target, ".git"));
  await mkdir(join(target, ".github/workflows"), { recursive: true });
  await writeFile(join(target, "CNAME"), "inspire.mannamila.com\n");
  await writeFile(join(target, ".nojekyll"), "");
  await writeFile(join(target, ".github/workflows/pages.yml"), "name: Pages\n");

  const dryRun = run("--dry-run", "--allow-dirty-source");
  assert.equal(dryRun.status, 0, dryRun.stderr);
  assert.match(dryRun.stdout, /Dry run/);
  await assert.rejects(readFile(join(target, "index.html")));

  const apply = run("--apply", "--allow-dirty-source");
  assert.equal(apply.status, 0, apply.stderr);
  assert.match(await readFile(join(target, "index.html"), "utf8"), /Mila Inspire/);
  assert.equal(await readFile(join(target, "CNAME"), "utf8"), "inspire.mannamila.com\n");
  assert.equal(await readFile(join(target, ".github/workflows/pages.yml"), "utf8"), "name: Pages\n");

  const manifest = JSON.parse(await readFile(join(target, ".inspire-source.json"), "utf8"));
  assert.equal(manifest.sourceRepository, "MannaMila/mannamila-web");
  assert.equal(manifest.sourcePath, "inspire");
  assert.equal(typeof manifest.sourceTreeDirty, "boolean");
  assert.ok(manifest.files["index.html"]);
  assert.ok(manifest.files["styles.css"]);
  assert.equal(manifest.files["verify-site.mjs"], undefined);

  const check = run("--check", "--allow-dirty-source");
  assert.equal(check.status, 0, check.stderr);
  assert.match(check.stdout, /Parity check passed/);

  await writeFile(join(target, "index.html"), "changed\n");
  const brokenCheck = run("--check", "--allow-dirty-source");
  assert.notEqual(brokenCheck.status, 0);
  assert.match(brokenCheck.stderr, /parity/i);

  await writeFile(join(target, "CNAME"), "wrong.example\n");
  const wrongDomain = run("--dry-run", "--allow-dirty-source");
  assert.notEqual(wrongDomain.status, 0);
  assert.match(wrongDomain.stderr, /CNAME must be inspire\.mannamila\.com/);
} finally {
  await rm(target, { recursive: true, force: true });
}

console.log("Mila Inspire promotion script tests passed.");

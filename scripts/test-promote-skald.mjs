import assert from "node:assert/strict";
import { mkdtemp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const script = join(repoRoot, "scripts/promote-skald.mjs");
const target = await mkdtemp(join(tmpdir(), "skald-web-promotion-"));

const run = (...args) =>
  spawnSync(process.execPath, [script, "--target", target, ...args], {
    cwd: repoRoot,
    encoding: "utf8",
  });

const snapshotNonFeedbackFiles = async (current = target, prefix = "") => {
  const snapshot = {};
  for (const entry of await readdir(current, { withFileTypes: true })) {
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (relativePath === "feedback") continue;
    if (entry.isDirectory()) {
      Object.assign(snapshot, await snapshotNonFeedbackFiles(join(current, entry.name), relativePath));
    } else if (entry.isFile()) {
      snapshot[relativePath] = (await readFile(join(current, entry.name))).toString("base64");
    }
  }
  return snapshot;
};

try {
  await mkdir(join(target, ".git"));
  await mkdir(join(target, ".github/workflows"), { recursive: true });
  await mkdir(join(target, "docs"));
  await mkdir(join(target, "feedback"));
  await writeFile(join(target, "CNAME"), "skald.mannamila.com\n");
  await writeFile(join(target, ".nojekyll"), "");
  await writeFile(join(target, ".github/workflows/pages.yml"), "name: Pages\n");
  await writeFile(join(target, "docs/deploy.md"), "deployment notes\n");
  await writeFile(join(target, "feedback/index.html"), "Feedback form\n");
  await writeFile(join(target, "README.md"), "Skald web deployment\n");

  const dryRun = run("--dry-run", "--allow-placeholder-form", "--allow-dirty-source");
  assert.equal(dryRun.status, 0, dryRun.stderr);
  assert.match(dryRun.stdout, /Dry run/);
  await assert.rejects(readFile(join(target, "index.html")));

  const apply = run("--apply", "--allow-placeholder-form", "--allow-dirty-source");
  assert.equal(apply.status, 0, apply.stderr);
  assert.match(await readFile(join(target, "index.html"), "utf8"), /One Odyssey\./);
  assert.match(await readFile(join(target, "feedback/index.html"), "utf8"), /Share feedback about Skald/);
  assert.match(
    await readFile(join(target, "feedback/privacy/index.html"), "utf8"),
    /within 12 months of submission/i,
  );
  assert.match(await readFile(join(target, "feedback/styles.css"), "utf8"), /\.route-card/);
  assert.match(
    await readFile(join(target, "updates-privacy/index.html"), "utf8"),
    /Product Updates Privacy Notice/,
  );
  await assert.rejects(readFile(join(target, "verify-site.mjs")));
  assert.equal(await readFile(join(target, "CNAME"), "utf8"), "skald.mannamila.com\n");
  assert.equal(await readFile(join(target, ".github/workflows/pages.yml"), "utf8"), "name: Pages\n");
  assert.equal(await readFile(join(target, "docs/deploy.md"), "utf8"), "deployment notes\n");

  const manifest = JSON.parse(await readFile(join(target, ".skald-source.json"), "utf8"));
  assert.equal(manifest.sourceRepository, "MannaMila/mannamila-web");
  assert.equal(typeof manifest.sourceCommit, "string");
  assert.equal(typeof manifest.sourceTreeDirty, "boolean");
  assert.ok(manifest.files["index.html"]);
  assert.ok(manifest.files["feedback/index.html"]);
  assert.ok(manifest.files["feedback/privacy/index.html"]);
  assert.ok(manifest.files["feedback/styles.css"]);
  assert.ok(manifest.files["updates-privacy/index.html"]);
  assert.equal(manifest.files["verify-site.mjs"], undefined);

  const check = run("--check", "--allow-placeholder-form", "--allow-dirty-source");
  assert.equal(check.status, 0, check.stderr);
  assert.match(check.stdout, /Parity check passed/);

  await writeFile(join(target, "index.html"), "deployment landing must survive\n");
  await writeFile(join(target, "availability.json"), '{"deployment":"availability must survive"}\n');
  await writeFile(join(target, "feedback/obsolete.html"), "remove only from feedback\n");
  const beforeFeedbackOnly = await snapshotNonFeedbackFiles();

  const feedbackDryRun = run(
    "--feedback-only",
    "--dry-run",
    "--allow-placeholder-form",
    "--allow-dirty-source",
  );
  assert.equal(feedbackDryRun.status, 0, feedbackDryRun.stderr);
  assert.match(feedbackDryRun.stdout, /Feedback-only dry run/);
  assert.deepEqual(await snapshotNonFeedbackFiles(), beforeFeedbackOnly);
  assert.equal(await readFile(join(target, "feedback/obsolete.html"), "utf8"), "remove only from feedback\n");

  const feedbackApply = run(
    "--feedback-only",
    "--apply",
    "--allow-placeholder-form",
    "--allow-dirty-source",
  );
  assert.equal(feedbackApply.status, 0, feedbackApply.stderr);
  assert.match(feedbackApply.stdout, /Promoted 3 feedback files/);
  assert.deepEqual(await snapshotNonFeedbackFiles(), beforeFeedbackOnly);
  assert.match(await readFile(join(target, "feedback/index.html"), "utf8"), /Share feedback about Skald/);
  await assert.rejects(readFile(join(target, "feedback/obsolete.html")));

  const feedbackCheck = run(
    "--feedback-only",
    "--check",
    "--allow-placeholder-form",
    "--allow-dirty-source",
  );
  assert.equal(feedbackCheck.status, 0, feedbackCheck.stderr);
  assert.match(feedbackCheck.stdout, /Feedback parity check passed/);
  assert.deepEqual(await snapshotNonFeedbackFiles(), beforeFeedbackOnly);

  await writeFile(join(target, "feedback/index.html"), "changed feedback\n");
  const brokenFeedbackCheck = run(
    "--feedback-only",
    "--check",
    "--allow-placeholder-form",
    "--allow-dirty-source",
  );
  assert.notEqual(brokenFeedbackCheck.status, 0);
  assert.match(brokenFeedbackCheck.stderr, /feedback parity/i);
  assert.deepEqual(await snapshotNonFeedbackFiles(), beforeFeedbackOnly);

  await writeFile(join(target, "index.html"), "changed\n");
  const brokenCheck = run("--check", "--allow-placeholder-form", "--allow-dirty-source");
  assert.notEqual(brokenCheck.status, 0);
  assert.match(brokenCheck.stderr, /parity/i);
} finally {
  await rm(target, { recursive: true, force: true });
}

console.log("Skald promotion script tests passed.");

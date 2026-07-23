#!/usr/bin/env node

import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  access,
  copyFile,
  lstat,
  mkdir,
  readdir,
  readFile,
  realpath,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = join(repoRoot, "skald");
const publicRoots = [
  "index.html",
  "styles.css",
  "app.js",
  "availability.json",
  "site-config.json",
  "assets",
  "privacy",
  "waitlist-privacy",
  "support",
  "feedback",
];
const feedbackRoots = ["feedback"];
const preservedTopLevel = new Set([
  ".git",
  ".gitignore",
  ".github",
  ".nojekyll",
  "CNAME",
  "README.md",
  "LICENSE",
  "CODEOWNERS",
  "SECURITY.md",
  "docs",
]);
const generatedManifest = ".skald-source.json";

const usage = () => {
  console.error(
    "Usage: node scripts/promote-skald.mjs --target /path/to/skald-web [--dry-run|--apply|--check] [--feedback-only] [--allow-placeholder-form] [--allow-dirty-source]",
  );
};

const parseArgs = () => {
  const args = process.argv.slice(2);
  const result = {
    target: null,
    mode: "dry-run",
    feedbackOnly: false,
    allowPlaceholderForm: false,
    allowDirtySource: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--target") {
      result.target = args[index + 1] ?? null;
      index += 1;
    } else if (["--dry-run", "--apply", "--check"].includes(arg)) {
      result.mode = arg.slice(2);
    } else if (arg === "--feedback-only") {
      result.feedbackOnly = true;
    } else if (arg === "--allow-placeholder-form") {
      result.allowPlaceholderForm = true;
    } else if (arg === "--allow-dirty-source") {
      result.allowDirtySource = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!result.target) throw new Error("--target is required");
  return result;
};

const pathExists = async (path) => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};

const runGit = (...args) => {
  const result = spawnSync("git", ["-C", repoRoot, ...args], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr.trim() || "git command failed");
  return result.stdout.trim();
};

const verifySource = ({ allowPlaceholderForm }) => {
  const result = spawnSync(process.execPath, [join(sourceRoot, "verify-site.mjs")], {
    cwd: repoRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      ...(allowPlaceholderForm ? { SKALD_ALLOW_PLACEHOLDER_FORM: "1" } : {}),
    },
  });

  if (result.status !== 0) {
    throw new Error(`Skald source verification failed:\n${result.stderr || result.stdout}`);
  }
};

const toPosix = (path) => path.split(sep).join("/");

const walkFiles = async (root, current = root) => {
  const entries = await readdir(current, { withFileTypes: true });
  const files = [];

  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const absolute = join(current, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Symlinks are not allowed in the public tree: ${absolute}`);
    if (entry.isDirectory()) files.push(...(await walkFiles(root, absolute)));
    else if (entry.isFile()) files.push(toPosix(relative(root, absolute)));
    else throw new Error(`Unsupported public-tree entry: ${absolute}`);
  }

  return files;
};

const sourceFiles = async (roots) => {
  const files = [];
  for (const root of roots) {
    const absolute = join(sourceRoot, root);
    const info = await lstat(absolute);
    if (info.isSymbolicLink()) throw new Error(`Symlinks are not allowed in the public tree: ${absolute}`);
    if (info.isDirectory()) files.push(...(await walkFiles(sourceRoot, absolute)));
    else if (info.isFile()) files.push(root);
    else throw new Error(`Unsupported public-tree entry: ${absolute}`);
  }
  return [...new Set(files)].sort();
};

const targetFiles = async (target, roots) => {
  const files = [];
  for (const root of roots) {
    const absolute = join(target, root);
    if (!(await pathExists(absolute))) continue;
    const info = await lstat(absolute);
    if (info.isSymbolicLink()) throw new Error(`Symlinks are not allowed in the deployed public tree: ${absolute}`);
    if (info.isDirectory()) files.push(...(await walkFiles(target, absolute)));
    else if (info.isFile()) files.push(root);
  }
  return [...new Set(files)].sort();
};

const sha256 = async (path) =>
  createHash("sha256")
    .update(await readFile(path))
    .digest("hex");

const checksums = async (root, files) => {
  const result = {};
  for (const file of files) result[file] = await sha256(join(root, file));
  return result;
};

const assertTarget = async (target) => {
  const resolvedTarget = resolve(target);
  const [sourceReal, targetReal] = await Promise.all([realpath(sourceRoot), realpath(resolvedTarget)]);
  if (sourceReal === targetReal || sourceReal.startsWith(`${targetReal}${sep}`)) {
    throw new Error("The deployment target cannot contain the source tree.");
  }
  if (!(await pathExists(join(resolvedTarget, ".git")))) {
    throw new Error("The deployment target must be a git checkout or worktree.");
  }
  if ((await readFile(join(resolvedTarget, "CNAME"), "utf8")).trim() !== "skald.mannamila.com") {
    throw new Error("The target CNAME must be skald.mannamila.com.");
  }
  if (!(await pathExists(join(resolvedTarget, ".nojekyll")))) {
    throw new Error("The target must contain .nojekyll.");
  }

  const approvedTopLevel = new Set([...publicRoots, ...preservedTopLevel, generatedManifest]);
  const unexpected = (await readdir(resolvedTarget))
    .filter((name) => !approvedTopLevel.has(name))
    .sort();
  if (unexpected.length > 0) {
    throw new Error(`Unexpected target entries would escape promotion control: ${unexpected.join(", ")}`);
  }

  return targetReal;
};

const sourceIdentity = () => {
  const sourceCommit = runGit("rev-parse", "HEAD");
  const sourceTreeDirty = runGit("status", "--porcelain", "--", "skald").length > 0;
  return { sourceCommit, sourceTreeDirty };
};

const manifestFor = (identity, fileChecksums) => ({
  schemaVersion: 1,
  sourceRepository: "MannaMila/mannamila-web",
  sourceCommit: identity.sourceCommit,
  sourcePath: "skald",
  sourceTreeDirty: identity.sourceTreeDirty,
  files: fileChecksums,
});

const copyPublicTree = async (target, files, roots) => {
  for (const root of roots) await rm(join(target, root), { recursive: true, force: true });

  for (const file of files) {
    const destination = join(target, file);
    await mkdir(dirname(destination), { recursive: true });
    await copyFile(join(sourceRoot, file), destination);
    const mode = (await stat(join(sourceRoot, file))).mode;
    await import("node:fs/promises").then(({ chmod }) => chmod(destination, mode));
  }
};

const compare = (expected, actual) => {
  const expectedFiles = Object.keys(expected).sort();
  const actualFiles = Object.keys(actual).sort();
  const added = expectedFiles.filter((file) => !(file in actual));
  const removed = actualFiles.filter((file) => !(file in expected));
  const changed = expectedFiles.filter((file) => file in actual && expected[file] !== actual[file]);
  return { added, removed, changed };
};

const formatChanges = ({ added, removed, changed }) => {
  const lines = [];
  for (const file of added) lines.push(`  add     ${file}`);
  for (const file of changed) lines.push(`  update  ${file}`);
  for (const file of removed) lines.push(`  remove  ${file}`);
  return lines.length > 0 ? lines.join("\n") : "  no public-file changes";
};

const main = async () => {
  const options = parseArgs();
  verifySource(options);
  const target = await assertTarget(options.target);
  const roots = options.feedbackOnly ? feedbackRoots : publicRoots;
  const identity = sourceIdentity();
  if (identity.sourceTreeDirty && !options.allowDirtySource) {
    throw new Error("The skald source tree is dirty. Promote a reviewed source commit, or use --allow-dirty-source only for an isolated test.");
  }

  const files = await sourceFiles(roots);
  const expectedChecksums = await checksums(sourceRoot, files);
  const existingFiles = await targetFiles(target, roots);
  const existingChecksums = await checksums(target, existingFiles);
  const changes = compare(expectedChecksums, existingChecksums);

  if (options.mode === "dry-run") {
    const label = options.feedbackOnly ? "Feedback-only dry run" : "Dry run";
    console.log(`${label}: ${files.length} approved public files from ${identity.sourceCommit}`);
    console.log(formatChanges(changes));
    if (!options.feedbackOnly) console.log(`  record  ${generatedManifest}`);
    return;
  }

  if (options.mode === "apply") {
    await copyPublicTree(target, files, roots);
    if (!options.feedbackOnly) {
      const manifest = manifestFor(identity, expectedChecksums);
      await writeFile(join(target, generatedManifest), `${JSON.stringify(manifest, null, 2)}\n`);
    }
    const label = options.feedbackOnly
      ? `${files.length} feedback files`
      : `${files.length} approved public files`;
    console.log(`Promoted ${label} from ${identity.sourceCommit}.`);
    console.log(formatChanges(changes));
    return;
  }

  if (options.feedbackOnly) {
    const parityFailed =
      changes.added.length > 0 || changes.removed.length > 0 || changes.changed.length > 0;
    if (parityFailed) {
      throw new Error(`Feedback parity check failed:\n${formatChanges(changes)}`);
    }

    console.log(`Feedback parity check passed for ${files.length} files from ${identity.sourceCommit}.`);
    return;
  }

  const manifest = manifestFor(identity, expectedChecksums);
  const actualManifest = await readFile(join(target, generatedManifest), "utf8").catch(() => null);
  const expectedManifest = `${JSON.stringify(manifest, null, 2)}\n`;
  const parityFailed =
    changes.added.length > 0 ||
    changes.removed.length > 0 ||
    changes.changed.length > 0 ||
    actualManifest !== expectedManifest;

  if (parityFailed) {
    throw new Error(`Deployment parity check failed:\n${formatChanges(changes)}${actualManifest === expectedManifest ? "" : `\n  update  ${generatedManifest}`}`);
  }

  console.log(`Parity check passed for ${files.length} public files from ${identity.sourceCommit}.`);
};

main().catch((error) => {
  usage();
  console.error(`\n${error.message}`);
  process.exitCode = 1;
});

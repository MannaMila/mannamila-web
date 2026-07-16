#!/usr/bin/env node

import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  access,
  copyFile,
  lstat,
  readFile,
  readdir,
  realpath,
  rm,
  writeFile,
} from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = join(repoRoot, "inspire");
const publicRoots = ["index.html", "styles.css"];
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
const generatedManifest = ".inspire-source.json";

const usage = () => {
  console.error(
    "Usage: node scripts/promote-inspire.mjs --target /path/to/inspire-web [--dry-run|--apply|--check] [--allow-dirty-source]",
  );
};

const parseArgs = () => {
  const args = process.argv.slice(2);
  const result = { target: null, mode: "dry-run", allowDirtySource: false };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--target") {
      result.target = args[index + 1] ?? null;
      index += 1;
    } else if (["--dry-run", "--apply", "--check"].includes(arg)) {
      result.mode = arg.slice(2);
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

const verifySource = () => {
  const result = spawnSync(process.execPath, [join(sourceRoot, "verify-site.mjs")], {
    cwd: repoRoot,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new Error(`Mila Inspire source verification failed:\n${result.stderr || result.stdout}`);
  }
};

const toPosix = (path) => path.split(sep).join("/");

const sourceFiles = async () => {
  const files = [];
  for (const root of publicRoots) {
    const absolute = join(sourceRoot, root);
    const info = await lstat(absolute);
    if (info.isSymbolicLink()) throw new Error(`Symlinks are not allowed in the public tree: ${absolute}`);
    if (!info.isFile()) throw new Error(`Expected a public file: ${absolute}`);
    files.push(toPosix(relative(sourceRoot, absolute)));
  }
  return files.sort();
};

const targetFiles = async (target) => {
  const files = [];
  for (const root of publicRoots) {
    const absolute = join(target, root);
    if (!(await pathExists(absolute))) continue;
    const info = await lstat(absolute);
    if (info.isSymbolicLink()) throw new Error(`Symlinks are not allowed in the deployed public tree: ${absolute}`);
    if (!info.isFile()) throw new Error(`Expected a deployed public file: ${absolute}`);
    files.push(root);
  }
  return files.sort();
};

const sha256 = async (path) => createHash("sha256").update(await readFile(path)).digest("hex");

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
  if (!(await pathExists(join(targetReal, ".git")))) {
    throw new Error("The deployment target must be a git checkout or worktree.");
  }
  if ((await readFile(join(targetReal, "CNAME"), "utf8")).trim() !== "inspire.mannamila.com") {
    throw new Error("The target CNAME must be inspire.mannamila.com.");
  }
  if (!(await pathExists(join(targetReal, ".nojekyll")))) {
    throw new Error("The target must contain .nojekyll.");
  }

  const approvedTopLevel = new Set([...publicRoots, ...preservedTopLevel, generatedManifest]);
  const unexpected = (await readdir(targetReal)).filter((name) => !approvedTopLevel.has(name)).sort();
  if (unexpected.length > 0) {
    throw new Error(`Unexpected target entries would escape promotion control: ${unexpected.join(", ")}`);
  }
  return targetReal;
};

const sourceIdentity = () => ({
  sourceCommit: runGit("rev-parse", "HEAD"),
  sourceTreeDirty: runGit("status", "--porcelain", "--", "inspire").length > 0,
});

const manifestFor = (identity, fileChecksums) => ({
  schemaVersion: 1,
  sourceRepository: "MannaMila/mannamila-web",
  sourceCommit: identity.sourceCommit,
  sourcePath: "inspire",
  sourceTreeDirty: identity.sourceTreeDirty,
  files: fileChecksums,
});

const compare = (expected, actual) => {
  const expectedFiles = Object.keys(expected).sort();
  const actualFiles = Object.keys(actual).sort();
  return {
    added: expectedFiles.filter((file) => !(file in actual)),
    removed: actualFiles.filter((file) => !(file in expected)),
    changed: expectedFiles.filter((file) => file in actual && expected[file] !== actual[file]),
  };
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
  verifySource();
  const target = await assertTarget(options.target);
  const identity = sourceIdentity();
  if (identity.sourceTreeDirty && !options.allowDirtySource) {
    throw new Error("The inspire source tree is dirty. Promote a reviewed source commit, or use --allow-dirty-source only for an isolated test.");
  }

  const files = await sourceFiles();
  const expectedChecksums = await checksums(sourceRoot, files);
  const existingFiles = await targetFiles(target);
  const existingChecksums = await checksums(target, existingFiles);
  const changes = compare(expectedChecksums, existingChecksums);
  const manifest = manifestFor(identity, expectedChecksums);

  if (options.mode === "dry-run") {
    console.log(`Dry run: ${files.length} approved public files from ${identity.sourceCommit}`);
    console.log(formatChanges(changes));
    console.log(`  record  ${generatedManifest}`);
    return;
  }

  if (options.mode === "apply") {
    for (const root of publicRoots) await rm(join(target, root), { recursive: true, force: true });
    for (const file of files) await copyFile(join(sourceRoot, file), join(target, file));
    await writeFile(join(target, generatedManifest), `${JSON.stringify(manifest, null, 2)}\n`);
    console.log(`Promoted ${files.length} approved public files from ${identity.sourceCommit}.`);
    console.log(formatChanges(changes));
    return;
  }

  const actualManifest = await readFile(join(target, generatedManifest), "utf8").catch(() => null);
  const expectedManifest = `${JSON.stringify(manifest, null, 2)}\n`;
  const parityFailed =
    changes.added.length > 0 ||
    changes.removed.length > 0 ||
    changes.changed.length > 0 ||
    actualManifest !== expectedManifest;
  if (parityFailed) {
    throw new Error(
      `Deployment parity check failed:\n${formatChanges(changes)}${actualManifest === expectedManifest ? "" : `\n  update  ${generatedManifest}`}`,
    );
  }
  console.log(`Parity check passed for ${files.length} public files from ${identity.sourceCommit}.`);
};

main().catch((error) => {
  usage();
  console.error(`\n${error.message}`);
  process.exitCode = 1;
});

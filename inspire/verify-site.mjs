#!/usr/bin/env node

import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const read = (path) => readFile(join(root, path), "utf8");

await Promise.all(["index.html", "styles.css"].map((path) => access(join(root, path))));

const [index, styles] = await Promise.all([read("index.html"), read("styles.css")]);

assert.match(index, /<html lang="en">/);
assert.match(index, /<meta name="viewport" content="width=device-width, initial-scale=1">/);
assert.match(index, /<title>Mila Inspire — Coming Soon<\/title>/);
assert.match(index, /<link rel="canonical" href="https:\/\/inspire\.mannamila\.com\/">/);
assert.match(index, /<meta property="og:url" content="https:\/\/inspire\.mannamila\.com\/">/);
assert.match(index, /<main>/);
assert.match(index, /<h1>Mila Inspire<\/h1>/);
assert.match(index, /<p>Coming soon\.<\/p>/);
assert.match(index, /<link rel="stylesheet" href="\.\/styles\.css">/);

for (const forbidden of [/<script\b/i, /<form\b/i, /<iframe\b/i, /<img\b/i, /<a\b/i]) {
  assert.doesNotMatch(index, forbidden, `stub contains forbidden markup: ${forbidden}`);
}

const body = index.match(/<body>([\s\S]*?)<\/body>/i)?.[1] ?? "";
const visibleText = body
  .replace(/<[^>]+>/g, " ")
  .replace(/\s+/g, " ")
  .trim();
assert.equal(visibleText, "Mila Inspire Coming soon.");

for (const match of index.matchAll(/(?:src|href)="\.\/([^"#?]+)"/g)) {
  await access(join(root, match[1]));
}

assert.match(styles, /#f4f1eb/i);
assert.match(styles, /#1b2436/i);
assert.match(styles, /#4b5468/i);
assert.match(styles, /min-height:\s*100svh/);
assert.match(styles, /font-size:\s*clamp\(/);
assert.doesNotMatch(styles, /@import\b/i);
assert.doesNotMatch(styles, /url\(/i);

console.log("Mila Inspire site verification passed.");

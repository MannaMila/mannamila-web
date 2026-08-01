# D11c — hosted 0.5.0 privacy policy

**Status: BLOCKED before promotion.** The source-repo work is complete, committed, and
verified as far as this environment allows. Promotion into `MannaMila/skald-web` and the
deploy PR were not performed: both required commands (`skald/verify-site.mjs` and
`scripts/test-promote-skald.mjs`, the latter invoked internally by `promote-skald.mjs`)
fail closed without the out-of-band `SKALD_MOSAIC_PASSWORD`, which was not made
available for this session.

---

## 1. What changed

Source repo: `/Volumes/Dev/Code/mannamila-web`, branch `main`.
**Source commit: `70b0787`** — `feat(skald): publish the 0.5.0 privacy policy`
(parent `28e1389`).

Two files, both under `skald/`. No inspire/squash file and no app-repo file was touched.

### `skald/privacy/index.html`

The policy body was replaced with the arbitrated text; everything else on the page is
byte-unchanged.

| Kept exactly as-is | Replaced |
| --- | --- |
| `<head>`, `<meta name="description">`, `<title>` | the policy body (`<h1>` onward) |
| `rel="canonical" href="https://skald.mannamila.com/privacy/"` | |
| `<script src="../retire-analytics.js" defer></script>` | |
| the entire inline `<style>` block | |
| `<p class="eyebrow">MannaMila LLC</p>` | |
| `<nav class="back-links">` footer (3 links) | |

Substance the old page did not have:

- The no-telemetry claim now attaches to **0.5.0**, the release that actually makes it
  true. The old page said *"Beginning with version 0.4.1…"* — a build that never
  shipped. No `0.4.1` string remains on the page.
- New sections: **At a glance**, **What the no-app-telemetry statement does not cover**,
  **Advertising attribution** (with `<h3>` subsections *On Android* / *On iPhone and
  iPad*), **Content-update requests (MannaMila delivery)**, **How information is
  processed or shared**, **International users and where data is processed**, **Your
  choices**. The Meta attribution lane (facebook-core 18.3.0, Play install referrer,
  `AD_ID`, Privacy Sandbox permissions, SKAdNetwork) and the
  `https://delivery.mannamila.com` content-delivery lane were entirely absent before.
- **Historical telemetry retention** → **Retention and deletion**, now stating the
  approved Amplitude 24-month / Sentry 90-day periods as policy periods rather than
  "pending owner recheck".
- Android backup section corrected: encrypted Google backup carries only
  `datastore/skald_entitlement.preferences_pb`, not "Android excludes app data".

**Dates.** Effective date unchanged at `2026-07-28` (as the page and the markdown both
state). Last updated moved `2026-07-28` → `2026-08-01`, the arbitrated policy's own
date. No date was invented.

**Link style.** The two MannaMila links in the markdown were converted to the site's
existing relative idiom — `https://skald.mannamila.com/feedback/privacy/` →
`../feedback/privacy/`, `https://skald.mannamila.com/updates-privacy/` →
`../updates-privacy/`. The external ICO link stays absolute. This is the only
markdown→HTML change that alters a character of the source, and it changes no rendered
text.

**Markdown → HTML idiom.** `##`→`<h2>`, `###`→`<h3>`, `**x**`→`<strong>`, `*Odyssey*`→
`<em>`, `- ` lists→`<ul><li>`, backticked literals→`<code>` (exactly the two the
markdown itself backticks: `datastore/skald_entitlement.preferences_pb` and `AD_ID`;
`facebook-core 18.3.0` is left plain because the markdown leaves it plain). `&`→`&amp;`.
Curly quotes and straight apostrophes preserved character-for-character from the source.

### `skald/verify-site.mjs`

Privacy-page assertions updated so the source gate matches what the app repo's
`scripts/verify_hosted_privacy_policy.sh` greps off the live page:

- `Beginning with version 0.4.1, …` → `0.5.0`
- added: the Amplitude/Sentry-initialization sentence, `Skald is offered in the United
  States, Canada, Australia, and New Zealand.`, `<h2>Advertising attribution</h2>`,
  `facebook-core 18.3.0`, `SKAdNetwork is the only iOS attribution mechanism`, `The iOS
  app sends no data to Meta`, `Attribution has no in-app opt-out`,
  `https://delivery.mannamila.com`, `processes the network IP transiently to enforce
  per-IP rate limits`, and `../feedback/privacy/`
- added `doesNotMatch` guards: no `0.4.1` claim, no unresolved `{{…}}` placeholder

Pre-existing assertions kept: canonical URL, `../updates-privacy/`, `The app does not
transmit the ID or create a replacement`, `No Analytics ID exists on this installation`,
`Request deletion of previously shared data`, `The public Skald website is also separate
from the app`, `United Kingdom information — pending before UK distribution`, and the
three legacy `doesNotMatch` guards.

---

## 2. Verbatim fidelity — how it was checked

The proposed file's body below its 2-line HTML comment header is byte-identical to the
source of truth:

```sh
cd /Volumes/Dev/Code/skald-integration          # branch feature/phase1-remote-attribution-entitlement @ fd8728d
tail -n +3 docs/sessions/2026-07-31-phase1-prep/hosted-privacy-policy-proposed.md > /tmp/proposed-body.md
diff /tmp/proposed-body.md docs/legal/privacy-policy.md      # no output
shasum -a 256 docs/legal/privacy-policy.md
# c188969b5f173663e97564a504fe8c636c1674c299876908d1089b7b085da930  (both files)
```

**Method: block-per-line text-extract diff.** A script normalizes both documents to the
same plain-text stream — one line per heading, paragraph, and list item — then compares
them positionally:

- *markdown side*: strip heading markers, unwrap `**`/`*`/backticks, reduce
  `[text](url)` to `text`, join soft-wrapped lines within a block, split list items.
- *HTML side*: take `<main>`, drop the two pieces of page chrome (`p.eyebrow`,
  `nav.back-links`), extract inner text of every `h1|h2|h3|p|li`, turn `<br>` into a
  space, strip tags, decode entities, collapse whitespace.

Any reworded, added, dropped, merged, split, or reordered block shows up as a positional
mismatch. Result:

```
markdown blocks: 95   html blocks: 95   differing: 0
```

This covers the `.meta` box too (its three `<br>`-joined lines reduce to the same string
as the markdown's effective/last-updated/canonical block), so the published dates are
diffed against the source rather than asserted.

The script is at
`/private/tmp/claude-501/-Volumes-Dev-Code-mannamila-web/c92c3752-0727-4043-a677-799fddf4a356/scratchpad/fidelity.mjs`
(scratch, not committed). Re-run:

```sh
node <scratchpad>/fidelity.mjs \
  /Volumes/Dev/Code/skald-integration/docs/legal/privacy-policy.md \
  /Volumes/Dev/Code/mannamila-web/skald/privacy/index.html \
  <scratchpad>
```

`skald/privacy/index.html` sha256: `1ab5e7bc4126974d1bed426ac5c236e35b3274e3c7d5980fbce6bb7a2167fd03`

---

## 3. Verifier / test results

| Command | Result |
| --- | --- |
| `node scripts/test-analytics-contract.mjs` | **PASS** — `MannaMila analytics-retirement contract tests passed.` |
| App-repo gate markers, simulated locally | **PASS** — all 12 markers found, no placeholder, no `0.4.1` |
| `node skald/verify-site.mjs` | **NOT RUN** — needs `SKALD_MOSAIC_PASSWORD` |
| `node scripts/test-promote-skald.mjs` | **NOT RUN** — same, transitively |

The retirement contract is green: the page still loads `../retire-analytics.js` with the
exact `<script src="…" defer></script>` shape the contract requires, and adds no
analytics loader, no `gtag`/`googletagmanager`/`google-analytics`/`G-XXXXXXXX` token,
and no inline `document.cookie` write. (The policy text says "Google Analytics tag" with
a space, which does not match the contract's hyphenated `google-analytics` pattern —
same as before this change.)

### Local simulation of the app-repo gate

Every marker `scripts/verify_hosted_privacy_policy.sh` greps was run against the built
page using that script's own normalization (`tr -s '[:space:]' ' '` + `grep -Fqi`):

```
ok  Skald: Odyssey
ok  privacy@mannamila.com
ok  Skald is offered in the United States, Canada, Australia, and New Zealand
ok  Beginning with version 0.5.0, Skald does not send usage analytics or crash diagnostics
ok  It does not initialize Amplitude or Sentry, create an Analytics ID, or operate a telemetry upload queue
ok  Advertising attribution
ok  facebook-core 18.3.0
ok  SKAdNetwork is the only iOS attribution mechanism
ok  The iOS app sends no data to Meta
ok  Attribution has no in-app opt-out
ok  https://delivery.mannamila.com
ok  processes the network IP transiently to enforce per-IP rate limits
ok  no unresolved placeholders
ok  no 0.4.1 claim
```

Including the marker that currently fails the gate by design:
`Skald is offered in the United States, Canada, Australia, and New Zealand.`

### Partial run of `verify-site.mjs`

`verify-site.mjs` hard-fails at line 88 without the access word:

```
Error: Set SKALD_MOSAIC_PASSWORD so Chrome can verify the encrypted mosaic before promotion.
```

To get real coverage of the assertions this change touches, the repo was copied to a
scratch directory, the four encrypted mosaic artifacts were removed there
(`skald/mosaic/mosaic-config.json`, `skald/mosaic/assets/*.enc`), and the verifier was
run with the documented development override. **Nothing in the real working tree was
modified.**

```sh
SKALD_ALLOW_MISSING_MOSAIC=1 node skald/verify-site.mjs   # in the scratch copy
```

It executed every static assertion — including all privacy-page assertions, which live
at lines 578–605, well before the first subprocess at line 689 — and then failed inside
`verify-feedback-render.mjs` on `/Pieter Lastman/`, i.e. only because the synthetic
fallback fixture replaces the real artwork catalog. With that one subprocess stubbed in
the scratch copy, the remainder ran clean:

```
Skald mosaic encryption tests passed.
MannaMila analytics-retirement contract tests passed.
Skald site verification passed.
```

**`test-promote-skald.mjs` cannot be validated at all without the real bundle.** An
unmodified-`HEAD` control copy was run as a check, and it fails too — at
`test-promote-skald.mjs:116`, `ENOENT … mosaic/mosaic-config.json`. So its absence from
the results table is an environment gap, not a regression from this change.
`scripts/test-encrypt-skald-mosaic.mjs` was confirmed deterministic (3/3 exit 0) in both
the modified and control copies.

**What remains genuinely unverified:** the real-ciphertext mosaic decrypt path, the
Chrome-rendered feedback regression against the real catalog, and the end-to-end
promotion manifest. None of these are touched by this change, but none were observed
green either.

---

## 4. Deploy PR

**Not opened.** No branch, commit, or file was created in
`/Volumes/Dev/Code/skald-web` or pushed to `MannaMila/skald-web`. The deploy repo is
untouched and still sits on the stale local branch `fix/mosaic-checkerboard-20260729`
(its remote is gone; `origin/main` is at `1ed7560`, and `.skald-source.json` records
source commit `34ec7d6`).

### Exact commands to finish (owner)

```sh
# 1. Access word, entered without echoing
read -s SKALD_MOSAIC_PASSWORD
export SKALD_MOSAIC_PASSWORD

# 2. Full source verification — both must pass before promotion
cd /Volumes/Dev/Code/mannamila-web
git log --oneline -1                      # expect 70b0787
node skald/verify-site.mjs
node scripts/test-promote-skald.mjs
node scripts/test-analytics-contract.mjs

# 3. Clean deploy checkout on a fresh branch
cd /Volumes/Dev/Code/skald-web
git checkout main && git pull --ff-only origin main
git checkout -b feat/privacy-policy-0.5.0

# 4. Promotion: dry-run -> apply -> check
cd /Volumes/Dev/Code/mannamila-web
node scripts/promote-skald.mjs --target ../skald-web --dry-run
node scripts/promote-skald.mjs --target ../skald-web --apply
node scripts/promote-skald.mjs --target ../skald-web --check

# 5. File SHA parity evidence for the PR body
shasum -a 256 /Volumes/Dev/Code/mannamila-web/skald/privacy/index.html \
              /Volumes/Dev/Code/skald-web/privacy/index.html
# both must be 1ab5e7bc4126974d1bed426ac5c236e35b3274e3c7d5980fbce6bb7a2167fd03
node -e 'const m=require("/Volumes/Dev/Code/skald-web/.skald-source.json");
  console.log("sourceCommit:", m.sourceCommit, "dirty:", m.sourceTreeDirty);
  console.log("privacy/index.html:", m.files["privacy/index.html"]);'
# expect sourceCommit 70b0787…, sourceTreeDirty false, and the same sha256

unset SKALD_MOSAIC_PASSWORD

# 6. Open the deploy PR — DO NOT MERGE, the owner merges it
cd /Volumes/Dev/Code/skald-web
git add -A && git commit -m "feat(web): publish the 0.5.0 privacy policy"
git push -u origin feat/privacy-policy-0.5.0
gh pr create --repo MannaMila/skald-web --base main \
  --title "feat(web): publish the 0.5.0 privacy policy" \
  --body "Promoted from mannamila-web@70b0787 …"   # paste the evidence from steps 4–5
```

---

## 5. Post-merge verification (re-runnable)

GitHub Pages serves the merge; allow a minute for the deploy before running these.

```sh
# A. App-repo gate — currently fails by design, must PASS after the merge
cd /Volumes/Dev/Code/skald-integration          # integration worktree, feature/phase1-remote-attribution-entitlement
scripts/verify_hosted_privacy_policy.sh
# expect: Verified public privacy policy at https://skald.mannamila.com/privacy/
# it currently exits 1 with:
#   Hosted privacy policy is missing required content: Skald is offered in the
#   United States, Canada, Australia, and New Zealand. Publish the hosted policy
#   first, then rerun this gate.

# B. Live page carries the 0.5.0 claim and no 0.4.1 claim
curl -s https://skald.mannamila.com/privacy/ \
  | grep -c 'Beginning with version 0.5.0, Skald does not send usage analytics or crash diagnostics'
# expect 1

curl -s https://skald.mannamila.com/privacy/ | grep -c '0\.4\.1'
# expect 0   (grep -c prints 0 and exits 1; the 0 is the result)

# C. Live fidelity re-check against the arbitrated markdown
curl -s https://skald.mannamila.com/privacy/ > /tmp/live-privacy.html
node <scratchpad>/fidelity.mjs \
  /Volumes/Dev/Code/skald-integration/docs/legal/privacy-policy.md /tmp/live-privacy.html /tmp
# expect: markdown blocks: 95   html blocks: 95   differing: 0

# D. Last updated date is live
curl -s https://skald.mannamila.com/privacy/ | grep -o 'Last updated:</strong> [0-9-]*'
# expect: Last updated:</strong> 2026-08-01
```

---

## 6. Follow-up outside this scope

`skald/index.html:215` still reads *"Skald 0.4.1 does not send usage analytics or crash
diagnostics."* Once this policy publishes, the landing page and the privacy policy will
name different versions on the same site, and the landing page will be describing a
build that never shipped. It was left alone deliberately: it is marketing copy, not
policy body, and its replacement wording has not been through the three-agent content
review. `skald/verify-site.mjs:589` still pins the 0.4.1 sentence for `index.html`, so
that assertion must be updated in the same change that rewords the copy.

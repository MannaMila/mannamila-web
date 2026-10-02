# Landing page and /get/ corrections for 0.7.10 (evidence)

Final copy approved by a three-role content review on 2026-10-02, on the owner's "Yes to landing
page corrections". The authority is `reviews/FINAL-ARBITRATION.md`; its final string table is
applied exactly.

## What is where

- `reviews/` — `accuracy.md`, `clarity.md`, `FINAL-ARBITRATION.md`.
- `skald/docs/landing-2026-10-02/` — `review-registry.json` and `resolved-index.html` (a byte copy
  of the final `skald/index.html`), read by `skald/verify-landing-copy.py`.
- `CANDIDATE.md`, `INVENTORY.md` — the review input and the first inventory, both superseded.
- `final-parity-report.json` (`tools/final-parity.py`) — 31 table rows: every FINAL string is in
  the built file, no LIVE string remains; the four files hash to the arbitration's expected hashes.
- `link-check.json` (`tools/link-check.py`) — 20 distinct hrefs on `/` and `/get/`, all 200 (or a
  present anchor). `./translations/` exists only in the deploy mirror, not in this source.
- `visual-report.json` (`tools/shots.mjs`, installed Chrome) and screenshots at 390 and 1280 px:
  `landing-*-top.png`, `landing-*-totals.png`, `landing-*-faq.png` (the availability answer centred,
  clear of the sticky header), `landing-*-final-cta.png`, `get-*.png`. No horizontal overflow.
- `social-card-before.jpg`, `social-card-after.jpg`, `og-render/` — the card and its generator edit.

## Final hashes

| File | sha256 |
| --- | --- |
| `skald/index.html` | `a48fec9daa94f738408d3d8ab240039d2daf07ba5c34fe049c9f64e9bc30a132` |
| `skald/app.js` | `c07ce27bbe0476577ea8dfad7490732f15d32b859ef75f0866acc020efd5c899` |
| `skald/get/index.html` | `09ced3b5ec6f4eb5c9dd6978832358266096a64e94dc74c8ba2a13318d7d2434` |
| `skald/availability.json` | `c9ac00c32be7719b97a43cf8f3ebd6ea308c0125aed580936bb16e551cb52559` |
| `skald/assets/skald-odyssey-og-20261002.jpg` | `636ec5cfdb95771d213beece3906696a85192cba1ed85a9eba13007c693f4415` |

All four match the arbitration's "Expected hashes".

## The Google-approval switch patch is gone

`google-approval-switch.patch` was deleted. Google published the 27 EU countries on 2026-10-02, so
the arbitration's rows 18 and 22 put the one-sentence, both-stores wording straight into the pages
(with a serial comma the patch lacked). There is nothing left to switch.

## Registry session ids

No real session identifiers were available to the site lane. Each `sessionId` in the registry is
the role name plus the first 16 hex characters of that role's review file sha256. They are
distinct labels, not harness session ids; the registry says so in `sessionIdNote`.

## Verifiers

- `python3 skald/verify-landing-copy.py`: PASS. It now reads `docs/landing-2026-10-02`, checks the
  supersession chain 2026-10-02 → 2026-09-15 → 2026-09-13, and asserts the page and `app.js` do
  **not** contain "next update", "coming in version", "Preview the next" and three related
  phrases. One approved exception is bound in the registry: the email sign-up heading "Hear about
  the next update.", which must appear exactly once.
- `node scripts/test-analytics-contract.mjs`: still fails, on the same cause as `origin/main`:
  archived `resolved-index.html` copies under `skald/docs/` are byte copies of the landing page
  and cannot carry the `../../retire-analytics.js` path. The test stops at the first such file,
  which is now `skald/docs/landing-2026-10-02/resolved-index.html` (it sorts before the 2026-09-13
  one named on `origin/main`). With the archived copies excluded the whole contract passes.
- `node skald/verify-site.mjs`: not runnable without the mosaic password; with a dummy value it
  stops at `index.html must include: One Odyssey.`, stale on `origin/main`. Its pins for the App
  Store URL, the country string, the map alt and the `og:image` were moved to the final strings.

## Known stale, accepted by the arbitration

- `assets/museum-guide.webp` shows a note the app has since corrected ("embossed shield"; 0.7.10
  reads "fluted bronze basin"). Recapture owed, first in the queue.
- All four screenshots and the card's screenshot were captured on 0.7.0; recorded in the registry
  (`websiteAssetSourceCaptures.captureVersion`) now that the alts no longer say it.
- The old card `assets/skald-odyssey-og-070.jpg` stays served; the unused `.release-preview` CSS rule stays.

## Deploy mirror

`robots.txt` exists only in skald-web; `Disallow: /docs/` is added there. The registry folder is
not copied to skald-web, so no new archived copy is served.

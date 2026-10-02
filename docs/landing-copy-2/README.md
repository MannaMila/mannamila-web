# Landing page: copy round 2 and the 0.7.10 screenshots (evidence)

One change, on the owner's "Do the updated screenshots and copy edits on the site." The copy was
approved by a three-role content review on 2026-10-02 (`reviews/FINAL-ARBITRATION.md`); the four
screenshots were recaptured on tag `v0.7.10` by a capture lane and checked by the root against the
old images and their alt texts, which do not change.

## Hashes

| | sha256 |
| --- | --- |
| `skald/index.html` with the five copy rows only (commit "apply the arbiter's final copy") | `b9681609f43ef1d41ea9d90f61e81c0d72de70008761c794552d34e8034f8520`, the arbitration's expected hash |
| `skald/index.html` final (copy rows + image cache key `?v=0710-20261002`) | `1e424a1b1d423f31f822c33b397da66968bab0abbb320cb9070cdfb375b244e4` |
| `skald/assets/reader-art.webp` (1320×2868) | `fec771681dd17b61f02a934d1e3a27f93533dc24032a8b8cba65441ce5bfa102` |
| `skald/assets/greek-split.webp` (2752×2064) | `4a3820095ba0bfd13ec7b1f7e904f89f9b74842ac85a552cc5806af8ea67aa89` |
| `skald/assets/nostos-route.webp` (1920×1080) | `84cfa9dcc8c9de1ae036c07a409de496ef129f54e8ea7df132232bfc36546765` |
| `skald/assets/museum-guide.webp` (2752×2064) | `b81aa9155197d374e708505d2440fe646d3bedecc8c819144e0fd5c8e5f5d0e0` |

`app.js`, `get/index.html`, `availability.json`, `styles.css` and the social card are unchanged.
Pixel sizes were read with `webpinfo`; they equal the old files' and the `width`/`height` attributes.

## Where the four images are referenced

Only `skald/index.html` (four `<img src>`; no `srcset`, no CSS, no `app.js`, not `/get/`). In the
deploy mirror the stale `.skald-source.json` manifest also lists them; no other page does.

## Screenshots

`screenshots-0.7.10/PROVENANCE.md` (the capture lane's record) and the four
`*--old-left-new-right.png` comparisons. The raw source PNGs (8.4 MB) are not committed; their
sha256 are in PROVENANCE.md and the registry.

Accepted differences, recorded in the registry: the map image is an iPad capture cropped to 16:9
(the old one was an Android tablet capture); the margin mark reads "NOTE" where the old captures
read "RARE WORD"; the museum sheet's backdrop is opaque. The stale museum image accepted this
morning is resolved: the note reads "fluted bronze basin". The social card
`skald-odyssey-og-20261002.jpg` keeps its 0.7.0 screenshot.

## Checks

- `python3 skald/verify-landing-copy.py`: PASS, reading `skald/docs/landing-2026-10-02-copy-2/`
  (chain: copy-2 → landing-2026-10-02 → 2026-09-15 → 2026-09-13; the forbidden preview wording
  and its one allowed heading are kept). Session ids are built as this morning: role name plus the
  first 16 hex characters of the review file's sha256.
- `final-parity-report.json`: the 6 FINAL strings (5 rows; C1 is a question and an answer) are on
  the page; the 3 replaced sentences and 7 other retired strings are gone; "word card" ×3,
  "a Homeric dictionary" ×1, "glossary" and "lexicon" ×0; the live figures are all still present.
- `link-check.json`: 20 distinct hrefs on `/` and `/get/`, all OK.
- `visual-report.json` (installed Chrome, 390 and 1280 px): each of the four images is served with
  `?v=0710-20261002` and its bytes hash to the capture lane's file; each rendered box equals the
  live page's box (no layout shift); no horizontal overflow; the longer language answer does not
  overflow at 390 px. Screenshots: `landing-*-hero.png`, `landing-390-hero-image.png`,
  `landing-*-greek-split.png`, `landing-*-nostos-route.png`, `landing-*-museum-guide.png`,
  `landing-*-translations-copy.png`, `landing-*-offline-list.png`, `landing-*-faq-language.png`,
  `landing-*-faq-greek.png`.
- `node scripts/test-analytics-contract.mjs`: the known archived-copy failure only (it now names
  the newest `resolved-index.html`); with archived copies excluded the contract passes.
- `node skald/verify-site.mjs`: not runnable without the mosaic password; stops at the stale
  `One Odyssey.` assertion. Its map-image cache-key pin was moved.

The registry folder is not mirrored to skald-web.

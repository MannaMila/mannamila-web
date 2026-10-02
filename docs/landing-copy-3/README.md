# Landing page, round 3: share card and the "Find your bearings." sentence (evidence)

Three-role content review on 2026-10-02 (`reviews/`), on the owner's "Refresh the … share card.
Tastefully remove look up person".

## What is published

- **Sentence** (`/`, "Find your bearings."): "Follow the voyage on the map and see what happens to
  the fleet." replaces "Follow the voyage on the map, see what happens to the fleet, and look up a
  person or place when you need a reminder."
  This is **option A, the arbiter's pre-approved fallback** (`FINAL-ARBITRATION.md`, "For the
  root", item 4), **chosen by the root** because it is true without exception: the arbiter's
  primary sentence says the map marks the place the story has reached, which the arbiter itself
  found is not true at the opening of Books XXI and XXII. "Tap a stop/place" is not approved: the
  app's map tap handler opens the first stop in route order within 56 px, not the nearest (an app
  bug, to be fixed in the app).
- **Share card:** `skald/assets/skald-odyssey-og-0710.jpg` (sha256
  `954314a111821dfba4bba607021830a605f72036c0e109b083e06d4a337f03df`, 1200×630; the candidate's
  `-20261003.jpg` renamed, same bytes), referenced by `og:image` and `twitter:image` as
  `…/skald-odyssey-og-0710.jpg?v=20261002`. Alts unchanged. The two older cards
  (`-070.jpg`, `-20261002.jpg`) stay in place. `share-card-before.jpg`, `share-card-after.jpg`.
- Final `skald/index.html`: `dbdecdde678d720a3b4542e5acb98340d2a498ca49a2c71001245a6751404d40`,
  the hash the arbitration gives for option A with these card URLs.

## Checks

- `python3 skald/verify-landing-copy.py`: PASS, reading `skald/docs/landing-2026-10-02-copy-3/`
  (chain copy-3 → copy-2 → landing-2026-10-02 → 2026-09-15 → 2026-09-13). "look up a person or
  place", "tap a stop" and "tap a place" are now forbidden strings.
- `final-checks.json` (`tools/final-checks.py`): the final sentence is on the page once; the live
  sentence, "tap a stop", "tap a place" and the old card references are gone from `index.html`,
  `app.js` and `/get/`; the page's `og:image` path returns 200 from a local static server with a
  1200×630 JPEG whose bytes equal the generated file; `twitter:image` is the same URL. The live
  URL cannot be fetched until the deploy PR is merged.
- `link-check.json`: 20 distinct hrefs on `/` and `/get/`, all OK.
- `landing-390-journey.png`, `landing-1280-journey.png` (`visual-report.json`): no horizontal overflow.
- `node scripts/test-analytics-contract.mjs`: only the known archived-copy failure.
- Not run: `verify-site.mjs` beyond its stale first assertion, `test-promote-skald.mjs` (mosaic password).

Session ids in the registry are the role name plus the review file's sha256 prefix, as in the two
earlier registries of the day. The registry folder is not mirrored to skald-web.

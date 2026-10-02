# Landing page, round 3: share card refresh and "look up a person or place" (candidate)

**Status: CANDIDATE. Not approved copy, not published.** On the owner's "Refresh the … share
card. Tastefully remove look up person". Baseline `origin/main` `1bd5d33`; live `/` sha256
`1e424a1b…44e4`.

## Candidate files

| File | sha256 | Changed |
| --- | --- | --- |
| `skald/index.html` | `53967dcaae5e6a7f3d2784e1cabee7fc18fd03bc3593c673cda5aa3c7b2297e9` | yes |
| `skald/assets/skald-odyssey-og-20261003.jpg` (new, 1200×630, 150,151 bytes) | `954314a111821dfba4bba607021830a605f72036c0e109b083e06d4a337f03df` | new |
| `skald/get/index.html` | `09ced3b5ec6f4eb5c9dd6978832358266096a64e94dc74c8ba2a13318d7d2434` | no |
| `skald/app.js` | `c07ce27bbe0476577ea8dfad7490732f15d32b859ef75f0866acc020efd5c899` | no |

## 1. "look up a person or place"

### Where the claim is

One sentence, on `/`, section "Find your bearings." (`index.html:184`):

> Follow the voyage on the map, see what happens to the fleet, and **look up a person or place
> when you need a reminder.**

Nothing else on `/` or `/get/` implies a searchable list of people or places ("Find your place"
is a retelling depth; "find your place without a connection" is about your reading position;
`/get/` has no such wording). `app.js` does not write this paragraph. Off the site, the store
description has the same phrase ("look up people and places as you go"); it is not touched here.

Why it goes: the 2026-10-02 round-2 arbitration found "no reader-visible glossary, list of people
and places, or index in 0.7.10" (ruling 4; "For the owner", item 3).

### Options

| | Sentence | Kind |
| --- | --- | --- |
| A | Follow the voyage on the map and see what happens to the fleet. | delete the clause |
| **B (recommended, applied)** | Follow the voyage on the map, tap a stop to read about the place, and see what happens to the fleet. | replace the clause with what the map gives |
| C | Follow the voyage on the map, see what happens to the fleet, and open a note on a person or place when you need a reminder. | the round-2 arbiter's suggested wording |

**Why B.** It keeps the three-beat sentence and the promise about places, and what it promises is
on screen in the picture beside it (the Ithaca card next to the map). A is true and finished but
drops places altogether. C is true of the notes, but "when you need a reminder" still suggests
something to consult on demand, whereas notes sit at their passages; and the next sentence already
says "Open a map or note".

### Evidence for what B asserts (app tag `v0.7.10`, `/Volumes/Dev/Code/skald-prod`)

- **The voyage map:** `feature/reader/src/commonMain/kotlin/com/skald/feature/reader/sidecar/books/odyssey/NostosRouteMapPanel.kt`
  (the route on a Mediterranean basemap; controls "Find me", "Whole map", lines 432 and 436).
- **Tap a stop to read about the place:** `…/sidecar/books/odyssey/NostosDossier.kt:66`, "The
  tapped-stop dossier: the modern place-name, a zoom-to-the-real-place inset, the note, the 'Where
  was it, really?' identification debate, and an optional photo of the site today — or an
  invitation to tap when nothing is selected." The recaptured `assets/nostos-route.webp` shows it
  for Ithaca. "Stop" is the code's word (`NostosStop`); **reviewers:** "tap a place" is the
  plainer alternative if "stop" reads oddly.
- **The fleet:** `…/sidecar/books/odyssey/FleetStatusPanel.kt:43`, 'Odyssey "The Fleet" — where
  the voyage stands in ships and men'; opened from a note ("Open the fleet",
  `ScholiaPanelNotePopover.kt:93`).

Not verified: the app running on a device; the labels were read from source.

### The section after the change

```text
Follow the journey
## Find your bearings.
Follow the voyage on the map, tap a stop to read about the place, and see what happens to the fleet.
Open a map or note, spend a little time with it, and return to your passage.
[Image: Skald voyage map with locations from the Odyssey.]
Trace the long route toward home without leaving the reader.
```

## 2. Share card

**Which screenshot the card holds.** Not the iPhone reader scene: the generator composites the
iPad capture `03-parallel.png` (the Greek beside Butler's English), the same scene as
`assets/greek-split.webp`. So the new input is the 0.7.10 iPad capture
`source/greek-split__ios-ipad-03-parallel.png` from the capture lane (2064×2752 with EXIF
orientation 8, sha256 `2ac6013a98174ecec7e82f652964f1a8c310d2d15184e7af9cdfe3f6070b265b`; see
`docs/landing-copy-2/screenshots-0.7.10/PROVENANCE.md`), a drop-in for the old file.

**How it was made.** The generator archived at
`skald-handoff-archive/skald-opus-20260915/web-candidate/og-render/`, with the two edited files
committed in `docs/landing-facts-0.7.10/og-render/` (`og.html`, `og-render.mjs`), unchanged. Before
swapping the input it was re-run with the old screenshot and reproduced the published
`skald-odyssey-og-20261002.jpg` byte for byte (`636ec5cf…`). Then only `03-parallel.png` was
replaced; PNG render in installed Chrome, then `sips -s format jpeg -s formatOptions 90`.

**What changed in the card** (`share-card-before.jpg`, `share-card-after.jpg`): only the
screenshot's pixels. Layout, fonts and drawn text are the same: "Skald: Odyssey" and "Spend some
time with the Odyssey." Both are still true; no figure or version is drawn. Inside the screenshot:
the date reads "Fri Oct 2" (was "Sun Sep 13"), the margin mark reads "NOTE" (was "RARE WORD"), the
paragraph wraps one word differently.

**Alt text** (`og:image:alt`, `twitter:image:alt`): "Skald on iPad, with the Ancient Greek beside
an English translation." Checked against the new image: iPad, Butler's English on the left, the
Greek on the right. Still true; unchanged.

**References.** `og:image` and `twitter:image` →
`https://skald.mannamila.com/assets/skald-odyssey-og-20261003.jpg?v=20261003`. The file name
follows the coordinator's instruction; the machine's local date at generation was 2026-10-02.
The two older cards (`-070.jpg`, `-20261002.jpg`) stay in `assets/` for links already shared;
`verify-site.mjs` requires both and now also the new one, and its `og:image` pin is moved. No
verifier forbids the older files.

## Checks

- `python3 skald/verify-landing-copy.py` **fails on this branch by design** (the page hash and the
  `og_and_twitter_image_url` binding are pinned to the copy-2 registry). After arbitration: a new
  registry folder superseding `skald/docs/landing-2026-10-02-copy-2`, with the new card's hash,
  its source capture (0.7.10) and the new URL binding.
- Screenshots at 390 and 1280 px of the changed paragraph: `landing-390-journey.png`,
  `landing-1280-journey.png` (`visual-report.json`: no horizontal overflow).
- No skald-web change yet.

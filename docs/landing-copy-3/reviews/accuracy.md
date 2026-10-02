# Landing copy round 3: accuracy review (Reviewer 1)

- **Role:** Reviewer 1 of 3: textual accuracy and claims. Independent of Reviewer 2 (`clarity.md` not read).
- **Model:** `claude-opus-5-5` (Claude Opus 5.5). **Effort:** high. **Date:** 2026-10-02.
- **Input:** `docs/landing-copy-3/CANDIDATE.md` sha256 `69bd6a2a10abcf48e3c2b39e404844aab1262ac1422f7b13e116e63ebd6fad80`.
  Candidate `skald/index.html` `53967dca…97e9` and card `skald/assets/skald-odyssey-og-20261003.jpg` `954314a1…03df` match the table in CANDIDATE.md.
- **Evidence:** app tag `v0.7.10` (`9a781e27e`) in `/Volumes/Dev/Code/skald-prod`, read with `git show` / `git grep`. All app paths below are under
  `feature/reader/src/commonMain/kotlin/com/skald/feature/reader/` unless a full path is given; they are `commonMain`, so they hold for Android and iOS.
- **Method limits:** source and bundled content only. Nothing was run on a device or simulator by me. The one runtime record I relied on is the capture lane's
  `docs/landing-copy-2/screenshots-0.7.10/PROVENANCE.md` (iOS simulator, Release 0.7.10).

## Verdict: APPROVE_WITH_EDITS

| Option | True as written? |
| --- | --- |
| A | **Yes.** Nothing in it depends on an untested interaction. |
| B (applied) | **Yes in substance, with one risk (LE-02).** Every stop has a card with text about the place, and a tap handler selects stops. By the code, a tap on the dot of a clustered stop can open a neighbouring place's card. Not checked on a device. |
| C | **Not as written.** Notes on people and places exist, but "when you need a reminder" is not supported (LE-05). |

No blocker. One major (LE-02), which applies only to B.

## Answers to the seven checks

1. **Voyage map, and how it is reached.** The map exists: `sidecar/books/odyssey/NostosRouteMapPanel.kt:62-71`; panel `odyssey-nostos-route-map`, on-screen title "Nostos Route Map"
   (`core/src/main/assets/content/odyssey/panels.json:673-676`). It marks stops Travelled / Where we are / Still ahead by the book being read (`:501-533`, `:618-629`) and says
   "the marked place is where the story stands now; the solid line is the sea already crossed" (`:294`). So "Follow the voyage on the map" is true.
   Reached only through notes: the panels' `tab` trigger is no longer consumed (only `Anchor` is, `ReaderScreen.kt:1487`; `core/.../model/Panels.kt:50`). A voyage note's card carries "Open the route"
   (`ScholiaPanelNotePopover.kt:92`); 8 of the 47 voyage notes have no text and open the map directly (`ReaderScholiaSurfaceController.kt:152-163`). Every one of the 24 books has 1 to 3 voyage notes.
   The reader can also get there on demand in any unlocked book: the Σ button, "Notes about this book", lists every note for the open edition with a Kind filter (`ScholiaBookNotes.kt:52`, `:93-96`, `:186-190`;
   shown whenever notes are on and the book is unlocked, `ReaderModeControls.kt:134-140`). The capture lane reached the map this way in Story mode. This matches the update post's wording.
2. **"tap a stop to read about the place".** Tapping selects a stop (`NostosRouteMapPanel.kt:179`; hit test `sidecar/primitives/RouteMapPane.kt:222-231`) and the card shows its name, modern name, a note,
   "WHERE WAS IT, REALLY?" with ranked identifications, and a site photo (`NostosDossier.kt:106-154`). Content: all 18 Mediterranean stops have a note, a modern name and at least one identification; 17 have a photo
   (none for the Entrance to Hades). The 6 Ithaca sites and 8 palace features also have notes. So a card exists for every stop. The notes mostly say what happens there; the modern name and the identifications are what is "about the place".
   **On-screen word:** the app never says "stop". It says "place": "Tap a place to read where it sits between memory and the open sea." (`NostosDossier.kt:87`) and "the marked place" (`NostosRouteMapPanel.kt:294`).
   **Free books:** yes. Books I, II and IX are free (`core/.../entitlement/TrialPolicy.kt:38`); each has 2 voyage and 2 fleet notes; the panel is gated only by `sidecarEnabled && !locked` (`ReaderScreen.kt:1329`),
   and the whole route with every card is shown regardless of book. **Tablet-only:** nothing. Wide or landscape windows put the card beside the map; narrow ones stack it under the map (`NostosRouteMapPanel.kt:188`, `:223-253`).
   The Ithaca and palace scales appear from Books XIII and XXI (`NostosScales.kt:24-26`), which is by book, not by device.
   See LE-02 for the tap-precision risk.
3. **"see what happens to the fleet".** True. "The Fleet" panel (`sidecar/books/odyssey/FleetStatusPanel.kt:42-50`): a ship count out of twelve, the men remaining, the event and its line citation for the current book (`:150`, `:161-187`),
   a book-by-book timeline "THE VOYAGE — TAP A BOOK" and "THE NAMED CREW" with each man's fate (`FleetTimeline.kt:72`, `:174`). 12 stages from Book I to XXIII in `panels.json` (from `:2048`).
   Opened from a fleet note, "Open the fleet" (`ScholiaPanelNotePopover.kt:93`). 40 fleet notes; Books XV and XVI have none, so the fleet cannot be opened from inside those two books. That does not make the sentence false.
4. **Option C.** Notes about people and places exist and can be opened: e.g. 11 of the 71 concepts are typed `person_place_named_group` (`content/odyssey/concepts.json`), and 304 notes carry the `geography` category.
   On demand, the reader can open the Σ list for the current book and filter by kind. But there is no kind, filter, search or index for a person or a place, the list is per book, and rows show only a line span and a title.
   There is no people-and-places glossary either (the legacy glossary is common-word vocabulary, `ReaderStateBuilder.kt:181-184`). A reader who has forgotten who someone is cannot count on finding a note about them. See LE-05.
5. **Surrounding paragraph and screenshot.** Consistent. `assets/nostos-route.webp` (`84cfa9dc…6765`, viewed) shows the map with "YOU ARE HERE / Ithaca" and the Ithaca card: "Ithaki, Ionian Islands", the note, "WHERE WAS IT, REALLY?",
   "historical · Ithaki · Ionian Sea, Greece", and a credited photo. That is exactly a place card with text about the place. Note that the card in the picture is the one the map opens with (the current place is selected by default,
   `NostosRouteMapPanel.kt:131-133`), not the result of a tap. "Open a map or note … and return to your passage" (`index.html:185`) holds: the map opens from a note and closing the panel returns to the reader.
   Caption and alt (`:189-191`) are true.
6. **Share card.** Viewed before and after. Pixel comparison of the two 1200×630 files: every differing pixel lies inside x 480–1135, y 64–575, the screenshot frame; the left text area (x < 450) and the top and bottom bands are identical (maximum channel difference 0).
   Drawn text "Skald: Odyssey" and "Spend some time with the Odyssey." is unchanged and true; no figure or version is drawn. The embedded screenshot matches the 0.7.10 `assets/greek-split.webp` scene (Butler 1900 on the left, Greek on the right, "Fri Oct 2", "NOTE" mark).
   `og:image` and `twitter:image` (`index.html:16`, `:23`) both point at `skald-odyssey-og-20261003.jpg?v=20261003`; the file is present with the stated hash; `verify-site.mjs:59`, `:201` updated to match.
   Alt text on both (`:19`, `:24`) is still accurate. See LE-04 for the file name.
   Not verifiable from this repo: the source capture `2ac6013a…` and the byte-for-byte reproduction of the previous card (the capture and the archived generator inputs are outside the branch).
7. **Other lookup or index wording.** None on `/` or `/get/`. `index.html:150`, `:154`, `:217`, `:233` use "place"/"people" in other senses. `:169` and `:292` describe the Greek word card and dictionary, which is true and is not a people-and-places lookup.
   `/get/` has no feature copy. `app.js` writes none of this. The store description's "look up people and places as you go" is outside this change and still needs its own fix.

## Findings

### LE-01 — minor — "stop" is not the app's word
- **Text:** "tap a stop to read about the place"
- **Evidence:** the app's own prompt is "Tap a place to read…" (`NostosDossier.kt:87`); the intro line says "the marked place" (`NostosRouteMapPanel.kt:294`). "Stop" appears only in code (`NostosStop`). Troy and Ithaca are also odd things to call stops.
- **Replacement:** "tap a place to read about it".

### LE-02 — major (B only; code-derived, needs a device check) — a tap on a clustered stop can open the neighbour's card
- **Text:** "tap a stop to read about the place"
- **Evidence:** `sidecar/primitives/RouteMapPane.kt:222-231` picks `stops.firstOrNull { distance <= 56.0 }`: the first stop in route order within 56 raw pixels of the tap, not the nearest. The radius is in the map's own unscaled pixels, so pinching in does not separate neighbours.
  With the 0.7.10 coordinates in `panels.json`, Pylos and Sparta are about 23 px apart on the 13-inch iPad map (the same spacing measured in the published capture). A tap on Sparta's dot is therefore also within range of Pylos, which comes first, and Pylos's card opens.
  Modelled result for a tap on the centre of each dot: on the iPad, 10 of the 17 dots open another place's card (Pylos, Sparta, Ismarus, Cape Malea, Aeolia, Sirens, Scylla & Charybdis, Thrinacia, Ogygia, Scheria); on a phone-width map it is 10 to 11, and Scylla & Charybdis has 0–2% of its tap area to itself.
  The second "Ithaca" entry (Book XIII) shares coordinates with the first and can never be chosen by tap; it shows only as the default card. No test exercises `onStopTap`.
  This is my reading of the code and a geometric model. I did not tap anything on a device, and the model's map widths for phones are estimates.
- **Why it matters for the copy:** B is the only option that tells readers to tap. If the model is right, a reader who follows the sentence will often get a card for a different place than the one tapped.
- **Replacement (pick one):**
  1. Option A as written.
  2. A places-keeping sentence that needs no tap, because the map opens with the current place's card already shown: "Follow the voyage on the map, read about the place the story has reached, and see what happens to the fleet."
  3. Keep B (with LE-01's wording) only after a device check on a phone and a tablet confirms that tapping Sparta, Pylos and Scylla & Charybdis opens the tapped place.
- **Separate from the copy:** the hit test should choose the nearest stop. That is an app fix, not part of this change.

### LE-03 — info — the map and fleet open only from notes
- **Text:** "Follow the voyage on the map" / "Open a map or note" (`index.html:184-185`)
- **Evidence:** check 1. Both are true; a reader gets to the map from a voyage note or from Σ, and Books XV–XVI have no fleet note. No change needed. "Open a note or the map" would be marginally closer to the order of events; optional.

### LE-04 — minor — card file name is dated a day ahead
- **Text:** `skald-odyssey-og-20261003.jpg?v=20261003`
- **Evidence:** generated on 2026-10-02 (CANDIDATE.md "References"; the embedded screenshot reads "Fri Oct 2"). Not reader-visible and not a claim.
- **Replacement:** none required. Record in the new registry that the name is a version label and the generation date is 2026-10-02, so the two are not later read as a discrepancy.

### LE-05 — major (C only) — "when you need a reminder" still promises a lookup
- **Text:** "open a note on a person or place when you need a reminder"
- **Evidence:** check 4. Notes on people and places exist, and Σ opens the current book's notes on demand, but nothing lets a reader find the note for a given person or place, and there may be none.
- **Replacement:** do not use C. If a notes clause is wanted, drop the conditional: "…and read notes on the people and places as you meet them."

## Not verified
- Anything at run time: tapping stops, the map on a phone, the panel in a free book on a store build. Source and content only.
- The live remote configuration. The `sidecar` gate defaults on but is remotely overridable (`core/.../flags/FeatureGate.kt:12`, `:21`); if it were switched off, neither panel would open.
- The share card's source capture hash and the byte-for-byte regeneration claim.
- The live page hash and the store description text quoted in CANDIDATE.md.

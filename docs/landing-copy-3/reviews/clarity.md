# Landing copy 3 — Reviewer 2 (reader usefulness, clarity)

- **Role:** Reviewer 2 of 3: reader usefulness, clarity. Independent; Reviewer 1's file not read.
- **Model:** `claude-opus-5-5`
- **Effort:** high
- **Date:** 2026-10-02
- **Input:** `docs/landing-copy-3/CANDIDATE.md` sha256
  `69bd6a2a10abcf48e3c2b39e404844aab1262ac1422f7b13e116e63ebd6fad80`
- **Also read:** `skald/index.html` (sha256 `53967dca…97e9`, matches CANDIDATE) lines 92–226;
  `landing-390-journey.png`, `landing-1280-journey.png`; `skald/assets/nostos-route.webp` at full
  size; `share-card-before.jpg`, `share-card-after.jpg` (after = the shipped asset, `954314a1…`),
  also viewed scaled to 400 px and 240 px wide. App wording read from source at tag `v0.7.10`; not
  run on a device.

## Verdict: APPROVE_WITH_EDITS

B is the right option. One word should change: "stop" → "place" (LF-01). The share card is fine.

**Best:** Follow the voyage on the map, tap a place to read about it, and see what happens to the
fleet.

**Fallback:** Follow the voyage on the map and see what happens to the fleet. (Option A)

## Findings

### LF-01 — MEDIUM — "tap a stop to read about the place"

**Text:** "Follow the voyage on the map, tap a stop to read about the place, and see what happens
to the fleet."

**Why.** "Stop" is the code's word, not the reader's. Nothing a visitor sees says "stop":

- the page's image alt says "locations";
- the screenshot beside the sentence says "the marked place is where the story stands now";
- the app's own prompt on that panel is "Tap a place to read where it sits between memory and the
  open sea." (`NostosDossier.kt:87` at `v0.7.10`).

For a reader with English as a second language "a stop" can be read as a button (stop/pause) before
it is read as a port of call, and the sentence then names the same thing twice with two nouns
("a stop … the place"), which suggests two different things. At 390 px the screenshot's labels are
not readable, so the sentence has to make sense alone. Some marked places are also not stops on
Odysseus's voyage (Sparta, Pylos), so "place" is the more accurate word as well.

"Landfall" is rarer still and appears nowhere on the page or in the app; do not use it.

"Place" does not collide with the page's other uses ("Find your place", "find your place without
a connection"): after "on the map" it can only mean a place on the map. "Tap" matches the section
above ("Tap a Greek word to open its word card").

**Replacement:** "Follow the voyage on the map, tap a place to read about it, and see what happens
to the fleet."

### LF-02 — INFO — choice of option and clause order

- **A** is true and finished, but thin: two beats under a large heading, and the picture beside it
  shows a place card the text no longer mentions. Good fallback, not the best.
- **C** keeps the problem. "Open a note on a person or place when you need a reminder" still reads
  as something to consult on demand, and a visitor will look for where to open it. It also repeats
  the next sentence ("Open a map or note").
- **B** promises exactly what the picture shows, and keeps the three-beat rhythm that the next
  sentence also has.

Order: keep B's (map, place, fleet). The tap belongs to the map, so it must sit next to it; in
(map, fleet, place) a reader could take the place to be part of the fleet view. No change.

### LF-03 — LOW — "when you need a reminder" and the heading's point

Dropping the clause weakens the orientation idea a little but does not lose it. "Find your
bearings." is still carried by the map itself and by "return to your passage" in the next sentence.
The dropped clause was specifically about recalling people and places on demand, which is the thing
the app does not offer, so it should go rather than be reworded.

If the arbiter wants the point back in words, the truthful version is about the map marking the
reader's position, which the screenshot shows ("YOU ARE HERE", "Where we are"):

> See where you are on the voyage map, tap a place to read about it, and follow what happens to
> the fleet.

This is optional and a larger change than the owner asked for. It adds one claim for Reviewer 1 or
the arbiter to confirm: that the marker follows the book being read (source: "The marked place is
where the story stands now", `NostosRouteMapPanel.kt:296`; not checked on a device).

### LF-04 — LOW — heading, caption, alt beside the sentence

- Heading "Find your bearings.": fits. No change.
- Caption "Trace the long route toward home without leaving the reader.": fits. Eyebrow, sentence
  and caption all say "follow the route" in different words; already so on the live page.
- Alt "Skald voyage map with locations from the Odyssey.": true, but it does not mention the place
  card that the sentence now points to, and it uses a third word ("locations").

**Replacement (optional, alt only):** "Skald voyage map with places from the Odyssey, and a note
about Ithaca open beside it."

### LF-05 — INFO — share card

- **As a link preview:** right. 1200×630, the 1.91:1 shape that large previews use. At 400 px and
  240 px wide the title "Skald: Odyssey" and the line "Spend some time with the Odyssey." stay
  readable; the screenshot reads as "a book page with Greek beside it and a painting", which is all
  it needs to do at that size. Text column and screenshot are balanced; the screenshot sits fully
  inside the frame with margin on the right and bottom.
- **Nothing new is cut off.** The painting runs off the bottom of the screenshot, as it did before;
  it reads as the page continuing.
- **Before vs after:** no visible difference at preview size. The changes (date, "NOTE" for "RARE
  WORD", one line wrap) are only visible at full size and none is a problem.
- **Square crops:** apps that crop the preview to a centred square will cut into the title. Same as
  the current card; not caused by this change.
- **Alt text** "Skald on iPad, with the Ancient Greek beside an English translation.": accurate and
  the right length. The words drawn on the card are already in `og:title`, so the alt need not
  repeat them. No change.

## Summary for the arbiter

| Item | Decision |
| --- | --- |
| Sentence | B with "tap a place to read about it" (LF-01) |
| Fallback | Option A |
| Heading, caption | Keep |
| Image alt | Optional edit (LF-04) |
| Share card and its alt | Approve as is |

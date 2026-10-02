# Landing page, round 3 (one sentence and the share card): final arbitration

- **Role:** Reviewer 3 of three, the arbiter: compares both reviews, resolves disagreements, makes
  the final content decision.
- **Model:** Claude Opus 5.5 (`claude-opus-5-5`)
- **Reasoning effort:** high
- **Date:** 2026-10-02 (`2026-10-02T20:15Z`)
- **Stand-in:** the app repo's `AGENTS.md` names `gpt-5.6-sol/high` or `gpt-6-sol/high` as the
  arbiter, and the program runs that role as `gpt-6-sol`. Recorded as the two earlier landing
  registries of today record it: `substitution.stands_in_for: "gpt-6-sol"`,
  `agents_md_role: "gpt-5.6-sol/high"`, reason "Codex usage limit until 2026-10-04; owner rulings
  2026-09-30."
- **Reviewer 1** (accuracy): Claude Opus 5.5 (`claude-opus-5-5`), high. **Reviewer 2** (clarity):
  Claude Opus 5.5 (`claude-opus-5-5`), high. Each states it did not read the other's file. The
  registry should record the models actually used.
- **This is a content review, not legal advice.** It edits no page, script or registry: a site lane
  applies the final string and the file name below.

## Decision

**APPROVE WITH MODIFICATIONS.** The candidate's sentence (option B, "tap a stop…") is **not**
published, and neither is Reviewer 2's "tap a place…": the map's tap handler does not reliably open
the place tapped (ruling 1, confirmed in the code). The page gets the FINAL sentence below. The
share card is approved under a new file name.

## Inputs

Website worktree `mannamila-web-copy3`, branch `docs/skald-landing-copy-3`, at `3851716`.

| File | sha256 |
| --- | --- |
| `docs/landing-copy-3/CANDIDATE.md` | `69bd6a2a10abcf48e3c2b39e404844aab1262ac1422f7b13e116e63ebd6fad80` |
| `skald/index.html` (candidate) | `53967dcaae5e6a7f3d2784e1cabee7fc18fd03bc3593c673cda5aa3c7b2297e9` |
| `skald/assets/skald-odyssey-og-20261003.jpg` (candidate card) | `954314a111821dfba4bba607021830a605f72036c0e109b083e06d4a337f03df` |
| `skald/app.js` (unchanged from live) | `c07ce27bbe0476577ea8dfad7490732f15d32b859ef75f0866acc020efd5c899` |
| `skald/get/index.html` (unchanged from live) | `09ced3b5ec6f4eb5c9dd6978832358266096a64e94dc74c8ba2a13318d7d2434` |
| `docs/landing-copy-3/reviews/accuracy.md` | `93913df86c6f6363f0c28e723925a955535476abbc1923ca1cedfafbb892dfb1` |
| `docs/landing-copy-3/reviews/clarity.md` | `c2daa2bcb5aa32033bc51e07a2eb113f36ed446338e46b2c20c285e3071c4763` |

Both reviews attest the same CANDIDATE.md and page hashes. Evidence: the app at tag `v0.7.10` in
`/Volumes/Dev/Code/skald-prod`, read with `git show` and `git grep`; the checkout was not changed.
(`9a781e27e`, quoted by Reviewer 1, is the tag object; it points at commit `a73ca6dd2`.) App paths
below are under `feature/reader/src/commonMain/kotlin/com/skald/feature/reader/`, shared by Android
and iOS. Content: `core/src/main/assets/content/odyssey/panels.json` and the 24 `scholia.json`
files, extracted from the tag into a scratch folder.

Not done: no device or simulator run, no read of the live remote configuration, no store console,
no run of `verify-site.mjs` or `verify-landing-copy.py`, no edit to any page, script or registry.

## Owner request and root rulings, as given

Owner (2026-10-02): "Tastefully remove look up person."

1. Verify Reviewer 1's hit-test finding in the `v0.7.10` code. If it holds, do not publish "tap a
   place".
2. Then choose between option A and a sentence that keeps a second, true thing the reader gets
   from the map without promising tap accuracy, whichever reads as the more finished sentence
   under "Find your bearings."; one sentence, the length of the live one or shorter.
3. If the finding does not hold, publish Reviewer 2's sentence.
4. Share card: approve or reject; the site lane renames it to `skald-odyssey-og-0710.jpg`.
5. Record the bug under "For the root" with file, line and the exact rule.

## Rulings

### Ruling 1: the hit-test finding holds. "Tap a place" is not published.

`sidecar/primitives/RouteMapPane.kt:222-231` at `v0.7.10`:

```kotlin
.pointerInput(stops, viewport) {
    detectTapGestures { tap ->
        val w = size.width.toFloat()
        val h = size.height.toFloat()
        val hit = stops.firstOrNull { s ->
            val sx = viewX(s.x) * w
            val sy = viewY(s.y) * h
            hypot((tap.x - sx).toDouble(), (tap.y - sy).toDouble()) <= 56.0
        }
        if (hit != null) onStopTap(hit.id)
    }
}
```

- **The rule:** the first stop **in list order** (route order) within 56 **raw pixels** of the tap,
  not the nearest. The radius is not in dp (about 21 dp on a 2.6× Android phone, 19 pt on a 3×
  iPhone, 28 pt on a 2× iPad).
- **Zoom does not help.** The handler sits after `.zoomable(state, …)` (`:221`), which ends in a
  `graphicsLayer` (`core/…/ui/Zoomable.kt:196-202`); the test therefore compares the tap with the
  stops' unzoomed positions. Two dots that collide collide at every zoom level.
- **Only caller:** `sidecar/books/odyssey/NostosRouteMapPanel.kt:179` (`onStopTap = {
  selectedStopId = it }`), used for the sea map and the Ithaca map. No test calls `onStopTap`
  (the one test that builds the pane, `RouteMapZoomSnapshotTest.kt`, is a picture test).
- **Both layouts.** The split layout (map beside the card: landscape, or a drawer 720 dp or wider,
  `NostosRouteMapPanel.kt:188-196`) and the stacked layout (`:223-242`) call the same map; only its
  width differs. The drawer is 74% of the window, 86% from 1200 dp (`sidecar/ReaderSidecar.kt:94-95`,
  `:258-260`); the map is 62% of the drawer's content width when split, the full content width
  when stacked.

Recomputed from the 18 route entries in `panels.json` (17 distinct dots; the Book XIII "Ithaca"
shares its coordinates with the Book I "Ithaca"), for a tap on the exact centre of each dot:

| Layout (modelled map width) | Dots that open another place's card | Tapping Sparta opens |
| --- | --- | --- |
| Android phone upright (about 706 px) | 11 of 17 | Ithaca |
| iPhone upright (about 764 px) | 10 of 17 | Ithaca |
| Phone landscape (about 1,043 px) | 10 of 17 | Ithaca |
| iPad 13-inch upright (about 902 px) | 10 of 17 | Ithaca |
| iPad 11-inch landscape (about 1,246 px) | 10 of 17 | Pylos |
| iPad 13-inch landscape (about 1,423 px) | 10 of 17 | Pylos |

At 1,423 px Pylos and Sparta are 23 px apart, as Reviewer 1 measured. The ten on the 13-inch iPad:
Pylos, Sparta, Ismarus, Cape Malea, Aeolia, Sirens, Scylla & Charybdis, Thrinacia, Ogygia,
Scheria. Across every width from 650 to 1,500 px the count stays between 9 and 11; the route would
need a map about 3,550 px wide to have none. On the Ithaca map, the Harbour of Phorcys opens the
Cave of the Nymphs at every width. The palace plan has the same rule with a 40 px radius
(`sidecar/primitives/MegaronPlanPane.kt:84-91`).

Reviewer 1's LE-02 is upheld on phone and tablet. This is a reading of the code and a geometric
model; nothing was tapped on a device. Under root ruling 1 that is enough: the page does not invite
the reader to tap places on the map. Root ruling 3 does not apply.

### Ruling 2: the sentence

**What the map gives without a tap.** The root's example, "read about the place the story has
reached", was checked and does **not** hold reliably. The map opens with
`anchorFocus["focus"] ?: currentSite?.id` selected (`NostosRouteMapPanel.kt:131-133`), and the
note that opens the map supplies that focus (`ReaderScholiaSurfaceController.kt:394-404`). Of the
47 notes that open the map: 23 open with the current place's card, 8 with another place's card
(the place the passage talks about: in Book II, Pylos and Sparta, while the mark is on Ithaca), and
16 with no card at all, only "Tap a place to read where it sits between memory and the open sea."
(`NostosDossier.kt:85-93`). Those 16 are in Books XIII to XXIV, where the map shows Ithaca or the
palace but the note's focus names a place on the sea map. The page's screenshot (Book I, "You are
here: Ithaca" with its card) is a true picture of the first case. See "For the root", item 2.

**What does hold: the mark.** The map marks the place the story has reached. The marked place
follows the book being read (`NostosRouteMapPanel.kt:88`, `:121-130`; `NostosScales.kt:61-64`), it
is drawn as the "YOU ARE HERE" beacon whatever is selected (`RouteMapPane.kt:437-441`, `:495`), the
legend calls it "Where we are" (`NostosRouteMapPanel.kt:510`), and the line above the map says "the
marked place is where the story stands now" (`:294`). Computed for all 24 books, there is a current
place in every one (Ithaca, Pylos, Sparta, Ogygia, Scheria ×3, Cyclops, Aeaea, the Entrance to
Hades, Thrinacia, then the Ithaca sites and the palace). The capture lane's 0.7.10 screenshot shows
it running. This also answers the claim Reviewer 2 asked to have confirmed in LF-03.

One limit, disclosed: in Books XXI and XXII the map opens on the palace plan, whose beacon follows
the selection instead (`NostosRouteMapPanel.kt:162`), and those books' three notes carry a focus
that is not on the plan, so the plan opens unmarked; the mark is on the map's other two tabs. The
claim holds at opening in 22 of 24 books, including the three free ones, and on the map in all 24.

**The choice.** Option A is true and finished. Reviewer 2 calls it thin under a large heading and
notes that dropping the old clause loses some of the heading's point (LF-02, LF-03). The mark is
that point: it is how the map gives a reader their bearings, it is what the picture beside the
sentence shows, and it replaces a false clause about orientation with a true one. It reads as the
more finished sentence, so it is chosen over A.

FINAL: **Follow the voyage on a map that marks the place the story has reached, and see what
happens to the fleet.**

- 21 words; the live sentence has 24. No "tap", no "stop", no "look up".
- "a map" agrees with the next sentence ("Open a map or note…"); "the story" is the page's own word
  (art and notes sections); "place" is the app's word (LE-01, LF-01).
- "see what happens to the fleet" stands as live; Reviewer 1 verified it (check 3).
- Option C is rejected, as both reviewers recommend (LE-05, LF-02).

### Ruling 4: the share card

**Approved.** Viewed by the arbiter at full size: 1200×630, the 0.7.10 iPad scene (Butler's English
beside the Greek, "Fri Oct 2", "NOTE"), the drawn text "Skald: Odyssey" and "Spend some time with
the Odyssey." unchanged, no figure or version drawn. `share-card-before.jpg` is byte-identical to
the live card (`636ec5cf…4415`), `share-card-after.jpg` to the candidate card. Both reviewers
approve; the alt text on both tags stays as it is.

**File name.** The card was made on 2 October and its name carries 3 October. The site lane renames
it, bytes unchanged:

- `skald/assets/skald-odyssey-og-20261003.jpg` → **`skald/assets/skald-odyssey-og-0710.jpg`**
  (sha256 `954314a1…03df`, 150,151 bytes).
- `og:image` (`index.html:16`) and `twitter:image` (`:23`) →
  `https://skald.mannamila.com/assets/skald-odyssey-og-0710.jpg?v=20261002`. The cache key had the
  same next-day date; `20261002` is the day the card was made and the live card's convention. This
  key is the arbiter's addition to the root's ruling.
- `verify-site.mjs:59` (required file) and `:201` (the `og:image` pin), the new registry's
  `og_and_twitter_image_url` binding, and CANDIDATE.md's table and "References" paragraph follow.
- The older cards (`-070.jpg`, `-20261002.jpg`, `skald-odyssey-og.jpg`) stay for links already
  shared. The review files keep the old name; they are hash-pinned and are not edited.

## Findings matrix

Disposition: **A** accepted as proposed; **M** accepted with a modification; **R** rejected.

| Finding | Severity | Finding in brief | Disposition | What to do |
| --- | --- | --- | --- | --- |
| LE-01 (R1) | minor | "stop" is not the app's word; "tap a place to read about it" | M | Fact accepted; the FINAL says "place". The replacement is not used: no tap clause is published |
| LE-02 (R1) | major | A tap on a clustered dot opens a neighbour's card | M | Confirmed (ruling 1). B is not published. Replacement 2 is not used as written: the card at opening is not reliably the current place (ruling 2); the mark is claimed instead |
| LE-03 (R1) | info | The map and fleet open only from notes | A | No change. "Open a map or note" stays |
| LE-04 (R1) | minor | The card's file name is dated a day ahead | M | Renamed, per the root, instead of annotated (ruling 4) |
| LE-05 (R1) | major (C only) | "when you need a reminder" still promises a lookup | A | C is not used |
| LF-01 (R2) | medium | "stop" → "place"; best sentence "tap a place to read about it" | M | "place" taken. The sentence is not published (ruling 1) |
| LF-02 (R2) | info | B is the right option; A is thin; C keeps the problem | M | C rejected, as proposed. B cannot be published; A's thinness is met by the mark clause |
| LF-03 (R2) | low | Bring the heading's point back through the reader's position on the map | M | Taken without the tap clause; the claim to confirm is confirmed (ruling 2) |
| LF-04 (R2) | low | Optional new alt text for the map picture | R | Beyond the owner's request; the live alt is true and no card is now mentioned in the sentence. No change |
| LF-05 (R2) | info | Share card and its alt are right | A | Approved (ruling 4) |

| | Major | Medium | Minor / low | Info | Total | A | M | R |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Reviewer 1 | 2 | 0 | 2 | 1 | 5 | 2 | 3 | 0 |
| Reviewer 2 | 0 | 1 | 2 | 2 | 5 | 1 | 3 | 1 |

No blocker in either review.

## The FINAL sentence and where it goes

`skald/index.html:184`, section `#journey` ("Find your bearings."), first paragraph of
`.proof-copy`. The whole paragraph is this one sentence.

| | Text |
| --- | --- |
| Live | Follow the voyage on the map, see what happens to the fleet, and look up a person or place when you need a reminder. |
| Candidate (not published) | Follow the voyage on the map, tap a stop to read about the place, and see what happens to the fleet. |
| **FINAL** | **Follow the voyage on a map that marks the place the story has reached, and see what happens to the fleet.** |

The section then reads:

```text
Follow the journey
## Find your bearings.
Follow the voyage on a map that marks the place the story has reached, and see what happens to the fleet.
Open a map or note, spend a little time with it, and return to your passage.
[Image: Skald voyage map with locations from the Odyssey.]
Trace the long route toward home without leaving the reader.
```

Nothing else on `/` changes except the two card URLs. `app.js` and `/get/` do not change.

**Expected hash.** The candidate `skald/index.html` (`53967dca…97e9`) with line 184 replaced by the
FINAL sentence and the card URL on lines 16 and 23 replaced as in ruling 4 hashes to
`0598a4a445bb2ee905ac0c364b61c50ae28c0630f361301076d6107491a9cc3f`. The text governs; the hash is a
check.

## For the root

1. **App bug: the map opens the wrong place.** `sidecar/primitives/RouteMapPane.kt:222-231` at
   `v0.7.10`. Exact rule: `stops.firstOrNull { hypot(tap − stop) <= 56.0 }`, the first stop in
   route order within 56 raw pixels, measured in the unzoomed pane. Effect: 10 or 11 of the 17 dots
   open a neighbour on every phone and tablet layout modelled (ruling 1). Fix: take the nearest
   stop within the radius (`minByOrNull` over the distance, then the radius test), give the radius
   in dp, and add a unit test with the shipped coordinates (Sparta, Pylos, Scylla & Charybdis).
   Same rule, 40 px, in `sidecar/primitives/MegaronPlanPane.kt:84-91`. The two "Ithaca" entries
   (`telemachy-ithaca`, `ithaca`) share coordinates, so on the sea map a tap on Ithaca always opens
   the Book I card, also in Books XIII to XXIV.
2. **App bug, found in this arbitration: the map can open with no card and, in two books, no mark.**
   `NostosRouteMapPanel.kt:131-134`: the selection is the note's focus, looked up only among the
   sites of the scale on show. A focus of `ithaca`, `pylos` or `underworld` is not a site on the
   Ithaca map or the palace plan, so 16 of the 47 map notes (every one in Books XIII, XIV, XVI,
   XVIII, XX, XXI, XXII and XXIV, and one in XVII) open onto "Tap a place to read…". On the palace
   plan the beacon is the selection (`:162`), so Books XXI and XXII also open unmarked. Fix: fall
   back to `currentSite` when the focus is not on the scale shown, and give the palace plan the
   current feature for its beacon. Code-derived; not seen on a device.
3. **Site lane, apply:** the FINAL sentence at `index.html:184`; the rename and the references
   listed in ruling 4; check the expected hash. Then a new registry folder superseding
   `skald/docs/landing-2026-10-02-copy-2` (roles and models as in the header, the stand-in block,
   the review hashes above plus this file's, the card's hash and its 0.7.10 source capture, the new
   URL binding and page pin), and reshoot `landing-390-journey.png` and `landing-1280-journey.png`.
   In CANDIDATE.md: the applied sentence, the page hash and the card's file name.
4. **If the root judges the Books XXI and XXII limit in ruling 2 disqualifying**, option A ("Follow
   the voyage on the map and see what happens to the fleet.") is true without qualification and may
   be used instead with no new review; with the same card URLs the page then hashes to
   `dbdecdde678d720a3b4542e5acb98340d2a498ca49a2c71001245a6751404d40`.
5. **After the app fix** and a check on a phone and a tablet (Sparta, Pylos, Scylla & Charybdis
   each open their own card), Reviewer 2's sentence is the one to return to: "Follow the voyage on
   the map, tap a place to read about it, and see what happens to the fleet." It needs a short new
   review then, not now.
6. **For the owner, unchanged from round 2:** the store description still says "look up people and
   places as you go". Not touched here.
7. **Not verified by anyone:** the app on a device (tapping, the map on a phone, the mark in Books
   XXI and XXII); the live remote configuration (the `sidecar` gate is remotely switchable); the
   card's source capture hash and the byte-for-byte regeneration of the earlier card.
8. **Protocol note:** the app repo's `AGENTS.md` names GPT-5.6 or Claude Opus 4.8 for roles 1 and
   2; both ran as `claude-opus-5-5`, as in today's earlier registries.

## Decision line

**APPROVED FOR PUBLICATION once applied exactly:** on `/`, the sentence "Follow the voyage on a map
that marks the place the story has reached, and see what happens to the fleet." at
`skald/index.html:184`, and the share card as `skald/assets/skald-odyssey-og-0710.jpg` with its two
URLs. "Tap a place" is not approved until the app's hit test is fixed and checked on a device. Any
other change to a customer-visible string needs a new review.

# Landing page and /get/ for 0.7.10: accuracy review

- **Role:** Reviewer 1 of three: textual accuracy, source anchors, claims. Independent of Reviewer 2; `reviews/clarity.md` was not opened.
- **Model:** `claude-opus-5-5`
- **Reasoning effort:** high
- **Date:** 2026-10-02 (live reads 17:51–17:55 UTC)
- **This is a content review, not legal advice.** It clears no right, no privacy question and no store obligation.

## Input

| File | sha256 |
| --- | --- |
| `docs/landing-facts-0.7.10/CANDIDATE.md` | `2a2d87b61ad90b0c62642d5550ea92c333e2d6256e99f64a1a603d87fa673176` |
| `skald/index.html` | `33022828e1731dd059aaae0466f77bf3d41549f5c922fc81102a35863abb75d1` |
| `skald/app.js` | `8bbd6dc8b564c94ec186fe0358b7493fb4265b81ba70336cd280d287ab05dd71` |
| `skald/get/index.html` | `8b55fdc48257626eba7ff4486296710f966ea9e8df16bf101858de17307babc1` |
| `skald/availability.json` | `c9ac00c32be7719b97a43cf8f3ebd6ea308c0125aed580936bb16e551cb52559` |
| `skald/assets/skald-odyssey-og-20261002.jpg` | `636ec5cfdb95771d213beece3906696a85192cba1ed85a9eba13007c693f4415` |
| `docs/landing-facts-0.7.10/google-approval-switch.patch` | `47c7c907036bec9822cdcb0c639cc717f9bad07c1a25c2a6a6379be991f5923c` |
| `docs/landing-facts-0.7.10/INVENTORY.md` | `52b51003aaed96f677c973c6e074255581dd732240739c17d1faee39a2411906` |

Website worktree `mannamila-web-landing` at `5d8d4ad`. The hashes were the same at the start and at
the end of the review. Evidence repo: `skald-prod` at `origin/main` `7713edcf4`; tag `v0.7.10` is
`a73ca6dd2`. `git diff --quiet v0.7.10 HEAD -- core/src/main/assets` exits 0, so every count below
is a count of the 0.7.10 bundle.

Live baseline confirmed: `https://skald.mannamila.com/`, `/app.js` and `/get/` hash to
`2d52ae4d…be2b`, `5c6417ff…aeb3` and `cc67ecb5…a194`, as CANDIDATE.md says.
`git diff cee6168 HEAD -- skald/` shows the 23 rows and nothing else in the four candidate files.

## Verdict

**APPROVE_WITH_EDITS.** No blocker: I found no sentence on `/` or `/get/` that is false of 0.7.10
or of the stores as read today. One major, time-sensitive point (LA-01), five minor, eight notes.

| Severity | Count |
| --- | --- |
| Blocker | 0 |
| Major | 1 |
| Minor | 5 |
| Note | 8 |

## Findings

### LA-01 — major (time-sensitive): Google Play may already serve the 27 EU countries

- **Text.** `/` FAQ (`index.html:300`) and `app.js:63`: "On iPhone and iPad it is also available in
  the 27 member states of the European Union." `/get/` (`get/index.html:39`): "On the App Store,
  also in the 27 member states of the European Union."
- **Finding.** Both sentences are true today whichever way Google has decided, so this is not a
  blocker. But they tell an Android reader in the EU that Skald is not there yet, and the public
  Play page suggests that may no longer be so.
- **Evidence.** At 17:52 UTC I fetched
  `https://play.google.com/store/apps/details?id=com.mannamila.skald&hl=en&gl=XX` for 38 codes.
  All 31 launch codes (US, CA, AU, NZ and the 27 EU states) return a page with an "Install" button
  and one `itemprop="offers"` / `itemprop="price"` block. All seven controls (GB, NO, CH, IS, LI,
  JP, BR) return the same page with no Install button and no offer block. Every page returns 200,
  so the status code tells nothing; the offer block is the difference.
- **Limit.** This is not one of the two gates the approved update post sets
  (`docs/marketing/updates/2026-10-02-release-0.7.10.md:677–690` says the `gl=` page "is not an
  availability check"). I could not tell whether the page showed the same offer block while the
  change was still in review. It is a reason to run the gates now, not a substitute for them.
- **Action.** Before publishing, read Play Console (Publishing overview no longer lists the
  countries change as in review; Production → Countries/regions shows 31) and rerun
  `verify_play_country_availability.py --phase post-activation`. If both pass, publish with
  `google-approval-switch.patch` applied instead of the two-sentence form:
  - `/`: "Skald is available on Android, iPhone, and iPad in the United States, Canada, Australia, New Zealand and the 27 member states of the European Union."
  - `/get/`: "Available in the United States, Canada, Australia, New Zealand and the 27 member states of the European Union."
  If either gate fails, publish the candidate as written.

### LA-02 — minor: the artwork screenshot shows a note the app has since corrected

- **Where.** `assets/museum-guide.webp` (`index.html:205`), unchanged by the candidate.
- **Finding.** The image shows the Lastman note as "a leopard-skinned Odysseus hefts a great
  embossed shield beside her". 0.7.10 reads "hefts a great fluted bronze basin beside her"
  (`odyssey-01-athena-visits-ithaca/master.json`, plate `…plate-02-lastman-minerva`,
  `parent_note`; also `docs/store/releases/0.7.10/CAPTURES.md`, scene 07-art). The painting in the
  same screenshot shows the basin.
- **Why minor.** The alt says "Skald 0.7.0 showing …", which is true of the image, and the note
  text is about 6 px high at the page's display size. The title, artist, year and museum label in
  the image match the 0.7.10 data.
- **Replacement.** No text change. Recapture this image from 0.7.10 when the store captures are
  redone; it is the one landing screenshot that shows wording 0.7.10 no longer displays.

### LA-03 — minor: "236 works of museum art" on `/get/`

- **Text.** `get/index.html:30`: "236 works of museum art".
- **Finding.** 236 is the right figure for this noun and 258 would be wrong for it: 236 is the
  gallery (`count-audit.mjs` → `museum_gallery.objects` 236; `unlock-stats.json`
  `museumArtworks.artworks` 236). The noun is slightly narrower than the count. Nine of the 236
  sit in collections that are not museums (Bibliothèque nationale de France 4, Römisches Haus 2,
  Palazzo Salviati 1, Banca d'Italia 1, Royal Palace Amsterdam 1), and the reviewed store copy
  says "236 from 48 museums and collections".
- **Replacement (optional, arbiter's call).** "236 works from museums and collections". The
  candidate's wording is the live phrase with the figure corrected and is acceptable as it stands.

### LA-04 — minor: two claim rows in CANDIDATE.md are inexact

- Row 16 names the FAQ question "How many translations are included?". The page's question is
  "Which translations are included?" (`index.html:283`). **Replacement:** use the page's wording.
- "2 link changes in 6 places (6, 23)". I count five customer-facing places: hero badge, final
  badge, `availability.json`, the `app.js` fallback, and the `/get/` badge. The sixth is the
  `verify-site.mjs` pin, which no visitor sees. **Replacement:** "in 5 places, plus the
  `verify-site.mjs` pin".
- Neither changes a published string. Fix both before the rows are copied into a registry.

### LA-05 — minor: archived copies of the old landing page are served publicly

- **Where.** `https://skald.mannamila.com/docs/store-web-2026-09-15-native/resolved-index.html`
  and `…/docs/store-web-2026-09-13/resolved-index.html` both return 200 `text/html`. The first is
  byte-identical to the current live page (`2d52ae4d…`).
- **Finding.** After this change they still say "A look at our next app update. The expanded
  library described here is coming in version 0.7.0; the stores currently offer an earlier
  version.", carry 3,288 / 252 / 54 / 230, and link to the `/us/` storefront. They are not in
  `sitemap.xml`, nothing links to them, and each has `rel="canonical"` pointing at `/`; `robots.txt`
  allows them. A new review folder with its own `resolved-index.html` would add a third copy.
- **Replacement.** Outside the candidate files. Either stop serving `docs/` or add
  `<meta name="robots" content="noindex">` to the archived copies. `promote-skald.mjs` treats
  `docs` as a preserved top-level folder of the deploy target, so this is a deploy decision.
- These are the only remaining `/us/` App Store links anywhere in the site source or on the live
  site that I found.

### LA-06 — minor: serial comma in the switched sentence

- **Text.** Switch patch, `/`: "…on Android, iPhone, and iPad in the United States, Canada,
  Australia, New Zealand and the 27 member states of the European Union."
- **Finding.** One sentence, two comma styles. The rest of the page uses the serial comma
  ("Android, iPhone, and iPad"; "Canada, Australia, and New Zealand" today). The switched phrase
  follows the privacy policy's sentence word for word, which has none.
- **Replacement (optional).** "…Canada, Australia, New Zealand, and the 27 member states of the
  European Union." in all three places and in the `verify-site.mjs` pin. True either way.

### LA-07 — note: the social card changed in layout as well as in the removed line

- Pixel comparison of `social-card-before.jpg` and `-after.jpg` (1200×630 each): every pixel that
  differs by more than 8/255 lies in x 61–355, y 116–516, the left text column. The screenshot on
  the right is unchanged. The title and tagline moved down about 24 px because the block is
  centred and lost a line.
- The generator diff against the archived `og.html` and `og-render.mjs` is the one `<p
  class="preview">` line and its assertion.
- Drawn text is now "Skald: Odyssey" and "Spend some time with the Odyssey." The embedded
  screenshot shows no figure and no version. Its visible labels (Book I, Butler (1900) · EN,
  "Athena Visits Ithaca", "I - Muse and Council", "RARE WORD", Story / Ἑλληνικά / Parallel) all
  exist in 0.7.10.
- `og:image` and `twitter:image` both point at `…/assets/skald-odyssey-og-20261002.jpg?v=20261002`;
  the file exists, is 1200×630 as the metas say, and equals `social-card-after.jpg`. Both alts
  read "Skald 0.7.0 on iPad, with the Ancient Greek beside an English translation.", which
  describes the screenshot in the card.
- The old card `skald-odyssey-og-070.jpg`, with "A look at our next app update.", stays served.
  Links shared earlier keep showing it from platform caches either way.

### LA-08 — note: the Google Play listing still shows the 0.7.0 figures

- The public Play page reads "3,288 reading notes, 252 historica…" and "24 translations, 3,288
  notes, art and scholarship." The App Store description (lookup, `country=de`) already reads
  3,285 / 258 / 236 / 52.
- The landing page will be right and the Play listing behind it. Nothing to change on the page;
  the Play listing update is the owed step.

### LA-09 — note: `app.js` fallback date

- `LAUNCHED_AVAILABILITY.lastVerifiedAt` is still `"2026-07-22T00:00:00-04:00"` (`app.js:20`)
  although its iOS URL changed in this candidate. Nothing displays it. `availability.json`
  `lastVerifiedAt` `2026-10-02T13:44:02-04:00` is valid, is today, and precedes my reads.

### LA-10 — note: "iPhone and iPad" on `/`, "the App Store" on `/get/`

- Both are true. The App Store lookup reports `features: iosUniversal` in all 31 countries, so
  "iPhone and iPad" is exact. `/get/` names no platform in its first sentence, so "On the App
  Store" is the natural contrast there. No change needed.

### LA-11 — note: screenshots and alts

- All four alts are true descriptions of 0.7.0 captures (`review-registry.json`
  `websiteAssetSourceCaptures`: iOS phone 01-reader, iPad 03-parallel, iPad 07-art, Android tablet
  08-voyage-map; the webp hashes still match the registry).
- I viewed all four. None shows a count, a version or a "coming soon" label.
- Differences from 0.7.10 other than LA-02 are layout only (larger headings, note marks and
  margin since 0.7.7). The hero shows Butler; a new install opens in Murray, and the alt says
  Butler.

### LA-12 — note: feature copy against 0.7.10

Nothing became false since the page was written on 2026-09-15.

- The panel launcher buttons were removed in #314 (`ff346185b`), which is an ancestor of
  `v0.7.0`, so the page was already written against a reader without them.
- The map, the fleet and the gallery still exist (`panels.json` global panels `nostos_route_map`,
  `fleet_status`, `museum_artifacts`) and open from notes (47 voyage, 40 fleet, 56 realia) and
  from an artwork's "See it in real life".
- Between `v0.7.0` and `v0.7.10`, `ReaderChrome.kt` and the `sidecar/` panel sources change only
  in type sizes, scene taps, museum name display and gallery copy. No control or panel is removed.
- Checked and true: three retelling depths labelled 1, 5 and 20 min in all 24 books
  (`TranslationPickerLabels.kt:10–12`; 24 each of `tier-30s`, `tier-5m`, `tier-30m`); Greek mode
  and Parallel mode; the Homeric lexicon; 66 comparison notes; 614 translation-scoped notes
  ("fresh notes can surface as you … change editions"); collection, credit and rights line on
  every gallery work (`MuseumArtifactsDetail.kt:293–315`); the student or teacher price on the
  unlock screen; the unlock kept for earlier buyers.
- "look up a person or place" matches the reviewed store copy ("look up people and places as you
  go"). In 0.7.10 that is the name cards, eleven person-and-place concept pages and the map's
  place entries. The older tap-a-word glossary holds vocabulary only and shows in retellings.
- In the EU the app starts no network request of its own (ADR 0027, EU offline tier). Links the
  reader taps still open, so the offline and "need a connection" sentences hold there too.
- The live content service cannot hide translations from 0.7.10: its `prod` manifest is
  `content.version` 7, below the bundle floor `BUNDLED_CONTENT_VERSION = 1_790_541_663`.

### LA-13 — note: links

- `https://apps.apple.com/app/id6790579937` → 301 → `…/us/app/skald-odyssey/id6790579937`, 200,
  title "Skald: Odyssey App - App Store", "Version 0.7.10". With `?ct=meta-test-1` the tag
  survives the redirect.
- `/de/`, `/fr/`, `/ie/`, `/mt/` storefront pages return 200 for the same app; `/gb/` returns 404.
- `https://play.google.com/store/apps/details?id=com.mannamila.skald`, and the `/get/` link with
  its referrer tag, return 200, title "Skald: Odyssey - Apps on Google Play", version 0.7.10.

### LA-14 — note: full-text article links

- Of the 40 full-text URLs in the bundle, 33 return a PDF to a plain fetch and one returns HTML.
  Six refuse a scripted fetch (two MDPI, two Oxford Academic and one Bristol repository with 403;
  two Brill with 202 and a challenge page). That is bot blocking, not evidence of a dead link.

## Every figure on the page

All derived from the 0.7.10 bundle (`core/src/main/assets/`), by the count scripts and by my own
count of the same files.

| Figure and noun | Where | Result | Source |
| --- | --- | --- | --- |
| 24 translations | metas, hero, totals, eyebrow, FAQ; "twenty-four" on `/get/` | True | `content/odyssey/translations.json`: 24 entries; `unlock-stats.json` `translations.editions` 24 |
| 11 languages | totals, eyebrow | True | en, es, fr, de, it, ru, nl, da, he, el, sv |
| 13 in English, two in French, one each in nine others | `index.html:168`, `:284` | True; 13 + 2 + 9 = 24 | en 13; fr 2 (Leconte de Lisle, Dacier); es, de, it, ru, nl, da, sv, he, el one each |
| plus Ancient Greek / "included separately" | totals, FAQ | True | `greek.json` in all 24 book folders |
| All 24 books | hero, totals, notes paragraph, `/get/` | True | 24 book folders; 576 of 576 translation-by-book files non-empty |
| 3,285 reading notes across all 24 books | meta, og, totals, `index.html:133` | True | `unlock-stats.json` `scholiaNotes.total` 3285; 3,285 rows and 3,285 unique ids across the 24 `scholia.json`; fewest in one book is 109 (XXI) |
| 258 historical artworks and objects / "258 distinct works" | og, totals, `:199` | True | `node tools/content-ingest/check-art-duplicates.mjs --assets-root core/src/main/assets` → "258 live identities" |
| 236 artworks … 48 museums and collections | eyebrow `:197`, `:199` | True | `panels.json` `museum_artifacts`: 48 groups, 236 objects, 236 distinct ids |
| Another 22 historical works | `:199` | True; 236 + 22 = 258 | 22 distinct plate images with no gallery id across the 24 `master.json` (Flaxman, Howard, Brueghel, Tischbein and others); all historical |
| 52 journal articles | og, totals, `:134` | True | 66 `citation` notes, 52 distinct DOIs, each with a `journal` |
| 40 with a direct full-text link; "the others have a citation and DOI link" | `:134` | True | 40 with `readInApp` and `fullTextUrl`; 12 without, each with a DOI |
| Books I, II and IX free | hero, FAQ ×2, final call to action | True | `unlock-stats.json` `freeBooks` [1, 2, 9] |
| other / remaining 21 books | FAQ ×2 | True | `books.paid` 21 |
| 1, 5 and 20 | depth cards, FAQ | True | tier labels in `TranslationPickerLabels.kt` |
| 236 works of museum art | `/get/` | Right figure; see LA-03 | as above |
| 27 member states | FAQ, `/get/` | True | `eu27-0.7.10.json`, `status: active`, 27 codes |

Each matches `docs/store/releases/0.7.10/store-copy.json` and
`FINAL-listing-count-corrections.md`. No noun has drifted from its number.

## Rewrites and removals

- No preview or future-tense wording about the app remains in visible text, metas, alts,
  aria-labels, the three `app.js` strings or `availability.json`. There is no JSON-LD on either
  page. The two "next" left are "somewhere to go next" and "Hear about the next update." (the
  email list). "What will product updates email me?" is also about the list.
- Both stores serve 0.7.10: the App Store lookup returns version 0.7.10 for all 31 countries
  (released 2026-10-02T13:30:19Z); the Play page carries 0.7.10.
- Row 17, "A student or teacher price is available on your own attestation.", is the reviewed
  description's sentence word for word. Both unlock products are on both stores
  (`ACTIVATION-0.7.10.md`, rows P6 and A6).
- The static FAQ paragraph, status line and kicker in `index.html` are string-equal to the
  `app.js` `faq`, `status` and `kicker` values, so the script overwrites each with itself.

## Availability today

| Store | Read | Result |
| --- | --- | --- |
| App Store | `itunes.apple.com/lookup?id=6790579937&country=XX`, 17:51 UTC | 0.7.10 in US, CA, AU, NZ and all 27 EU states; no result for GB, NO, CH |
| Google Play, four countries | `ACTIVATION-0.7.10.md`; public page | 0.7.10 live |
| Google Play, 27 EU countries | `ACTIVATION-0.7.10.md` row P4 | Configured and in review as recorded; see LA-01 |

`git apply --check docs/landing-facts-0.7.10/google-approval-switch.patch` passes on the candidate
(four files, one line each). The switched sentences are true once Google Play serves the 27.

## Could not verify

- Whether Google has approved the 27 countries. Only Play Console and the read-back can say.
- Where the storefront-neutral App Store link sends a desktop visitor on an EU network. From this
  US host it lands on `/us/`. On an iPhone or iPad it opens the device's own storefront.
- The Art Atlas record count (252 per CANDIDATE.md); the bundle is encrypted. The landing page
  states no count for the atlas.
- That re-running the card generator reproduces the image byte for byte. I compared the generator
  inputs and the two images, and did not re-render.
- Any pixel of a running 0.7.10 build. Screenshot findings rest on the bundled content and the
  changelog.

# Landing page and /get/: candidate for content review (0.7.10)

**Status: CANDIDATE. Not approved copy, not published.** The arbiter decides the final text; the
review registry and `resolved-index.html` are written only after that.

Live baseline: `/` sha256 `2d52ae4d…be2b`, `/app.js` `5c6417ff…aeb3`, `/get/` `cc67ecb5…a194`
(read 2026-10-02; source and mirror identical to live before these changes).

## Candidate files

| File | sha256 |
| --- | --- |
| `skald/index.html` | `33022828e1731dd059aaae0466f77bf3d41549f5c922fc81102a35863abb75d1` |
| `skald/app.js` | `8bbd6dc8b564c94ec186fe0358b7493fb4265b81ba70336cd280d287ab05dd71` |
| `skald/get/index.html` | `8b55fdc48257626eba7ff4486296710f966ea9e8df16bf101858de17307babc1` |
| `skald/availability.json` | `c9ac00c32be7719b97a43cf8f3ebd6ea308c0125aed580936bb16e551cb52559` |
| `skald/assets/skald-odyssey-og-20261002.jpg` (new) | `636ec5cfdb95771d213beece3906696a85192cba1ed85a9eba13007c693f4415` |

`styles.css` and the four screenshots are unchanged.

## Every changed customer-visible string

Types: figure, removal, rewrite, new sentence, link, meta.

| # | Page | Location | Live | Candidate | Type |
| --- | --- | --- | --- | --- | --- |
| 1 | `/` | `meta description` | Preview the next Skald update: the Odyssey with 24 translations, 3,288 reading notes, art and scholarship to explore alongside the poem. | Read the Odyssey with 24 translations, 3,285 reading notes, art and scholarship to explore alongside the poem. | meta (rewrite + figure) |
| 2 | `/` | `og:description` | A look at the next Skald update: 24 translations, 3,288 notes, 252 artworks and objects, and references to 54 journal articles, gathered around the Odyssey. | Skald: 24 translations, 3,285 notes, 258 artworks and objects, and references to 52 journal articles, gathered around the Odyssey. | meta (rewrite + 3 figures) |
| 3 | `/` | `twitter:description` | Preview the next Skald update: read the Odyssey with translations, art and scholarship alongside the poem. | Read the Odyssey with translations, art and scholarship alongside the poem. | meta (rewrite) |
| 4 | `/` | `og:image`, `twitter:image` | `…/assets/skald-odyssey-og-070.jpg?v=070-native-20260915` (card carries "A look at our next app update.") | `…/assets/skald-odyssey-og-20261002.jpg?v=20261002` (same card without that line) | meta (image) |
| 5 | `/` | hero card, first paragraph | A look at our next app update. The expanded library described here is coming in version 0.7.0; the stores currently offer an earlier version. | (paragraph removed) | removal |
| 6 | `/` | App Store badge, hero and final call to action; `availability.json`; `app.js` fallback | `https://apps.apple.com/us/app/skald-odyssey/id6790579937` | `https://apps.apple.com/app/id6790579937` | link |
| 7 | `/` | library section eyebrow | The library in the next update | The library | rewrite |
| 8 | `/` | totals strip `aria-label` (screen readers) | Library totals for the next Skald update | Library totals | rewrite |
| 9 | `/` | totals strip | 3,288 reading notes across all 24 books | 3,285 … | figure |
| 10 | `/` | totals strip | 252 historical artworks and objects | 258 … | figure |
| 11 | `/` | totals strip | 54 journal articles referenced alongside the poem | 52 … | figure |
| 12 | `/` | notes paragraph | The next update brings 3,288 reading notes to passages across all 24 books: … | Skald brings 3,285 reading notes to passages across all 24 books: … | rewrite + figure |
| 13 | `/` | notes paragraph | References to 54 journal articles give you somewhere to go next. For 42 of them, you can follow a direct link to the full text online; … | References to 52 journal articles … For 40 of them, … | figure (×2) |
| 14 | `/` | museum eyebrow | 230 artworks and artifacts · 48 museums and collections | 236 artworks and artifacts · 48 museums and collections | figure |
| 15 | `/` | museum paragraph | The museum gallery has 230 artworks and objects from 48 museums and collections. Another 22 historical works appear alongside the reading, bringing the library to 252 distinct works. | … has 236 … Another 22 … to 258 distinct works. | figure (×2) |
| 16 | `/` | FAQ "How many translations are included?" | The next update includes 24 translations: 13 in English, … | Skald includes 24 translations: 13 in English, … | rewrite |
| 17 | `/` | FAQ "Is this a subscription?" | The next update also offers a student or teacher price on your own attestation. | A student or teacher price is available on your own attestation. | rewrite |
| 18 | `/` | FAQ "Where is Skald available?" (and the same string in `app.js`, which writes it at load) | Skald is available on Android, iPhone, and iPad in the United States, Canada, Australia, and New Zealand. | (kept) + On iPhone and iPad it is also available in the 27 member states of the European Union. | new sentence |
| 19 | `/` | final call to action | Books I, II and IX are free. Pick a translation and see what catches your attention. The expanded library on this page arrives with version 0.7.0. | Books I, II and IX are free. Pick a translation and see what catches your attention. | removal |
| 20 | `/get/` | line under the headline | … · eleven translations · … | … · twenty-four translations · … | figure |
| 21 | `/get/` | line under the headline | … · 221 works of museum art. | … · 236 works of museum art. | figure |
| 22 | `/get/` | note | Available in the United States, Canada, Australia, and New Zealand. | (kept) + On the App Store, also in the 27 member states of the European Union. | new sentence |
| 23 | `/get/` | App Store badge | `https://apps.apple.com/us/app/skald-odyssey/id6790579937?ct=meta-test-1` | `https://apps.apple.com/app/id6790579937?ct=meta-test-1` (tag byte-identical) | link |

Not customer-visible: `app.js?v=20260722` → `app.js?v=20261002` (only `index.html` loads it);
`availability.json` `lastVerifiedAt` → `2026-10-02T13:44:02-04:00`; `verify-site.mjs` pins for
the App Store URL and the `og:image`.

Counts by type: 15 figure substitutions (rows 1, 2, 9–15, 20, 21); 2 removals (5, 19);
8 rewrites (1, 2, 3, 7, 8, 12, 16, 17; three of them are metas); 2 new sentences in 3 places
(18 in `index.html` and `app.js`, 22); 2 link changes in 6 places (6, 23); 1 image change in 2 metas (4).

Markup after the removals: the notice was the first child of the hero availability card; the card
now opens with "Available now on Android, iPhone, and iPad." and needs no other change
(`landing-*-top.png`). The unused `.release-preview` rule stays in `styles.css`, which is not
touched. The final call to action keeps its paragraph, one sentence shorter.

## Source of each figure

App repo (`MannaMila/skald`), reviewed for the 0.7.10 store listing:
`docs/store/releases/0.7.10/store-copy.json` / `shared-description.txt` and
`docs/content/reviews/release-0.7.10-2026-10-01/FINAL-listing-count-corrections.md`.

| Figure | Was | Now | Reviewed wording it follows |
| --- | --- | --- | --- |
| Reading notes | 3,288 | 3,285 | "3,285 reading notes" (`unlock-stats.json` `scholiaNotes.total`) |
| Historical artworks and objects | 252 | 258 | "258 historical artworks and objects" (236 gallery + 22 chapter-only) |
| Of which from museums and collections | 230 | 236 | "including 236 from 48 museums and collections" |
| Journal articles | 54 | 52 | "references to 52 journal articles" |
| With a full-text link | 42 | 40 | "40 have direct full-text links" |
| Translations (`/get/`) | eleven | twenty-four | "24 translations in 11 languages" |
| Museum art (`/get/`) | 221 | 236 | the museum-gallery figure; **reviewers:** 258 is the art total, but it would need "historical artworks and objects" |
| Unchanged and still true | | | 24 translations, 11 languages, 13 English, 48 museums and collections, 22 other works, Books I, II and IX free, 21 remaining books, all 24 books |

The student or teacher sentence (row 17) is the store description's sentence word for word.
The EU sentences (18, 22) are new; "the 27 member states of the European Union" is the phrase of
the approved update post. They are true on 2026-10-02: App Store live in 31 storefronts, Google
Play in four with the 27 in review.

## Links checked (plain fetch, 2026-10-02)

- `https://apps.apple.com/app/id6790579937` → 200, resolves to `apps.apple.com/us/app/skald-odyssey/id6790579937`, title "Skald: Odyssey App - App Store".
- `https://apps.apple.com/app/id6790579937?ct=meta-test-1` → 200, same page, `ct` kept through the redirect.

## Social card

Generator found: `/Volumes/Dev/Code/skald-handoff-archive/skald-opus-20260915/web-candidate/og-render/`
(`og.html`, `og-render.mjs`, fonts, `03-parallel.png` sha256 `0fb91a86…`). Re-running it unchanged
reproduces the archived PNG byte for byte, and `sips -s format jpeg -s formatOptions 90` reproduces
the live `skald-odyssey-og-070.jpg` byte for byte (`4600afb1…`). The candidate removes only the
`<p class="preview">A look at our next app update.</p>` line (and the matching assertion);
`og-render/` here holds the two edited files. Before and after: `social-card-before.jpg`,
`social-card-after.jpg`. Card text is now "Skald: Odyssey / Spend some time with the Odyssey."
The image alt is unchanged: it describes the screenshot. The old file stays in `assets/`.

## What stays stale, and why

- The four screenshots and the social card's screenshot were taken on 0.7.0, and their alts say
  "Skald 0.7.0 on iPhone/iPad…". That is accurate of the images; new captures are a separate job.
- "Hear about the next update." (email sign-up heading) is about future news, not a version.
- `/get/` Google Play badge keeps its campaign tags; campaigns are paused.
- `/translations/**` (mirror only) and `/mosaic/` (252 records, encrypted) are not touched.

## Switch when Google approves the 27 countries

`google-approval-switch.patch` (applies cleanly to this candidate): the kept sentence and the added
one become one sentence in `index.html`, `app.js` and `get/index.html`:

- `/`: Skald is available on Android, iPhone, and iPad in the United States, Canada, Australia, New Zealand and the 27 member states of the European Union.
- `/get/`: Available in the United States, Canada, Australia, New Zealand and the 27 member states of the European Union.

It also moves the `verify-site.mjs` pin. Same two gates as the update post's variant A. The
switched wording is part of this review; it changes `index.html`, so the registry hash moves again.

## What `skald/verify-landing-copy.py` needs after arbitration

It fails on this candidate by design. To pass again:

1. A new review folder under `skald/docs/` (the script hard-codes `docs/store-web-2026-09-15-native`
   on its line 15; that path must be changed to the new folder) containing `review-registry.json`
   and `resolved-index.html`.
2. `review-registry.json` fields the script reads:
   - `decision`: `"APPROVED"`; `roles`: a list whose entries have three distinct `sessionId` values.
   - `approved_sha256["resolved-index.html"]`: must equal sha256 of `skald/index.html` and of the
     folder's `resolved-index.html` (so that file is a byte copy of the final page).
   - `websiteFilesSha256`: map of path under `skald/` → sha256, each checked. The current one lists
     `index.html`, `styles.css`, the four screenshot webps and `assets/skald-odyssey-og-070.jpg`; the
     new one should list the new card (and may add `app.js`, `get/index.html`, `availability.json`).
   - `supersession.priorWebsiteRegistry.supersededEntries["approved_sha256.resolved-index.html"]`
     must equal the prior registry's approved hash, and `.replacement` must equal sha256 of
     `skald/index.html`. The prior registry is hard-coded as
     `docs/store-web-2026-09-13/content-review-registry.json`; to supersede the 2026-09-15 registry
     instead (approved hash `2d52ae4d…be2b`), that path changes too.
   - `websiteTextBindings`: `hero_alt`, `greek_alt`, `map_alt`, `art_alt` (must be image alts on the
     page), `art_caption` (must be in the page), `og_and_twitter_image_url`, `og_and_twitter_image_alt`
     (must equal both metas), and `retained_release_notice` (must be in the page).
3. Script edits forced by the copy itself: the assertions `'Preview' in meta description`,
   `'next' in og:description` and the `retained_release_notice` binding contradict the candidate
   and must be removed or replaced; the final PASS message names them.
4. Unchanged checks that the candidate already meets: unique ids, every `#anchor` has a target, a
   Google Play and an App Store link are present, `styles.css` and `assets/skald-odyssey-og.jpg` exist.

`skald/verify-site.mjs` is separate: it needs the mosaic password and is already red on
`origin/main` on stale landing strings ("One Odyssey.", `styles.css?v=20260722`).

## Evidence

`visual-report.json` and screenshots at 390 and 1280 px (installed Chrome): `landing-*-top.png`,
`landing-*-totals.png`, `landing-*-faq.png`, `landing-*-final-cta.png`, `get-*.png`. No horizontal
overflow, no failed request, no broken image, no release notice in the DOM.

## The landing page as a visitor reads it (candidate, extracted in reading order)

`#`/`##`/`###` mark headings, `Q:` a FAQ question, `[Image: …]` an image's alt text.

```text
Skip to content
MannaMila Skald: Odyssey
Inside Greek & translations Notes & scholarship Questions Updates Translation Atlas
Get the app
Homer, with room to explore
# Spend some time with the Odyssey.
We’ve gathered 24 translations, the Ancient Greek, thousands of reading notes, art and scholarship in one place. Read the poem and follow whatever catches your attention.
Available now on Android, iPhone, and iPad.
[Image: Download on the App Store]
[Image: Get it on Google Play]
See what’s inside ↓ Get product updates →
Free to start. Books I, II and IX are free; one purchase unlocks the rest. No subscription or app account.
Ὀδύσσεια
[Image: Skald 0.7.0 on iPhone, showing Butler's opening of Book I with reading notes and historical art.]
Open art alongside the passage you’re reading.
All 24 books
Read · compare · explore
The library
## A poem, and a lot to spend time with.
24 translations in 11 languages, plus Ancient Greek
3,285 reading notes across all 24 books
258 historical artworks and objects
52 journal articles referenced alongside the poem
01
### Read
Choose a full translation or a short retelling and read at your own pace.
02
### Compare
See how translators handle the same passage, with the Ancient Greek close by.
03
### Follow a thought
A word can lead to an ancient custom, a recurring image, or a scholar’s reading of the scene.
04
### Come back
Try another translation. Different wording can bring out a detail you passed over the first time.
Notes and scholarship
## Follow the detail that interests you.
Skald brings 3,285 reading notes to passages across all 24 books: Greek wordplay, translation choices, everyday life, recurring phrases and more. Some notes speak to a particular translation, so fresh notes can surface as you reread or change editions.
References to 52 journal articles give you somewhere to go next. For 40 of them, you can follow a direct link to the full text online; the others have a citation and DOI link.
Getting started
## Start with a translation. Or a short retelling.
Read a full translation from the start, or get your bearings with a retelling. The three telling depths offer a quick outline, a fuller account of the scenes, or a longer reading. Each retelling keeps its source details.
1
### Find your place
The central movement of a book, ready when you need to return quickly.
5
### Follow the scenes
More turns, people, and consequences while keeping the path clear.
20
### Take the long way
A fuller source-grounded telling made for a sustained reading session.
The labels describe telling depth and are not guarantees of an exact reading time.
24 translations in 11 languages
## Read it in another voice.
Choose from 13 English translations, two in French, and one each in Spanish, German, Italian, Russian, Dutch, Danish, Swedish, Hebrew and Modern Greek. Keep the Ancient Greek beside your reading and compare how translators approach the same passage.
Tap a Greek word for the Homeric lexicon. Translation comparisons include notes on the choices behind the wording.
[Image: Skald 0.7.0 on iPad, with the Ancient Greek beside an English translation.]
Read the Greek beside a translation, with linked scrolling.
Follow the journey
## Find your bearings.
Follow the voyage on the map, see what happens to the fleet, and look up a person or place when you need a reminder.
Open a map or note, spend a little time with it, and return to your passage.
[Image: Skald 0.7.0 voyage map with locations from the Odyssey.]
Trace the long route toward home without leaving the reader.
236 artworks and artifacts · 48 museums and collections
## See what others saw in the poem.
The museum gallery has 236 artworks and objects from 48 museums and collections. Another 22 historical works appear alongside the reading, bringing the library to 258 distinct works. Explore paintings, prints and ancient objects connected to the story and its world. Some picture an Odyssey scene; others help explain a custom, a craft or an everyday object. Open a work for its collection, source and rights details.
You can also browse the Art Atlas on the web. Collection links open when you’re online.
[Image: Skald 0.7.0 showing Pieter Lastman’s Odysseus and Minerva with its collection details and a reading note.]
Open an artwork alongside the poem.
Keep reading offline
## Take the library with you.
The text, reading notes, translations, Ancient Greek, glossary, maps and bundled art live on your device. Read on a flight, on a train, or wherever you happen to have some time.
Read, compare, and find your place without a connection.
✦ Reading stays ready offline
Article links and external museum, catalog and reference pages need an internet connection. Your saved passage and preferences stay in app storage. See app privacy for details.
Reading across centuries
## A little closer to ancient lives.
A meal, a welcome for a stranger, a boat taking shape, someone waiting at home. Spending time with these details can bring the people in the poem a little closer.
### Generations of readers
Translators, artists and scholars have spent centuries thinking about the Odyssey. Their work gives us more to notice and more to think about as we read.
### Time to follow an idea
Stay with a passage for a minute or an hour. Follow a note into the art or scholarship, then come back to the story whenever you’re ready.
### Another reading
There is more here than you are likely to explore in one reading. Try a second translation, or a third, and see which details catch your attention this time.
For curious adults and parent-led reading. The poem includes violence and mature themes.
Product updates
## Hear about the next update.
Get occasional news about new reading material and app updates.
Read the updates journal →
No account required
At most one email per month
Unsubscribe at any time
Your product-updates signup is separate from the Skald app. Read the Product Updates Privacy Notice.
Product updates
### Keep in touch with Skald.
Open the product-updates form
A few questions
## Before you start
Q: Is the whole Odyssey included?
Yes. Books I, II and IX are free to read in full. One purchase unlocks the other 21 books.
Q: What do the 1-, 5-, and 20-minute labels mean?
They mark three levels of telling depth: a quick return to the shape of a book, a fuller sequence of scenes, and a sustained source-grounded telling. They are not exact reading-time guarantees.
Q: Which translations are included?
Skald includes 24 translations: 13 in English, two in French, and one each in Spanish, German, Italian, Russian, Dutch, Danish, Swedish, Hebrew and Modern Greek. Ancient Greek is included separately. Explore the translations on the web.
Q: Can I read the original Greek?
Yes. You can place the Greek beside a telling or translation, follow corresponding passages, and open the on-device Greek glossary.
Q: Does Skald work offline?
The bundled reading library and reading tools work offline. External catalog and reference pages and online sharing services need a connection.
Q: Is this a subscription?
No. Books I, II and IX are free. A one-time purchase unlocks the remaining 21 books; the store shows your local price. A student or teacher price is available on your own attestation. People who bought Skald before it became free keep their access to the whole library.
Q: Where is Skald available?
Skald is available on Android, iPhone, and iPad in the United States, Canada, Australia, and New Zealand. On iPhone and iPad it is also available in the 27 member states of the European Union.
Q: What will product updates email me?
Occasional news about app updates and new reading material. You can unsubscribe whenever you like.
Q: Who publishes Skald?
MannaMila LLC publishes Skald independently. It is not affiliated with a film studio, publisher, museum, or modern translator.
Available on Android, iPhone, and iPad
## Start with a book of the Odyssey.
Books I, II and IX are free. Pick a translation and see what catches your attention.
[Image: Download on the App Store]
[Image: Get it on Google Play]
Get product updates →
Free to start · One purchase unlocks every book · No subscription or app account
MannaMila Playful, practical software.
App privacy Updates journal Product updates privacy Art Atlas Translation Atlas Support Back to top ↑
```

## /get/ (candidate)

```text
Skald: Odyssey
# One Odyssey. A shelf of ways through.
All 24 books · twenty-four translations · the original Greek · 236 works of museum art. Free to start — one purchase unlocks every book, with no subscription, ads, or accounts.
[Image: Download on the App Store]
[Image: Get it on Google Play]
Available in the United States, Canada, Australia, and New Zealand. On the App Store, also in the 27 member states of the European Union. About Skald: Odyssey →
```

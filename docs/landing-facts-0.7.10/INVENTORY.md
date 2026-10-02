# Landing-page facts against the reviewed 0.7.10 store copy (inventory)

**Superseded as a status record by [CANDIDATE.md](CANDIDATE.md):** the proposals under "Not changed" below are now applied as candidate edits, pending one content review.

Read 2026-10-02. Live `/`, `/app.js` and (after the back-port) `/get/` are byte-identical to this
source. Reviewed figures: `MannaMila/skald` `docs/store/releases/0.7.10/store-copy.json` and
`docs/content/reviews/release-0.7.10-2026-10-01/FINAL-listing-count-corrections.md`
(24 translations, 11 languages, 3,285 notes, 258 artworks and objects of which 236 from 48
museums and collections, 52 journal articles of which 40 with full-text links, Books I, II and IX free).

## Changed in this branch (figure only, sentence untouched)

| Page | Where | Live | Now |
| --- | --- | --- | --- |
| `/` | `meta description`, `og:description`, totals strip, "Notes" paragraph | 3,288 (×4) | 3,285 |
| `/` | `og:description`, totals strip, museum paragraph | 252 (×3) | 258 |
| `/` | `og:description`, totals strip, "References to … journal articles" | 54 (×3) | 52 |
| `/` | "For 42 of them" | 42 | 40 |
| `/` | museum eyebrow and paragraph | 230 (×2) | 236 |
| `/get/` | "eleven translations" | eleven | twenty-four |
| `/get/` | "221 works of museum art" | 221 | 236 (the museum-gallery figure; 258 would need "historical artworks and objects") |

## Changed by adding one sentence (new customer-facing words; needs the root's review)

| Page | Live sentence (kept) | Sentence added |
| --- | --- | --- |
| `/` FAQ and `app.js` `faq` (the script overwrites the FAQ text) | Skald is available on Android, iPhone, and iPad in the United States, Canada, Australia, and New Zealand. | On iPhone and iPad it is also available in the 27 member states of the European Union. |
| `/get/` | Available in the United States, Canada, Australia, and New Zealand. | On the App Store, also in the 27 member states of the European Union. |

When Google approves (both gates in the update brief): delete the added sentence in all three
places and end the kept sentence "…in the United States, Canada, Australia, New Zealand and the
27 member states of the European Union."

## Not changed: needs a rewritten sentence (proposed wording for the root)

| Page | Live | Proposed |
| --- | --- | --- |
| `/` release notice (pinned as `retained_release_notice` in the 2026-09-15 review registry) | A look at our next app update. The expanded library described here is coming in version 0.7.0; the stores currently offer an earlier version. | Remove the paragraph. |
| `/` final call to action | …The expanded library on this page arrives with version 0.7.0. | Remove the sentence. |
| `/` `meta description` | Preview the next Skald update: the Odyssey with 24 translations, 3,285 reading notes, art and scholarship to explore alongside the poem. | Read the Odyssey with 24 translations, 3,285 reading notes, art and scholarship to explore alongside the poem. |
| `/` `og:description` | A look at the next Skald update: 24 translations, … | Skald: 24 translations, 3,285 notes, 258 artworks and objects, and references to 52 journal articles, gathered around the Odyssey. |
| `/` `twitter:description` | Preview the next Skald update: read the Odyssey with translations, art and scholarship alongside the poem. | Read the Odyssey with translations, art and scholarship alongside the poem. |
| `/` section eyebrow | The library in the next update | The library |
| `/` totals `aria-label` | Library totals for the next Skald update | Library totals |
| `/` notes paragraph | The next update brings 3,285 reading notes to passages… | Skald brings 3,285 reading notes to passages… |
| `/` FAQ, translations | The next update includes 24 translations: … | Skald includes 24 translations: … |
| `/` FAQ, subscription | The next update also offers a student or teacher price on your own attestation. | A student or teacher price is available on your own attestation. (store copy wording) |
| `/` social-card image (`og_card_text_lines`) | "A look at our next app update." drawn in `skald-odyssey-og-070.jpg` | New image. |
| `/` App Store badge and `availability.json` | `apps.apple.com/us/app/skald-odyssey/id6790579937` (opens the US storefront for EU readers) | `https://apps.apple.com/app/id6790579937`; `verify-site.mjs` pins the `/us/` URL. |
| `/get/` App Store badge | `apps.apple.com/us/app/…?ct=meta-test-1` | Same, if the page is to serve EU readers. |

## Read and left as it is

| Page | Text | Why |
| --- | --- | --- |
| `/` | 24 translations in 11 languages; 13 in English…; 48 museums and collections; Another 22 historical works; Books I, II and IX are free; remaining 21 books; all 24 books | True of 0.7.10. |
| `/` | "Skald 0.7.0 on iPhone/iPad…" (four image alts, og/twitter image alt) | They describe the screenshots, which were taken on 0.7.0; pinned by the review registry. |
| `/` | "Hear about the next update." | About the email list, not a version. |
| `/get/` | All 24 books; Free to start — one purchase unlocks every book | True. |
| `/updates-privacy/` | "Your country or region: United States, Canada, Australia, New Zealand, or somewhere else." | Describes the form's choices, not availability. |
| `/support/`, `/feedback/`, `/mosaic/` | no version, count, country or timing claim (the mosaic's 252 records are inside the encrypted bundle) | — |
| `/translations/**`, `/translators/` | exist only in skald-web, not in this source; they count the atlas (233 translations), not the app | Not touched. |

## Checks

- `python3 skald/verify-landing-copy.py` **fails on this branch by design**: it pins
  `index.html` to the sha256 approved in `skald/docs/store-web-2026-09-15-native/review-registry.json`.
  Any landing edit needs a new review registry and `resolved-index.html`; none is fabricated here.
- `node scripts/test-analytics-contract.mjs`: same single failure as `origin/main`.
- `verify-site.mjs`, `test-promote-skald.mjs`: not run (mosaic password).
- `app.js` is loaded as `app.js?v=20260722`; the cache key is not bumped.

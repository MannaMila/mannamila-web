# Landing page and /get/ corrections (0.7.10): final arbitration

- **Role:** Reviewer 3 of three, the arbiter: compares both reviews, resolves disagreements, makes
  the final content decision.
- **Model:** Claude Opus 5.5 (`claude-opus-5-5`)
- **Reasoning effort:** high
- **Date:** 2026-10-02 (`2026-10-02T18:05Z`)
- **Stand-in:** the app repo's `AGENTS.md` names `gpt-5.6-sol/high` or `gpt-6-sol/high` as the
  arbiter, and the program runs that role as `gpt-6-sol`. Recorded as the update-post registry of
  2026-10-02 (`docs/marketing/updates/reviews/2026-10-02-release-0.7.10.md`) records it:
  `substitution.stands_in_for: "gpt-6-sol"`, `agents_md_role: "gpt-5.6-sol/high"`, reason "Codex
  usage limit until 2026-10-04; owner rulings 2026-09-30."
- **Reviewer 1** (accuracy): Claude Opus 5.5 (`claude-opus-5-5`), high. **Reviewer 2** (clarity):
  Claude Opus 5.5 (`claude-opus-5-5`), high. Each states it did not open the other's file.
- **This is a content review, not legal advice.** It clears no right, no privacy question and no
  store obligation. It edits no page: a site lane applies the final strings below.

## Decision

**APPROVE WITH MODIFICATIONS. Approved for publication once the final string table below is
applied exactly.** No blocker in either review. Twelve rows depart from the candidate; they are
marked in the table.

## Inputs

Website worktree `mannamila-web-landing`, branch `docs/skald-landing-facts-0.7.10`, at `5d8d4ad`.

| File | sha256 |
| --- | --- |
| `docs/landing-facts-0.7.10/CANDIDATE.md` | `2a2d87b61ad90b0c62642d5550ea92c333e2d6256e99f64a1a603d87fa673176` |
| `skald/index.html` (candidate) | `33022828e1731dd059aaae0466f77bf3d41549f5c922fc81102a35863abb75d1` |
| `skald/app.js` (candidate) | `8bbd6dc8b564c94ec186fe0358b7493fb4265b81ba70336cd280d287ab05dd71` |
| `skald/get/index.html` (candidate) | `8b55fdc48257626eba7ff4486296710f966ea9e8df16bf101858de17307babc1` |
| `skald/availability.json` (candidate) | `c9ac00c32be7719b97a43cf8f3ebd6ea308c0125aed580936bb16e551cb52559` |
| `skald/assets/skald-odyssey-og-20261002.jpg` | `636ec5cfdb95771d213beece3906696a85192cba1ed85a9eba13007c693f4415` |
| `docs/landing-facts-0.7.10/reviews/accuracy.md` | `a046a01d1facedc59a2fb597e87a5f2c6c714d1fe93a72823923a2c02b4f6b3d` |
| `docs/landing-facts-0.7.10/reviews/clarity.md` | `b0b0e0ce57b473f9c543a86fd2420eda8a3c665b42257367f58416e189e190ba` |
| `docs/landing-facts-0.7.10/google-approval-switch.patch` | `47c7c907036bec9822cdcb0c639cc717f9bad07c1a25c2a6a6379be991f5923c` |

Both reviews attest the same candidate hashes. Live baseline, re-read by the arbiter at 18:01 UTC
and still unchanged (full hashes, which CANDIDATE.md abbreviates):

| Live | sha256 |
| --- | --- |
| `/` | `2d52ae4d23fa614cb735b01920e10c6ea21b5daefb2c09f5aa8e770c24d1be2b` |
| `/app.js` | `5c6417ff99868dc8826b9763a0c349c290b2207f7c706f832c80d45d6450aeb3` |
| `/get/` | `cc67ecb5895196ee6f24c6c9e28806268a3fb5c97c7ef05130bfeb312b96a194` |
| `/availability.json` | `59eb1f9f284b19c23d736439e3ba940ceb8a54a6e1211b40bf16b738b9a7c140` |
| Old card `assets/skald-odyssey-og-070.jpg` | `4600afb1a3311ea361bb50a419887e106a8a1356ea43b879b8ad1ad8d08f6a33` |
| Card source screenshot `03-parallel.png` | `0fb91a8696fc916fd73e532b1afe77a7d736266f9c25e241830442acfbec4bf1` |

## What the arbiter checked itself

- **Availability.** App repo `skald-prod`, fetched; `origin/main` `7713edcf4`; branch
  `origin/docs/eu27-play-approval-evidence` at `068c8cb7a` (PR MannaMila/skald#520, open).
  `docs/store/territories/evidence/play-console-read-2026-10-02.md`: Publishing overview shows no
  change in review; Production → Countries / regions shows 31, read about 17:45 UTC.
  `play-post-activation-2026-10-02.json`: production track, release 0.7.10, versionCode 28, 31
  country codes (US, CA, AU, NZ and the 27 member states; counted). `ACTIVATION-0.7.10.md` on that
  branch: "Both stores now serve 0.7.10 in the 31 countries." The live `/updates/` post, read at
  18:02 UTC, says "Skald is now on the App Store and Google Play in the 27 member states of the
  European Union, as well as in the United States, Canada, Australia and New Zealand."
- **The museum figure.** `core/src/main/assets/content/odyssey/panels.json` at `v0.7.10` (the
  bundle is identical at `origin/main`): 48 groups, 236 works, 236 distinct ids. Nine of the 236
  are in collections that are not museums: Bibliothèque nationale de France 4, Römisches Haus 2,
  Palazzo Salviati 1, Collezione d'arte della Banca d'Italia 1, Royal Palace Amsterdam 1. The
  reviewed store description says "258 historical artworks and objects, including 236 from 48
  museums and collections".
- **The corrected note.** `odyssey-01-athena-visits-ithaca/master.json`, `parent_note`: "hefts a
  great fluted bronze basin beside her". `skald/assets/museum-guide.webp`, viewed: "hefts a great
  embossed shield beside her".
- **The images.** All four page screenshots and both social cards, viewed. The pages' diff against
  the live baseline (`cee6168..5d8d4ad`), read in full.
- **The archived copies** (LA-05): `robots.txt`, `sitemap.xml`, the mosaic sitemap, the site
  source, the deploy mirror and a `site:` search.
- **The final text.** The final strings were applied to copies of the three candidate files in a
  scratch directory, the reading-order text below was extracted from those copies with
  `tools/extract-text.py`, and the copies were hashed (see "Expected hashes").

Not done: no store console, no device, no install from an EU account, no run of
`verify-site.mjs` or `verify-landing-copy.py`, no edit to any page, script or registry.

## Root and owner rulings, as given

1. Owner (2026-10-02): "Yes to landing page corrections": corrections, including the stale "next
   update / coming in version 0.7.0" sentences, not a redesign; the smallest edits that make the
   page true and read naturally.
2. **Availability.** Google published the 27 EU countries on Play on 2026-10-02 at about 17:45
   UTC; both gates passed and are recorded in MannaMila/skald#520. Publish the after-approval
   wording everywhere (static FAQ, the `app.js` FAQ string, `/get/`): one sentence, both stores,
   the four countries and the 27 member states of the European Union; serial-comma style
   consistent with the rest of the page; no "with Google for review" wording anywhere. LB-01 and
   LA-01 are resolved by this.
3. **Screenshots.** The museum screenshot showing a note since corrected in the app is accepted
   for this publication as a known stale image; a recapture is owed and goes on the root's list.
   The arbiter decides the alt-text question, preferring to drop the version if the alts stay true
   descriptions without it.
4. **Seams and wording.** Accept minimal replacements that fix a seam ("Skald brings" → "Skald
   has", "twenty-four" → "24" on `/get/` if it matches that page's style, "artifacts" → "objects"
   if the page elsewhere says objects, the `og:description` shape). Reject anything that is a
   rewrite for taste.
5. **`/get/` museum figure.** Choose between "236 works of museum art" and "236 works from
   museums and collections" on accuracy.
6. **Beyond the corrections.** Add no new content now. List each of Reviewer 2's seven questions
   and LA-05 under "For the owner" with a one-line recommendation.
7. **The social card.** Approve or reject the regenerated image.
8. **CANDIDATE.md.** State the correct rows for the errors LA-04 names; the site lane corrects the
   file.

## Resolution

The reviewers do not contradict each other on any fact. They overlap on the availability
sentence, the comma, the museum screenshot, the `/get/` figure and the row-16 slip, and agree on
each. Three points needed a decision.

1. **Availability (ruling 2).** Reviewer 1 asked for the gates to be run and, if they passed, for
   the one-sentence form; Reviewer 2 wrote a two-sentence form for a day on which Google had not
   decided. Google has decided, the evidence is in #520 and the arbiter read it. The one-sentence
   form is published with the serial comma both reviewers asked for. Reviewer 2's "with Google for
   review" sentences are not used.
2. **`/get/` museum figure (ruling 5).** Reviewer 2 found "236 works of museum art" natural;
   Reviewer 1 found the noun narrower than the count. On accuracy Reviewer 1 prevails: nine of the
   236 are not in museums, and "236 from 48 museums and collections" is the reviewed store
   phrase. Final: "236 works from museums and collections".
3. **Alt texts (ruling 3).** Reviewer 1 found the "Skald 0.7.0" alts true of the images;
   Reviewer 2 found the version useless to the only readers who hear it. Both are right. The
   version is dropped, by deleting " 0.7.0" and nothing else: each alt remains a true description
   of what its image shows (checked against the four images and the card). Reviewer 2's two
   rephrasings ("The voyage map in Skald, …" and "Skald: Odyssey on iPad, …") are not taken; the
   deletion is enough and keeps the page alt and the card alt identical, as they are today. That
   the captures were taken on 0.7.0 is recorded in the new review registry, not in the alts.

The other accepted edits are the four seam fixes ruling 4 names. Each was checked against the
page: "artworks and objects" is the page's own phrase in the totals strip, the museum paragraph
and `og:description`; `/get/` writes "24 books" and "236" in digits; "Skald has … reading notes on
passages" needs "on" because "has … notes to passages" is not English; the new `og:description`
opens as the meta description does and carries the same four reviewed figures.

## Findings matrix

Disposition: **A** accepted as proposed; **M** accepted with a modification; **R** rejected.

### Reviewer 1 (accuracy)

| Finding | Severity | Finding in brief | Disposition | What to do |
| --- | --- | --- | --- | --- |
| LA-01 | major | Google Play may already serve the 27 EU countries; run the gates and publish the one-sentence form if they pass | M | Gates passed (#520, read by the arbiter). One sentence in all three places, with the serial comma of LA-06. Rows 18 and 22 |
| LA-02 | minor | The museum screenshot shows a note the app has since corrected | A | No text change. Accepted as a known stale image (ruling 3); recapture owed, first in the queue |
| LA-03 | minor | "236 works of museum art": right figure, noun slightly narrow | A | "236 works from museums and collections". Row 21 |
| LA-04 | minor | Two rows of CANDIDATE.md are inexact | A | Correct rows stated under "Corrections to CANDIDATE.md" |
| LA-05 | minor | Archived copies of the old landing page are served under `/docs/` | M | Not handled in this publication (ruling 6). "For the owner", item 8 |
| LA-06 | minor | Serial comma in the one-sentence form | A | "…Australia, New Zealand, and the 27 member states of the European Union." in all three places and in the `verify-site.mjs` pin |
| LA-07 | note | The card changed in layout as well as in the removed line | A | Card approved (see "Social card") |
| LA-08 | note | The Google Play listing still shows the 0.7.0 figures | A | Nothing on the page. "For the root" |
| LA-09 | note | `app.js` fallback `lastVerifiedAt` is still 2026-07-22 | A | No change required; nothing displays it. Optional tidy in "For the root" |
| LA-10 | note | "iPhone and iPad" on `/`, "the App Store" on `/get/` are both true | A | Moot: both phrases leave with the one-sentence form |
| LA-11 | note | The four alts are true of 0.7.0 captures; no image shows a count or version | A | Confirmed by viewing. The version leaves the alts (ruling 3); the registry records the capture version |
| LA-12 | note | Feature copy holds against 0.7.10 | A | No change |
| LA-13 | note | Links resolve | A | No change |
| LA-14 | note | Six full-text links refuse a scripted fetch | A | No change |

### Reviewer 2 (clarity)

| Finding | Severity | Finding in brief | Disposition | What to do |
| --- | --- | --- | --- | --- |
| LB-01 | major | The availability answer says nothing about Android in the EU | M | Resolved by the fact and the one-sentence form (ruling 2). The "with Google for review" replacement is not used. Row 18 |
| LB-02 | major | The museum screenshot shows corrected note text and the stale list does not say so | M | Accepted for publication (ruling 3), not recaptured first as recommended; named in "Known stale items"; recapture owed, first in the queue |
| LB-03 | minor | The `/get/` note is silent on Google Play in the EU | M | As LB-01. Row 22 |
| LB-04 | minor | "Skald 0.7.0" in five alt texts | M | Version dropped by deletion only; the two rephrasings are not taken. Rows A1 to A5 |
| LB-05 | minor | `og:description` opens with a label | A | "Read the Odyssey with 24 translations, 3,285 reading notes, 258 artworks and objects, and references to 52 journal articles." Row 2 |
| LB-06 | minor | "Skald brings … notes to passages" | A | "Skald has 3,285 reading notes on passages across all 24 books: …" Row 12 |
| LB-07 | minor | "24 … twenty-four" on `/get/` | M | "24 translations" taken; the museum noun in the same line follows LA-03, not the reviewer's line. Rows 20 and 21 |
| LB-08 | minor | "artworks and artifacts" in the museum eyebrow | A | "236 artworks and objects · 48 museums and collections". Row 14 |
| LB-09 | minor | Comma in the after-approval sentence | A | Same as LA-06 |
| LB-10 | minor | Three provenance gaps in CANDIDATE.md | A | Evidence for rows 18 and 22, the row-16 question and the full hashes are given in this file; the site lane corrects CANDIDATE.md |
| LB-11 | minor | The evidence screenshots hide the sentence under review | A | Reshoot `landing-390-faq.png` and `landing-1280-faq.png` with the header out of the way after the final wording is in |
| LB-12 | note | Meta description and `twitter:description` pass | A | Both stay as in the candidate. The optional longer versions are not taken (ruling 4) |
| LB-13 | note | The social card is complete without the line | A | Card approved; its alt follows LB-04 |
| LB-14 | note | Seams checked and sound | A | No change. "What's inside" as an eyebrow is not taken |
| LB-15 | note | Names of things, page against post | A | No change now; the open points are Q1, Q5 and Q6 in "For the owner" |
| Q1 to Q7 | question | Seven matters beyond the corrections | deferred | "For the owner", items 1 to 7 (ruling 6) |

### Counts

| | Blocker | Major | Minor | Note | Total | Accepted | Accepted, modified | Rejected |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Reviewer 1 | 0 | 1 | 5 | 8 | 14 | 12 | 2 | 0 |
| Reviewer 2 | 0 | 2 | 9 | 4 | 15 | 10 | 5 | 0 |
| Both | 0 | 3 | 14 | 12 | 29 | 22 | 7 | 0 |

No finding is rejected outright. Three proposed wordings inside accepted findings are not used:
the two "today" availability replacements of LB-01 and LB-03 (overtaken by Google's approval), the
two alt rephrasings of LB-04, and the optional longer metas of LB-12. Reviewer 2's seven questions
are deferred to the owner and are not in the counts.

## Final string table

Every customer-visible string that differs from the live page. Row numbers 1 to 23 are
CANDIDATE.md's; A1 to A5 are new. **"Candidate" column: "same" means the candidate file already
holds the final text; "CHANGED" means the site lane must edit the candidate file.** Text is given
as a visitor reads it; where the source uses an entity, the note says so.

### `/` (`skald/index.html`)

| # | Location | Live | FINAL | Candidate |
| --- | --- | --- | --- | --- |
| 1 | `meta[name="description"]` | Preview the next Skald update: the Odyssey with 24 translations, 3,288 reading notes, art and scholarship to explore alongside the poem. | Read the Odyssey with 24 translations, 3,285 reading notes, art and scholarship to explore alongside the poem. | same |
| 2 | `meta[property="og:description"]` | A look at the next Skald update: 24 translations, 3,288 notes, 252 artworks and objects, and references to 54 journal articles, gathered around the Odyssey. | Read the Odyssey with 24 translations, 3,285 reading notes, 258 artworks and objects, and references to 52 journal articles. | **CHANGED** (candidate: "Skald: 24 translations, 3,285 notes, 258 artworks and objects, and references to 52 journal articles, gathered around the Odyssey.") |
| 3 | `meta[name="twitter:description"]` | Preview the next Skald update: read the Odyssey with translations, art and scholarship alongside the poem. | Read the Odyssey with translations, art and scholarship alongside the poem. | same |
| 4 | `meta[property="og:image"]` and `meta[name="twitter:image"]` | `https://skald.mannamila.com/assets/skald-odyssey-og-070.jpg?v=070-native-20260915` | `https://skald.mannamila.com/assets/skald-odyssey-og-20261002.jpg?v=20261002` (file `skald/assets/skald-odyssey-og-20261002.jpg`, 1200 × 630, sha256 `636ec5cf…4415`) | same |
| A5 | `meta[property="og:image:alt"]` and `meta[name="twitter:image:alt"]` | Skald 0.7.0 on iPad, with the Ancient Greek beside an English translation. | Skald on iPad, with the Ancient Greek beside an English translation. | **CHANGED** (candidate keeps the live text) |
| 5 | `#get-skald p.release-preview` | A look at our next app update. The expanded library described here is coming in version 0.7.0; the stores currently offer an earlier version. | (element removed; the card opens with "Available now on Android, iPhone, and iPad.") | same |
| 6 | `a[data-store-link="ios"]` `href`, twice (hero card and final call to action) | `https://apps.apple.com/us/app/skald-odyssey/id6790579937` | `https://apps.apple.com/app/id6790579937` | same |
| A1 | `img[src^="./assets/reader-art.webp"]` `alt` | Skald 0.7.0 on iPhone, showing Butler's opening of Book I with reading notes and historical art. | Skald on iPhone, showing Butler's opening of Book I with reading notes and historical art. (source keeps `Butler&#x27;s`) | **CHANGED** |
| 7 | `#inside .section-heading p.eyebrow` | The library in the next update | The library | same |
| 8 | `ul.proof-strip` `aria-label` | Library totals for the next Skald update | Library totals | same |
| 9 | `ul.proof-strip`, second item | 3,288 reading notes across all 24 books | 3,285 reading notes across all 24 books | same |
| 10 | `ul.proof-strip`, third item | 252 historical artworks and objects | 258 historical artworks and objects | same |
| 11 | `ul.proof-strip`, fourth item | 54 journal articles referenced alongside the poem | 52 journal articles referenced alongside the poem | same |
| 12 | `#notes .section-heading`, first paragraph, first sentence | The next update brings 3,288 reading notes to passages across all 24 books: Greek wordplay, translation choices, everyday life, recurring phrases and more. | Skald has 3,285 reading notes on passages across all 24 books: Greek wordplay, translation choices, everyday life, recurring phrases and more. | **CHANGED** (candidate: "Skald brings 3,285 reading notes to passages across…") |
| 13 | `#notes .section-heading`, second paragraph | References to 54 journal articles give you somewhere to go next. For 42 of them, you can follow a direct link to the full text online; the others have a citation and DOI link. | References to 52 journal articles give you somewhere to go next. For 40 of them, you can follow a direct link to the full text online; the others have a citation and DOI link. | same |
| A2 | `img[src^="./assets/greek-split.webp"]` `alt` | Skald 0.7.0 on iPad, with the Ancient Greek beside an English translation. | Skald on iPad, with the Ancient Greek beside an English translation. | **CHANGED** |
| A3 | `img[src^="./assets/nostos-route.webp"]` `alt` | Skald 0.7.0 voyage map with locations from the Odyssey. | Skald voyage map with locations from the Odyssey. | **CHANGED** |
| 14 | `#art p.eyebrow` | 230 artworks and artifacts · 48 museums and collections | 236 artworks and objects · 48 museums and collections | **CHANGED** (candidate: "236 artworks and artifacts · …") |
| 15 | `#art .proof-copy`, first paragraph, first two sentences | The museum gallery has 230 artworks and objects from 48 museums and collections. Another 22 historical works appear alongside the reading, bringing the library to 252 distinct works. | The museum gallery has 236 artworks and objects from 48 museums and collections. Another 22 historical works appear alongside the reading, bringing the library to 258 distinct works. | same |
| A4 | `img[src^="./assets/museum-guide.webp"]` `alt` | Skald 0.7.0 showing Pieter Lastman’s Odysseus and Minerva with its collection details and a reading note. | Skald showing Pieter Lastman’s Odysseus and Minerva with its collection details and a reading note. (curly apostrophe kept) | **CHANGED** |
| 16 | FAQ "Which translations are included?", first sentence | The next update includes 24 translations: 13 in English, two in French, and one each in Spanish, German, Italian, Russian, Dutch, Danish, Swedish, Hebrew and Modern Greek. | Skald includes 24 translations: 13 in English, two in French, and one each in Spanish, German, Italian, Russian, Dutch, Danish, Swedish, Hebrew and Modern Greek. | same |
| 17 | FAQ "Is this a subscription?", third sentence | The next update also offers a student or teacher price on your own attestation. | A student or teacher price is available on your own attestation. | same |
| 18 | FAQ "Where is Skald available?", `p[data-availability-faq]` | Skald is available on Android, iPhone, and iPad in the United States, Canada, Australia, and New Zealand. | Skald is available on Android, iPhone, and iPad in the United States, Canada, Australia, New Zealand, and the 27 member states of the European Union. | **CHANGED** (candidate has two sentences) |
| 19 | `.final-cta-inner`, paragraph under the heading | Books I, II and IX are free. Pick a translation and see what catches your attention. The expanded library on this page arrives with version 0.7.0. | Books I, II and IX are free. Pick a translation and see what catches your attention. | same |

Not visible on `/`: `<script src="./app.js?v=20260722">` → `./app.js?v=20261002` (same as the
candidate). The image URLs keep their `?v=070-native-20260913` cache keys. `og:title`,
`twitter:title`, the Google Play links and every other string are unchanged from live.

### `/app.js`

| # | Location | Live | FINAL | Candidate |
| --- | --- | --- | --- | --- |
| 18 | `availabilityCopy()` → `faq` (written into `p[data-availability-faq]` at load; must be string-equal to the static paragraph) | Skald is available on Android, iPhone, and iPad in the United States, Canada, Australia, and New Zealand. | Skald is available on Android, iPhone, and iPad in the United States, Canada, Australia, New Zealand, and the 27 member states of the European Union. | **CHANGED** (candidate has two sentences) |
| 6 | `LAUNCHED_AVAILABILITY.ios.storeUrl` | `https://apps.apple.com/us/app/skald-odyssey/id6790579937` | `https://apps.apple.com/app/id6790579937` | same |

`status` ("Available now on Android, iPhone, and iPad.") and `kicker` ("Available on Android,
iPhone, and iPad") are unchanged from live. `LAUNCHED_AVAILABILITY.lastVerifiedAt` stays
`"2026-07-22T00:00:00-04:00"` (not displayed; LA-09).

### `/availability.json`

| # | Key | Live | FINAL | Candidate |
| --- | --- | --- | --- | --- |
| 6 | `ios.storeUrl` | `https://apps.apple.com/us/app/skald-odyssey/id6790579937` | `https://apps.apple.com/app/id6790579937` | same |
| — | `lastVerifiedAt` (not displayed) | `2026-07-22T23:51:30-04:00` | `2026-10-02T13:44:02-04:00` | same |

`android.state`, `android.storeUrl` and `ios.state` are unchanged.

### `/get/` (`skald/get/index.html`)

| # | Location | Live | FINAL | Candidate |
| --- | --- | --- | --- | --- |
| 20, 21 | `p.get-dek`, first sentence | All 24 books · eleven translations · the original Greek · 221 works of museum art. | All 24 books · 24 translations · the original Greek · 236 works from museums and collections. (source keeps `&middot;`) | **CHANGED** (candidate: "… · twenty-four translations · the original Greek · 236 works of museum art.") |
| 22 | `p.get-note`, text before the `<br>` | Available in the United States, Canada, Australia, and New Zealand. | Available in the United States, Canada, Australia, New Zealand, and the 27 member states of the European Union. | **CHANGED** (candidate has two sentences) |
| 23 | `.get-badges`, first link `href` | `https://apps.apple.com/us/app/skald-odyssey/id6790579937?ct=meta-test-1` | `https://apps.apple.com/app/id6790579937?ct=meta-test-1` | same |

The second sentence of `p.get-dek` ("Free to start — one purchase unlocks every book, with no
subscription, ads, or accounts."), the Google Play link with its campaign tags, the page's own
meta description and title are unchanged from live.

### Rows that depart from the candidate

Twelve rows, thirteen places: 2; 12; 14; 18 (in `index.html` and in `app.js`); 20 and 21 (one
sentence); 22; A1; A2; A3; A4; A5 (two metas). Rows 1, 3 to 11, 13, 15 to 17, 19 and 23 are approved as the candidate has
them.

### The three availability sentences

- `/`, static FAQ: **Skald is available on Android, iPhone, and iPad in the United States, Canada, Australia, New Zealand, and the 27 member states of the European Union.**
- `/app.js`, `faq`: the same string, character for character.
- `/get/`: **Available in the United States, Canada, Australia, New Zealand, and the 27 member states of the European Union.**

On `/` the sentence names the three devices, which covers both stores. On `/get/` it stands
directly under the two store badges and is unqualified, so it speaks for both.

### Expected hashes

If the changed rows are applied to the candidate files at the input hashes above as plain string
replacements, and nothing else changes, the files hash to:

| File | sha256 after applying |
| --- | --- |
| `skald/index.html` | `a48fec9daa94f738408d3d8ab240039d2daf07ba5c34fe049c9f64e9bc30a132` |
| `skald/app.js` | `c07ce27bbe0476577ea8dfad7490732f15d32b859ef75f0866acc020efd5c899` |
| `skald/get/index.html` | `09ced3b5ec6f4eb5c9dd6978832358266096a64e94dc74c8ba2a13318d7d2434` |
| `skald/availability.json` | `c9ac00c32be7719b97a43cf8f3ebd6ea308c0125aed580936bb16e551cb52559` (unchanged from the candidate) |

A different hash means something other than the table was changed; the table governs, the hashes
are a check.

## Social card

**Approved:** `skald/assets/skald-odyssey-og-20261002.jpg` (1200 × 630, sha256 `636ec5cf…4415`,
byte-identical to `social-card-after.jpg`).

- Compared with `social-card-before.jpg` by eye and by the generator diff against the archived
  `og.html` and `og-render.mjs`: the only change is the removed line "A look at our next app
  update." and its assertion. The title, rule and tagline sit about 24 px lower because the block
  is centred and lost a line; the screenshot is untouched.
- Drawn text: "Skald: Odyssey" and "Spend some time with the Odyssey." **No figure and no version
  is drawn in the card**, so there is no number to correct. The screenshot inside it shows Book I,
  "Butler (1900) · EN", "Athena Visits Ithaca", Story / Ἑλληνικά / Parallel and the Greek text;
  all exist in 0.7.10. It crops the Lastman plate above the note, so the corrected sentence is not
  in the card.
- Final alt, both metas: "Skald on iPad, with the Ancient Greek beside an English translation."
- The old file `assets/skald-odyssey-og-070.jpg` stays served; links shared earlier may keep
  showing it from platform caches.

## Corrections to CANDIDATE.md (ruling 8)

The site lane corrects the file; these are the correct rows.

- **Row 16, location:** `/`, FAQ "Which translations are included?" (not "How many translations
  are included?").
- **Counts line:** "2 link changes in 5 customer-facing places (row 6: the hero badge, the final
  call-to-action badge, `availability.json`, the `app.js` fallback; row 23: the `/get/` badge),
  plus the `verify-site.mjs` pin, which no visitor sees."
- **Rows 18 and 22, type and basis:** "rewrite" (one sentence), not "new sentence". Basis:
  MannaMila/skald#520, `docs/store/territories/evidence/play-console-read-2026-10-02.md` (Play
  Console, about 17:45 UTC) and `play-post-activation-2026-10-02.json` (31 country codes,
  production, versionCode 28); App Store: `ACTIVATION-0.7.10.md` row A6 and Reviewer 1's lookups
  at 17:51 UTC. The sentence "Google Play in four with the 27 in review" is no longer true and
  comes out.
- **Rows 2, 12, 14, 20 and 21:** candidate text as in the final string table. **New rows A1 to
  A5:** the five alt texts.
- **"What stays stale":** add the museum screenshot and its corrected sentence; the alts no longer
  say "Skald 0.7.0".
- **"Switch when Google approves":** spent. `google-approval-switch.patch` is superseded by rows 18
  and 22 (it lacks the serial comma and no longer applies once they are in).
- **Hashes:** give the live baseline and the card's source screenshot in full, as in "Inputs".

## Final text of `/` in reading order

Extracted with `tools/extract-text.py` from the candidate with the final strings applied.
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
[Image: Skald on iPhone, showing Butler's opening of Book I with reading notes and historical art.]
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
Skald has 3,285 reading notes on passages across all 24 books: Greek wordplay, translation choices, everyday life, recurring phrases and more. Some notes speak to a particular translation, so fresh notes can surface as you reread or change editions.
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
[Image: Skald on iPad, with the Ancient Greek beside an English translation.]
Read the Greek beside a translation, with linked scrolling.
Follow the journey
## Find your bearings.
Follow the voyage on the map, see what happens to the fleet, and look up a person or place when you need a reminder.
Open a map or note, spend a little time with it, and return to your passage.
[Image: Skald voyage map with locations from the Odyssey.]
Trace the long route toward home without leaving the reader.
236 artworks and objects · 48 museums and collections
## See what others saw in the poem.
The museum gallery has 236 artworks and objects from 48 museums and collections. Another 22 historical works appear alongside the reading, bringing the library to 258 distinct works. Explore paintings, prints and ancient objects connected to the story and its world. Some picture an Odyssey scene; others help explain a custom, a craft or an everyday object. Open a work for its collection, source and rights details.
You can also browse the Art Atlas on the web. Collection links open when you’re online.
[Image: Skald showing Pieter Lastman’s Odysseus and Minerva with its collection details and a reading note.]
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
Skald is available on Android, iPhone, and iPad in the United States, Canada, Australia, New Zealand, and the 27 member states of the European Union.
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

## Final text of `/get/` in reading order

```text
Skald: Odyssey
# One Odyssey. A shelf of ways through.
All 24 books · 24 translations · the original Greek · 236 works from museums and collections. Free to start — one purchase unlocks every book, with no subscription, ads, or accounts.
[Image: Download on the App Store]
[Image: Get it on Google Play]
Available in the United States, Canada, Australia, New Zealand, and the 27 member states of the European Union. About Skald: Odyssey →
```

## Known stale items accepted for publication

| Item | Why it is accepted | Owed |
| --- | --- | --- |
| `assets/museum-guide.webp` shows the Lastman note as "hefts a great embossed shield"; 0.7.10 reads "hefts a great fluted bronze basin" | Root ruling 3. The alt does not quote the note; the title, artist, year and museum in the image match 0.7.10 | Recapture from 0.7.10, first in the queue |
| All four page screenshots and the card's screenshot were captured on 0.7.0 | Differences from 0.7.10 are layout only (heading, note-mark and margin sizes). The hero shows Butler, as its alt says; a new install opens in Murray | Recapture after the museum image. Record "captured on 0.7.0" in the new registry (`websiteAssetSourceCaptures`), since the alts no longer say it |
| Image cache keys `?v=070-native-20260913` | In URLs only; the files are unchanged | Change with the recapture |
| Old card `assets/skald-odyssey-og-070.jpg` stays served | Earlier shares point at it; platform caches hold it either way | None |
| "Hear about the next update." | About the email list, not a version | None |
| `/get/` campaign tags (`ct=meta-test-1`, the Play `referrer`) | Campaigns are paused; the tags are harmless | Review when campaigns resume |
| `app.js` fallback `lastVerifiedAt` `2026-07-22` | Nothing displays it | Optional tidy |
| Unused `.release-preview` rule in `styles.css` | `styles.css` is not touched | Optional tidy |
| Archived `resolved-index.html` copies under `/docs/` keep the old notice and figures | Not linked, not in a sitemap; see "For the owner", item 8 | Owner decision |
| Evidence screenshots `landing-390-faq.png`, `landing-1280-faq.png` | Evidence only, not published | Reshoot after applying (LB-11) |

Off the page, and not made stale by it: the Google Play listing still shows the 0.7.0 figures
(LA-08), and the web Art Atlas holds 252 records against the app's 258 (the page states no count
for the atlas).

## For the owner

Nothing here is added to the page now (ruling 6). One recommendation each.

1. **Q1, interface language.** The page now addresses 27 more countries and says "24 translations
   in 11 languages". Recommend: yes, as the first follow-up; add the approved post sentence "The
   app's interface, notes and retellings are in English." to the "Which translations are
   included?" answer, through its own review.
2. **Q2, hearing when EU Android opens.** Overtaken: Android is open in the EU. What remains is
   the sign-up form's country list (four countries or "somewhere else"). Recommend: leave it until
   you decide whether inviting EU sign-ups fits the Product Updates Privacy Notice.
3. **Q3, a "Where is it available?" link beside the badges.** Mostly overtaken for EU readers; it
   still matters for visitors elsewhere (the United Kingdom, for one). Recommend: not now.
4. **Q4, recapture order.** Recommend: the museum image first, then the other three and the card;
   check the voyage-map capture (Android tablet) against 0.7.10 while doing it.
5. **Q5, two translations side by side.** The post leads with it; the page never says it.
   Recommend: one sentence in "Read it in another voice." at the next copy pass.
6. **Q6, one name for the Greek word help** ("Homeric lexicon", "Greek glossary", "Greek word
   cards"). Recommend: settle what each is and use one name per thing at the next copy pass.
7. **Q7, "24 translations in 11 languages" on `/get/`.** Recommend: take it when campaigns
   resume; the page is `noindex` and unfed today.
8. **LA-05, the archived review copies.**
   `/docs/store-web-2026-09-15-native/resolved-index.html` and
   `/docs/store-web-2026-09-13/resolved-index.html` return 200 and keep the old notice, the old
   figures and the `/us/` link. They are **not linked** from any page in the site source or the
   deploy mirror, **not in** `sitemap.xml` or the mosaic sitemap, and a `site:` search finds
   nothing; `robots.txt` allows everything; each carries `rel="canonical"` to `/`. The review
   registries beside them (`review-registry.json`) are public too. Recommend, least invasive: one
   line, `Disallow: /docs/`, in the deployed `robots.txt`. Do not add `noindex` to the files: they
   are hash-pinned review records and must stay byte-identical. Not serving `docs/` at all is the
   cleaner end state, but it is a deploy-script change.

## For the root

1. **Site lane, apply:** the thirteen places marked CHANGED, then check the three expected hashes.
   Pins that move with them: `verify-site.mjs` country string → "United States, Canada, Australia,
   New Zealand, and the 27 member states of the European Union"; `verify-site.mjs` map-alt
   assertion → "Skald voyage map with locations from the Odyssey."; the new registry's `hero_alt`,
   `greek_alt`, `map_alt`, `art_alt` and `og_and_twitter_image_alt` bindings → rows A1 to A5; the
   `retained_release_notice` binding and the `'Preview'` and `'next'` assertions in
   `verify-landing-copy.py` go, as CANDIDATE.md already says. Drop `google-approval-switch.patch`.
2. **Site lane, record:** correct CANDIDATE.md as listed above; reshoot the two FAQ evidence
   screenshots.
3. **Merge MannaMila/skald#520.** The published sentence rests on evidence that is on a branch
   (`068c8cb7a`), not yet on `main`.
4. **Recapture** `museum-guide.webp` from 0.7.10 (owed under ruling 3), then the rest.
5. **Google Play listing** still shows "3,288 reading notes, 252 historica…" (LA-08); the listing
   update is owed.
6. **Art Atlas on the web:** 252 records against 258 in the app; a mosaic refresh is owed.
7. **Not checked by anyone:** an install or purchase from an EU account on Google Play (the
   evidence file says so), and where the storefront-neutral App Store link lands for a desktop
   visitor on an EU network.
8. **Optional:** `app.js` fallback `lastVerifiedAt`; the unused `.release-preview` rule.

## Decision line

**APPROVED FOR PUBLICATION once applied exactly:** the final string table above, on `/`,
`/app.js`, `/availability.json` and `/get/`, with the social card
`skald/assets/skald-odyssey-og-20261002.jpg`. Any other change to a customer-visible string needs
a new review.

# Landing page copy edits, round 2: final arbitration

- **Role:** Reviewer 3 of three, the arbiter: compares both reviews, resolves disagreements, makes
  the final content decision.
- **Model:** Claude Opus 5.5 (`claude-opus-5-5`)
- **Reasoning effort:** high
- **Date:** 2026-10-02 (`2026-10-02T19:40Z`)
- **Stand-in:** the app repo's `AGENTS.md` names `gpt-5.6-sol/high` or `gpt-6-sol/high` as the
  arbiter, and the program runs that role as `gpt-6-sol`. Recorded as this morning's landing
  registry (`skald/docs/landing-2026-10-02/review-registry.json`) records it:
  `substitution.stands_in_for: "gpt-6-sol"`, `agents_md_role: "gpt-5.6-sol/high"`, reason "Codex
  usage limit until 2026-10-04; owner rulings 2026-09-30."
- **Reviewer 1** (accuracy): Claude Opus 5.5 (`claude-opus-5-5`), high. **Reviewer 2** (clarity):
  Claude Opus 5.5 (`claude-opus-5-5`), high. Each states it did not read the other's file. The
  registry should record the models actually used.
- **This is a content review, not legal advice.** It clears no right, no privacy question and no
  store obligation. It edits no page, script or registry: a site lane applies the final strings
  below.

## Decision

**APPROVE WITH MODIFICATIONS. Approved for publication once the final string table below is
applied exactly.** No blocker in either review. All four candidate rows change, and one row is
added (the offline list). `app.js` and `/get/` do not change.

## Inputs

Website worktree `mannamila-web-copy2`, branch `docs/skald-landing-copy-2`, at `4889d64`.

| File | sha256 |
| --- | --- |
| `docs/landing-copy-2/CANDIDATE.md` | `7c0262361f1c49b1139f575e2164f2733252f17ba607fe7ce230f5d26a2e0c09` |
| `skald/index.html` (candidate) | `64b17c1cbfaf41d55b0500946c0b1481bfe81d02a3ea7c92dcca780c6969109b` |
| `skald/app.js` (candidate, unchanged from live) | `c07ce27bbe0476577ea8dfad7490732f15d32b859ef75f0866acc020efd5c899` |
| `skald/get/index.html` (unchanged from live) | `09ced3b5ec6f4eb5c9dd6978832358266096a64e94dc74c8ba2a13318d7d2434` |
| `docs/landing-copy-2/reviews/accuracy.md` | `8aa2b05b30dd127222d156773a7c1d93864a85ff0d0ddf11b8e0b9757deb55e7` |
| `docs/landing-copy-2/reviews/clarity.md` | `1e9dceeacac7d8f0e7eba67c433dc4c4529d688a6c2b252e325aeb6ad0679d7a` |

Both reviews attest the same candidate hashes. Live baseline, fetched by the arbiter at 19:37 UTC:
`/` `a48fec9daa94f738408d3d8ab240039d2daf07ba5c34fe049c9f64e9bc30a132` (identical to
`origin/main:skald/index.html`), `/app.js` `c07ce27b…5899` (identical to the candidate).

Evidence: the app at tag `v0.7.10` (`9a781e27`) in `/Volumes/Dev/Code/skald-prod`, read with
`git show` and `git grep`; bundled content extracted from the tag with `git archive` into a
scratch folder. The checkout was not changed. The store copy is quoted from `origin/main`
(`docs/store/releases/0.7.10/store-copy.json`), which is not in the tag.

## What the arbiter checked itself

- **Translations and languages.** `core/src/main/assets/content/odyssey/translations.json`: 24
  entries; language codes `en` 13, `fr` 2, and one each `es`, `de`, `it`, `ru`, `nl`, `da`, `sv`,
  `he`, `el`: 11 languages. The Greek original is `greek.json`, not a registry entry.
- **Interface language.** No `values-<language>` folder (only `values` and `values-v31/themes.xml`),
  no `.lproj`, `.strings` or `.xcstrings` file, and `composeResources` holds fonts only.
- **Parallel.** `ReaderModeControls.kt:350-352`: the switch reads "Story", "Ἑλληνικά", "Parallel";
  "Parallel" is added only when `parallelEnabled` (`:86`, a translation is open).
  `SplitReader.kt:108`: `if (maxWidth > maxHeight)` puts the panes in a row; otherwise a column,
  one above the other (`:136` onward, with a separator made for the stacked case). The stacked
  layout therefore applies to a phone **and** a tablet held upright. Goldens exist for both
  (`reader_parallel_portrait_light.png`, `reader_parallel_landscape_light.png`). A new install
  opens on Murray (`ReadingSourceDefaults.kt:18`), so Parallel is on offer from first launch.
- **The word card.** `GreekPane.kt:194-308` (`GreekWordPopover`): a card with no title; book and
  line; the headword; a proper-name label; then either `"pronounced in Greek: …"` or a
  transliteration; the tapped form with its grammar; the definitions and etymology, or "No
  dictionary entry for this form."; the credit. `GreekWordInfo.kt:19`: the pronunciation is "set
  only when [properName]". The credit string in `lexicon/autenrieth.json` is "Autenrieth, A
  Homeric Dictionary (Harper & Brothers, 1891) · digitized by the Perseus Project, Tufts
  University; via Alpheios". `CHANGELOG.md:191-193`: the 207 words newly defined in this release
  were linked to their Autenrieth entries, not written afresh.
- **What the app calls it.** A search of non-test Kotlin and Swift for "dictionary", "lexicon",
  "glossary" and "word card" inside string literals finds two on-screen strings: "The Greek text,
  with a dictionary a tap away" (`PaywallStatsFormatter.kt:26`) and "No dictionary entry for this
  form." (`GreekPane.kt:273`). The help says "In the Greek, tap any word to see its meaning and
  form." (`HelpTourSteps.kt:29-30`). No screen says "word card", "lexicon" or "glossary".
- **Offline.** `scripts/ios_bundle_assets.sh:16` copies `lexicon` and `content/odyssey` into the
  iOS bundle; on Android they are assets.
- **The glossary.** See ruling 4 below; the hinge was recomputed, not taken from Reviewer 1.
- **`app.js`.** Read in full: it writes three elements only (`[data-availability-copy]`,
  `[data-availability-faq]`, `[data-availability-kicker]`, lines 70 to 76). None of the edited
  elements carries those attributes. No JSON-LD on `/`.
- **Other copies of the strings.** "Homeric lexicon", "Greek glossary" and "on-device Greek" occur
  in no served file under `skald/` other than `index.html` (the hash-pinned review copies under
  `skald/docs/` aside). `/get/` contains none of the terms.
- **The final text.** The five final strings were applied to a scratch copy of the candidate
  `index.html` as plain replacements (each matched exactly once); the reading-order text below was
  extracted from that copy with `docs/landing-facts-0.7.10/tools/extract-text.py`, and the copy was
  hashed (see "Expected hash").

Not done: no device or simulator run, no store console, no read of the live remote configuration,
no run of `verify-site.mjs` or `verify-landing-copy.py`, no edit to any page, script or registry.

## Owner request and root rulings, as given

Owner (2026-10-02): "Do the updated screenshots and copy edits on the site". The copy edits are
the three follow-ups: say the interface is in English; mention side-by-side reading; one name for
the Greek word help. Smallest edits that are true and read naturally.

1. **Language entry (LD-01).** Name the languages in the answer, exactly as the bundled registry
   lists them and consistent with the page's "24 translations in 11 languages"; decide and state
   whether the 11 include English and exclude Ancient Greek. Keep "interface, notes and retellings
   are in English" only as far as Reviewer 1 verified it; if "retellings" is not a word the page
   has used before that point, use the page's own word.
2. **Parallel.** Say where it is and what it does in one sentence, true on both phone and tablet;
   prefer wording true in both orientations ("together" over "side by side") unless side by side
   is verified everywhere. Use "Parallel" exactly as the app labels it.
3. **One name for the Greek word help (LD-04, LC-03).** Choose one reader-facing name true to
   what the reader sees in 0.7.10 on tapping a Greek word; say in a few words what it gives
   (meaning and form; pronunciation for names if verified); keep the scholarly anchor if it costs
   under ten words. Apply the name everywhere on the page; give every replaced sentence.
4. **"glossary" (LC-01, LD-07).** Settle in the code and content at `v0.7.10` whether there is any
   reader-visible glossary, list of people and places, or index, and write the list item so it
   names only things that exist and work offline.
5. **LD-08** and similar one-word fixes: accept only if the word is plainly inconsistent with the
   page's own usage.
6. **Store listing** ("Homeric lexicon"): out of scope; list under "For the owner".
7. **`app.js`** and the static HTML must say the same thing wherever `app.js` overwrites text; say
   exactly which `app.js` strings change, if any.

## Resolution

The reviewers contradict each other on one fact (the glossary) and differ in emphasis on the
name. Reviewer 1 is right on the fact. Everything else is compatible.

### Ruling 1: the language answer

Reviewer 2 is right that the answer must stand alone: each FAQ answer is closed until its question
is tapped, so "11 languages" with no language named does not answer "is it in mine?". The answer
names all eleven.

- **The count.** The 11 **include** English and Modern Greek and **exclude** Ancient Greek, which
  is the original, not one of the 24 translations. That matches the page's own "24 translations in
  11 languages, plus Ancient Greek" and "Ancient Greek is included separately". The list is the
  registry's set exactly, in English names, in the order the page already uses twice. English
  comes first, which also closes Reviewer 1's optional point in LC-06 (that "11 languages" after
  "…are in English" could be read as eleven besides English).
- **"interface, notes and retellings are in English"** stands as Reviewer 1 verified it (LC-04,
  LC-05) and as the arbiter re-checked the interface part. "Retellings" is the page's own word
  before this point: "a short retelling" in the first feature card, "Or a short retelling." in the
  "Getting started" heading, and twice in the paragraph under it. No substitute is needed.
- "are in" replaces "cover": it is the page's own phrase and the app's ("24 translations in 11
  languages.").
- Ancient Greek is not added to this answer. The answer above says it is included separately and
  the next question is about it.

### Ruling 2: Parallel

"Side by side" is not verified everywhere, so it is not used. The panes sit side by side only when
the window is wider than it is tall; held upright, a phone or a tablet shows one translation above
the other. "Together" is true in both and is the word the update post and the App Store "What's
New" text use.

Reviewer 2's other point is taken: after a paragraph that opens "Choose from 13 English
translations…", a bare "Choose Parallel" reads for a moment like one more translation to pick.
"In the reader" says where; "mode" says what kind of thing it is (the app's help titles the switch
"Reading modes"). "Parallel" keeps the app's exact label and capital.

Final: **In the reader, choose Parallel mode to read two translations together.**

### Ruling 3: one name for the Greek word help

**The name is "word card".** The dictionary is named once, as the source of the meanings, not as a
second name for the feature.

- What a reader sees on tapping a Greek word in 0.7.10 is a card about that word. It opens for
  every word, including a word with no dictionary entry and a proper name with no definition, and
  it carries more than a dictionary gives: the form and grammar (from the treebank), the
  pronunciation of names (Skald's own), where the word sits, and for ten translations a quoted
  line. "Dictionary" or "lexicon" as the name would describe one part of it.
- "Greek word cards" is the name in the update post on the same site and in the Google Play
  release notes. The app's own screens do not name the card; where they speak of it they say
  "dictionary", and the card credits *A Homeric Dictionary*. The post relates the two the same
  way: "The dictionary behind the Greek word cards".
- So the page says "word card" for what opens, and says once that the meanings come from a Homeric
  dictionary. That is true to the app's screens, to the post, and to the store's "Homeric
  lexicon", which is the same dictionary.
- The second "Greek" is dropped (LD-05): after "a Greek word", "its word card" is the same name.
- **What it gives:** "the meaning and form" is the app's own description. "For names, the
  pronunciation" is verified (the card prints "pronounced in Greek: …" for proper names only) and
  is added with that qualification, which answers Reviewer 2's objection to an unqualified
  "pronunciation".
- **The scholarly anchor** is kept in the FAQ answer, the classicist's question: "The meanings
  come from a Homeric dictionary" is seven words; "stored on your device" carries over the live
  sentence's "on-device", now attached to the thing that is stored. The generic "a Homeric
  dictionary" is used rather than Autenrieth's name: it is the title of the work the card credits,
  and it is the wording Reviewer 2 reviewed.

The name is applied in three places: the translations paragraph (C3), the Greek FAQ answer (C4)
and the offline list (N1, ruling 4). After the change the page says "word card(s)" three times,
"a Homeric dictionary" once, and "lexicon" and "glossary" nowhere.

### Ruling 4: "glossary"

**There is no reader-visible glossary, list of people and places, or index in 0.7.10.** Reviewer 1
(LC-01) is upheld; Reviewer 2's "glossary of people and places" (LD-07) names something that does
not exist and is rejected.

- The only thing the code calls a glossary is the vocabulary list inherited from the
  bedtime-story build (`GlossaryTerm`, `vocab_candidates`). Counted at the tag: 120 entries across
  the 24 books, 93 distinct words, none capitalised, all common nouns ("council", "suitor",
  "omen", "harbor" …). No entry is a person or a place.
- The reader shows that list only when the concept notes do not resolve for the text on screen
  (`ReaderStateBuilder.kt:172-176`, `ReaderViewModel.kt:509-522`). The arbiter recomputed the
  fingerprint the reader checks (`ConceptSpanResolver.kt`, `ConceptSourceFingerprint.kt`) for
  every source in every book: 576 of 576 translation texts (24 books × 24 translations) and 106 of
  106 retelling texts (72 plain, 34 gentler) match the bundled `concept-mentions.json`, and every
  one of them has anchors. `KeyConcepts` is on by default (`FeatureGate.kt:19`). So the old
  vocabulary popover is not shown anywhere in the shipped Odyssey.
- The panels the reader registers are the voyage map, the Olympian family tree, the fleet and the
  museum (`OdysseyPanels.kt`). None is a glossary or an index. No on-screen string contains
  "glossary", "people and places" or "index".
- Limit of this check, as Reviewer 1 says: the gate is remotely switchable, and the arbiter cannot
  see the live remote configuration. The app was not run.

On the live page "glossary" in the offline list most plausibly meant the Greek word help (the FAQ
called it "the on-device Greek glossary"). Its true successor is the word card, which does work
offline: the dictionary and each book's word list are bundled on both platforms. Reviewer 1's
preferred replacement is taken, with the echo "Ancient Greek, Greek word cards" removed for the
same reason as LD-05.

Final: **The text, reading notes, translations, Ancient Greek with its word cards, maps and
bundled art live on your device.**

### Ruling 5: "telling" → "retelling" (LD-08)

Accepted. Wherever the page pairs the short version with "translation" it says "retelling" (three
of three other places: "a full translation or a short retelling", "Start with a translation. Or a
short retelling.", "Read a full translation from the start, or … a retelling"). "Telling"
otherwise occurs only in "telling depth" and "source-grounded telling". "A telling or translation"
is the one exception, and after this change it would sit directly under an answer that says
"retellings". One word, in a sentence already being edited. The fact holds: the "Ἑλληνικά" mode is
offered with a retelling as well as with a translation (`ReaderModeControls.kt:351`).

No other one-word consistency change is made.

### Ruling 7: `app.js`

**No `app.js` string changes.** The script overwrites only the hero status line, the availability
answer and the final kicker; none of the five rows touches them. The static availability answer
(`index.html:304`) and `availabilityCopy().faq` (`app.js:63`) remain identical. The script tag's
cache key does not change.

## Findings matrix

Disposition: **A** accepted as proposed; **M** accepted with a modification; **R** rejected.

### Reviewer 1 (accuracy)

| Finding | Severity | Finding in brief | Disposition | What to do |
| --- | --- | --- | --- | --- |
| LC-01 | major | "glossary" in the offline list names nothing a reader of 0.7.10 can open | M | Fact confirmed by recomputation. Replaced by the word cards, worded "Ancient Greek with its word cards" instead of "Ancient Greek, Greek word cards". Row N1 |
| LC-02 | minor | CANDIDATE.md describes the glossary wrongly | M | Site lane corrects CANDIDATE.md with the reviewer's bullet and table rows; the closing sentence follows the final strings (see "Corrections to CANDIDATE.md") |
| LC-03 | minor | The store description says "Homeric lexicon"; the app says "dictionary" | A | No further page change: "word card" is the name, "a Homeric dictionary" its source (ruling 3). Store listing: "For the owner", item 1 |
| LC-04 | note | Interface in English: verified, both platforms | A | No change. Re-checked by the arbiter |
| LC-05 | note | Notes and retellings in English: verified; two quoted abstracts are not | A | No change. The two abstracts are quotations |
| LC-06 | note | 24 translations, 11 languages: exact; the 11 include English, exclude Ancient Greek | A | Count stated in ruling 1. The optional "English among them" is met by the list, which begins with English |
| LC-07 | note | Parallel: label, place, two translations, both orientations | A | "Together" kept; "side by side" not used. Row C2 |
| LC-08 | note | The in-app help describes Parallel ambiguously | A | No page change. "For the owner", item 5 |
| LC-09 | note | What a tap opens, and that it works offline | A | No change. Basis for rows C3, C4 and N1 |
| LC-10 | note | Static FAQ, `app.js` and structured data agree | A | No `app.js` change (ruling 7) |
| LC-11 | note | "look up a person or place" is not the glossary | A | No change in this publication. "For the owner", item 3 |
| LC-12 | note | What Reviewer 1 could not verify | A | Carried into "Not verified by anyone" |

### Reviewer 2 (clarity)

| Finding | Severity | Finding in brief | Disposition | What to do |
| --- | --- | --- | --- | --- |
| LD-01 | major | The language answer does not say which languages | A | The reviewer's replacement, word for word. Row C1 |
| LD-02 | note | A separate entry and this question are right | A | No change. "Retellings" confirmed as the page's own word |
| LD-03 | minor | "Parallel" arrives as a bare label; no "side by side" | M | "mode" taken; "In the reader," added (ruling 2); "side by side" not taken, because it is true only in landscape. Row C2 |
| LD-04 | major | "word card" is named but not explained | M | The reviewer's clause, plus "and, for names, the pronunciation" (verified; ruling 3). Row C3 |
| LD-05 | minor | "Greek" twice in eight words | A | "its word card". Rows C3 and C4; the same reasoning shapes N1 |
| LD-06 | minor | "open the on-device Greek word cards" does not read naturally | A | The reviewer's recommended two sentences. Row C4 |
| LD-07 | minor | "glossary" is left unexplained; proposes "glossary of people and places" | R | The proposed text names a feature that does not exist in 0.7.10 (ruling 4). The reviewer's concern, a second unexplained name, is met by removing the word. Row N1 |
| LD-08 | minor | "telling" directly under "retellings" | A | "beside a retelling or translation" (ruling 5). Row C4 |
| LD-09 | note | One name for one thing, after the edits | A | Holds with the final strings: "word card(s)" three times, "a Homeric dictionary" once as the source, no "glossary" |
| LD-10 | note | The FAQ order still flows | A | No change |
| LD-11 | note | Six matters beyond the request | A | Nothing added to the page. Items go to "For the owner" and "For the root" |

### Counts

| | Blocker | Major | Minor | Note | Total | Accepted | Accepted, modified | Rejected |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Reviewer 1 | 0 | 1 | 2 | 9 | 12 | 10 | 2 | 0 |
| Reviewer 2 | 0 | 2 | 5 | 4 | 11 | 8 | 2 | 1 |
| Both | 0 | 3 | 7 | 13 | 23 | 18 | 4 | 1 |

## Final string table

Every customer-visible string that differs from the live page. All are on `/`
(`skald/index.html`). C1 to C4 are CANDIDATE.md's rows; N1 is new. Text is given as a visitor
reads it; the source keeps the curly apostrophe in "app’s". **Every row differs from the
candidate file**, so the site lane edits all five.

| # | Location | Live | FINAL | Candidate |
| --- | --- | --- | --- | --- |
| C2 | `#translations .proof-copy`, first paragraph, new last sentence (`index.html:168`) | …and compare how translators approach the same passage. | …and compare how translators approach the same passage. In the reader, choose Parallel mode to read two translations together. | **CHANGED** (candidate: "Choose Parallel to read two translations together.") |
| C3 | `#translations .proof-copy`, second paragraph, first sentence (`:169`) | Tap a Greek word for the Homeric lexicon. | Tap a Greek word to open its word card, which gives the meaning and form and, for names, the pronunciation. | **CHANGED** (candidate: "Tap a Greek word to open its Greek word card.") |
| N1 | `#offline .offline-main`, first paragraph, first sentence (`:216`) | The text, reading notes, translations, Ancient Greek, glossary, maps and bundled art live on your device. | The text, reading notes, translations, Ancient Greek with its word cards, maps and bundled art live on your device. | **CHANGED** (new row; the candidate keeps the live text) |
| C1 | FAQ, new entry directly after "Which translations are included?" (`:286-289`): question | (none) | What language is Skald in? | same |
| C1 | the same entry: answer | (none) | The app’s interface, notes and retellings are in English. The 24 translations are in 11 languages: English, French, Spanish, German, Italian, Russian, Dutch, Danish, Swedish, Hebrew and Modern Greek. | **CHANGED** (candidate second sentence: "The 24 translations cover 11 languages.") |
| C4 | FAQ "Can I read the original Greek?", answer (`:292`) | Yes. You can place the Greek beside a telling or translation, follow corresponding passages, and open the on-device Greek glossary. | Yes. You can place the Greek beside a retelling or translation, follow corresponding passages, and tap any Greek word to open its word card. The meanings come from a Homeric dictionary stored on your device. | **CHANGED** (candidate: "…beside a telling or translation, follow corresponding passages, and open the on-device Greek word cards.") |

The second sentence of the C3 paragraph ("Translation comparisons include notes on the choices
behind the wording.") and the second sentence of the N1 paragraph ("Read on a flight, on a train,
or wherever you happen to have some time.") are unchanged. No figure changes: 24, 11, 13, 3,285,
258, 236, 52, 48 and 40 stand as live.

### `/app.js`, `/get/`, metas

No change. `app.js` stays at `c07ce27b…5899`, `get/index.html` at `09ced3b5…2434`. No meta
description, title, alt text or caption is touched by these rows.

### Every replaced sentence that named the Greek word help

| Where | Live | FINAL |
| --- | --- | --- |
| "Read it in another voice." | Tap a Greek word for the Homeric lexicon. | Tap a Greek word to open its word card, which gives the meaning and form and, for names, the pronunciation. |
| "Take the library with you." | …translations, Ancient Greek, glossary, maps and bundled art… | …translations, Ancient Greek with its word cards, maps and bundled art… |
| FAQ "Can I read the original Greek?" | …and open the on-device Greek glossary. | …and tap any Greek word to open its word card. The meanings come from a Homeric dictionary stored on your device. |

### Expected hash

If the five rows are applied to the candidate `skald/index.html` (`64b17c1c…109b`) as plain string
replacements and nothing else changes, the file hashes to:

`b9681609f43ef1d41ea9d90f61e81c0d72de70008761c794552d34e8034f8520`

A different hash means something other than the table was changed; the table governs, the hash is
a check. The recaptured screenshots, when they join this change, will move the hash again; that is
the capture lane's change, not a copy change.

## Final text of the affected sections, in reading order

Extracted from the candidate with the final strings applied. `##` marks a heading, `Q:` a FAQ
question, `[Image: …]` an image's alt text.

```text
24 translations in 11 languages
## Read it in another voice.
Choose from 13 English translations, two in French, and one each in Spanish, German, Italian, Russian, Dutch, Danish, Swedish, Hebrew and Modern Greek. Keep the Ancient Greek beside your reading and compare how translators approach the same passage. In the reader, choose Parallel mode to read two translations together.
Tap a Greek word to open its word card, which gives the meaning and form and, for names, the pronunciation. Translation comparisons include notes on the choices behind the wording.
[Image: Skald on iPad, with the Ancient Greek beside an English translation.]
Read the Greek beside a translation, with linked scrolling.
```

```text
Keep reading offline
## Take the library with you.
The text, reading notes, translations, Ancient Greek with its word cards, maps and bundled art live on your device. Read on a flight, on a train, or wherever you happen to have some time.
Read, compare, and find your place without a connection.
✦ Reading stays ready offline
Article links and external museum, catalog and reference pages need an internet connection. Your saved passage and preferences stay in app storage. See app privacy for details.
```

```text
A few questions
## Before you start
Q: Is the whole Odyssey included?
Yes. Books I, II and IX are free to read in full. One purchase unlocks the other 21 books.
Q: What do the 1-, 5-, and 20-minute labels mean?
They mark three levels of telling depth: a quick return to the shape of a book, a fuller sequence of scenes, and a sustained source-grounded telling. They are not exact reading-time guarantees.
Q: Which translations are included?
Skald includes 24 translations: 13 in English, two in French, and one each in Spanish, German, Italian, Russian, Dutch, Danish, Swedish, Hebrew and Modern Greek. Ancient Greek is included separately. Explore the translations on the web.
Q: What language is Skald in?
The app’s interface, notes and retellings are in English. The 24 translations are in 11 languages: English, French, Spanish, German, Italian, Russian, Dutch, Danish, Swedish, Hebrew and Modern Greek.
Q: Can I read the original Greek?
Yes. You can place the Greek beside a retelling or translation, follow corresponding passages, and tap any Greek word to open its word card. The meanings come from a Homeric dictionary stored on your device.
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
```

Every other section of `/`, and all of `/get/`, reads as in CANDIDATE.md's reading-order text.

## Corrections to CANDIDATE.md

The site lane corrects the file; the arbiter does not edit it.

- **Rows C1 to C4:** candidate text as in the final string table. **New row N1:** the offline list.
- **C1, "Why":** "so the list is not repeated" no longer holds; the answer names the languages
  because each answer is closed until tapped.
- **"Edit 3: inventory…", the Glossary bullet:** replace with Reviewer 1's text (LC-02): the
  glossary is the legacy vocabulary list (120 entries, 93 distinct common words), replaced by
  concept notes and not shown; it is not a glossary of people and places, and no screen uses the
  word.
- **Inventory table:** the "Take the library with you." row becomes **change** (N1). The "Find
  your bearings." row's "What it refers to" becomes "notes on people and places, the voyage map,
  proper-name word cards".
- **Closing sentence:** "After the change the page says 'word card(s)' three times, 'a Homeric
  dictionary' once as their source, and 'glossary' and 'lexicon' nowhere."
- **`skald/app.js` "Changed: no"** stands.

## For the owner

Nothing here is added to the page now. One recommendation each.

1. **Store listings say "Homeric lexicon"** ("…and tap a word for the Homeric lexicon", both
   stores), and older listing files (`docs/store/play-listing.json`, `app-store/metadata.json`) say
   "Homeric glossary". Out of scope here (ruling 6).
   Recommend: at the next store-listing review, "…and tap a word to open its word card."
2. **"Side by side."** The page says "together" because the two translations sit side by side
   only when the screen is wider than tall; upright, one is above the other. Recommend: keep
   "together". The page's older "beside" for the Greek (caption, alt text, two sentences) has
   the same limit and was accepted in the last round; the picture shows an iPad in landscape, where
   it is literally true.
3. **"look up a person or place"** ("Find your bearings."; the store description has the same
   phrase). 0.7.10 has notes on people and places, the map and name labels on word cards, but no
   index to look things up in. Recommend: at the next copy pass, "…and open a note on a person or
   place when you need a reminder."
4. **Naming the dictionary.** The card credits "Autenrieth, A Homeric Dictionary (Harper &
   Brothers, 1891)". The page says "a Homeric dictionary". Recommend: leave it; if you want the
   name for classicists, "The meanings come from Autenrieth’s Homeric Dictionary, stored on your
   device." is the same length and needs only a one-line check.
5. **The app's own help** says "Parallel both side by side", which reads as the translation and
   the Greek; Parallel shows two translations. Recommend: an issue in the app repo, "Parallel two
   translations together".
6. **`/get/`** says "24 translations" and lists the EU, with nothing on the app's language.
   Recommend: when campaigns resume, add "The app is in English; the translations are in 11
   languages." The page is `noindex` and unfed today.
7. **Older journal entries** on the Updates page speak of "the glossary" and "a Homeric glossary"
   for earlier releases. Recommend: leave them; they are dated entries about those releases.

## For the root

1. **Site lane, apply:** the five rows, then check the expected hash
   (`b9681609…8520`). No change to `app.js`, `get/index.html`, `availability.json` or
   `styles.css`.
2. **Site lane, record:** a new registry folder superseding `skald/docs/landing-2026-10-02`, with
   the three roles as recorded in the header above (models as actually used, the arbiter's
   stand-in block, the `sessionId` convention of the morning's registry), the review hashes from
   "Inputs" plus this file's hash, and the new `index.html` pin for `verify-landing-copy.py`.
   Correct CANDIDATE.md as listed.
3. **Evidence screenshots:** reshoot the three pairs after applying (`landing-*-translations`,
   `landing-*-faq-language`, `landing-*-faq-greek`) and add a pair for the offline section (N1).
   The language answer is now three lines longer at 390 px; check it for overflow.
4. **Capture lane:** the alt and caption checks S1 to S10 in CANDIDATE.md were not part of this
   review; neither reviewer reported a finding against them, and they are to be read against the
   new captures when those arrive. If the new iPad capture can keep the "Story / Ἑλληνικά /
   Parallel" switch legible, the picture will show where Parallel is chosen (LD-11).
5. **Protocol note:** the app repo's `AGENTS.md` names GPT-5.6 or Claude Opus 4.8 for roles 1 and
   2; both ran as `claude-opus-5-5`, as in the morning's registry.
6. **Not verified by anyone:** the app running on a device (labels, the Parallel layout and the
   word card were read from source, tests and golden file names); the live remote configuration
   (a remote switch of `key_concepts` would bring the old vocabulary popover back; this bears only
   on ruling 4); that 0.7.10 is the version each store serves today; the live store listing text.

## Decision line

**APPROVED FOR PUBLICATION once applied exactly:** the final string table above, five rows on `/`
(C1, C2, C3, C4, N1), with `app.js` and `/get/` unchanged. Any other change to a customer-visible
string needs a new review.

# Landing copy edits, round 2: Reviewer 1 (accuracy)

- **Role:** Reviewer 1 of 3: textual accuracy, source anchors, claims. Independent of Reviewer 2
  (`clarity.md` was not read).
- **Model:** `claude-opus-5-5`
- **Effort:** high
- **Date:** 2026-10-02
- **Input:** `docs/landing-copy-2/CANDIDATE.md`, sha256
  `7c0262361f1c49b1139f575e2164f2733252f17ba607fe7ce230f5d26a2e0c09`
  (branch `docs/skald-landing-copy-2`, commit `4889d64`)
- **Candidate files read:** `skald/index.html` sha256 `64b17c1c…109b`, `skald/app.js` sha256
  `c07ce27b…5899`, `skald/get/index.html` sha256 `09ced3b5…2434`. All three match the hashes
  CANDIDATE.md states.
- **Evidence:** app repo `/Volumes/Dev/Code/skald-prod`, tag `v0.7.10` (`9a781e27`, tagged commit
  `a73ca6dd`), read with `git show` / `git grep`; its checkout was not changed. Bundled content was
  extracted from the tag with `git archive` into a scratch folder and counted by script.
  `docs/store/releases/0.7.10/store-copy.json` is **not in the tag**; it was added afterwards by
  `524289a2b` (#511) and is quoted from `origin/main` `75b74afc1`.
- **Method:** read source and bundled content. The app was not run on a device or simulator.

## Verdict

**APPROVE_WITH_EDITS**

The four changed strings (C1 to C4) are true of 0.7.10 as shipped, on both platforms. One edit is
required elsewhere on the page: Edit 3 leaves the word "glossary" in the offline paragraph, and
0.7.10 has no glossary for it to name (LC-01).

| Severity | Count |
| --- | --- |
| blocker | 0 |
| major | 1 |
| minor | 2 |
| note | 9 |

## Findings

### LC-01 (major): the kept "glossary" names nothing a reader of 0.7.10 can open

**Text** (`skald/index.html:216`, unchanged by the candidate, kept on purpose by CANDIDATE.md's
inventory): "The text, reading notes, translations, Ancient Greek, glossary, maps and bundled art
live on your device."

**Why the edits make it a problem.** On the live page the only other use of the word is the FAQ's
"the on-device Greek glossary", so "glossary … live on your device" reads as the same Greek word
help. C4 renames that to "Greek word cards". The offline paragraph's "glossary" is then the only
one left, and CANDIDATE.md assigns it to a separate "people-and-places glossary". That feature
does not exist in 0.7.10.

**Evidence (all at `v0.7.10`).**

- What the code calls the glossary is the vocabulary list inherited from the bedtime-story MVP:
  `GlossaryTerm(term, lemma, kid_def, parent_note)`
  (`core/src/commonMain/kotlin/com/skald/core/model/Domain.kt:145-151`), stored as
  `vocab_candidates` in each book's `master.json` (e.g.
  `core/src/main/assets/content/odyssey/odyssey-01-athena-visits-ithaca/master.json:72`). Counted
  across the 24 books: 120 entries, 93 distinct words, all common nouns ("council", "suitor",
  "disguise", "omen", "harbor", "threshold" …). Book I's first entry: term "council", definition
  "A meeting to decide what should happen." No entry is a person or a place.
- The Odyssey reader replaced it. `docs/adr/0013-curated-concepts-and-catalog-art.md:9-13` ("The
  Odyssey reader inherited a child-vocabulary system … make isolated words italic and open short
  definitions") and `:26-27` ("The Odyssey switches to these sidecars only after every episode and
  source passes the full gate. Other works retain the legacy glossary until separately migrated.").
- The code does what the ADR says:
  `feature/reader/src/commonMain/kotlin/com/skald/feature/reader/ReaderStateBuilder.kt:172-176`
  (`conceptsReplaceGlossary = keyConceptsEnabled && spans.isNotEmpty()`; the glossary is then
  empty), `ReaderViewModel.kt:509-522` (same rule when gates change), `ReaderConceptBundle.kt:13`
  ("The atomic sidecar unit required before the Odyssey reader leaves the legacy glossary").
  `KeyConcepts` is on by default (`core/src/commonMain/kotlin/com/skald/core/flags/FeatureGate.kt:19`).
- The bundle meets the condition everywhere: every one of the 24 `concept-mentions.json` files
  carries anchors for all three retellings and all 24 translations (27 sources × 24 books, counted).
  So the vocabulary popover is a fallback for a broken concept bundle, not something a reader sees.
- No on-screen string in the app contains "glossary" (searched `*.kt` and `*.swift` outside tests).

I did not run the app; the claim rests on the ADR, the code path, the gate default and the bundled
anchors. A remote configuration that turned `key_concepts` off would bring the old vocabulary
popover back; I cannot see the live remote configuration.

**Replacement (preferred).** It keeps a true offline claim (the dictionary is bundled on both
platforms, see LC-09) and gives the page one name for the thing:

> The text, reading notes, translations, Ancient Greek, Greek word cards, maps and bundled art live on your device.

**Alternative**, if three uses of "Greek word card(s)" on one page is too many (C4 already says
"on-device"):

> The text, reading notes, translations, Ancient Greek, maps and bundled art live on your device.

### LC-02 (minor): CANDIDATE.md describes the glossary wrongly

**Text** (CANDIDATE.md, "Edit 3: inventory…"): "**Glossary**: tappable terms in the story text
(people, places, things), opening a glossary card. The store description calls this 'look up
people and places as you go'." Also the table rows "glossary | the people-and-places glossary …
| keep" and "(unnamed) | the glossary | keep", and the closing "'glossary' stays for the
different thing it names. After the change the page says 'Greek word card(s)' twice and 'glossary'
once."

**Evidence.** As LC-01. The `CHANGELOG.md:254` line the file cites ("Tapping away from a Greek
word or glossary card…") describes a fix in the popover code both cards share
(`ReaderPopovers.kt:79`); it does not show that the Odyssey reader displays glossary cards.

**Replacement** for the bullet:

> - **Glossary (legacy, not shown)**: the vocabulary list from the original bedtime-story build
>   (120 entries across the 24 books; 93 distinct common words such as "council", "suitor",
>   "omen", each with a one-line definition). The Odyssey reader replaced it with concept notes
>   (ADR 0013); at `v0.7.10` it appears only if the concept files fail to load. It is not a
>   glossary of people and places, and no screen uses the word.

Table: the "Take the library with you." row becomes **change** (LC-01); the "Find your bearings."
row's "What it refers to" becomes "notes on people and places, the voyage map, proper-name word
cards (see LC-11)". Closing sentence: "After the change the page says 'Greek word card(s)' three
times and 'glossary' nowhere." (or "twice", with the alternative in LC-01).

### LC-03 (minor): the store description still says "Homeric lexicon"; the app itself says "dictionary"

**Text.** C3 "Tap a Greek word to open its Greek word card." and C4 "…and open the on-device
Greek word cards."

**Evidence.**

- Store description, both stores (`docs/store/releases/0.7.10/store-copy.json:7`, `origin/main`
  `75b74afc1`; the same sentence in `shared-description.txt:8`, `play-listing.json:4`,
  `app-store-copy.json:6`): "Keep the Ancient Greek beside your reading and tap a word for the
  Homeric lexicon."
- The same file's Google Play release notes (`store-copy.json:9`): "Greek word cards define 207
  more words, label proper names and, in Greek mode, quote the line in ten translations." The App
  Store "What's New" text (`:8`) does not mention them.
- "Greek word card(s)" is the name in `CHANGELOG.md` (`:183`, `:191`, `:241`, `:251`) and in the
  update post (`skald/updates/index.html:117-118`). It is **not** an on-screen name: the card has
  no title, only the headword (`feature/reader/src/commonMain/kotlin/com/skald/feature/reader/GreekPane.kt:216-228`).
  Where the app names the thing it says "dictionary": the unlock screen's "The Greek text, with a
  dictionary a tap away" (`feature/flow/src/commonMain/kotlin/com/skald/feature/flow/PaywallStatsFormatter.kt:26`),
  the card's "No dictionary entry for this form." (`GreekPane.kt:273`), and the help's "In the
  Greek, tap any word to see its meaning and form." (`HelpTourSteps.kt:29-30`). The card's footer
  credits "Autenrieth, A Homeric Dictionary (Harper & Brothers, 1891) …"
  (`core/src/main/assets/lexicon/autenrieth.json`, `attribution`), which is what "Homeric lexicon"
  pointed at.

**Assessment.** C3 and C4 are accurate and match the post and the Play release notes. A visitor
who goes on to either store reads "the Homeric lexicon" for the same tap; the two phrases are
recognisably the same feature, so this does not block. Nothing a visitor sees in the app
contradicts "word card".

**Replacement.** None required on the page. Either C3 wording is accurate: the candidate's "Tap a
Greek word to open its Greek word card." or the lighter "Tap a Greek word for its word card."
(leave the choice to the clarity review). Follow-up for the next store-listing review, outside this
change: "…and tap a word to open its Greek word card."

### LC-04 (note): C1, "The app's interface … [is] in English": verified, both platforms

- Android ships one string resource, the app name
  (`app/src/main/res/values/strings.xml:4`); the only resource folders are `values` and
  `values-v31` (themes). There is no `values-<language>` folder.
- The shared UI has no string resources at all: `core/src/commonMain/composeResources/` holds
  fonts only, and screen text is English literals in Kotlin (for example
  `HelpTourSteps.kt:28-59`, `PaywallStatsFormatter.kt:26-59`).
- iOS: no `.lproj`, `.strings` or `.xcstrings` file in the tree; the project's regions are
  `Base, en` with development region `en`
  (`ios/SkaldApp/SkaldApp.xcodeproj/project.pbxproj:263-268`);
  `app-ios/src/iosMain/kotlin/com/skald/app/ios/IosSkaldDependencies.kt:260-262` says "the bundle
  ships no .lproj localizations".
- Things on screen that are not English, none of which contradicts the sentence: the mode button
  "Ἑλληνικά" (`ReaderModeControls.kt:351`); the language names in the translation list, each in
  its own language ("Français", "עברית", "Νέα Ελληνικά"; `core/src/commonMain/kotlin/com/skald/core/text/ReadingDirection.kt:70-82`
  and `languageName` in `translations.json`); the translations' own printed headings and
  summaries (Pindemonte's "LIBRO PRIMO / ARGOMENTO", Wilster's "Første Sang"), which belong to the
  translations; and dialogs the operating system draws (purchase sheet, notification permission),
  which follow the device language. The episode title and scene headings stay English whatever
  translation is open.

### LC-05 (note): C1, "notes and retellings are in English": verified, with two quoted abstracts

- Notes: 3,285 across the 24 `scholia.json` files (matches the page's figure and
  `content/unlock-stats.json`). Every note body is English: checked by script over each string of
  25 letters or more in `payload.text` (3,175 strings), `payload.why` (66), `payload.oralFunction`
  (128), `payload.focus` (19) and the "see also" labels (2,001), none flagged. Notes
  quote Greek and the open translation's own wording, and give an English gloss for non-English
  translations (`anchor.glossByTranslation`).
- Two of the 3,285 show an excerpt that is not English: the citation notes for a Portuguese and a
  French article print "From the abstract" in the article's language
  (`…/odyssey-10-aeolus-laestrygonians-circe/scholia.json:7762`, `sch-od-10-cite-assuncao-2025`;
  `…/odyssey-11-land-of-the-dead/scholia.json:7709`, `sch-od-11-cite-toledo-2024`; shown by
  `ScholiaCitationPopover.kt:111-120`). Skald's own sentence in each is English and ends "Article
  in Portuguese." / "Article in French." These are quotations, not Skald's notes; no change needed.
- Retellings: 72 files (`tier-30s.json`, `tier-5m.json`, `tier-30m.json` × 24), all English,
  including the gentler variants (`paragraphs[].text_gentle`). There is no retelling in any other
  language.
- Also English: concept pages (`concepts.json`), the museum and map panels (`panels.json`), the
  translation blurbs, and every definition on a Greek word card.

### LC-06 (note): C1, "The 24 translations cover 11 languages": exact, and consistent with the page

- `core/src/main/assets/content/odyssey/translations.json` at the tag has 24 entries: 13 `en`,
  2 `fr`, and one each `es`, `de`, `it`, `ru`, `nl`, `da`, `sv`, `he`, `el` (Polylas, Modern
  Greek): 11 languages. Each has its file in all 24 books (24 × 24 `translation-*.json` /
  `loeb.json`). The app prints the same figures (`content/unlock-stats.json:37-40`,
  `HelpTourSteps.kt:111-115`).
- The 24 **exclude** the Greek original (it is `greek.json`, not a registry entry). The 11
  **include** English and Modern Greek and **exclude** Ancient Greek.
- The page says the same elsewhere: "24 translations in 11 languages, plus Ancient Greek"
  (`index.html:99`), the eyebrow at `:166`, the list at `:168`, and the FAQ answer directly above
  (`:284`: 13 + 2 + 9 = 24; "Ancient Greek is included separately"). The store description agrees
  (`store-copy.json:7`).
- Optional, not required: read straight after "…are in English", "cover 11 languages" can be taken
  as eleven languages besides English. If the arbiter wants that closed: "The 24 translations are
  in 11 languages, English among them." The answer above it already lists them, so the candidate
  sentence is acceptable as written.

### LC-07 (note): C2, "Choose Parallel to read two translations together.": verified

- **Label.** "Parallel" is the exact on-screen text, third segment of the mode switch
  "Story | Ἑλληνικά | Parallel" (`ReaderModeControls.kt:350-352`). The switch is shared code
  (`commonMain`), so the label is the same on Android, iPhone and iPad.
- **Where.** In the reader's fixed top controls (`ReaderModeControls.kt:76-89`, tag
  `reader_mode_controls`). The segment is offered only while a translation, not a retelling, is
  the reading text (`:86`, `parallelEnabled = state.activeTranslationId != null`; test
  `ReaderParallelTest.kt:150-170`). The sentence sits in the translations paragraph, and a new
  install opens on a translation (Murray; `core/src/commonMain/kotlin/com/skald/core/prefs/ReadingSourceDefaults.kt:18`),
  so "Choose Parallel" is true from where the sentence stands.
- **What it shows.** Exactly two translations: the one being read and a second in its own pane
  (`CompanionPane.kt:30`, `ParallelCompanionPane.kt:76-89`), scrolling together
  (`ParallelCompanionPane.kt:110-120`; `CHANGELOG.md:354`: "two translations side by side in
  synchronous scroll"). The second is chosen for you on first entry (Murray pairs with Butler;
  `ReadingSourceDefaults.kt:47-51`, `ReaderReadingSourceController.kt:68-73`) and either can be
  changed from the row beneath the switch (`ReaderSourcesRow.kt:113-133`). The Greek is not shown
  in Parallel; Greek beside one translation is the "Ἑλληνικά" mode (`CompanionPane.kt:21`), which
  the page's caption and screenshot describe correctly.
- **Device size.** No limitation. Portrait stacks the two panes, landscape sets them side by side
  (`SplitReader.kt:78-83`, `:108`); phone goldens exist
  (`feature/reader/src/test/snapshots/reader_parallel_portrait_light.png`,
  `reader_parallel_landscape_light.png`). Only pictures in the text are withheld below 840 dp of
  width (`SplitReader.kt:61-70`). "Together" is therefore the right word; "side by side" would be
  wrong on a phone held upright.
- The page's own screenshot (`assets/greek-split.webp`, as rendered in
  `landing-1280-translations.png`) shows the switch with "Parallel" as its third segment.
- The App Store "What's New" text uses the same words: "read two translations together"
  (`store-copy.json:8`).

### LC-08 (note, for the app, not the page): the in-app help describes Parallel ambiguously

`HelpTourSteps.kt:29-30`: "Story shows the translation, Ἑλληνικά the Greek text, and Parallel both
side by side." Read literally, "both" is the translation and the Greek, which is what Ἑλληνικά
does; Parallel shows two translations. The landing sentence is the accurate one. No page change.

### LC-09 (note): C3 and C4, what a tap opens and "on-device": verified

- A tap on a word in the Greek text (`GreekPane.kt:158`) opens a card at the foot of the screen
  (`GreekPane.kt:182-308`): where the word sits ("Book II · line 7"), in Greek mode a quotation
  from the translation beside it (ten translations; `CHANGELOG.md:223-232`), the headword, a
  proper-name label where it applies, transliteration or pronunciation, the form and its grammar,
  the dictionary's definitions and etymology, "How translators turned it" for some words, and the
  source credit. Every word opens a card; a word the dictionary lacks shows "No dictionary entry
  for this form." (`GreekPane.kt:273`; `core/src/commonMain/kotlin/com/skald/core/lexicon/GreekWordInfo.kt:131`).
  "Card" is the code's and the changelog's word for it.
- Offline: the dictionary (`core/src/main/assets/lexicon/autenrieth.json`, read by
  `JsonLexiconRepository.kt:23`) and each book's word list (`greek-lex.json`, 24 files) are in the
  Android assets and in the iOS bundle (`scripts/ios_bundle_assets.sh:16` copies `lexicon` and
  `content/odyssey`). Only the card's "Licence" and "Source" links need a connection
  (`GreekPane.kt:321-328`), which the page's offline note already covers ("external … reference
  pages").
- C4's surrounding claims hold: the Greek can sit beside a retelling or a translation (the
  "Ἑλληνικά" segment is always offered, `ReaderModeControls.kt:351`).

### LC-10 (note): static FAQ, `app.js` and structured data agree

- `app.js` rewrites three elements only: `[data-availability-copy]`, `[data-availability-faq]` and
  `[data-availability-kicker]` (`skald/app.js:70-76`). The new entry (`index.html:286-289`) and
  the changed Greek answer (`:291-292`) carry none of these attributes, so the script does not
  touch them. `app.js` contains no FAQ text other than the availability sentence, which is
  byte-identical to `index.html:304`.
- There is no JSON-LD on `/`: no `application/ld+json`, `FAQPage` or `schema.org` in
  `skald/index.html`, `skald/app.js` or `skald/get/index.html`. Nothing to keep in step. If
  `FAQPage` data is added later it must carry this question and answer word for word.
- `skald/verify-site.mjs` pins no FAQ string affected by the edits. `skald/verify-landing-copy.py`
  fails on the hash pin, as CANDIDATE.md says it will until the new registry lands (run: assertion
  at line 17).
- C1's first sentence and C2 are word for word the update post's
  (`skald/updates/index.html:122`, `:84`).

### LC-11 (note, outside the three edits): "look up a person or place" is not the glossary

`index.html:184`: "…and look up a person or place when you need a reminder." CANDIDATE.md ties this
to "the glossary" (see LC-02). In 0.7.10 what a reader has is: underlined words and margin marks
that open notes (11 of the 71 concept pages are of type `person_place_named_group`; 47 notes are
of kind `voyage`), the voyage map, and word cards that label proper names. There is no index of
people or places to look something up in. The sentence was accepted in the previous round (LA-12)
and the store description has the same phrase ("look up people and places as you go"), so I leave
it; if it is reopened, a safer form is "…and open a note on a person or place when you need a
reminder."

### LC-12 (note): what I could not verify

- Whether 0.7.10 is the version live on the App Store and Google Play today. The update post in
  this repo says it is; I checked the tag, not the stores.
- Live remote configuration and any content pack delivered after the build. The bundled content
  outranks older packs (`core/src/commonMain/kotlin/com/skald/core/delivery/BundledContent.kt`),
  but a newer pack or a remote gate could change what is shown (this bears on LC-01 only).
- The app on a device: labels, the Parallel layout and the word card were read from source, tests
  and golden file names, not seen running. iOS rendering in particular rests on the code being
  shared.
- The live store listing text. `store-copy.json` is the reviewed package on `origin/main`; I did
  not open either store page.

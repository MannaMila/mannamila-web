# Landing page copy edits, round 2: Reviewer 2 (reader usefulness, clarity, provenance)

| | |
| --- | --- |
| Role | Reviewer 2 of 3: reader usefulness, clarity, provenance. Independent of Reviewer 1; their file was not read (the `reviews/` folder did not exist when this review began). |
| Model | `claude-opus-5-5` (Claude Opus 5.5). The repository protocol names GPT-5.6 or Claude Opus 4.8 for this role; the registry should record the model actually used. |
| Effort | high |
| Date | 2026-10-02 |
| Input | `docs/landing-copy-2/CANDIDATE.md`, sha256 `7c0262361f1c49b1139f575e2164f2733252f17ba607fe7ce230f5d26a2e0c09` |
| Candidate files | `skald/index.html` `64b17c1cbfaf41d55b0500946c0b1481bfe81d02a3ea7c92dcca780c6969109b`; `skald/app.js` `c07ce27bbe0476577ea8dfad7490732f15d32b859ef75f0866acc020efd5c899` (both match the candidate's table) |
| Also read | The six screenshots and `visual-report.json` in `docs/landing-copy-2/`; the live Updates page (sha256 `f4c086b9…e333`, byte-identical to `skald/updates/index.html`), October 2, 2026 post; live `/` (sha256 `a48fec9d…a132`, the candidate's stated baseline); `skald/get/index.html`; the app at tag `v0.7.10` for the words the app itself uses |
| Branch | `docs/skald-landing-copy-2` at `4889d64`. Nothing changed except this file; no commit. |

## Verdict

**APPROVE_WITH_EDITS.** All three edits belong on the page and sit in the right places. Two of them
do not yet do their job for the visitor they were written for: the language answer does not say
which languages, and "Greek word card" is named without saying what a card gives. Both have
one-sentence fixes below.

| Blocker | Major | Minor | Note | Total |
| ---: | ---: | ---: | ---: | ---: |
| 0 | 2 | 5 | 4 | 11 |

## What the app says, for the wording below

Checked at tag `v0.7.10` in the app repository, as vocabulary only; accuracy is Reviewer 1's.

| Fact | Where |
| --- | --- |
| The reader has a three-way switch labelled "Story", "Ἑλληνικά", "Parallel". "Parallel" appears only when a translation is open. | `feature/reader/.../ReaderModeControls.kt`, `ViewModeSwitch` |
| The in-app help calls these "Reading modes" and says: "Story shows the translation, Ἑλληνικά the Greek text, and Parallel both side by side. In the Greek, tap any word to see its meaning and form." | `feature/reader/.../HelpTourSteps.kt`, lines 28–30 |
| In Parallel the second pane holds a second translation ("Pick a second translation from the pill above."). | `feature/reader/.../ParallelCompanionPane.kt`, line 266 |
| The two panes sit side by side when the window is wider than tall, and one above the other in portrait. | `feature/reader/.../SplitReader.kt`, lines 78–82 and 108 |
| The changelog's name for the feature: "Parallel reading: two translations side by side in synchronous scroll". | `CHANGELOG.md`, line 354 |
| A word card shows the headword, a transliteration or (for names) a pronunciation, the tapped form with its grammar, the dictionary definition, and the book and line. The empty state reads "No dictionary entry for this form." | `feature/reader/.../GreekPane.kt` |
| The dictionary is Autenrieth's *A Homeric Dictionary* (1891), credited in each card's footer. | `docs/content/schema.md`, line 1194 |
| The FAQ items are `<details>` with no `open` attribute: each answer is hidden until its question is tapped. The screenshots show them all open because the capture script opens them. | `skald/index.html`; `docs/landing-copy-2/tools/shots.mjs`, line 19 |

## Findings

### LD-01 (major): the language answer does not say which languages

**Text:** "The app’s interface, notes and retellings are in English. The 24 translations cover 11
languages."

**Why it fails the reader.** The entry exists for the visitor asking "is this in my language?". The
first sentence answers half of it. The second tells a French, German or Italian visitor that there
are eleven languages and not whether theirs is one. The candidate's reason for leaving the list out
is that the answer above lists them, but that answer is closed by default: a visitor who opens only
this question sees no language named, and has to guess that a different question holds the list.
The update post names the languages in the same breath for this reason. "Cover" is also a looser
verb than the page's own "24 translations in 11 languages", and harder in a second language.

Repetition was checked. With both answers open, the list appears twice in a row, and it is already
in "Read it in another voice.". The answer above gives the count per language; this one says which
parts of the app are English and which are not. Each answer has to stand alone when it is the only
one open, so the repeat is worth its two lines. No "only" is needed after "English": the contrast
between the two sentences carries it.

**Replacement:**

> The app’s interface, notes and retellings are in English. The 24 translations are in 11
> languages: English, French, Spanish, German, Italian, Russian, Dutch, Danish, Swedish, Hebrew and
> Modern Greek.

If the arbiter will not have the list a third time on the page, the fallback is a pointer, which
costs the visitor a second tap: "The app’s interface, notes and retellings are in English. The 24
translations are in 11 languages; “Which translations are included?” lists them."

### LD-02 (note): a separate entry is the right home, and the question is the right one

No change. A visitor scanning closed questions for the app's language will not open "Which
translations are included?", so folding the sentence into that answer (the earlier arbitration's
suggestion) would hide it. "What language is Skald in?" is short, plain and matches the shape of
the answer. "Is Skald available in my language?" is closer to what the visitor thinks, but it
promises a yes or no the page cannot give, and "available" already means countries two questions
further down ("Where is Skald available?").

"Retellings" is introduced before this point: "a short retelling" in the first feature card and
"Or a short retelling." in the "Getting started" heading. "Notes" is the page's short form of
"reading notes" throughout.

### LD-03 (minor): "Parallel" arrives as a bare label, and the sentence does not say "side by side"

**Text:** "Choose Parallel to read two translations together."

**Why it fails the reader.** In the update post the sentence follows "Press and hold a passage…",
so the reader is already inside the app. On the landing page it follows a paragraph that opens
"Choose from 13 English translations, two in French…". A second "Choose", followed by a
capitalised word, reads for a moment like one more thing to pick from that list: an edition or a
translator called Parallel. Nothing says what kind of thing Parallel is or where it is chosen.
"Together" is also the weakest word available: it does not say the two texts share the screen, and
the owner asked for side-by-side reading by name. "Side by side" is the app's own description in
its help and in the changelog, and an everyday phrase for a second-language reader.

One added word and one swap fix it. "Mode" is the app's word ("Reading modes") and tells the
visitor that Parallel is a way of viewing, not a text. The sentence keeps the post's "Choose
Parallel … to read two translations", so page and post still say the same thing.

**Replacement:**

> Choose Parallel mode to read two translations side by side.

For the arbiter and Reviewer 1: in portrait the app puts one translation above the other, and side
by side only in landscape. The app's help says "side by side" regardless, and the page already
uses "beside" for the Greek in the same loose sense, so I would publish it. If a sentence that is
literal in both orientations is wanted, keep "together" and add only "mode": "Choose Parallel mode
to read two translations together."

### LD-04 (major): "word card" is named but not explained, and the explanation the old sentence carried is gone

**Text:** "Tap a Greek word to open its Greek word card."

**Why it fails the reader.** A newcomer learns that a card opens and not what is on it. "Word
card" is also the usual classroom term for a vocabulary flashcard, which is the first meaning many
second-language readers will reach for. The reader who knows Greek has lost something: "the
Homeric lexicon" told them a tapped word leads to a dictionary of Homer's vocabulary, and the new
sentence tells them nothing in its place. A parenthesis such as "(a Homeric lexicon entry)" would
put the old name back beside the new one, which is the opposite of what the edit is for, and
"lexicon" is not the plain word (in German, "Lexikon" first means an encyclopedia).

A short clause saying what the card gives serves both readers, in the app's own words: its help
says "tap any word to see its meaning and form." Pronunciation should stay out of the clause:
cards show how a word sounds only for proper names.

**Replacement** (also resolves LD-05):

> Tap a Greek word to open its word card, which gives the meaning and form.

### LD-05 (minor): "Greek" twice in eight words

**Text:** "Tap a Greek word to open its Greek word card."

**Why it fails the reader.** The second "Greek" adds nothing: "its" already ties the card to the
Greek word. The echo makes a short sentence sound mechanical.

**Replacement:** as LD-04. "Its word card" and the FAQ's "word card" are the same name; the reader
does not need the adjective repeated to match them.

### LD-06 (minor): "open the on-device Greek word cards" does not read naturally

**Text:** "Yes. You can place the Greek beside a telling or translation, follow corresponding
passages, and open the on-device Greek word cards."

**Why it fails the reader.** With "glossary" the phrase worked: a glossary is one thing that is
stored on the device and opened. Cards are not. "Open the … cards", plural with "the", suggests a
screen or deck called Greek word cards; there is none, a card opens for the word you tap.
"On-device" is now attached to the wrong noun (what is stored on the device is the dictionary),
and four modifiers before "cards" is heavy for a second-language reader. This is also where a
visitor who goes straight to the questions first meets the term, and it is the classicist's
question, so it is the natural place to say where the meanings come from. "Homeric dictionary" is
the title of the source the cards credit, and the post already speaks of "the dictionary behind
the Greek word cards"; it names the source, not a second name for the feature.

**Replacement** (recommended):

> Yes. You can place the Greek beside a telling or translation, follow corresponding passages, and
> tap any Greek word to open its word card. The meanings come from a Homeric dictionary stored on
> your device.

Minimal alternative, if the arbiter wants the feature name and nothing else: "…follow
corresponding passages, and tap any Greek word to open its word card." This drops "on-device"; the
next answer ("The bundled reading library and reading tools work offline.") still covers it.

### LD-07 (minor, beyond the two substitutions): "glossary" is left with nothing to tell the reader what it is

**Text:** "The text, reading notes, translations, Ancient Greek, glossary, maps and bundled art live
on your device." ("Take the library with you.")

**Why it fails the reader.** The candidate keeps this "glossary" because it means the people and
places glossary. The reader cannot know that. Until today the page's only other use of the word
was "Greek glossary", for the Greek word help, and here it stands directly after "Ancient Greek".
After the edits it is the page's one mention of a glossary, the people and places lookup is never
called one ("look up a person or place"), and the natural guess is that it means the word cards.
The page then has two names for one thing in the reader's mind, which is what edit 3 set out to
end.

**Replacement:**

> The text, reading notes, translations, Ancient Greek, glossary of people and places, maps and
> bundled art live on your device.

### LD-08 (minor, beyond the request): "telling" directly under "retellings"

**Text:** "…place the Greek beside a telling or translation…"

**Why it fails the reader.** The new answer immediately above says "retellings"; this one says
"telling" for the same thing. The page's noun is "retelling" (five uses); "telling" otherwise
appears only in "telling depth" and "source-grounded telling", which are about length. The
sentence is being edited anyway.

**Replacement:** "…place the Greek beside a retelling or translation…"

### LD-09 (note): one name for one thing, after the edits

Every remaining term on `/` (the metas, the alt texts and `/get/` contain none of the word-help or
glossary terms):

| Thing | Terms on the page after the candidate | One name? |
| --- | --- | --- |
| Greek word help | "Greek word card" ("Read it in another voice."); "Greek word cards" (FAQ). "Lexicon" and "dictionary" no longer occur. | Yes. With LD-04 and LD-06: "word card" twice, plus "a Homeric dictionary" for the source behind it. |
| People and places glossary | "glossary" ("Take the library with you."); unnamed in "look up a person or place" ("Find your bearings.") | One name, but unexplained: LD-07. |
| Notes | "reading notes" (hero, totals, notes section, offline list, both descriptions, two alt texts); short form "notes" / "note" (nav, eyebrow, "Some notes…", "Open a map or note", "Follow a note…", the new answer, "notes on the choices behind the wording") | Yes. No "annotations", "commentary" or "scholia". |
| Scholarship | "journal articles", "references", "scholarship" | Yes. |
| Short versions | "retelling(s)"; "telling depth(s)"; "telling" | Nearly: LD-08. |
| Two texts on screen | "beside" (Greek and a translation: three times in the text, and in the image alt text); "Parallel … together" (two translations) | Consistent with LD-03; "beside" stays for the Greek. |

The update post agrees with all of these: "Greek word cards", "the dictionary behind" them,
"Parallel", "notes", "retellings".

### LD-10 (note): the FAQ order still flows

No change. The new entry makes a run of three on language: which translations, what language the
app is in, the original Greek. Purchase, availability, email and publisher follow as before. It
could also sit beside "Where is Skald available?", but its answer leans on the translations, so
the candidate's position is the better one.

### LD-11 (note): beyond the request

Nothing here is needed for this publication.

1. **Metas and alt text.** No change needed. None mentions the lexicon, the glossary, Parallel or
   the interface language.
2. **The picture beside the Parallel sentence** shows the Greek beside a translation, not two
   translations; its caption says so, and that is enough. The reader's mode switch ("Story",
   "Ἑλληνικά", "Parallel") is visible in that screenshot. If the recapture lane can keep it
   legible in the new iPad capture, the picture will show where Parallel is chosen.
3. **`/get/`** tells an EU visitor "24 translations" and lists the EU, with nothing on the app's
   language. The page is `noindex` and not in use today. When campaigns resume, add after the
   availability sentence: "The app is in English; the translations are in 11 languages."
4. **Outside the FAQ**, the page never says the app is in English; a visitor who reads "two in
   French" and does not open the question may assume a French app. The FAQ entry is what the owner
   asked for and is enough for now.
5. **Store listings** still say "Homeric lexicon" and "Homeric glossary". When they are redrafted,
   use "Greek word cards" and "glossary of people and places".
6. **The app's help** says "Parallel both side by side", which reads as the translation and the
   Greek. Parallel shows two translations. This is for the app repository, not this page.

## Final text of the three edited places, as I would publish them

**1. FAQ, new entry after "Which translations are included?"**

> **What language is Skald in?**
>
> The app’s interface, notes and retellings are in English. The 24 translations are in 11
> languages: English, French, Spanish, German, Italian, Russian, Dutch, Danish, Swedish, Hebrew and
> Modern Greek.

**2. "Read it in another voice.", first paragraph**

> Choose from 13 English translations, two in French, and one each in Spanish, German, Italian,
> Russian, Dutch, Danish, Swedish, Hebrew and Modern Greek. Keep the Ancient Greek beside your
> reading and compare how translators approach the same passage. Choose Parallel mode to read two
> translations side by side.

**3. The Greek word help**

"Read it in another voice.", second paragraph:

> Tap a Greek word to open its word card, which gives the meaning and form. Translation
> comparisons include notes on the choices behind the wording.

FAQ, "Can I read the original Greek?":

> Yes. You can place the Greek beside a retelling or translation, follow corresponding passages,
> and tap any Greek word to open its word card. The meanings come from a Homeric dictionary stored
> on your device.

("retelling" in the last answer is LD-08, beyond the request; if it is declined, the word stays
"telling". LD-07's "glossary of people and places" is the one other change I would make with
these.)

# Landing page copy edits, round 2: candidate for content review

**Status: CANDIDATE. Not approved copy, not published.** Three follow-up edits the 2026-10-02
arbitration listed for the owner (`docs/landing-facts-0.7.10/reviews/FINAL-ARBITRATION.md`, "For
the owner", items 1, 5, 6), on the owner's "Do the updated screenshots and copy edits on the
site." The four recaptured 0.7.10 screenshots come from another lane and join this change later.

Baseline: `origin/main` `d24f9e0`; live `/` sha256 `a48fec9d…a132`, identical to the source.

## Candidate files

| File | sha256 | Changed |
| --- | --- | --- |
| `skald/index.html` | `64b17c1cbfaf41d55b0500946c0b1481bfe81d02a3ea7c92dcca780c6969109b` | yes |
| `skald/app.js` | `c07ce27bbe0476577ea8dfad7490732f15d32b859ef75f0866acc020efd5c899` | no |
| `skald/get/index.html` | `09ced3b5ec6f4eb5c9dd6978832358266096a64e94dc74c8ba2a13318d7d2434` | no |

`app.js` rewrites only the availability answer, the hero status line and the final kicker; none
of the edits touches those, so the static page and the script stay in step without a script change.

## Every changed string (all on `/`)

| # | Location | Live | Candidate | Why |
| --- | --- | --- | --- | --- |
| C1 | FAQ, new entry after "Which translations are included?" | (none) | **Q:** What language is Skald in? **A:** The app’s interface, notes and retellings are in English. The 24 translations cover 11 languages. | Edit 1. The first sentence is the published update post's, word for word. A separate question, because a visitor asking "is the app in my language?" does not look under "Which translations are included?"; it sits directly below that answer, which lists the eleven languages, so the list is not repeated. |
| C2 | "Read it in another voice.", first paragraph, new last sentence | …and compare how translators approach the same passage. | …and compare how translators approach the same passage. Choose Parallel to read two translations together. | Edit 2. The post's sentence, word for word. "Parallel" is the on-screen label at `v0.7.10`: `feature/reader/src/commonMain/kotlin/com/skald/feature/reader/ReaderModeControls.kt:352` (`ReaderViewMode.Parallel to "Parallel"`, offered when a translation is open). |
| C3 | "Read it in another voice.", second paragraph, first sentence | Tap a Greek word for the Homeric lexicon. | Tap a Greek word to open its Greek word card. | Edit 3. One name for what a tap on a Greek word opens. |
| C4 | FAQ "Can I read the original Greek?" | …follow corresponding passages, and open the on-device Greek glossary. | …follow corresponding passages, and open the on-device Greek word cards. | Edit 3. Here "Greek glossary" meant the same Greek word help; one noun replaced. |

Figures: C1 prints 24 and 11, as live. No other number is touched (3,285, 258, 52, 40 unchanged).

## Edit 3: inventory of names for the Greek word help

What the app has at `v0.7.10` (two different things; `CHANGELOG.md` itself writes "a Greek word or
glossary card"):

- **Greek word cards**: tap a word in the Greek text; the card gives the dictionary entry (bundled
  `lexicon/autenrieth.json`), the form, proper-name labels, and for ten translations a quote. The
  update post and the changelog call them "Greek word cards"; the in-app empty state says "No
  dictionary entry for this form."
- **Glossary**: tappable terms in the story text (people, places, things), opening a glossary card.
  The store description calls this "look up people and places as you go".

| Page | Sentence | Name used | What it refers to | Candidate |
| --- | --- | --- | --- | --- |
| `/` "Read it in another voice." | Tap a Greek word for the Homeric lexicon. | Homeric lexicon | Greek word cards | **change** (C3) |
| `/` FAQ "Can I read the original Greek?" | …and open the on-device Greek glossary. | Greek glossary | Greek word cards | **change** (C4) |
| `/` "Take the library with you." | The text, reading notes, translations, Ancient Greek, glossary, maps and bundled art live on your device. | glossary | the people-and-places glossary (read so because "Ancient Greek" is listed separately beside it) | keep |
| `/` "Find your bearings." | …and look up a person or place when you need a reminder. | (unnamed) | the glossary | keep |
| `/get/` | (no occurrence of lexicon, glossary, word card or dictionary) | | | |

"Dictionary" and "word cards" do not occur on either page today. Recommendation: two
substitutions (C3, C4); "glossary" stays for the different thing it names. After the change the
page says "Greek word card(s)" twice and "glossary" once.

**For reviewers:** the reviewed store description still says "tap a word for the Homeric lexicon";
C3 departs from it in favour of the post's name. A lighter C3 is "Tap a Greek word for its word
card." (avoids "Greek … Greek"). In C4, "the on-device" is kept from the live sentence; "open Greek
word cards" is the shorter alternative.

## Text that describes what a screenshot shows (not changed; check against the 0.7.10 captures)

| # | Where | Text | Image | What to check on the new capture |
| --- | --- | --- | --- | --- |
| S1 | hero `img` alt | Skald on iPhone, showing Butler's opening of Book I with reading notes and historical art. | `assets/reader-art.webp` | iPhone; Butler selected (a new install opens in Murray); Book I opening; note marks and an art plate visible |
| S2 | hero figcaption | Open art alongside the passage you’re reading. | same | an artwork visible beside or within the text |
| S3 | hero margin notes (decorative, `aria-hidden`) | All 24 books · Read · compare · explore | same | drawn by the page, not in the image; nothing to check |
| S4 | translations `img` alt | Skald on iPad, with the Ancient Greek beside an English translation. | `assets/greek-split.webp` | iPad; Greek and an English translation both on screen |
| S5 | translations figcaption | Read the Greek beside a translation, with linked scrolling. | same | split view; "linked scrolling" is behaviour a still cannot show (noted in the 2026-09-15 registry) |
| S6 | journey `img` alt | Skald voyage map with locations from the Odyssey. | `assets/nostos-route.webp` | the voyage map with named places; captured on an Android tablet last time |
| S7 | journey figcaption | Trace the long route toward home without leaving the reader. | same | in 0.7.10 the map opens from notes at their passages, not from a button row; the caption still holds if it opens inside the reader |
| S8 | museum `img` alt | Skald showing Pieter Lastman’s Odysseus and Minerva with its collection details and a reading note. | `assets/museum-guide.webp` | same artwork, its collection details and a note visible; the note now reads "fluted bronze basin" |
| S9 | museum figcaption | Open an artwork alongside the poem. | same | artwork open with the poem's context visible |
| S10 | `og:image:alt`, `twitter:image:alt` | Skald on iPad, with the Ancient Greek beside an English translation. | `assets/skald-odyssey-og-20261002.jpg` (its screenshot is the 0.7.0 `03-parallel.png`) | if the card is re-rendered from the new iPad capture, the same check as S4 |

Nearby sentences that describe the interface rather than an image, to read against 0.7.10 (the
update post says "the voyage map, the fleet and the museum open from notes at their passages, and
the row of five buttons above the text is gone"):

- "Follow the voyage on the map, see what happens to the fleet, and look up a person or place when you need a reminder." and "Open a map or note, spend a little time with it, and return to your passage." (journey). Neither names a button or a row; both hold if map and fleet open from notes.
- "Keep the Ancient Greek beside your reading…" (translations) and "You can place the Greek beside a telling or translation, follow corresponding passages…" (FAQ).
- "Tap a Greek word …" (C3).
- "You can also browse the Art Atlas on the web." (museum; about the website).

No sentence on `/` or `/get/` mentions a row of buttons, a toolbar or a panel. The 0.7.0 captures
themselves show the old five-button row; that is what the recapture removes.

## Checks

- `python3 skald/verify-landing-copy.py` **fails on this branch by design** (`index.html` is
  pinned to the 2026-10-02 registry hash). After arbitration: a new registry folder superseding
  `skald/docs/landing-2026-10-02`, with the recaptured screenshots' hashes and alts.
- Screenshots at 390 and 1280 px, each changed sentence centred and clear of the header:
  `landing-*-translations.png`, `landing-*-faq-language.png`, `landing-*-faq-greek.png`
  (`visual-report.json`: no horizontal overflow, no failed request).
- No skald-web change yet; that follows arbitration.

## `/` as a visitor reads it (candidate, reading order)

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
Choose from 13 English translations, two in French, and one each in Spanish, German, Italian, Russian, Dutch, Danish, Swedish, Hebrew and Modern Greek. Keep the Ancient Greek beside your reading and compare how translators approach the same passage. Choose Parallel to read two translations together.
Tap a Greek word to open its Greek word card. Translation comparisons include notes on the choices behind the wording.
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
Q: What language is Skald in?
The app’s interface, notes and retellings are in English. The 24 translations cover 11 languages.
Q: Can I read the original Greek?
Yes. You can place the Greek beside a telling or translation, follow corresponding passages, and open the on-device Greek word cards.
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

## `/get/` (unchanged)

```text
Skald: Odyssey
# One Odyssey. A shelf of ways through.
All 24 books · 24 translations · the original Greek · 236 works from museums and collections. Free to start — one purchase unlocks every book, with no subscription, ads, or accounts.
[Image: Download on the App Store]
[Image: Get it on Google Play]
Available in the United States, Canada, Australia, New Zealand, and the 27 member states of the European Union. About Skald: Odyssey →
```

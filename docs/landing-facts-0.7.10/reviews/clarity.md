# Landing page and /get/ corrections (0.7.10): reader clarity review

| | |
| --- | --- |
| Role | Reviewer 2: reader usefulness, clarity, art relevance, provenance. Independent of Reviewer 1; their file was not read. |
| Model | `claude-opus-5-5` |
| Effort | high |
| Date | 2026-10-02 |
| Input | `docs/landing-facts-0.7.10/CANDIDATE.md`, sha256 `2a2d87b61ad90b0c62642d5550ea92c333e2d6256e99f64a1a603d87fa673176` |
| Candidate files read | `skald/index.html` (`33022828…75d1`), `skald/app.js` (`8bbd6dc8…dd71`), `skald/get/index.html` (`8b55fdc4…abc1`), `skald/availability.json`, `google-approval-switch.patch`, `INVENTORY.md`; hashes match the candidate table |
| Images looked at | `landing-{390,1280}-{top,totals,faq,final-cta}.png`, `get-{390,1280}.png`, `social-card-{before,after}.jpg`, and the four page screenshots (`reader-art`, `greek-split`, `nostos-route`, `museum-guide` `.webp`) |
| Compared with | Live `https://skald.mannamila.com/updates/` (fetched 2026-10-02; newest post "Twenty-four translations, and Skald opens in the European Union"); app repo `origin/main` `docs/store/releases/0.7.10/shared-description.txt`, `app-store-promotional-text.txt`, `CAPTURES.md`, and `docs/content/reviews/release-0.7.10-2026-10-01/FINAL-listing-count-corrections.md` |

Severity: **blocker** = must not publish as is. **major** = needs an edit or a recorded owner
decision before publishing. **minor** = small edit that makes the page read better or more
consistently. **note** = checked, no change required.

## Verdict: APPROVE_WITH_EDITS

0 blockers, 2 majors (LB-01, LB-02), 9 minors (LB-03 to LB-11), 4 notes (LB-12 to LB-15),
7 questions for the owner.

The page still reads as one piece. The preview framing came out cleanly: the hero card, the
library section, the translations answer and the final call to action have no seam. The two
majors are about what the corrections leave unsaid, not about what they say.

Checked and complete: every changed line in the diff against the live baseline (`cee6168..HEAD`,
`skald/index.html`, `get/index.html`, `app.js`, `availability.json`) maps to one of the 23 rows.
No customer-visible change is missing from the table. The type counts add up (15, 2, 8, 2, 2, 1).
The arithmetic on the page holds: 236 + 22 = 258; 13 + 2 + 9 = 24 translations; 11 languages;
3 free + 21 = 24 books.

## Findings

### LB-01 (major): the availability answer says nothing about Android in the European Union

- **Where:** `/` FAQ "Where is Skald available?" (`index.html` line 300) and the identical string
  in `app.js` line 63, which overwrites the answer at load. Row 18.
- **Text:** "Skald is available on Android, iPhone, and iPad in the United States, Canada,
  Australia, and New Zealand. On iPhone and iPad it is also available in the 27 member states of
  the European Union."
- **Why it fails the reader:** A reader in Germany with an Android phone has to work out their
  answer from an omission. Read carefully, the sentence does not claim they can get it today. Read
  quickly, "available on Android, iPhone, and iPad … also available in the 27 member states" does.
  It gives no reason and no outlook, so it reads as a standing exclusion. The post published the
  same day gives the answer in plain words ("so far on the App Store only"; "the European Union
  countries are with Google for review"). A reader who sees both pages gets two different
  impressions.
- **Order:** the second sentence leads with the device, so the reader looking for their country
  finds it last. Lead with the place: the European reader finds their sentence, then both device
  answers in it.
- **Replacement for today** (uses the approved post's own phrase for the Google status):

  > Skald is available on Android, iPhone, and iPad in the United States, Canada, Australia, and New Zealand. In the 27 member states of the European Union, it is available on iPhone and iPad; on Android, those countries are with Google for review.

- **After Google approves:** the patch's single sentence is clear. See LB-09 for one comma.
- **Mechanics:** the same string must go into `index.html`, `app.js` and the `-` lines of
  `google-approval-switch.patch`, or the patch stops applying.

### LB-02 (major): the museum screenshot shows note text the app has since corrected, and the stale list does not say so

- **Where:** `/` art section, `assets/museum-guide.webp` (`index.html` line 205), unchanged by the
  candidate. "What stays stale, and why" in `CANDIDATE.md`.
- **What is on screen:** the opened Lastman plate with the note "…as a leopard-skinned Odysseus
  hefts a great embossed shield beside her." The app repo records that 0.7.10 changed this note to
  "…hefts a great fluted bronze basin beside her" and widened the museum button
  (`docs/store/releases/0.7.10/CAPTURES.md`, scene 07-art, iPad). The sentence is legible in the
  image at desktop size on a high-density screen.
- **Why it matters:** the candidate says of the screenshots "That is accurate of the images; new
  captures are a separate job." For three of the four that is a fair summary (layout differences
  only). For this one, the page shows a description of an artwork that the app itself has
  corrected. On a page whose art claim is care over sources and details, that is the one stale
  item a visitor could catch.
- **Action (no page text changes in this finding):** add a line to "What stays stale" naming this
  screenshot and the corrected sentence, and have the owner decide between (a) recapturing this
  one image from 0.7.10 first, ahead of the rest, or (b) accepting it until the full recapture. I
  recommend (a). The corrections can ship either way once the decision is recorded.

### LB-03 (minor): `/get/` note is silent on Google Play in the European Union

- **Where:** `get/index.html` line 39. Row 22.
- **Text:** "Available in the United States, Canada, Australia, and New Zealand. On the App Store,
  also in the 27 member states of the European Union."
- **Why:** same gap as LB-01, at lower stakes: the page is `noindex`, the campaigns that feed it
  are paused and were aimed at the four countries. Framing by store is right here, because the two
  badges sit directly above the note. The fragment suits the page's short voice.
- **Replacement for today** (the post's own phrase, place first, two words longer than the
  candidate's second sentence):

  > Available in the United States, Canada, Australia, and New Zealand. In the 27 member states of the European Union, so far on the App Store only.

### LB-04 (minor): "Skald 0.7.0" in five alt texts

- **Where:** `index.html` lines 84, 174, 189, 205 (page images) and 19, 24 (`og:image:alt`,
  `twitter:image:alt`).
- **Useful, harmless or confusing?** Mildly confusing, and not useful to anyone. The page no
  longer mentions a version anywhere, so "0.7.0" has nothing to attach to. A screen reader says
  "Skald zero point seven point zero" four times. A zero-point number suggests an unfinished
  product, and the Updates post says 0.7.10 is live. Sighted visitors see the same images with no
  version label, so the alt is not working as a disclosure: it informs only the people who cannot
  see the image. The stores show these same 0.7.0 captures without a version label. Where the
  captures came from belongs in the review registry, not in the description of the picture.
- **Recommendation: change.** Dropping the number claims nothing new; each alt stays a true
  description of its image. Exact text:

  | Line | Replacement |
  | --- | --- |
  | 84 | Skald on iPhone, showing Butler's opening of Book I with reading notes and historical art. |
  | 174 | Skald on iPad, with the Ancient Greek beside an English translation. |
  | 189 | The voyage map in Skald, with locations from the Odyssey. |
  | 205 | Skald showing Pieter Lastman's Odysseus and Minerva with its collection details and a reading note. |
  | 19, 24 | Skald: Odyssey on iPad, with the Ancient Greek beside an English translation. |

  (Line 84 keeps the `&#x27;` escape; line 205 keeps the curly apostrophe.) The registry's
  `hero_alt`, `greek_alt`, `map_alt`, `art_alt` and `og_and_twitter_image_alt` bindings have to be
  rewritten for the new registry in any case. Record "captured on 0.7.0" there.
- **If the arbiter keeps the number:** nothing breaks, but then keep it on line 205 at least until
  LB-02 is settled, since that image is the one that differs from the current app in words.

### LB-05 (minor): `og:description` opens with a label and is a list of four numbers

- **Where:** `index.html` line 14. Row 2.
- **Text:** "Skald: 24 translations, 3,285 notes, 258 artworks and objects, and references to 52
  journal articles, gathered around the Odyssey."
- **Why:** "Skald:" is what was left when "A look at the next Skald update:" was cut. On a share
  card it sits under `og:site_name` "Skald: Odyssey" and `og:title` "Skald: Odyssey — Spend some
  time with the Odyssey", so the name and colon appear three times, and "Skald: 24 translations"
  reads like a second title. It also says "notes" where the page says "reading notes". Length is
  fine (130 characters).
- **Replacement** (124 characters; same four reviewed figures; opens like the meta description and
  like the reviewed App Store promotional text, "Read the Odyssey with 24 translations, …"):

  > Read the Odyssey with 24 translations, 3,285 reading notes, 258 artworks and objects, and references to 52 journal articles.

### LB-06 (minor): "Skald brings 3,285 reading notes to passages"

- **Where:** `index.html` line 133. Row 12.
- **Why:** "brings" belonged to the update ("The next update brings…"). An update brings things; a
  product has them. With the new subject, "brings … notes to passages" is slightly off and briefly
  parses as bringing notes to the reader. It is the one sentence that still sounds like release
  notes. It does not clash with its neighbours: the strip above gives the total, this paragraph
  says what the notes are about.
- **Replacement** (two words):

  > Skald has 3,285 reading notes on passages across all 24 books: Greek wordplay, translation choices, everyday life, recurring phrases and more.

### LB-07 (minor): `/get/` writes the same number two ways, three words apart

- **Where:** `get/index.html` line 30. Row 20.
- **Text:** "All 24 books · twenty-four translations · the original Greek · 236 works of museum art."
- **Why:** "eleven" in words beside "24 books" was a different number. "24 … twenty-four" is the
  same number in two styles and looks unedited. Digits also scan faster in this page's short
  voice, and the other two figures in the line are digits. The echo "24 books · 24 translations"
  works in the line's favour.
- **Replacement:**

  > All 24 books · 24 translations · the original Greek · 236 works of museum art.

- "236 works of museum art" reads naturally and is the right figure for that phrase. I agree with
  the candidate's note: 258 would need "historical artworks and objects".

### LB-08 (minor): "artworks and artifacts" in the museum eyebrow

- **Where:** `index.html` line 197. Row 14.
- **Text:** "236 artworks and artifacts · 48 museums and collections"
- **Why:** the paragraph directly under it says "236 artworks and objects", the totals strip says
  "historical artworks and objects", and the reviewed store copy says "artworks and objects". The
  eyebrow is the only place with "artifacts". The wording predates this candidate, but the row is
  being edited and the same figure is named two ways two lines apart.
- **Replacement:**

  > 236 artworks and objects · 48 museums and collections

### LB-09 (minor): comma in the after-approval sentence

- **Where:** `google-approval-switch.patch`, three places, and its `verify-site.mjs` pin.
- **Text:** "…on Android, iPhone, and iPad in the United States, Canada, Australia, New Zealand and
  the 27 member states of the European Union."
- **Why:** today's sentence uses the serial comma in both lists ("iPhone, and iPad"; "Australia,
  and New Zealand"). The switched sentence keeps it in the first list and drops it in the second.
- **Replacement:**
  - `/`: Skald is available on Android, iPhone, and iPad in the United States, Canada, Australia, New Zealand, and the 27 member states of the European Union.
  - `/get/`: Available in the United States, Canada, Australia, New Zealand, and the 27 member states of the European Union.
- Otherwise the switched wording is clear and needs nothing else.

### LB-10 (minor, provenance): three gaps in `CANDIDATE.md`

1. **Rows 18 and 22.** The basis is stated ("App Store live in 31 storefronts, Google Play in
   four with the 27 in review") with no pointer to where that was observed. Cite the record and
   its time (for example the App Store Connect availability check and the Play console state), as
   the links section does for the two URLs.
2. **Row 16.** The location says FAQ "How many translations are included?". The page's question is
   "Which translations are included?" (`index.html` line 283).
3. **Truncated hashes.** The live baseline (`2d52ae4d…be2b`, `5c6417ff…aeb3`, `cc67ecb5…a194`)
   and the card's source screenshot (`0fb91a86…`) are abbreviated. The registry will need them in
   full.

Everything else traces: the figures to the two app-repo files (I read both; the wording matches),
row 17 to the store description word for word (confirmed), "the 27 member states of the European
Union" to the live post (confirmed), the card to its generator. Rows 1–3, 7, 8, 12 and 16 are
wording authored in this candidate by cutting or swapping the subject; the table types them
honestly as rewrites, and the registry should record them as authored here.

### LB-11 (minor): evidence screenshots hide the sentence under review

- **Where:** `landing-390-faq.png`: the sticky header and the "Skip to content" link are drawn
  over the availability answer, so its middle line cannot be read. `landing-1280-faq.png` has the
  same overlay across the labels answer.
- **Why:** this is the capture offered as evidence for row 18 at phone width. I verified the
  sentence from the source instead.
- **Action:** reshoot both with the header hidden (or scrolled to the top) after the final
  wording is in.

### LB-12 (note): meta description and `twitter:description` pass

- `description` (row 1), 110 characters: specific, opens with a verb, two figures, no clipping
  risk. Good as is. Optional, if the owner wants the snippet to say what the thing is (153
  characters): "Read the Odyssey with 24 translations, 3,285 reading notes, art and scholarship
  to explore alongside the poem. Free to start on Android, iPhone and iPad."
- `twitter:description` (row 3), 75 characters: true and short; "with translations" is vague.
  Optional: "Read the Odyssey with 24 translations, art and scholarship alongside the poem."

### LB-13 (note): the social card is complete without the line

`skald/assets/skald-odyssey-og-20261002.jpg` is 1200 × 630 and byte-identical to
`social-card-after.jpg`. With the line gone the title, rule and tagline re-centre on the card's
middle and balance the tablet; nothing looks missing. The alt text describes the tablet
screenshot only and carries the version; LB-04 gives a replacement that also names the card's
wordmark.

### LB-14 (note): seams checked and found sound

- **Hero card** now opens "Available now on Android, iPhone, and iPad." Natural; no transition
  missing where the notice was.
- **"The library"** above "A poem, and a lot to spend time with." works: the strip under it counts
  holdings, and the page uses "library" four more times in its text. No change. (If the arbiter wants the
  eyebrow to answer the hero's "See what's inside ↓", "What's inside" is the alternative.)
- **"Library totals"** (`aria-label`): fine.
- **"Skald includes 24 translations: …"** under "Which translations are included?": natural. It
  repeats the translations section, as it did before, which is normal for a FAQ.
- **"A student or teacher price is available on your own attestation."** Reads as a plain
  statement now. "Attestation" is formal, but it is the reviewed store sentence and was already on
  the page.
- **Final call to action**: "Books I, II and IX are free. Pick a translation and see what catches
  your attention." keeps its reason and closes the loop with the hero's "follow whatever catches
  your attention".
- **"Hear about the next update."**: about future news; correct to keep.
- No leftover preview wording: a search of both pages for next, coming, soon, preview, expanded,
  arrives, currently and 0.7 finds no version or timing claim. What it does find is that heading,
  "somewhere to go next" (about articles), and the "0.7.0" alt texts (LB-04).

### LB-15 (note): names of things, landing page against the Updates post

Figures agree everywhere: 24 translations, 11 languages, 3,285 reading notes, 52 articles of
which 40 with full text, six coins (252 → 258), Books I, II and IX free. "Reading notes" and
"retellings" are used the same way. The App Store link is the same. Differences a reader of both
could notice:

| Post | Landing page | Reader effect |
| --- | --- | --- |
| "so far on the App Store only"; "with Google for review" | iPhone and iPad only, no status | Two impressions. Fixed by LB-01 and LB-03. |
| "The app's interface, notes and retellings are in English." | not stated | See Q1. |
| "Choose Parallel to read two translations together." | Side-by-side reading is described only as Greek beside a translation; "Parallel" appears only inside the screenshots | Not a contradiction; the landing page undersells it. See Q5. |
| "Greek word cards", "the dictionary behind" them | "the Homeric lexicon" (line 169), "the on-device Greek glossary" (line 288), "glossary" (line 216) | Four names for what may be one or two things. See Q6. |
| "Australia and New Zealand" | "Australia, and New Zealand" | Comma only. |
| "six more ancient Greek coins", "the museum" | "artworks and objects" / "artworks and artifacts" | LB-08. |

## Questions for the owner (beyond the requested corrections)

Each is something the corrections expose, with one suggestion. None is required for the verdict.

- **Q1. Interface language.** The page now addresses 27 more countries and says "24 translations
  in 11 languages", so a German or French reader may expect a German or French app. Suggestion:
  append the post's approved sentence to the "Which translations are included?" answer: "The
  app's interface, notes and retellings are in English." Of the seven, this is the one I would
  take with this change.
- **Q2. How an EU Android reader hears when it opens.** The only route is the updates list, and
  its form asks "United States, Canada, Australia, New Zealand, or somewhere else". Suggestion:
  point the availability answer at the journal, which needs no sign-up ("The updates journal will
  say when that changes."), and decide separately whether inviting EU sign-ups fits the Product
  Updates Privacy Notice.
- **Q3. The hero and final cards.** "Available now on Android, iPhone, and iPad." above a Google
  Play badge sends an EU Android visitor to a store page that refuses them, with the explanation
  in the seventh of nine collapsed answers near the foot of the page. Suggestion: a small "Where is it available?" link
  beside the badges that opens that answer.
- **Q4. Recapture order.** Suggestion: recapture `museum-guide` first (LB-02), then the rest; and
  check the voyage-map image (an Android tablet capture) against 0.7.10, since the app repo's
  capture comparison does not cover a map scene.
- **Q5. Two translations side by side.** The post leads with it; the landing page never says it.
  Suggestion: one sentence in "Read it in another voice.", such as "Or read two translations side
  by side."
- **Q6. One name for the Greek word help.** Suggestion: settle whether "Homeric lexicon", "Greek
  glossary" and "Greek word cards" are one thing, and use one name on the page and in posts.
- **Q7. `/get/` languages.** Suggestion, if the line may grow by three words: "24 translations in
  11 languages", the reviewed store phrase, which also tells an EU visitor why the count matters.

## Summary of exact replacements

| Id | Where | Replacement |
| --- | --- | --- |
| LB-01 | `index.html` 300, `app.js` 63 | Skald is available on Android, iPhone, and iPad in the United States, Canada, Australia, and New Zealand. In the 27 member states of the European Union, it is available on iPhone and iPad; on Android, those countries are with Google for review. |
| LB-03 | `get/index.html` 39 | Available in the United States, Canada, Australia, and New Zealand. In the 27 member states of the European Union, so far on the App Store only. |
| LB-04 | `index.html` 19, 24, 84, 174, 189, 205 | five alt texts, table above |
| LB-05 | `index.html` 14 | Read the Odyssey with 24 translations, 3,285 reading notes, 258 artworks and objects, and references to 52 journal articles. |
| LB-06 | `index.html` 133 | Skald has 3,285 reading notes on passages across all 24 books: … (rest unchanged) |
| LB-07 | `get/index.html` 30 | All 24 books · 24 translations · the original Greek · 236 works of museum art. |
| LB-08 | `index.html` 197 | 236 artworks and objects · 48 museums and collections |
| LB-09 | switch patch | …Australia, New Zealand, and the 27 member states of the European Union. |

LB-02, LB-10 and LB-11 change `CANDIDATE.md` and the evidence, not the page.

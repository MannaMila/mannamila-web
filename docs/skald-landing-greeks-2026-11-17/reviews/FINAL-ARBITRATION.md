# Final arbitration: skald/ landing + get, commit 172c616 plus working-tree layout edits

Role: Final content arbiter (third agent). Model: Claude Opus 5.5 (claude-opus-5-5), standing in for the arbiter role.
Scope: `skald/index.html`, `skald/get/index.html` as they are in the worktree (172c616 + menu labels "Library"/"Translations" + notes paragraphs re-split).
Inputs: `accuracy.md` (Reviewer 1, APPROVE) and `clarity.md` (Reviewer 2, APPROVE WITH CHANGES).

## Rulings

### Clarity, required
1. Picture count: ACCEPT WITH REWORDING. 565 is right (267 beside the Odyssey + 298 beside the library). 258 counts distinct works in the Odyssey, a different thing. Keep 565 everywhere and print its two parts (267 + 298) in the gallery, so every printed sum closes; 258 stays in its own sentence about distinct works.
2. Translations eyebrow: ACCEPT WITH REWORDING. Shorter eyebrow with no numbers to mis-add: "The Odyssey in 11 languages · the library in English".
3. Strip cell: ACCEPT. "58 translations across the seventeen works".
4. Content note: ACCEPT WITH REWORDING. The reviewer is right that "monsters and battles" undersells the end of the Odyssey on a page; the page is not bound by store-listing length. Use the store's own phrase "violence and mature themes" for both: "The Odyssey and some plays and histories in the library include violence and mature themes." This stays within the store's claims and does not widen to "many works".
5. FAQ answer: ACCEPT WITH REWORDING. The question is "Is the whole Odyssey included?", so the answer stays about the Odyssey; tie the books to it and leave the library free sections to the pricing FAQ and hero.
6. "unlocks" vs "opens": ACCEPT. Applied inside edit 5; no other "unlock" remains.

### Clarity, optional
7. Hero caption: ACCEPT WITH REWORDING. "The library: the Odyssey first, then five shelves."
8. FAQ order: ACCEPT. Rename question first; it is the question returning readers bring.
9. EU/AU sentence: ACCEPT WITH REWORDING. Move to the end, but "some Plato translations" is inaccurate (it is part of one translation, the Loeb). Final wording below.
10. Library section duplicate sentence: ACCEPT. Cut it; the hero already says it.
11. "What they made": ACCEPT. Restores the original "Their work".
12. Notes merge: ACCEPT. Removes the repeated "In/For the Odyssey" opening.

### Accuracy open points
- Word cards for library Greek: REJECT any widening (not device-checked). Page stays Odyssey-scoped. Follow-up below.
- "most of them from the Met, Rijksmuseum, Cleveland" (unverified): ACCEPT AS IS, conditional; consistent with the art-lane sources, and "most" is soft. Root should recount before the next site revision (see below). Grandfathering covering the library: kept, confirmed by store copy.

## Resolved edits

skald/index.html

1.
OLD: <li><strong>58</strong><span>translations, with the Greek beside them</span></li>
NEW: <li><strong>58</strong><span>translations across the seventeen works</span></li>

2.
OLD: <p class="eyebrow">58 translations · the Odyssey in 11 languages</p>
NEW: <p class="eyebrow">The Odyssey in 11 languages · the library in English</p>

3.
OLD: <p>The library has 298 pictures of its own, each set at the passage it belongs to, most of them from the Metropolitan Museum of Art, the Rijksmuseum and the Cleveland Museum of Art.</p>
NEW: <p>Of the 565 pictures beside the text, 267 are in the Odyssey and 298 in the library. Each library picture is set at the passage it belongs to, and most of them come from the Metropolitan Museum of Art, the Rijksmuseum and the Cleveland Museum of Art.</p>

4.
OLD: The Odyssey includes monsters and battles, and some plays and histories in the library include violence and mature themes.
NEW: The Odyssey and some plays and histories in the library include violence and mature themes.

5.
OLD: <p>Yes. Books I, II and IX are free to read in full. One purchase unlocks the other 21 books, along with the rest of the Greek library.</p>
NEW: <p>Yes. Books I, II and IX of the Odyssey are free to read in full. One purchase opens the other 21 books, along with the rest of the Greek library.</p>

6.
OLD: <figcaption>The Odyssey at the top, then the shelves.</figcaption>
NEW: <figcaption>The library: the Odyssey first, then five shelves.</figcaption>

7. (FAQ order: swap the first two entries)
OLD:
          <details>
            <summary>What is in Skald?</summary>
            <p>The Odyssey and sixteen more Greek works: Homer’s Iliad and the Homeric Hymns, Hesiod, Sappho, the surviving plays of Aeschylus, Sophocles and Euripides, Herodotus, Thucydides, Plato, four works of Aristotle, and Epicurus. Each has its Greek text, English translations and reading notes.</p>
          </details>
          <details>
            <summary>What happened to Skald: Odyssey?</summary>
            <p>It is the same app with a new name. Skald: Odyssey became Skald: the Greeks in November 2026, when the Greek library joined it. The app updates in place, and the Odyssey is where it was, with its translations, the voyage map, the fleet and the museum.</p>
          </details>
NEW:
          <details>
            <summary>What happened to Skald: Odyssey?</summary>
            <p>It is the same app with a new name. Skald: Odyssey became Skald: the Greeks in November 2026, when the Greek library joined it. The app updates in place, and the Odyssey is where it was, with its translations, the voyage map, the fleet and the museum.</p>
          </details>
          <details>
            <summary>What is in Skald?</summary>
            <p>The Odyssey and sixteen more Greek works: Homer’s Iliad and the Homeric Hymns, Hesiod, Sappho, the surviving plays of Aeschylus, Sophocles and Euripides, Herodotus, Thucydides, Plato, four works of Aristotle, and Epicurus. Each has its Greek text, English translations and reading notes.</p>
          </details>

8.
OLD: The Greek text of every work is included separately. In the European Union and Australia, W. D. Ross’s Ethics and some of the Loeb Plato are not offered; the other translations of those works are. <a href="./translations/">
NEW: The Greek text of every work is included separately. W. D. Ross’s translation of the Ethics and part of the Loeb translation of Plato are not offered in the European Union and Australia; the other translations of those works are. <a href="./translations/">

(Note: the sentence already sits last before the link; this edit rewords it in place.)

9.
OLD: <p>Beside the Odyssey there is a library of sixteen more works. Each has its Greek text, English translations, reading notes and pictures beside the passages they illustrate. The first section of every library work is free.</p>
NEW: <p>Beside the Odyssey there is a library of sixteen more works. The first section of every library work is free.</p>

10.
OLD: What they made gives us more to notice
NEW: Their work gives us more to notice

11.
OLD: In the Odyssey, some notes speak to a particular translation, so fresh notes can surface as you reread or change editions. For the Odyssey, references to 52 journal articles give you somewhere to go next.
NEW: In the Odyssey, some notes speak to a particular translation, so fresh notes can surface as you reread or change editions, and references to 52 journal articles give you somewhere to go next.

skald/get/index.html: no edits. Its "565 pictures beside the text" stands alone with no parts printed beside it, and it already says "opens".

## Decision

APPROVED (with the resolved edits applied)

Checks after applying: "Hear about the next update." occurs once and no other "next update" wording; the FAQ availability sentence is untouched; "Skald: Odyssey" appears only in the rename FAQ; no "unlock" remains in either file; no new em dashes.

## For the root
- The `<title>` and `og:title` keep an em dash as the separator ("Skald: the Greeks — Spend some time with the Greeks"). It predates this change and is a title separator, not prose, so it is not blocked here; decide whether to switch it site-wide.
- Check on a device whether tapping Greek in a library work opens a word card. If it does, widen the claim in a later reviewed change (accuracy review item 9 wording).
- Recount the library picture sources to confirm "most of them" from the Met, Rijksmuseum and Cleveland.
- 258 (distinct works) and 267 (pictures beside the Odyssey's text) now both relate to the Odyssey in the gallery section; they are different counts and no printed sum breaks, but if readers ask, a later revision could say the gallery and reading share some works.
- Clarity layout notes: "READ · COMPARE · EXPLORE" clipped on desktop; phone h1 wrap. Not content; leave to a layout pass.
- Waitlist-privacy page: confirm its body and date match updates-privacy (clarity review, smaller pages).
- Record this arbitration in the content review registry with the two reviews.

# Skald privacy pages for the EU27 opening (0.7.10)

**Not published. Merge only on the owner's go at EU activation**, together with the
companion `MannaMila/skald-web` pull request (merging that one publishes to the live site).
English and French go out together.

## Sources (MannaMila/skald, branch `legal/eu-privacy-0.7.10`)

| | Markdown | SHA-256 |
| --- | --- | --- |
| English | `docs/legal/privacy-policy.md` | `3e73d5cbc64cb4b88bba65d9e619fbfb8098d6860f575e9a062c49d1f48f90cd` |
| English, hosted mirror | `docs/sessions/2026-07-31-phase1-prep/hosted-privacy-policy-proposed.md` | `7464a102b90aa830fa1a5ca3474b090de5e5f49c422e116a1ef003a6625f0c1a` (body identical to the file above after its two-line preamble) |
| French | `docs/sessions/2026-10-02-eu-activation-privacy/french-resolved/privacy-policy.fr.md` | `618112564bd304d74850402b311f7a06a72c99997c195891421c5e6600026c3f` |

Rendered pages: `skald/privacy/index.html` `30ea8e0c6c251f61e61c2ee4290344174557df30e3591698aa9540a98e3c761b`,
`skald/privacy/fr/index.html` `56554fef209db903fcc3fc6957aece6e33bcdb3776b8762bd47157c29e6da1d5`.

## Method

`tools/render.py` renders the Markdown into the page's existing markup shape and replaces
only the policy body (from `<h1>` to the closing navigation). Head, styles, language
switch, `retire-analytics.js` loader and navigation are untouched. Before use it was run on
the previously published sources (English at `c3566193e` with the 0.7.9 date edit; French of
2026-09-13) and reproduced both live pages **byte for byte**.

One deliberate markup choice, per the French arbitration ("For the root", 3): the bare EDPB
address is an `<a>` whose text is the address itself, so the sentence's full stop stays
outside the link. English links `members_en`, French `members_fr`. Visible text is unchanged.

French typography: the 60 U+00A0 characters of the source are kept as real U+00A0 characters
(the page used neither U+00A0 nor `&nbsp;` before). French `rel="canonical"` and the visible
canonical line both read `https://skald.mannamila.com/privacy/fr/`; the existing hreflang
pair on the French page is kept, and the English page still has none (existing convention).

`skald/verify-site.mjs`: one assertion followed the reviewed text. The old page ended with
"…Canada, Australia and New Zealand."; the policy now says "…Canada, Australia, New Zealand
and the 27 member states of the European Union", and the assertion matches that sentence.

## Evidence

- `parity-report.json` (`tools/parity.py`): for each language the page body equals the
  Markdown block for block, in order (73 blocks; 211 English and 214 French sentences, none
  missing, none extra). Whitespace is collapsed without touching U+00A0, so the comparison is
  exact on the non-breaking spaces. The only other visible text is navigation chrome, listed
  in the report. Link targets equal the Markdown's, in order, plus the EDPB address.
- The same report holds the marker loop of the app repository's
  `scripts/verify_hosted_privacy_policy.sh` (branch `legal/eu-privacy-0.7.10`), run on the
  local English page with that script's own HTMLParser normalisation: **15 of 15 markers
  present**, no unresolved placeholder.
- `visual-report.json` and screenshots (`tools/shots.mjs`, installed Google Chrome through
  Playwright `channel: 'chrome'`, tree served by a local static server): `en-390.png`,
  `en-1280.png`, `fr-390.png`, `fr-1280.png` (top of page) and the same four with
  `-eu-section` (scrolled to the new section). No horizontal overflow at either width; the
  only requests are the page and `retire-analytics.js`.

## Checks

- Privacy assertions of `skald/verify-site.mjs` (run on their own): pass.
- `node skald/verify-site.mjs` as a whole and `node scripts/test-promote-skald.mjs` stop at
  "Set SKALD_MOSAIC_PASSWORD…" before reaching any privacy check; the password was not
  available to this lane. Same result on unmodified `origin/main` (`325c1f9`).
- `node scripts/test-analytics-contract.mjs` fails on
  `skald/docs/store-web-2026-09-13/resolved-index.html`, a file this change does not touch;
  same failure on unmodified `origin/main`.

The tools carry this lane's absolute paths; adjust `W` and `S` to rerun elsewhere.

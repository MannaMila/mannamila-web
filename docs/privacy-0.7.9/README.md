# Reviewed Skald 0.7.9 privacy pages

The English page renders the canonical hosted policy from MannaMila/skald
`docs/legal/privacy-policy.md` at `origin/main` `c3566193e` (or newer), which is
byte-identical to the approved output recorded in
`docs/content/reviews/ios-skan-purchase-2026-09-29/resolved-review.json`
(`approved_output_sha256["docs/legal/privacy-policy.md"]`). Beyond the 0.7.0
publication (#22), this carries the SKAdNetwork purchase-measurement paragraph
from PR #494 / record `ios-skan-purchase-2026-09-29`: Skald now asks Apple to
update the SKAdNetwork conversion value to `1` after a verified purchase, instead
of only ever setting `0` at launch. No reminders-paragraph change was found
between `ec9104e4b` (the source #22 used) and the current `origin/main`; the
SKAdNetwork paragraph is the only content difference. Every sentence is rendered
verbatim.

**Correction applied per orchestrator instruction (2026-09-30):** the markdown's
own front-matter still reads `Last updated: 2026-09-18` on `origin/main` as of
this writing, even though PR #494 changed the SKAdNetwork paragraph. The 0.7.9
release commit will change that line to `Last updated: 2026-09-30` and make no
other policy change. This publication renders the hosted page from `main`'s text
with that single date edit applied ahead of the release commit landing, so the
published date matches the 0.7.9 release commit. No other text was altered
beyond what PR #494 already changed in `docs/legal/privacy-policy.md`.

English policy SHA-256 (markdown, PR #494's approved output): `eac53bfa6abc058eb11354012be4e7009debc6d2518242ff7bc1005518c815f8`.
English page SHA-256 (rendered HTML, with the Last-updated date edit): `fccc974f0b442203166c9d2dbc6864601188c98add800cf2c1f83a3ffe86d993`.
French policy SHA-256: `7dbe1796f56470dcf03a8143d2cf8fd8c6d892d7f011fb0b84a7017a3f9433b5` (unchanged).
French page SHA-256: `d4d3ad5baa4487020bac1a74dd21365ca7bd83410c07cef492d0de40d4f27f71` — byte-identical to the 0.7.0 publication.

The French page still renders the independently reviewed 2026-09-13 translation.
No reviewed French text exists yet for the paragraph PR #494 added (or for #411 /
#414 before it), so its body and its "Dernière mise à jour" date (2026-09-13) are
unchanged from the 0.7.0 publication — the English page at `/privacy/` is the
current authoritative text until a reviewed translation lands. This publication
makes **no changes at all** to the French page; its hash is identical to the
0.7.0 publication's.

## Method

Reproduces PR #20/#22's method: the converter renders the markdown's substantive
text verbatim into the existing page's markup, preserving all page chrome,
inline styles, and the `retire-analytics.js` loader. Only the one changed
paragraph (plus the Last-updated date, per the correction above) was edited in
`skald/privacy/index.html`; no other markup, CSS, or script changed.

## Evidence

- `parity-report.json` — visible-text parity against the reviewed sources
  (tag-stripped, whitespace-collapsed comparison, the same method the release
  gate's HTMLParser uses), SHA-256 of each source and rendered file, and the
  full marker-and-placeholder check result.
- `visual-report.json` + `en-390.png` / `en-1280.png` / `fr-390.png` /
  `fr-1280.png` — 390px and 1280px viewport renders with no horizontal overflow
  (`scrollWidth === clientWidth` at both widths, both languages), captured via
  Puppeteer-core driving the system Chrome with a genuine mobile-viewport CDP
  override (`Page.setViewport({width:390, isMobile:true, hasTouch:true})`).
  **Tooling note:** Chrome's plain CLI headless flags (`--headless=new
  --window-size=390,...`) enforce an internal ~500px window-width floor on this
  machine, which silently produces a wider-than-requested layout — confirmed via
  a throwaway test page (`innerWidth` came back 500 when 390 was requested).
  Puppeteer's CDP `Emulation.setDeviceMetricsOverride` (used under
  `page.setViewport`) bypasses that floor and gives a true 390px layout,
  matching the intent of the original PR #20/#22 evidence. Screenshots are
  viewport captures (not full-page) to keep file sizes comparable to the 0.7.0
  evidence.
- Local marker check — ran the exact marker list from `scripts/
  verify_hosted_privacy_policy.sh` at `origin/main` in the MannaMila/skald repo
  (not the stale list in an older local checkout) against the rendered
  `skald/privacy/index.html`, using the same tag-stripping/whitespace-collapse
  method as the gate's Python `HTMLParser` step. Result: **all 15 markers pass,
  plus the unresolved-`{{placeholder}}` check.** Markers checked:
  - `Skald: Odyssey`
  - `privacy@mannamila.com`
  - `The date Skald: Odyssey 0.7.0 is first made available`
  - `Reading text, your saved place, selected book and translation, and reading preferences are kept in app storage`
  - `Advertising measurement`
  - `facebook-core SDK. It asks the SDK to log the events described above`
  - `tracking permission only after you actively finish a free book`
  - `It does not share events from before you allow tracking`
  - `advertiser-ID collection is off, and Skald does not send IDFA`
  - `Reading, purchasing, and restoring purchases work the same`
  - `sets its SKAdNetwork conversion value to`
  - `update the conversion value to 1 for one purchase`
  - `https://delivery.mannamila.com`
  - `Routine network information such as the request IP address is processed to serve and protect the request`
  - `This release is approved for distribution in the United States, Canada, Australia and New Zealand`

  All PASS. No unresolved `{{placeholder}}` found.

This is a scoped privacy update, not a full promotion of the canonical site
tree. No app-store operation is included. Companion PR in `MannaMila/skald-web`
copies only `privacy/index.html` (the French page is unchanged there too, so it
was not touched).

# Reviewed Skald 0.7.0 privacy pages

The English page renders the canonical hosted policy from MannaMila/skald
`docs/legal/privacy-policy.md` at `ec9104e4b` (last updated 2026-09-18). That text
is byte-identical to `docs/sessions/2026-09-18-eu-offline/resolved/hosted-privacy-policy-proposed.md`
after its two-line preamble, and the app's release-readiness gate pins it. Beyond the
2026-09-13 iOS ATT arbitration that the previous publication rendered, it carries the
Android consent/measurement text (PR #411, record
`release-0.7.0-eu-measurement-consent-2026-09-17`) and the EU offline tier (PR #414,
record `release-0.7.0-eu-offline-2026-09-18`). Every sentence is rendered verbatim.

English policy SHA-256: `756bd91cb9c11cb0fdf8dbd52b7726ed69f00ca5c66616c2ff8f69d6fbe5b6c4`.
French policy SHA-256: `7dbe1796f56470dcf03a8143d2cf8fd8c6d892d7f011fb0b84a7017a3f9433b5`.
French arbitration SHA-256: `201ae46d49d96ef19dce61fcd3324249aff15db1bc68aeda3b959bbdf270e4bf`.

The French page still renders the independently reviewed 2026-09-13 translation. No
reviewed French text exists yet for the paragraphs added by PR #411 and PR #414, so its
body is unchanged and its "Dernière mise à jour" stays 2026-09-13; the English page at
`/privacy/` is the current authoritative text until a reviewed translation lands. The
only French change is the `retire-analytics.js` loader in `<head>`, which the
analytics-retirement contract requires on every route and which the previous
publication omitted.

`parity-report.json` proves every visible policy word on each page matches its reviewed
source. The 390px and 1280px viewport renders and `visual-report.json` show no
horizontal overflow, the updated date on the English page, and that the retirement
loader is the only script on either page. Page chrome, styles, heading structure and
language navigation are unchanged from the previous publication.

This is a scoped privacy update, not a full promotion of the canonical site tree. No
app-store operation is included.

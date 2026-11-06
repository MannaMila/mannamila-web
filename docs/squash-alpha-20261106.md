# Mila Squash alpha website — 2026-11-06

Source for the private-alpha landing page at `squash.mannamila.com`. It replaces the
July "store review / launch waitlist" page and the unpublished October "preparing"
branch (`codex/squash-release-web-20261026`, commits 64e622b, 2e58233, c1449f3). The
useful parts of that branch were folded in: the `--site` argument on the analytics
contract test, the app.js release-state test, the Meta store-access privacy paragraph,
and the rule that a disabled signup mounts no iframe. Its "preparing" status copy,
privacy page restructure and support-address change were not carried over.

## What the page says and where each claim comes from

| Claim | Source |
| --- | --- |
| Private alpha, manual approval, 18+, Quest 3 / Quest 3S with controllers, 200 places | `squash-vr/docs/TESTING_COHORT.md`, `squash-vr/docs/website-cohort-handoff.json` |
| Invite URL `https://www.meta.com/s/8gekrWSxj` | Verified Meta enrollment page, S341 |
| 200 frames per second on Quest 3 in High FPS mode; 207 Hz physics | `squash-vr/docs/PROJECT_STATE.md` S334, S336, S338 (High 200–202 FPS at RTM 0.90 / 207 Hz); High FPS is the fresh-install default on build 808 |
| Swept racket contact between physics steps | `squash-vr/docs/racket-realism-plan.md`, `scripts/physics/racket_ccd.gd` |
| Spin generated at the racket, persistent through bounces, Magnus lift, drag | `squash-vr/docs/research/52-magnus-and-spin-bounce-coupling.md`, D34/D35 |
| Ball temperature affecting bounce and sound pitch | `scripts/ball_thermal_model.gd`, `docs/decisions/D25-generated-impact-audio-policy.md` |
| Racket contact model: face angle, swing speed, effective mass, off-center twist | `squash-vr/docs/research/19-racket-ball-collision.md` |
| Seven impact classes with generated sound, haptics on contact | D25 (racket, front wall, side wall, back wall, floor, ceiling, tin) |
| Verdict, depth, tightness, tempo, shot card, box comparison, session log, consistency, target accuracy, contact and legality views | Clip manifest descriptions in `Mila-Squash-Clips-2026-11-06/manifest.json`; existing July page |
| Serve history on headset, never uploaded | App privacy policy |

Claims deliberately **not** made: Quest 3S performance, permanent free access, launch
credit, pricing, multiplayer or full matches, a store date.

## Media

Two clips under `squash/media/`, copied byte-for-byte from the owner's revision-2
delivery (SHA-256 prefixes): `hand-racket-ball-control` 969859fe (hero) and
`progress-and-consistency` 09a9c971 (privacy section, shows the on-device Stats).
Posters are the delivered first frames scaled to 1280×720. The social card
`assets/mila-squash-og.jpg` is a 1200×630 center crop of the hand/racket poster. No
captions, logos or overlays were added. The owner's 2026-11-06 restyle dropped the
other clips to keep the page short; the held `02-close-contact.mp4` (BL-362 stringbed
fallthrough) was never used. Source footage is the Dev-app recording; the page does
not call it build 808 footage.

## Design and copy (2026-11-06 restyle)

Owner direction: a court palette instead of Skald's paper/copper (plaster off-white
walls, maple floor band, red court lines, dark glass panel), plain headings with no
italic taglines, the owner's own hero sentence, a privacy block that says play data is
never sent to us and is all available on the headset, about a screen and a half of
scroll, the email form on its own page (`/list/`) rather than embedded, and a Quest 3
image (an inline SVG illustration; no licensed photo was available). Copy went through
two Codex plain-language passes; the brand line "Playful, practical software." stays for
parity with the other MannaMila sites. Fonts: Barlow Semi Condensed and Inter.

## Google Analytics

Re-enabled for Squash only, measurement ID `G-E0E4FPDPTB`, host-scoped cookie, Google
Signals and ad personalization off, one custom event `alpha_request_click`. Disclosed
at `/privacy/#website`. Skald and Inspire keep the retirement script. Details and
live-verification steps: [google-analytics.md](google-analytics.md).

## Alpha email list — Google Form specification

Live since 2026-11-06 under `assaf@mannamila.com`: public form
`https://docs.google.com/forms/d/e/1FAIpQLSe-2k82oaFx2d7ql4qZdf2RQ1hGpHF0YCPVpP8r3veAp6Ipkg/viewform`,
responses in the "Mila Squash alpha list responses" Sheet
(`https://docs.google.com/spreadsheets/d/1M6AEXunFAO4DRX-vZHxyUJW2XVQo6ROthmzO8jxtifg/edit`).
`site-config.json` carries `signupEnabled: true` with that URL. The Skald product-updates
list uses the same Google Forms → Google Sheets pattern. The specification below is what
was built; change the form and this notice together.

**Title:** Mila Squash alpha list

**Description:** Occasional email about the Mila Squash alpha on Meta Quest 3: when
it opens wider, when a build changes something testers asked for, and when the app
reaches the store. At most one email a month; unsubscribe any time. This is not the
alpha access request, which happens on Meta's site. Privacy notice:
https://squash.mannamila.com/waitlist-privacy/

| # | Question | Type | Required | Options / validation |
| --- | --- | --- | --- | --- |
| 1 | Email address | Short answer | yes | Response validation: text, email address |
| 2 | Which headset do you have? | Multiple choice | yes | Quest 3; Quest 3S; Another headset, or none yet |
| 3 | How much squash do you play? | Multiple choice | no | New to squash; Now and then; Club or league; Competitive |
| 4 | I am 18 or older | Checkboxes | yes | single option "Yes"; validation: select at least 1 |

**Settings:** do not collect email addresses automatically (question 1 is the only
copy); do not require sign-in; do not limit to one response; no file uploads; not a
quiz; no response summary for respondents; no editing after submit; link responses
to a new dedicated Sheet named "Mila Squash alpha list responses"; restrict editors to
MannaMila operators. Confirmation message: "Thanks. We will write when there is
something worth reading."

These fields match `squash/waitlist-privacy/index.html` exactly. Adding a question
means updating that notice first.

## Deployment

```sh
node squash/verify-site.mjs
node scripts/test-promote-squash.mjs
node scripts/promote-squash.mjs --target ../squash-web --dry-run
node scripts/promote-squash.mjs --target ../squash-web --apply
node scripts/promote-squash.mjs --target ../squash-web --check
```

Promotion removes `retire-analytics.js` from the deployment and adds `analytics.js`
and `media/`. The deployment repository `MannaMila/squash-web` publishes `main:/` with
the `squash.mannamila.com` CNAME; GitHub's domain re-registration adds "Delete CNAME"
/ "Create CNAME" commits there, so pull before promoting.

## TLS record

HTTPS is served by Cloudflare since 2026-11-06 (proxied record plus a hostname-scoped
HTTP→HTTPS redirect rule); see the exception in
[github-pages-custom-domains.md](github-pages-custom-domains.md). The app repository's
session 343 note records the failed GitHub-side resets. Completion gate: Pages `status=built`, certificate `approved`,
`https_enforced=true`, `http://` redirecting to `https://`, and the page plus
`styles.css`, `app.js`, `analytics.js` and a clip poster returning 200 over HTTPS.

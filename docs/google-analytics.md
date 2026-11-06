# Google Analytics

## Status by product site

| Site | Analytics | Loader every HTML route must include | Since |
| --- | --- | --- | --- |
| `squash.mannamila.com` | **GA4 live** (page views, scrolls, outbound clicks, one custom event) | `analytics.js` | 2026-11-06 |
| `skald.mannamila.com` | Retired | `retire-analytics.js` | 2026-07-28 |
| `inspire.mannamila.com` | Retired | `retire-analytics.js` | 2026-07-28 |

`scripts/test-analytics-contract.mjs` enforces one mode per site and discovers routes
from the source trees, so a new HTML route fails verification unless it follows its
site's contract. Run it for one site with `--site squash`.

The main MannaMila Google Site has a separate native Analytics setting that this
repository does not control. It was switched off in the Google Sites editor on
2026-07-28; recheck it as separate live evidence.

## Ownership

- Google account: `assaf@mannamila.com`
- Analytics account: `MannaMila`
- GA4 property: `MannaMila Websites`
- Web stream: `MannaMila.com websites`
- Measurement ID: `G-E0E4FPDPTB`
- Stream ID: `15334583978`

The measurement ID and stream ID are public identifiers, not secrets. The property was
left in place when the product sites retired the tag in July 2026; the Squash loader
re-uses it, so historical July data and new November data sit in one property.

## Mila Squash GA4 contract

`squash/analytics.js`:

1. runs only when `location.hostname` is exactly `squash.mannamila.com`. Localhost,
   `mannamila.github.io` previews, embeds and the sibling product sites never load the
   tag or create a data layer;
2. configures `G-E0E4FPDPTB` with `allow_google_signals: false`,
   `allow_ad_personalization_signals: false`, `cookie_flags: "SameSite=Lax;Secure"` and
   `cookie_domain: "squash.mannamila.com"`. The cookie is scoped to the Squash host on
   purpose: Skald and Inspire still run the retirement script, which expires `_ga*`
   cookies set on the shared `mannamila.com` domain;
3. appends exactly one `async` Google tag script and writes no cookies itself.

`squash/app.js` sends one custom event, `alpha_request_click`, with a `link_location`
of the page section, when a visitor clicks a Meta alpha request link. No personal
data, URL parameter or form content is sent. Never place an email address, phone
number, name, or other personal data in a URL or Analytics event.

The privacy policy at `/privacy/#website` discloses the measurement, the cookie scope,
the disabled advertising features and the opt-out routes. Keep that section in step
with the loader. Consent handling remains a public-policy decision; do not claim legal
compliance based only on this technical configuration.

Enhanced measurement (page views, scrolls, outbound clicks, file downloads) is a
stream setting in the Analytics admin, not in this repository.

## Skald and Inspire retirement contract

Those sources contain no GA measurement ID, Google tag loader, `gtag` initialization
or analytics-cookie configuration, and ship no `analytics.js`. Every HTML route loads
the identical `retire-analytics.js`, which on a `mannamila.com` hostname expires any
observable `_ga` and `_ga_*` cookie at `Path=/` as a host cookie and with
`Domain=mannamila.com`, makes no network request and creates no identifier. It does
nothing on localhost or the preview host. Browser JavaScript cannot remove HttpOnly
cookies or cookies on another registrable domain, so the routine is best effort.

## Verification

Source and promotion tests:

```sh
node scripts/test-analytics-contract.mjs
node squash/verify-site.mjs
node skald/verify-site.mjs
node inspire/verify-site.mjs
node scripts/test-promote-squash.mjs
node scripts/test-promote-skald.mjs
node scripts/test-promote-inspire.mjs
```

After a Squash deployment, in a clean browser profile:

1. every documented route (`/`, `/privacy/`, `/support/`, `/waitlist-privacy/`)
   returns HTTP 200 over HTTPS;
2. `analytics.js` returns 200 and `retire-analytics.js` returns 404;
3. the Network panel shows one request to
   `googletagmanager.com/gtag/js?id=G-E0E4FPDPTB` and collection requests to a
   `google-analytics.com` or regional `analytics.google.com` endpoint;
4. a `_ga` cookie exists for `squash.mannamila.com` only, not for `.mannamila.com`;
5. the visit appears in Analytics **Reports → Realtime** for the property before
   collection is declared live. Initial processing can lag even when the request is
   correct.

After a Skald or Inspire deployment, confirm the opposite: no request to
`googletagmanager.com` or `google-analytics.com`, `analytics.js` returns 404, and no
`_ga*` cookie remains after loading a route.

Treat source tests, deployed-file parity, browser network evidence and the Analytics
Realtime report as distinct evidence. A green source test does not prove that an older
deployment has been replaced.

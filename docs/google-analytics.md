# Google Analytics retirement

## Scope

Google Analytics is disabled in every reviewed static product source and
deployment target:

- `skald.mannamila.com`: `/`, `/get/`, `/feedback/`,
  `/feedback/privacy/`, `/privacy/`, `/support/`, `/updates/`,
  `/updates-privacy/`, and `/waitlist-privacy/`;
- `squash.mannamila.com`: `/`, `/privacy/`, `/support/`, and
  `/waitlist-privacy/`;
- `inspire.mannamila.com`: `/`.

The route list is discovered from the source trees by
`scripts/test-analytics-contract.mjs`, so a new HTML route fails verification
unless it also follows the retirement contract.

The main MannaMila Google Site is configured separately through Google Sites.
Its native Analytics setting is not controlled by this repository. That setting
was switched off in the signed-in Google Sites editor on 2026-07-28; recheck it
as separate live configuration evidence. If it is enabled again, visiting the
main site can create a new shared-domain Google Analytics cookie after a
product route has removed an earlier one.

## Source and deployment contract

The product sources contain no GA measurement ID, Google tag loader, `gtag`
initialization, or analytics-cookie configuration. Each product's
`analytics.js` is a retired managed deployment asset: promotion removes an old
copy rather than leaving dormant executable code in place.

Every product route loads the identical `retire-analytics.js`. On a
`mannamila.com` hostname, the script:

1. reads the non-HttpOnly cookies visible to that route;
2. selects only `_ga` and `_ga_*` names;
3. expires each observed name at `Path=/` both as a host cookie and with
   `Domain=mannamila.com`; and
4. makes no network request and creates no identifier.

It does nothing on localhost or the `mannamila.github.io` preview host.

This is intentionally best effort. Browser JavaScript cannot enumerate or
delete HttpOnly cookies, cookies scoped to an inaccessible path, or cookies on
another registrable domain. Standard GA browser cookies are visible first-party
cookies at the root path, which is the case the retirement script addresses.
The script also cannot prevent the separately configured main Google Site from
creating a new cookie later.

## Verification

Run the source and promotion tests:

```sh
node scripts/test-analytics-contract.mjs
SKALD_ALLOW_PLACEHOLDER_FORM=1 node skald/verify-site.mjs
SQUASH_ALLOW_PLACEHOLDER_FORM=1 node squash/verify-site.mjs
node inspire/verify-site.mjs
node scripts/test-promote-skald.mjs
node scripts/test-promote-squash.mjs
node scripts/test-promote-inspire.mjs
```

The contract test proves that every discovered product HTML route loads only
the retirement script, no product JavaScript initializes GA or writes cookies
outside the tested expiration routine, the routine selects only observable
`_ga` and `_ga_*` names, and preview hosts do not mutate cookies. Promotion
tests seed a stale `analytics.js` in each deployment target and prove that
applying the promotion removes it.

After each production deployment, use a clean browser profile and verify:

1. every documented route returns HTTP 200;
2. `analytics.js` returns 404 and `retire-analytics.js` returns 200;
3. the Network panel shows no request to `googletagmanager.com`,
   `google-analytics.com`, or a GA collection endpoint;
4. an observable legacy `_ga` and `_ga_*` cookie is absent after loading a
   product route; and
5. the rendered product route still passes its ordinary layout and link checks.

Treat source tests, deployed-file parity, browser network evidence, and the
separate Google Sites setting as distinct evidence. A green source test does
not prove that an older deployment has already been replaced.

# MannaMila Web

Static interactive embed for the MannaMila Google Sites homepage.

Local preview:

```sh
python3 -m http.server 5173
```

Then open `http://127.0.0.1:5173/`.

## Product-site analytics

The reviewed Skald and Mila Inspire sources do not load Google Analytics. Every
route on those sites loads a small first-party retirement script that expires
observable legacy `_ga` and `_ga_*` cookies without making a network request. The
Mila Squash source re-enabled GA4 on 2026-11-06 through a hostname-gated loader with
a host-scoped cookie. The main MannaMila Google Site has a separate native Analytics
setting and is outside these static deployment trees.

Verify the complete static-product-site contract with:

```sh
node scripts/test-analytics-contract.mjs
```

See [Google Analytics](docs/google-analytics.md) for the per-site contract,
limitations, promotion requirements, and live verification.

## Skald site

The reviewed source for `skald.mannamila.com` lives under `skald/`. Verify it before promotion:

```sh
node skald/verify-site.mjs
node scripts/test-promote-skald.mjs
```

The Skald verifier includes a rendered feedback-page regression in installed Google Chrome using CDP device emulation at a 390×844 CSS viewport. Run it directly, with optional desktop and mobile evidence captures, using:

```sh
node skald/verify-feedback-render.mjs --screenshots-dir /path/to/existing/output-directory
```

The site verifier intentionally fails while `skald/site-config.json` still contains the temporary Google Form URL. During local development only, the non-publishable structure can be checked with:

```sh
SKALD_ALLOW_PLACEHOLDER_FORM=1 node skald/verify-site.mjs
```

Store availability is controlled only by `skald/availability.json`. Keep a platform in `review` until its customer-facing page opens in a signed-out browser in an initial-release market. When it does, set that platform to `available`, add its verified HTTPS URL, update `lastVerifiedAt`, and run the verifier and promotion flow again. The expected public pages are:

- Android: `https://play.google.com/store/apps/details?id=com.mannamila.skald`
- iPhone and iPad: `https://apps.apple.com/app/id6790579937`

If one platform clears review before the other, update only that platform. The runtime will show its store button and retain review wording for the other; no page or campaign rewrite is needed.

After the public Form URL is configured and the source commit is reviewed, preview and apply the exact public-tree promotion into a clean `skald-web` checkout:

```sh
node scripts/promote-skald.mjs --target ../skald-web --dry-run
node scripts/promote-skald.mjs --target ../skald-web --apply
node scripts/promote-skald.mjs --target ../skald-web --check
```

Promotion preserves the deployment repository's custom-domain, GitHub workflow, and documentation files. It records the source commit and SHA-256 checksums in `.skald-source.json` and refuses dirty source, an unconfigured Form, unexpected target files, or the wrong custom domain.

When only the reviewed feedback routes are authorized for release, use the scoped lane:

```sh
node scripts/promote-skald.mjs --target ../skald-web --feedback-only --dry-run
node scripts/promote-skald.mjs --target ../skald-web --feedback-only --apply
node scripts/promote-skald.mjs --target ../skald-web --feedback-only --check
```

The feedback-only lane replaces only `feedback/**`. It does not update the landing page, availability, site configuration, assets, other routes, or `.skald-source.json`.
It also refuses to run until the target already has the reviewed
`retire-analytics.js`, because the feedback routes depend on that root asset.

## Mila Squash site

The reviewed source for `squash.mannamila.com` lives under `squash/`. Since
2026-11-06 it presents the private **Alpha** on Meta Quest 3 (manual approval, 18+,
200 people) with the verified Meta enrollment link, embeds five reviewed gameplay and
stats clips under `squash/media/`, and loads Google Analytics 4 through
`squash/analytics.js` (see [Google Analytics](docs/google-analytics.md)). Verify it
before promotion:

```sh
node squash/verify-site.mjs
node scripts/test-promote-squash.mjs
```

The verifier runs `scripts/test-analytics-contract.mjs --site squash` and
`scripts/test-squash-release-state.mjs`, and pins every alpha request link to the
verified Meta URL recorded in `squash/availability.json`.

Release state is controlled only by `squash/availability.json`. Keep `quest` in
`alpha` with the verified `inviteUrl` while the private channel is the only route in.
Use `review` only when a store submission is verified. When the Meta Horizon Store page
opens in a signed-out browser, set it to `available`, add the verified
`https://www.meta.com/experiences/...` URL, update `lastVerifiedAt`, and run the
verifier and promotion flow again.

The optional alpha email list is controlled by `squash/site-config.json`. With
`signupEnabled: false` and a null URL, the signup section and its links stay hidden
and no third-party iframe is mounted. Enabling it requires a real public Google Form
URL; the form's fields must match `squash/waitlist-privacy/`. Placeholder testing is
development-only:

```sh
SQUASH_ALLOW_PLACEHOLDER_FORM=1 node squash/verify-site.mjs
```

After the source commit is reviewed, preview and apply the exact public-tree promotion
into a clean `squash-web` checkout:

```sh
node scripts/promote-squash.mjs --target ../squash-web --dry-run
node scripts/promote-squash.mjs --target ../squash-web --apply
node scripts/promote-squash.mjs --target ../squash-web --check
```

Promotion preserves the deployment repository's custom-domain, GitHub workflow, and
documentation files, removes the retired `retire-analytics.js`, and records the source
commit and SHA-256 checksums in `.squash-source.json`. It refuses dirty source, an
enabled but unconfigured Form, unexpected target files, or the wrong custom domain.

See [the November 6 alpha website handoff](docs/squash-alpha-20261106.md) for the
media provenance, the Google Form specification and the TLS recovery record.

## Mila Inspire site

The reviewed source for the Mila Inspire placeholder at `inspire.mannamila.com` lives under `inspire/`. Verify it before promotion:

```sh
node inspire/verify-site.mjs
node scripts/test-promote-inspire.mjs
```

After the source commit is reviewed, preview and apply the exact public-tree promotion into a clean `inspire-web` checkout:

```sh
node scripts/promote-inspire.mjs --target ../inspire-web --dry-run
node scripts/promote-inspire.mjs --target ../inspire-web --apply
node scripts/promote-inspire.mjs --target ../inspire-web --check
```

Promotion preserves deployment-only files and records the reviewed source commit and SHA-256 checksums in `.inspire-source.json`. The placeholder intentionally has no forms or interactive product behavior; its only JavaScript expires observable legacy Google Analytics cookies.

## Documentation

- [GitHub Pages custom domains](docs/github-pages-custom-domains.md) — provision a new MannaMila product subdomain, recover stalled TLS certificate issuance, and verify the live deployment.
- [Google Analytics](docs/google-analytics.md) — GA4 ownership, route coverage, privacy controls, promotion, and verification.

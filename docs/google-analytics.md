# Google Analytics

## Ownership

- Google account: `assaf@mannamila.com`
- Analytics account: `MannaMila`
- GA4 property: `MannaMila Websites`
- Web stream: `MannaMila.com websites`
- Stream URL: `https://www.mannamila.com`
- Measurement ID: `G-E0E4FPDPTB`
- Stream ID: `15334583978`

The measurement ID and stream ID are public identifiers, not secrets.

## Coverage

The main Google Site uses its native **Settings → Analytics** integration. The
reviewed static sources use one identical `analytics.js` loader:

- `skald.mannamila.com`
  - `/`
  - `/get/`
  - `/feedback/`
  - `/feedback/privacy/`
  - `/privacy/`
  - `/support/`
  - `/updates/`
  - `/updates-privacy/`
  - `/waitlist-privacy/`
- `squash.mannamila.com`
  - `/`
  - `/privacy/`
  - `/support/`
  - `/waitlist-privacy/`
- `inspire.mannamila.com`
  - `/`

The loader runs only on the three custom product hostnames. It intentionally
does not run on localhost or `mannamila.github.io`, preventing preview traffic
and Google Sites embeds from producing duplicate page views.

## Data-minimization settings

The implementation uses these safeguards:

- one first-party cookie domain, `mannamila.com`, for continuity between the
  MannaMila product subdomains;
- Google Signals disabled by the loader;
- ad-personalization signals disabled by the loader;
- Google tag user-provided-data capabilities disabled;
- all optional Analytics account data-sharing settings disabled;
- automatic email redaction enabled;
- cross-domain measurement configured for domains containing
  `mannamila.com`;
- no Google Ads or other product links configured.

Enhanced measurement is enabled for ordinary website interactions such as page
views, scrolls, and outbound clicks. Never place an email address, phone number,
name, or other personal data in a URL or Analytics event.

Google Sites supplies its own regional cookie-consent dialog when Analytics is
enabled. Privacy notices and consent handling remain public-policy decisions;
do not claim legal compliance based only on this technical configuration.

## Verification

Run the analytics contract and site/promotion tests:

```sh
node scripts/test-analytics-contract.mjs
node skald/verify-site.mjs
node squash/verify-site.mjs
node inspire/verify-site.mjs
node scripts/test-promote-skald.mjs
node scripts/test-promote-squash.mjs
node scripts/test-promote-inspire.mjs
```

The Squash site verifier intentionally remains non-publishable while
`squash/site-config.json` contains its temporary Google Form placeholder. Use
`SQUASH_ALLOW_PLACEHOLDER_FORM=1` only for a structural local check; do not use
that override to approve a release.

After promotion and GitHub Pages deployment:

1. Confirm every documented route returns HTTP 200.
2. Confirm each route references the correctly relative `analytics.js`.
3. Confirm `analytics.js` returns HTTP 200 from each custom domain.
4. In a clean browser session, confirm the Google tag request uses
   `G-E0E4FPDPTB`.
5. Confirm visits appear in Analytics Realtime before declaring collection
   live. Initial processing can take time even when the network request is
   correct.

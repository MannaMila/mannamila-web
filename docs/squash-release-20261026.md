# Mila Squash release website handoff — 2026-10-26

Prepared source only; no deployment or DNS changes were made. This work supports
the app's Serve Practice Early Access candidate in
[squash-vr PR #143](https://github.com/MannaMila/squash-vr/pull/143).

## Changes and verification

- Availability is `preparing`, matching the last verified September 22 portal
  state. Both HTML fallback and JavaScript avoid claiming an unsubmitted review.
- The unconfigured signup form is deliberately disabled with a null URL. No
  third-party iframe is mounted and no signup promise is made.
- Privacy content matches the app's separate analytics opt-out/reset behavior;
  support and privacy requests use `support@mannamila.com`.
- `node squash/verify-site.mjs`, `node scripts/test-promote-squash.mjs`, release-
  state tests and `git diff --check` passed. Squash analytics verification is
  scoped explicitly; the default all-product command is unchanged and retains
  an unrelated existing Skald archived-HTML failure.
- Browser preview stalled and was aborted. No webpage visual approval or live
  content parity is claimed. The unused local preview server was stopped.

## Concrete hosting repair

GitHub Pages for `MannaMila/squash-web` already has the correct custom domain and
HTTPS enforcement. Its certificate was expired October 15, state `bad_authz`.
Public DNS on October 26 has no usable address/CNAME for the subdomain; the root
domain has no restrictive CAA record, and `mannamila.github.io` resolves normally.

After authenticated Cloudflare access, restore this record:

| Field | Value |
|---|---|
| Zone | `mannamila.com` |
| Type | CNAME |
| Name | `squash` |
| Target | `mannamila.github.io` |
| Proxy | DNS only |
| TTL | Auto |

Cloudflare login is the present access blocker. Its saved-profile Continue button
also accepts subscription terms, so the browser confirmation rule requires the
owner's confirmation; it was not clicked. Do not reset/reissue Pages TLS before
the DNS record resolves correctly. Follow `docs/github-pages-custom-domains.md`,
then verify valid HTTPS for the landing, privacy and support routes.

## Promotion boundary

Review/render this source, then use the existing scoped Squash promotion workflow
into a clean `squash-web` checkout. Preserve CNAME/workflow/deployment metadata,
record source hashes, and verify public content after publication. Do not promote
Skald/Inspire or change their availability as part of this repair. Mailbox
monitoring and final Meta listing field wiring still require publisher confirmation.

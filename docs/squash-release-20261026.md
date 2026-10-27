# Mila Squash release website handoff — 2026-10-26

Prepared website source remains unpublished. The DNS repair below is now applied; TLS is still unverified. This work supports
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

## DNS repaired; GitHub certificate still blocked

The owner explicitly approved the Cloudflare sign-in terms and repair. Computer
control signed into the saved MannaMila Google profile and created the missing
DNS-only CNAME on October 26:

| Field | Applied value |
|---|---|
| Zone | `mannamila.com` |
| Name | `squash` |
| Type/target | CNAME → `mannamila.github.io` |
| Proxy / TTL | DNS only / Auto |

Cloudflare's saved row and authoritative chin/corey nameservers confirm the
record. Public 1.1.1.1 and 8.8.8.8 also resolve the correct CNAME. The root and
subdomain have no CAA restrictions. No other DNS records or API-token permissions
were changed. The existing Delivery API token still lacks DNS-record access;
the approved browser session supplied the required administration access.

GitHub Pages for `MannaMila/squash-web` retains `main` `/` and the correct custom
domain. Its October 15-expired certificate still reports `bad_authz` as of
2026-10-27 03:54 UTC. Documented domain remove/reattach recovery was attempted,
including explicit null removal and waiting for the removal deployment to finish.
The site rebuilds, but strict HTTPS requests to `/`, `/privacy/` and `/support/`
still reject the expired certificate. GitHub refuses `https_enforced=true` with
“The certificate has not finished being issued”; the current flag is false.
Do not claim HTTPS or public content parity complete.

The GitHub browser-settings request stalled despite its requested timeout; no
further retries of that browser path were made. API/CLI remained available.
Receipts are preserved in the Squash app worktree under
`test_output/s328/cloudflare-dns-20261026/`. No support message was sent.

## Promotion boundary

Review/render this source, then use the existing scoped Squash promotion workflow
into a clean `squash-web` checkout. Preserve CNAME/workflow/deployment metadata,
record source hashes, and verify public content after publication. Do not promote
Skald/Inspire or change their availability as part of this repair. Mailbox
monitoring and final Meta listing field wiring still require publisher confirmation.

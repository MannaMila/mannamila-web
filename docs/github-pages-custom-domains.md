# GitHub Pages Custom Domains

This repository owns MannaMila's shared public web source and the GitHub Pages widget embedded by the main Google Sites property. Standalone product domains may publish from separate public Pages repositories when the product needs to live at the domain root.

## Current Pages Surfaces

| Repository | Public URL | Custom domain | Purpose |
| --- | --- | --- | --- |
| `MannaMila/mannamila-web` | `https://mannamila.github.io/mannamila-web/` | None | Shared widget and product source pages, including `skald/` |
| `MannaMila/skald-web` | `https://skald.mannamila.com/` | `skald.mannamila.com` | Standalone Skald product site at a domain root |
| `MannaMila/inspire-web` | `https://inspire.mannamila.com/` | `inspire.mannamila.com` | Standalone Mila Inspire placeholder at a domain root |

The custom domain belongs to the deployment repository, not automatically to the corresponding directory in this repository. Keep any copy or promotion from a source directory to a standalone Pages repository explicit and reviewable.

## Provision A Product Subdomain

Replace `PRODUCT` and `PAGES_REPO` in the examples below.

1. Choose the public Pages repository and confirm which branch and directory it publishes.
2. Add the intended custom domain in that repository's **Settings > Pages** before changing DNS.
3. Add one authoritative DNS record:

   ```dns
   PRODUCT.mannamila.com. CNAME mannamila.github.io.
   ```

4. Do not add A or AAAA records beside a CNAME at the same name.
5. If the zone uses CAA records, ensure at least one record permits `letsencrypt.org`.
6. Wait for the authoritative CNAME to resolve, then confirm Pages reports an approved certificate and HTTPS enforcement.
7. Verify the HTTP redirect, certificate hostname, live page, representative assets, and browser security state.

GitHub may create or update a root `CNAME` file in a branch-based Pages repository when the custom domain is saved.

## Diagnose A `Not Secure` Site

Run these checks before opening the DNS editor:

```sh
dig +short PRODUCT.mannamila.com CNAME
dig +short mannamila.com NS
dig +short mannamila.com CAA
curl -sSIL http://PRODUCT.mannamila.com
curl -sSIL https://PRODUCT.mannamila.com
printf '' | openssl s_client \
  -connect PRODUCT.mannamila.com:443 \
  -servername PRODUCT.mannamila.com 2>/dev/null \
  | openssl x509 -noout -subject -issuer -dates -ext subjectAltName
gh api repos/MannaMila/PAGES_REPO/pages
gh api repos/MannaMila/PAGES_REPO/pages/health
```

The stalled-certificate signature seen on Skald was:

- HTTP served the expected site.
- HTTPS presented GitHub's generic `*.github.io` certificate.
- The Pages API reported the correct custom domain but `https_enforced=false`.
- An attempt to enable HTTPS returned `The certificate does not exist yet`.

## Recover Stalled Certificate Issuance

If the authoritative CNAME is direct and correct, DNSSEC resolves successfully, no conflicting records exist, and CAA permits Let's Encrypt, re-register the Pages custom domain to restart GitHub's DNS and ACME checks:

```sh
gh api --method PUT repos/MannaMila/PAGES_REPO/pages -f cname=''
gh api --method PUT repos/MannaMila/PAGES_REPO/pages \
  -f cname='PRODUCT.mannamila.com'
```

For branch-based Pages sites this deletes and recreates the root `CNAME` file, producing two small remote commits. Check the target repository first, and confirm the recreated file contains only the intended domain.

After the Pages API reports `https_certificate.state=approved`, enable HTTPS if GitHub did not enable it automatically:

```sh
gh api --method PUT repos/MannaMila/PAGES_REPO/pages -F https_enforced=true
```

In the Skald recovery, the certificate was approved in roughly 30 seconds after reattaching the domain. DNS did not need to change.

## Completion Gate

The work is complete only when:

- The Pages API reports `status=built`.
- `https_certificate.state` is `approved` for the exact product hostname.
- `https_enforced` is `true`.
- The latest Pages deployment succeeded.
- `http://PRODUCT.mannamila.com/` returns `301` to the same HTTPS URL.
- The TLS subject or SAN includes `PRODUCT.mannamila.com`, not only `*.github.io`.
- The HTTPS page and representative CSS, JavaScript, and image assets return `200`.
- Chrome loads the page as a secure context without a certificate warning.
- The source checkout has no unintended changes.

Use a cache-busting query immediately after deployment if an edge cache briefly returns the previous HTTP behavior.

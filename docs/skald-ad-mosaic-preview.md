# Skald ad mosaic preview

The unlinked preview route is:

`https://skald.mannamila.com/mosaic/`

Share its access word out of band. The deployed JavaScript does not contain the
word or a readable image URL.

## Encrypt the final asset

Keep the approved JPEG outside this repository and the deployable route. From a
clean `mannamila-web` source checkout, copy the approved SHA-256 and exact pixel
dimensions from the reviewed package manifest. Also copy the reviewed
`mosaic-map.json` path and its independent SHA-256. Do not derive approval
values as part of the encryption command: they are the independent contracts
that prevent different readable assets from being accepted. Then enter the
access word without echoing it and encrypt the JPEG and artwork catalog:

Export the final JPEG with its orientation normalized into the pixels. The
dimension contract uses the JPEG frame dimensions rather than EXIF rotation.

```sh
read -s SKALD_MOSAIC_PASSWORD
export SKALD_MOSAIC_PASSWORD
node scripts/encrypt-skald-mosaic.mjs \
  --input /absolute/path/to/approved-skald-mosaic.jpg \
  --approved-sha256 <reviewed-lowercase-sha256> \
  --approved-width <reviewed-pixel-width> \
  --approved-height <reviewed-pixel-height> \
  --catalog-input /absolute/path/to/reviewed-mosaic-map.json \
  --approved-catalog-sha256 <reviewed-lowercase-catalog-sha256>
```

The command validates both inputs and writes only:

- `skald/mosaic/mosaic-config.json`
- `skald/mosaic/assets/skald-museum-art-mosaic.enc`
- `skald/mosaic/assets/skald-museum-art-map.enc`

Image and catalog inputs are an all-or-nothing bundle. The command refuses a
full encryption run without the reviewed catalog and its approved hash.

The config contains the approved plaintext SHA-256, byte count, exact
dimensions and media type, plus the random salt, PBKDF2 iteration count,
derived verifier hash, separate AES-GCM IVs, and encrypted-asset URLs. The
catalog contract additionally authenticates its artwork count. Each plaintext
contract is authenticated as AES-GCM additional data, so changing a hash,
dimensions, byte count, media type, or artwork count invalidates its
ciphertext. The JPEG, JSON catalog, and access word are not written into the
public tree. The viewer derives the key with PBKDF2-SHA-256, rejects a wrong
word before downloading either ciphertext, then decrypts both with AES-256-GCM,
verifies the approved contracts, and creates an in-memory image Blob URL.
Locking or reloading revokes that URL and clears the decrypted catalog.

To add or replace only the reviewed catalog for an existing encrypted mosaic,
use catalog-only mode. It reads the deployed config, verifies that the access
word matches its verifier, reuses the established KDF, chooses a fresh catalog
IV distinct from the image IV, and leaves the image ciphertext byte-for-byte
unchanged:

```sh
node scripts/encrypt-skald-mosaic.mjs \
  --catalog-only \
  --catalog-input /absolute/path/to/reviewed-mosaic-map.json \
  --approved-catalog-sha256 <reviewed-lowercase-catalog-sha256>
```

Encryption and site verification recursively reject `.jpg`, `.jpeg`, `.png`,
`.webp`, and `.gif` files, case-insensitively, anywhere below the deployable
preview route. Keep every plaintext review image outside that route.

Validate both the encryption tool and the real encrypted bundle before
committing:

```sh
node scripts/test-encrypt-skald-mosaic.mjs
node skald/verify-site.mjs
node scripts/test-promote-skald.mjs
unset SKALD_MOSAIC_PASSWORD
```

`verify-site.mjs` fails closed when the encrypted bundle is absent and requires
`SKALD_MOSAIC_PASSWORD` when it is present. It decrypts the real bundle and
checks its authenticated SHA-256, byte count, JPEG dimensions, and media type
before promotion. During route-only development before the final JPEG exists,
use `SKALD_ALLOW_MISSING_MOSAIC=1 node skald/verify-site.mjs`; never use that
override for promotion.

The route must remain absent from public navigation and page copy. Its HTML
declares `noindex`, `nofollow`, `noarchive`, `nosnippet`, and `noimageindex`.
Do not block the route in `robots.txt`: compliant crawlers must be able to read
the HTML directive for `noindex` to work, and a disallow entry would expose the
opaque path. These controls discourage indexing but do not make a static GitHub
Pages route undiscoverable. Static encryption also has no server-side rate
limiting; the deliberately shared access word can still be attacked offline.
Do not use the page for confidential material.

Do not promote or publish the route until the final asset, rights review, and
campaign approval are complete.

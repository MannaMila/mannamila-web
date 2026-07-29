# Skald ad mosaic preview

The unlinked preview route is:

`https://skald.mannamila.com/folio-24b3206ad4eceb1abe0c/`

Share its access word out of band. The deployed JavaScript does not contain the
word or a readable image URL.

## Encrypt the final asset

Keep the approved JPEG outside this repository and the deployable route. From a
clean `mannamila-web` source checkout, copy the approved SHA-256 and exact pixel
dimensions from the reviewed package manifest. Do not derive the approval
values as part of the encryption command: they are the independent contract
that prevents a different readable JPEG from being accepted. Then enter the
access word without echoing it and encrypt the JPEG:

Export the final JPEG with its orientation normalized into the pixels. The
dimension contract uses the JPEG frame dimensions rather than EXIF rotation.

```sh
read -s SKALD_MOSAIC_PASSWORD
export SKALD_MOSAIC_PASSWORD
node scripts/encrypt-skald-mosaic.mjs \
  --input /absolute/path/to/approved-skald-mosaic.jpg \
  --approved-sha256 <reviewed-lowercase-sha256> \
  --approved-width <reviewed-pixel-width> \
  --approved-height <reviewed-pixel-height>
```

The command validates the JPEG and writes only:

- `skald/folio-24b3206ad4eceb1abe0c/mosaic-config.json`
- `skald/folio-24b3206ad4eceb1abe0c/assets/skald-museum-art-mosaic.enc`

The config contains the approved plaintext SHA-256, byte count, exact
dimensions and media type, plus the random salt, PBKDF2 iteration count,
derived verifier hash, AES-GCM IV, and encrypted-asset URL. The plaintext
contract is authenticated as AES-GCM additional data, so changing its hash,
dimensions, byte count, or media type invalidates the ciphertext. The JPEG and
access word are not written into the public tree. The viewer derives the key
with PBKDF2-SHA-256, rejects a wrong word before downloading the ciphertext,
then decrypts with AES-256-GCM, verifies the approved SHA-256 and dimensions,
and creates an in-memory Blob URL. Locking or reloading revokes that URL.

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

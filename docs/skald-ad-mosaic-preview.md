# Skald ad mosaic preview

The unlinked preview route is:

`https://skald.mannamila.com/mosaic/`

Share its access word out of band. The deployed JavaScript does not contain the
word or a readable image URL.

## Encrypt the approved bundle

Keep the approved JPEG outside this repository and the deployable route. From a
clean `mannamila-web` source checkout, copy the approved SHA-256 and exact pixel
dimensions from the reviewed package manifest. Also copy the reviewed
`mosaic-map.json` path and its independent SHA-256. Do not derive approval
values as part of the encryption command: they are the independent contracts
that prevent different readable assets from being accepted. The 16K JPEG is the
download master; the separate progressive viewer pack is added in the next
step. Enter the access word without echoing it and encrypt the master and
artwork catalog:

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
public tree. This step establishes the PBKDF2-SHA-256 access verifier and
AES-256-GCM key material that the progressive viewer pack reuses.

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

## Encrypt the progressive viewer pack

The reviewed viewer pack contains one 4,096 × 2,048 overview and eight
4,000 × 4,000 tiles covering the complete 16,000 × 8,000 atlas. Its approved
manifest is `scripts/skald-mosaic-viewer-layers.approved.json`; layer paths are
resolved from the reviewed package's `mosaic/` directory. Add the pack to the
existing encrypted master-and-catalog bundle:

```sh
node scripts/encrypt-skald-mosaic.mjs \
  --viewer-pack-only \
  --viewer-manifest scripts/skald-mosaic-viewer-layers.approved.json \
  --viewer-root /absolute/path/to/reviewed-package/mosaic \
  --approved-viewer-manifest-sha256 0f04131c1e29fc2262fce1dbbe8eece15f058ac1065c7ec8dee77e402fc33003
```

Viewer-pack mode verifies the independent manifest approval, every layer hash
and dimension, complete non-overlapping tile coverage, and the existing access
verifier. It writes only:

- `skald/mosaic/mosaic-config.json`
- `skald/mosaic/assets/skald-museum-art-viewer.enc`

The config embeds the approved overview-and-tile manifest and authenticates its
hash, layer count, full dimensions, byte count, and media type. Viewer-pack mode
uses a fresh AES-GCM IV and preserves both
`skald-museum-art-mosaic.enc` and `skald-museum-art-map.enc` byte-for-byte.

After access is accepted, the page downloads and decrypts the progressive
viewer pack and artwork catalog. It displays the overview first and creates
tile images from the approved in-memory pack as zoom makes them useful. It does
not download the encrypted 16K master during unlock, pan, zoom, or artwork
selection. The master is fetched and decrypted only after the user chooses
**Download full-resolution image**.

Wheel, pan, and pinch updates are coalesced to display frames and reuse cached
stage geometry. Detail tiles enter above 25% zoom, stay active down to 20% to
avoid threshold churn, and are limited to the four closest viewport tiles; the
overview remains underneath while those tiles decode.

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

`verify-site.mjs` fails closed unless the config, master, catalog, and
progressive viewer ciphertext are installed together, and requires
`SKALD_MOSAIC_PASSWORD` when they are present. It decrypts all three real
ciphertexts before promotion, checks their authenticated contracts, verifies
the one-overview/eight-tile layout against the reviewed catalog, and rejects
plaintext image or catalog files in the public route. The promotion test also
confirms that the reviewed viewer config and ciphertext enter the deployment
manifest while the 16K master appears only in the explicit full-resolution
download flow. During route-only development before the final bundle exists,
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

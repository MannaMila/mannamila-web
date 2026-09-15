# Native 0.7.0 screenshots on the Skald landing page (2026-09-15)

Scope: exactly 7 files under `skald/`: `index.html`, `styles.css`, `assets/reader-art.webp`, `assets/greek-split.webp`, `assets/museum-guide.webp`, `assets/nostos-route.webp` and the new `assets/skald-odyssey-og-070.jpg`. The old `assets/skald-odyssey-og.jpg` stays for the other routes that use it.

- `review-registry.json` is the three-role approval: two independent reviewers and a final arbiter, each a separate `claude-opus-5` session. It binds every file by full sha256, and `resolved-index.html` is the approved landing page.
- `approval.md` is the arbiter's summary. `reviews/` holds both reviews, the task prompts and the CLI results.
- `candidate/` holds the candidate report, its manifests, and the validation scripts and results. The two iPad webps were re-encoded from the EXIF-rotated captures so they display upright.
- The approval supersedes only the landing index hash in `../store-web-2026-09-13/content-review-registry.json` (`0ac01407…` → `2d52ae4d…`). That registry stays unchanged as history.
- `verify-landing-copy.py` checks the new registry: all 7 hashes, the supersession link, the retained 0.7.0 preview notice, and the image and social metadata. `verify-site.mjs` pins now expect the new map and `og:image` values.

The page still says the expanded library is coming in version 0.7.0, and it makes no EU/UK availability claim.

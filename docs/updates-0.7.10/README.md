# Updates journal: the 0.7.10 post (evidence)

Draft work, not published. Source brief (round 2 final copy at `7c7999501`, variant B, approved for publication by the owner on 2026-10-02):
`MannaMila/skald` `docs/marketing/updates/2026-10-02-release-0.7.10.md`.

## Back-port (commit 1)

`skald/updates/**` was two posts behind the live site. `index.html` and ten art files were copied
byte for byte from `skald-web` `origin/main` `514eb6f`.

- `backport-source.sha256` / `backport-live-mirror.sha256`: sha256 of all 38 files under
  `updates/` on each side after the back-port; the two lists are identical, and `diff -r` is empty.
- `index.html` sha256 `8be7e2df…d32c59`, equal to the live page fetched 2026-10-02.
- Differences found before the back-port: the two August posts, the `og:description`
  ("a tenth translation" in the source), and the ten August 4 art files. Nothing else.

## New post (commit 2)

- `parity-report.json` (`tools/parity.py <mannamila-web> <app-repo worktree>`): headline, 19 body
  blocks and 49 sentences identical to the brief and in order; nothing extra; 700 body words; alt
  texts, captions, two links and `og:description` identical; both images byte-identical to the
  app-repo assets and to the brief's checksums.
- `visual-report.json` (`tools/shots.mjs`, installed Chrome): at 390 and 1280 px no horizontal
  overflow, both images load. Requests: the page, `retire-analytics.js`, `styles.css`, Google
  Fonts (page-level, unchanged) and the two images. The post adds no script.
- Screenshots: `post-390.png`, `post-1280.png` (the whole post), `post-*-coins.png`,
  `post-*-coins-second.png` (after pressing the arrow), `updates-*-top.png`. In the element
  screenshots the sticky header and skip link are stitched in mid-post by the capture; they are
  not in the page flow.
- `link-check.txt`: the two hrefs of the post, HTTP 200 on 2026-10-02.

## Choices the brief left open

- Date: `2026-10-02` in the article `id`, the `<time datetime>` and the visible line. The brief
  says these are the day of publication: change all three (and `h2 id`, `aria-labelledby`) if the
  post goes out on another day.
- Entities (`&rsquo;`, `&ldquo;`, `&mdash;`, `&ndash;`, `&middot;`, `&ouml;`, `&Sigma;`) as in the August posts.
- Carousel buttons keep the existing labels "Previous artwork" / "Next artwork".
- External store links carry no `target` or `rel`, like every other link on the page.

## Variant A

`variant-a-switch.patch` holds the two replacement strings from the brief. Apply only when both
gates in the brief's "Publication cautions", item 1, are met: `git apply docs/updates-0.7.10/variant-a-switch.patch`.

# Skald website screenshots recaptured on 0.7.10 (2026-10-02)

Nothing was committed, and neither the website nor the app repo was edited. `git status` in `/Volumes/Dev/Code/skald-v0710` is clean after the run.

## Build

- App: tag `v0.7.10`, commit `a73ca6dd2c5fba1643ba840b6d1434c1a5edf527`, worktree `/Volumes/Dev/Code/skald-v0710` (detached).
- Configuration: `Release`, iOS Simulator arm64, `CODE_SIGNING_ALLOWED=NO ONLY_ACTIVE_ARCH=YES ENABLE_TESTABILITY=YES` (the Release recipe in `docs/dev/ios.md`). Bundle reports 0.7.10 (24), delivery channel `prod`. Executable sha256 `5df8949235762eb51fe14c98d581e2d5829a8e8b0c1fb723aec27cec8d8c75f5` (`dd/Build/Products/Release-iphonesimulator/SkaldApp.app/SkaldApp`).
- The 0.7.0 record does not say which configuration its captures used; Release was chosen because the Debug shell adds the local feedback tools.
- Host: macOS 26.5.1, Xcode 26.6 (17F113), host locale `en_US`, time zone `America/New_York` (simulators inherit both). cwebp 1.6.0.

## Simulators (created for this task, now shut down, not deleted)

| Name | UDID | Device type | Runtime |
|---|---|---|---|
| Skald Site Shots iPhone 0710 | `3DB659A7-9A5F-4172-989A-78FF979B4F86` | iPhone 17 Pro Max (same type as the 0.7.0 "Skald Store iPhone 20260913") | iOS 26.5 (23F77) |
| Skald Site Shots iPad 0710 | `CAD5A894-0C02-4F63-ACD4-400C92D92CE1` | iPad Pro 13-inch (M5) (same type as "Skald Store iPad 20260913") | iOS 26.5 (23F77) |

Light appearance. Status bar: iPhone `--time 9:41 --batteryState charged --batteryLevel 100 --cellularBars 4 --wifiBars 3`; iPad `--time 9:41 --batteryState charged --batteryLevel 100 --wifiBars 3 --dataNetwork wifi --cellularMode notSupported` (the current iPad images show Wi-Fi only, so the cellular bars were dropped there). Overrides were cleared before shutdown. The two simulators that were booted before the task (iPhone 17 Pro `1A969A1D…`, iPhone 17 Pro Max `8567DCA7…`) were not touched and are still booted. No consent, tracking or notification prompt appeared in any run.

## Method

Reused the 0.7.0 method recorded in `docs/store/releases/0.7.0/CAPTURES.md`: the opt-in UI test `SkaldAppUITests/TranslationPickerVisualUITests/testStoreScreenshots` (`SKALD_STORE_CAPTURE=1`, plus `SKALD_STORE_LANDSCAPE=1` on iPad), run unmodified from the tag. Wrapper: `run-store.sh <udid> <name> [landscape]`; attachments exported with `xcresulttool export attachments` (`export.sh`).

Two things the stock test does not do, handled by a scratch UI-test project that lives only in this folder (`driver/`, XcodeGen project `SiteShotDriver`, drives the installed app by bundle id; helper functions copied from the stock test file):

1. `MapShot/testSelectButler`: a fresh 0.7.10 install opens in Murray (1919). The old captures show Butler (1900), and in Murray the stock test fails at its art step ("Missing accessibility identifier inline_art_card"). The driver opens the reading-source picker and taps "Butler, 1900"; the selection persists into the stock test run.
2. `MapShot/testVoyageMap`: the stock test has no map scene (the 0.7.0 map image was an Android tablet capture, `android-tablet/08-voyage-map.png`, emulator 1920×1080).

Order per device, each from a fresh install (uninstall, `simctl install` of the Release app): `testSelectButler`, then stock `testStoreScreenshots`; on iPad then `testVoyageMap`. Fresh installs matter because opened notes persist as visited and change the margin marks.

| Web file | Capture | Steps |
|---|---|---|
| `reader-art.webp` | stock `store-01-reader`, iPhone portrait | pass first run, Story, text size decreased twice |
| `greek-split.webp` | stock `store-03-parallel`, iPad landscape | as above, then tap Ἑλληνικά |
| `museum-guide.webp` | stock `store-07-art`, iPad landscape | Story, drag the text up, tap the inline art card |
| `nostos-route.webp` | driver `map-03-panel`, iPad landscape | Story, text size decreased twice, Σ (Notes about this book), scroll to and tap "Smoke rising from Ithaca" (`sch-od-01-deep-voyage-smoke-048`, lines 48–59), tap the note's open-panel button (`scholion_open_panel`), wait 4 s |

Result bundles: `xcresult/phone.xcresult`, `xcresult/ipad.xcresult`, `xcresult/ipad-map.xcresult` (plus `*-butler`, and `*-run1`/`*-run2` from earlier attempts, not used).

Post-processing, same as the 2026-09-15 record: iPad captures are a 2064×2752 buffer with EXIF orientation 8, so they were rotated with `sips -r 270` (`source/upright/`), then all encoded with `cwebp -q 88 -m 4 -metadata none`. The map additionally uses `-crop 0 0 2752 1548 -resize 1920 1080` (top 75% of the iPad screen, to reach 16:9).

## Files and sha256

Source (raw attachments as captured):

- `source/reader-art__ios-phone-01-reader.png` 1320×2868 `b6af16ebc0a454500ea5458def8ac71169aca58d109dfbfba36e1fe0643d6ed1`
- `source/greek-split__ios-ipad-03-parallel.png` 2064×2752 + EXIF 8 `2ac6013a98174ecec7e82f652964f1a8c310d2d15184e7af9cdfe3f6070b265b`
- `source/museum-guide__ios-ipad-07-art.png` 2064×2752 + EXIF 8 `657fbdf65a8b691c7ec60e311d14ec01b433fdf20337508cdc3a4b18e2e10cb7`
- `source/nostos-route__ios-ipad-08-voyage-map.png` 2064×2752 + EXIF 8 `f775e79d7f5ec487ae18fb46afa3754149811311239c11b1b64e44b64a1f6beb`

Rotated to display orientation (2752×2064):

- `source/upright/greek-split__ios-ipad-03-parallel.png` `629085914be47dedf10f184b134adb7e87fceb8b579fa9018cc1be6b240ee03a`
- `source/upright/museum-guide__ios-ipad-07-art.png` `7cbb9093f1a5d92d098c56087137944afc4558036d98edfbb750e57767b7ac6a`
- `source/upright/nostos-route__ios-ipad-08-voyage-map.png` `852d8a62c071674eaf9b3af1e996f4b9c48b2d5ccf99fbf4041b90f8bdd221ac`

Web:

| File | Size | Bytes (old → new) | sha256 |
|---|---|---|---|
| `web/reader-art.webp` | 1320×2868 | 259,602 → 256,806 (0.98×) | `fec771681dd17b61f02a934d1e3a27f93533dc24032a8b8cba65441ce5bfa102` |
| `web/greek-split.webp` | 2752×2064 | 354,836 → 353,532 (0.99×) | `4a3820095ba0bfd13ec7b1f7e904f89f9b74842ac85a552cc5806af8ea67aa89` |
| `web/museum-guide.webp` | 2752×2064 | 271,136 → 221,470 (0.81×) | `b81aa9155197d374e708505d2440fe646d3bedecc8c819144e0fd5c8e5f5d0e0` |
| `web/nostos-route.webp` | 1920×1080 | 81,630 → 89,824 (1.10×) | `84cfa9dcc8c9de1ae036c07a409de496ef129f54e8ea7df132232bfc36546765` |

`old/` holds the four current files from `mannamila-web` `origin/main`; their hashes match `review-registry.json` (`10088bdc…`, `cf2b6955…`, `fcf9da94…`, `2a3114e2…`). `compare/<name>--old-left-new-right.png` are 1600 px wide side-by-sides.

## Differences from the old scenes, and alt text

**reader-art** — same scene: Butler (1900), Book I opening, "Athena Visits Ithaca", the Lastman card below the first paragraph. Differences: margin mark is now "ση~ NOTE" (was "ζή(τει) RARE WORD"); header type is slightly heavier; the paragraph wraps one word differently; status bar shows four cellular bars (old showed no-service dots). Existing alt still true.

**greek-split** — same scene: Ἑλληνικά mode, Butler left, Greek lines 1–23 right. Differences: margin mark "ση~ NOTE" (was "ζή(τει) RARE WORD"); date reads "Fri Oct 2" (was "Sun Sep 13"). Existing alt still true.

**museum-guide** — same artwork and note. Differences: the note reads "hefts a great fluted bronze basin beside her" (was "embossed shield"); a new "from Book XIII" line sits between title and "PIETER LASTMAN, 1625"; the collection button reads "SEE THE MUSEUM'S RECORD → REMBRANDTHUIS · AMSTERDAM, NETHERLANDS" (was "SEE IT IN REAL LIFE → …"); the backdrop is now opaque dark, so the reader text and controls are no longer visible behind the card. Existing alt still true.

**nostos-route** — closest equivalent, not a like-for-like device. The old image is an Android tablet capture; Android was out of scope, so this is the iPad landscape screen with its top 75% cropped to 16:9 and scaled to 1920×1080. Same panel, same framing of the map (Ithaca marked "YOU ARE HERE", same place labels, Find me / Whole map), same Ithaca card. Differences: iPad status bar (9:41 AM, Fri Oct 2, Wi-Fi, battery) instead of Android's; the reader text behind the panel is visible at left; the site photo, its credit line and the Licence/Source links are fully visible (old cut off mid-photo); the bottom "tap outside to close" hint and the empty lower part of the panel are cropped away. The panel is now reached from a note (Σ → "Smoke rising from Ithaca" → open map), not from a panel button. Existing alt still true. The uncropped 4:3 capture is `source/upright/nostos-route__ios-ipad-08-voyage-map.png` if a full-screen image is preferred (that would change the page's 16:9 box).

## For the reviewer

- The brief expected the row of controls above the text to be gone in 0.7.10. It is still present in these captures (Story / Ἑλληνικά / Parallel, the panel button, the two text-size buttons, Σ and ?), in the same places as in the 0.7.0 images.
- A fresh 0.7.10 install opens in Murray, not Butler; the captures switch to Butler to keep the alt text true.
- nostos-route is a cropped iPad screen, not a whole-device capture. The "Licence" and "Source" links end in a small blue arrow glyph that renders like an emoji box.
- "ingenious hero" carries the animated shimmer underline; the frame caught looks like a plain underline with a soft highlight, as in the old images.
- The iPad captures keep the small curved window-resize mark in the bottom-right corner (also in the old greek-split and museum-guide). It is cropped out of nostos-route.
- No counts, version labels, debug text or dialogs are visible in the four images.

#!/bin/sh
# Renders og.html at 1200x630 in headless Chrome (throwaway profile) and writes skald/assets/skald-the-greeks-og.jpg.
# Usage: render.sh <app repo checkout, for the fonts>   (run from this directory)
set -eu
APP="$1"
HERE="$(cd "$(dirname "$0")" && pwd)"
SITE="$HERE/../../../skald"
WORK="$(mktemp -d)"
PY="${PYTHON:-python3}"
mkdir -p "$WORK/shots"
"$PY" - "$SITE" "$WORK" <<'PY'
import sys
from PIL import Image
site, work = sys.argv[1], sys.argv[2]
for name in ("greeks-library", "greeks-plate"):
    Image.open(f"{site}/assets/{name}.webp").convert("RGB").save(f"{work}/shots/{name}.png")
PY
sed -e "s#FONTS/#file://$APP/core/src/commonMain/composeResources/font/#g" -e "s#SHOTS/#file://$WORK/shots/#g" "$HERE/og.html" > "$WORK/og.html"
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars --no-first-run \
  --user-data-dir="$WORK/profile" --force-color-profile=srgb --window-size=1200,630 --force-device-scale-factor=1 \
  --virtual-time-budget=4000 --screenshot="$WORK/og.png" "file://$WORK/og.html" >/dev/null 2>&1
"$PY" - "$WORK/og.png" "$SITE/assets/skald-the-greeks-og.jpg" <<'PY'
import sys
from PIL import Image
im = Image.open(sys.argv[1]).convert("RGB")
assert im.size == (1200, 630), im.size
im.save(sys.argv[2], quality=90, optimize=True)
print(sys.argv[2], im.size)
PY
rm -rf "$WORK"

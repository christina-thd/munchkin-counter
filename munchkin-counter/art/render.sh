#!/bin/sh
# Renders the Home Assistant store images from the SVG sources:
#   icon.png  128×128  ← public/img/logo.svg
#   logo.png  250×100  ← art/store-logo.svg
#
# Runs in a throwaway container, from the add-on folder:
#   docker run --rm -v "$PWD:/addon" -w /addon alpine:3.20 sh art/render.sh
set -e

apk add --no-cache -q rsvg-convert fontconfig >/dev/null
mkdir -p /usr/share/fonts/luckiest
wget -q -O /usr/share/fonts/luckiest/LuckiestGuy-Regular.ttf \
  https://github.com/google/fonts/raw/main/apache/luckiestguy/LuckiestGuy-Regular.ttf
fc-cache -f >/dev/null

rsvg-convert -w 128 -h 128 public/img/logo.svg -o icon.png

# rsvg only loads images next to (or below) the SVG, so render the banner from a temp folder
work=$(mktemp -d)
cp public/img/logo.svg "$work/logo.svg"
sed 's#\.\./public/img/logo\.svg#logo.svg#g' art/store-logo.svg > "$work/store-logo.svg"
rsvg-convert -w 250 -h 100 "$work/store-logo.svg" -o logo.png
rm -rf "$work"

echo "icon.png and logo.png updated"

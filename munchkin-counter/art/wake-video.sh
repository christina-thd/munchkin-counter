#!/bin/sh
# Creates the tiny silent videos the dashboard loops to keep the screen awake
# where the Wake Lock API isn't available (plain http on the home network).
#
# Runs in a throwaway container, from the add-on folder:
#   docker run --rm -v "$PWD:/addon" -w /addon alpine:3.20 sh art/wake-video.sh
set -e

apk add --no-cache -q ffmpeg >/dev/null
mkdir -p public/media
# 2 seconds of a 16×16 black frame, no audio
ffmpeg -loglevel error -y -f lavfi -i color=c=black:s=16x16:r=1:d=2 \
  -c:v libx264 -profile:v baseline -pix_fmt yuv420p -movflags +faststart -an public/media/wake.mp4
ffmpeg -loglevel error -y -f lavfi -i color=c=black:s=16x16:r=1:d=2 \
  -c:v libvpx -b:v 10k -an public/media/wake.webm

echo "public/media/wake.mp4 and wake.webm updated"

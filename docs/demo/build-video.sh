#!/bin/bash
# =============================================================================
# Confidex AI Demo Video Builder
# =============================================================================
# Generates a 145-second demo video from slide PNGs + narration audio.
#
# Actual narration durations:
#   narr_1 = 30s, narr_2 = 35s, narr_3 = 35s, narr_4 = 30s
#
# Timing breakdown (8 slides, 4 narration segments):
#   Slide 1 — Title           0:00 - 0:15 (15s)  silence
#   Slide 2 — The Problem     0:15 - 0:30 (15s)  narr_1[0:00-0:15]
#   Slide 3 — The Solution    0:30 - 0:45 (15s)  narr_1[0:15-0:30]
#   Slide 4 — BITE Protocol   0:45 - 1:20 (35s)  narr_2[0:00-0:35]
#   Slide 5 — Smart Contracts  1:20 - 1:37 (17s)  narr_3[0:00-0:17]
#   Slide 6 — AI Due Diligence 1:37 - 1:55 (18s)  narr_3[0:17-0:35]
#   Slide 7 — Demo Dashboard   1:55 - 2:10 (15s)  narr_4[0:00-0:15]
#   Slide 8 — Closing          2:10 - 2:25 (15s)  narr_4[0:15-0:30]
#                                       TOTAL = 145s
#
# Requirements: ffmpeg
# Usage: bash build-video.sh
# =============================================================================

set -euo pipefail
cd "$(dirname "$0")"

# Verify ffmpeg is available
if ! command -v ffmpeg &>/dev/null; then
  echo "ERROR: ffmpeg is required but not found in PATH."
  echo "Install with: sudo apt-get install ffmpeg  (or brew install ffmpeg)"
  exit 1
fi

# Verify slides exist
for i in 01 02 03 04 05 06 07 08; do
  if [ ! -f "slides/slide_${i}.png" ]; then
    echo "ERROR: slides/slide_${i}.png not found. Run generate-slides.mjs first."
    exit 1
  fi
done

# Verify narration exists
for i in 1 2 3 4; do
  if [ ! -f "narration/narr_${i}.mp3" ]; then
    echo "ERROR: narration/narr_${i}.mp3 not found. Run generate-narration.mjs first."
    exit 1
  fi
done

echo "=== Confidex AI Demo Video Builder ==="
echo ""

# Clean and create parts directory
rm -rf parts
mkdir -p parts

# Common encoding settings
VIDEO_CODEC="-c:v libx264 -tune stillimage -pix_fmt yuv420p -vf scale=1280:720"
AUDIO_CODEC="-c:a aac -b:a 128k"

# ─── Part 0: Title slide (15s) with silence ───
echo "[1/9] Part 0: Title slide (15s silence)..."
ffmpeg -y -loop 1 -i slides/slide_01.png \
  -f lavfi -i anullsrc=channel_layout=mono:sample_rate=22050 \
  -t 15 $VIDEO_CODEC $AUDIO_CODEC -shortest parts/p0.mp4 2>/dev/null

# ─── Part 1a: Slide 2 + narr_1 (first 15s) ───
echo "[2/9] Part 1a: The Problem slide (15s)..."
ffmpeg -y -loop 1 -i slides/slide_02.png \
  -i narration/narr_1.mp3 \
  -ss 0 -t 15 $VIDEO_CODEC $AUDIO_CODEC -shortest parts/p1a.mp4 2>/dev/null

# ─── Part 1b: Slide 3 + narr_1 (from 15s, 15s) ───
echo "[3/9] Part 1b: The Solution slide (15s)..."
ffmpeg -y -loop 1 -i slides/slide_03.png \
  -i narration/narr_1.mp3 \
  -ss 15 -t 15 $VIDEO_CODEC $AUDIO_CODEC -shortest parts/p1b.mp4 2>/dev/null

# ─── Part 2: Slide 4 + narr_2 (full 35s) ───
echo "[4/9] Part 2: BITE Protocol slide (35s)..."
ffmpeg -y -loop 1 -i slides/slide_04.png \
  -i narration/narr_2.mp3 \
  -ss 0 -t 35 $VIDEO_CODEC $AUDIO_CODEC -shortest parts/p2.mp4 2>/dev/null

# ─── Part 3a: Slide 5 + narr_3 (first 17s) ───
echo "[5/9] Part 3a: Smart Contracts slide (17s)..."
ffmpeg -y -loop 1 -i slides/slide_05.png \
  -i narration/narr_3.mp3 \
  -ss 0 -t 17 $VIDEO_CODEC $AUDIO_CODEC -shortest parts/p3a.mp4 2>/dev/null

# ─── Part 3b: Slide 6 + narr_3 (from 17s, 18s) ───
echo "[6/9] Part 3b: AI Due Diligence slide (18s)..."
ffmpeg -y -loop 1 -i slides/slide_06.png \
  -i narration/narr_3.mp3 \
  -ss 17 -t 18 $VIDEO_CODEC $AUDIO_CODEC -shortest parts/p3b.mp4 2>/dev/null

# ─── Part 4a: Slide 7 + narr_4 (first 15s) ───
echo "[7/9] Part 4a: Demo Dashboard slide (15s)..."
ffmpeg -y -loop 1 -i slides/slide_07.png \
  -i narration/narr_4.mp3 \
  -ss 0 -t 15 $VIDEO_CODEC $AUDIO_CODEC -shortest parts/p4a.mp4 2>/dev/null

# ─── Part 4b: Slide 8 + narr_4 (from 15s, 15s) ───
echo "[8/9] Part 4b: Closing slide (15s)..."
ffmpeg -y -loop 1 -i slides/slide_08.png \
  -i narration/narr_4.mp3 \
  -ss 15 -t 15 $VIDEO_CODEC $AUDIO_CODEC -shortest parts/p4b.mp4 2>/dev/null

# ─── Create concat list ───
echo "[9/9] Concatenating all parts into final video..."
cat > parts/list.txt << 'CONCAT_LIST'
file 'p0.mp4'
file 'p1a.mp4'
file 'p1b.mp4'
file 'p2.mp4'
file 'p3a.mp4'
file 'p3b.mp4'
file 'p4a.mp4'
file 'p4b.mp4'
CONCAT_LIST

# ─── Concatenate into final video ───
ffmpeg -y -f concat -safe 0 -i parts/list.txt \
  -c copy Confidex_AI_Demo.mp4 2>/dev/null

# ─── Summary ───
echo ""
echo "=========================================="
echo "  DONE! Video created: Confidex_AI_Demo.mp4"
echo "=========================================="
echo ""

# Show duration
DURATION=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 Confidex_AI_Demo.mp4 2>/dev/null || echo "unknown")
echo "  Duration: ${DURATION}s (target: 145s)"
echo "  Resolution: 1280x720"
echo "  File size: $(du -h Confidex_AI_Demo.mp4 | cut -f1)"
echo ""
echo "  Slide timing:"
echo "    0:00 - 0:15  Title"
echo "    0:15 - 0:30  The Problem"
echo "    0:30 - 0:45  The Solution"
echo "    0:45 - 1:20  BITE Protocol"
echo "    1:20 - 1:37  Smart Contracts"
echo "    1:37 - 1:55  AI Due Diligence"
echo "    1:55 - 2:10  Demo Dashboard"
echo "    2:10 - 2:25  Closing"
echo ""
echo "  Clean up temp files: rm -rf parts/"
echo ""

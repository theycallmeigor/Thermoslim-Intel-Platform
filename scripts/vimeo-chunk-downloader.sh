#!/bin/bash
# vimeo-chunk-downloader.sh
# Downloads all segments from a Vimeo master.json / HLS / DASH manifest
# and stitches them into a single MP4 with ffmpeg.
#
# Usage:
#   ./scripts/vimeo-chunk-downloader.sh <MASTER_URL> [OUTPUT_NAME]
#
# How to get MASTER_URL:
#   1. Open the page with the Vimeo embed
#   2. DevTools → Network tab
#   3. Filter by "master.json" or "master.m3u8" or ".mpd"
#   4. Copy the full URL (includes signed query params)
#
# The script handles three Vimeo manifest formats:
#   - master.json  (Vimeo's proprietary segmented format)
#   - .m3u8        (HLS)
#   - .mpd         (DASH)

set -euo pipefail

MASTER_URL="${1:?Usage: $0 <MASTER_URL> [OUTPUT_NAME]}"
OUTPUT_NAME="${2:-vimeo_download}"
WORK_DIR="/tmp/vimeo_chunks_$$"
mkdir -p "$WORK_DIR"

echo "=== Vimeo Chunk Downloader ==="
echo "Master URL: ${MASTER_URL:0:80}..."
echo "Output: ${OUTPUT_NAME}.mp4"
echo "Work dir: $WORK_DIR"
echo ""

# Detect manifest type
if [[ "$MASTER_URL" == *"master.json"* ]]; then
    echo ">>> Detected: Vimeo master.json format"

    # Download the master manifest
    curl -s "$MASTER_URL" -o "$WORK_DIR/master.json"

    # Extract base URL (everything before master.json)
    BASE_URL="${MASTER_URL%%master.json*}"

    # Parse video segments (highest quality)
    echo ">>> Parsing video segments..."
    VIDEO_BASE=$(python3 -c "
import json, sys
with open('$WORK_DIR/master.json') as f:
    data = json.load(f)
# Pick highest bitrate video
videos = sorted(data.get('video', []), key=lambda v: v.get('bitrate', 0), reverse=True)
if videos:
    v = videos[0]
    print(v.get('base_url', ''))
    print(v.get('init_segment', ''), file=sys.stderr)
    for seg in v.get('segments', []):
        print(seg.get('url', ''))
else:
    print('ERROR: No video tracks found', file=sys.stderr)
    sys.exit(1)
" 2>"$WORK_DIR/video_init.txt")

    VIDEO_BASE_URL=$(echo "$VIDEO_BASE" | head -1)
    VIDEO_SEGMENTS=$(echo "$VIDEO_BASE" | tail -n +2)
    VIDEO_INIT=$(cat "$WORK_DIR/video_init.txt")

    # Parse audio segments (highest quality)
    echo ">>> Parsing audio segments..."
    AUDIO_BASE=$(python3 -c "
import json, sys
with open('$WORK_DIR/master.json') as f:
    data = json.load(f)
audios = sorted(data.get('audio', []), key=lambda a: a.get('bitrate', 0), reverse=True)
if audios:
    a = audios[0]
    print(a.get('base_url', ''))
    print(a.get('init_segment', ''), file=sys.stderr)
    for seg in a.get('segments', []):
        print(seg.get('url', ''))
else:
    print('ERROR: No audio tracks found', file=sys.stderr)
    sys.exit(1)
" 2>"$WORK_DIR/audio_init.txt")

    AUDIO_BASE_URL=$(echo "$AUDIO_BASE" | head -1)
    AUDIO_SEGMENTS=$(echo "$AUDIO_BASE" | tail -n +2)
    AUDIO_INIT=$(cat "$WORK_DIR/audio_init.txt")

    # Download video init segment + chunks
    echo ">>> Downloading video init segment..."
    if [[ -n "$VIDEO_INIT" ]]; then
        echo "$VIDEO_INIT" | base64 -d > "$WORK_DIR/video_init.m4s"
    fi

    VIDEO_COUNT=$(echo "$VIDEO_SEGMENTS" | grep -c . || true)
    echo ">>> Downloading $VIDEO_COUNT video segments..."
    i=0
    while IFS= read -r seg_url; do
        [[ -z "$seg_url" ]] && continue
        i=$((i + 1))
        printf "\r  Video segment %d/%d" "$i" "$VIDEO_COUNT"
        # Segment URLs can be relative to video base_url, which is relative to master base
        FULL_URL="${BASE_URL}${VIDEO_BASE_URL}${seg_url}"
        curl -s "$FULL_URL" -o "$WORK_DIR/video_$(printf '%05d' $i).m4s"
    done <<< "$VIDEO_SEGMENTS"
    echo ""

    # Download audio init segment + chunks
    echo ">>> Downloading audio init segment..."
    if [[ -n "$AUDIO_INIT" ]]; then
        echo "$AUDIO_INIT" | base64 -d > "$WORK_DIR/audio_init.m4s"
    fi

    AUDIO_COUNT=$(echo "$AUDIO_SEGMENTS" | grep -c . || true)
    echo ">>> Downloading $AUDIO_COUNT audio segments..."
    i=0
    while IFS= read -r seg_url; do
        [[ -z "$seg_url" ]] && continue
        i=$((i + 1))
        printf "\r  Audio segment %d/%d" "$i" "$AUDIO_COUNT"
        FULL_URL="${BASE_URL}${AUDIO_BASE_URL}${seg_url}"
        curl -s "$FULL_URL" -o "$WORK_DIR/audio_$(printf '%05d' $i).m4s"
    done <<< "$AUDIO_SEGMENTS"
    echo ""

    # Concatenate video: init + all segments
    echo ">>> Stitching video stream..."
    cat "$WORK_DIR/video_init.m4s" "$WORK_DIR"/video_*.m4s > "$WORK_DIR/video_combined.m4s" 2>/dev/null || \
    cat "$WORK_DIR"/video_*.m4s > "$WORK_DIR/video_combined.m4s"

    echo ">>> Stitching audio stream..."
    cat "$WORK_DIR/audio_init.m4s" "$WORK_DIR"/audio_*.m4s > "$WORK_DIR/audio_combined.m4s" 2>/dev/null || \
    cat "$WORK_DIR"/audio_*.m4s > "$WORK_DIR/audio_combined.m4s"

    # Mux video + audio into MP4
    echo ">>> Muxing final MP4..."
    ffmpeg -y -loglevel warning \
        -i "$WORK_DIR/video_combined.m4s" \
        -i "$WORK_DIR/audio_combined.m4s" \
        -c copy \
        "${OUTPUT_NAME}.mp4"

elif [[ "$MASTER_URL" == *".m3u8"* ]]; then
    echo ">>> Detected: HLS (.m3u8) format"
    echo ">>> Using ffmpeg to download all segments..."

    ffmpeg -y -loglevel warning \
        -i "$MASTER_URL" \
        -c copy \
        "${OUTPUT_NAME}.mp4"

elif [[ "$MASTER_URL" == *".mpd"* ]]; then
    echo ">>> Detected: DASH (.mpd) format"
    echo ">>> Using ffmpeg to download all segments..."

    ffmpeg -y -loglevel warning \
        -i "$MASTER_URL" \
        -c copy \
        "${OUTPUT_NAME}.mp4"

else
    echo ">>> Unknown format, trying as direct stream URL..."
    ffmpeg -y -loglevel warning \
        -i "$MASTER_URL" \
        -c copy \
        "${OUTPUT_NAME}.mp4"
fi

# Verify output
if [[ -f "${OUTPUT_NAME}.mp4" ]]; then
    SIZE=$(du -h "${OUTPUT_NAME}.mp4" | cut -f1)
    DURATION=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${OUTPUT_NAME}.mp4" 2>/dev/null | cut -d. -f1)
    echo ""
    echo "=== SUCCESS ==="
    echo "File: ${OUTPUT_NAME}.mp4"
    echo "Size: ${SIZE}"
    echo "Duration: ${DURATION:-unknown}s"
else
    echo ""
    echo "=== FAILED ==="
    echo "Output file not created. Check $WORK_DIR for partial downloads."
    exit 1
fi

# Cleanup
echo ">>> Cleaning up work dir..."
rm -rf "$WORK_DIR"
echo "Done."

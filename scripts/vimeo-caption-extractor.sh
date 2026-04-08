#!/bin/bash
# vimeo-caption-extractor.sh
# Reverse-engineers the Vimeo player embed to extract caption/subtitle VTT files.
#
# How Vimeo serves captions (reverse-engineered):
# 1. The embed iframe at player.vimeo.com/video/{ID} loads an HTML page
# 2. That HTML contains a <script> with window.playerConfig = {...} or
#    a JSON blob inside a data attribute
# 3. Inside that config: .request.text_tracks[] has caption URLs
# 4. Caption URLs are relative to skyfire.vimeocdn.com and are SIGNED
# 5. The signatures require the correct Referer and Origin headers
#
# Usage:
#   ./scripts/vimeo-caption-extractor.sh <VIMEO_VIDEO_ID> [REFERER_URL]
#
# Examples:
#   ./scripts/vimeo-caption-extractor.sh 941600752 https://adsrx.co
#   ./scripts/vimeo-caption-extractor.sh 941600752

set -euo pipefail

VIDEO_ID="${1:?Usage: $0 <VIMEO_VIDEO_ID> [REFERER_URL]}"
REFERER="${2:-}"
OUTPUT_DIR="/tmp/vimeo_captions_${VIDEO_ID}"
mkdir -p "$OUTPUT_DIR"

echo "=== Vimeo Caption Extractor ==="
echo "Video ID: $VIDEO_ID"
echo "Referer: ${REFERER:-none}"
echo ""

# --- Step 1: Fetch the embed page HTML ---
echo ">>> Step 1: Fetching embed page..."

EMBED_URL="https://player.vimeo.com/video/${VIDEO_ID}"
CURL_HEADERS=(-H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36")

if [[ -n "$REFERER" ]]; then
    CURL_HEADERS+=(-H "Referer: ${REFERER}" -H "Origin: ${REFERER}")
fi

HTTP_CODE=$(curl -s -o "$OUTPUT_DIR/embed.html" -w "%{http_code}" \
    "${CURL_HEADERS[@]}" \
    "$EMBED_URL")

echo "  HTTP status: $HTTP_CODE"

if [[ "$HTTP_CODE" != "200" ]]; then
    echo "  FAILED: Got $HTTP_CODE. Trying with ?h= hash parameter..."

    # Some private videos need an unlisted hash — try common patterns
    # The hash is usually in the original embed src: /video/ID?h=HASH
    echo "  TIP: Check the iframe src on the page for ?h=XXXXX parameter"
    echo "  Then run: $0 ${VIDEO_ID}?h=YOUR_HASH ${REFERER}"

    # Also try the oembed endpoint to discover the hash
    echo ""
    echo ">>> Trying oEmbed discovery..."
    OEMBED=$(curl -s "https://vimeo.com/api/oembed.json?url=https://vimeo.com/${VIDEO_ID}" \
        "${CURL_HEADERS[@]}" 2>/dev/null || echo "{}")
    echo "$OEMBED" | python3 -m json.tool 2>/dev/null | head -20 || echo "  oEmbed failed too"
fi

if [[ ! -s "$OUTPUT_DIR/embed.html" ]]; then
    echo "FATAL: Empty response. Cannot proceed."
    exit 1
fi

# --- Step 2: Extract the player config JSON ---
echo ""
echo ">>> Step 2: Extracting player config..."

# Method A: window.playerConfig = {...}
# Method B: data-config-url="..." attribute (fetch that URL)
# Method C: var config = {...} in inline script
# Method D: JSON embedded in a specific script tag

python3 << 'PYEOF' > "$OUTPUT_DIR/config.json" 2>"$OUTPUT_DIR/extract_log.txt"
import re, json, sys

with open(f"{sys.argv[1]}/embed.html", "r", errors="replace") as f:
    html = f.read()

config = None

# Method A: playerConfig assignment
m = re.search(r'window\.playerConfig\s*=\s*(\{.+?\})\s*;?\s*\n', html, re.DOTALL)
if m:
    print("Method A: playerConfig", file=sys.stderr)
    config = m.group(1)

# Method B: data-config-url
if not config:
    m = re.search(r'data-config-url="([^"]+)"', html)
    if m:
        url = m.group(1).replace("&amp;", "&")
        print(f"Method B: config URL found: {url}", file=sys.stderr)
        # Write URL to file for curl to fetch
        with open(f"{sys.argv[1]}/config_url.txt", "w") as uf:
            uf.write(url)
        sys.exit(0)

# Method C: var config = {...}
if not config:
    m = re.search(r'var\s+config\s*=\s*(\{.+?\})\s*;', html, re.DOTALL)
    if m:
        print("Method C: var config", file=sys.stderr)
        config = m.group(1)

# Method D: Look for text_tracks in any JSON blob
if not config:
    matches = re.findall(r'(\{[^{}]{100,}?"text_tracks"[^{}]*\})', html)
    if matches:
        print(f"Method D: found {len(matches)} JSON blobs with text_tracks", file=sys.stderr)
        config = matches[0]

# Method E: Find any large JSON that looks like Vimeo config
if not config:
    # Look for JSON objects with "request" key (Vimeo config structure)
    for m in re.finditer(r'(\{"cdn_url".+?\})\s*;', html, re.DOTALL):
        print("Method E: cdn_url JSON", file=sys.stderr)
        config = m.group(1)
        break

# Method F: Extract ALL JSON-like objects and find the one with text_tracks
if not config:
    # Greedy: find the biggest JSON blob
    all_json = re.findall(r'(?:=\s*|>\s*)(\{.{500,}?\})\s*[;<]', html, re.DOTALL)
    for blob in all_json:
        if "text_tracks" in blob or "captions" in blob or "request" in blob:
            print(f"Method F: large blob ({len(blob)} chars)", file=sys.stderr)
            config = blob
            break

if config:
    # Try to parse and re-serialize clean JSON
    try:
        parsed = json.loads(config)
        json.dump(parsed, sys.stdout, indent=2)
    except json.JSONDecodeError:
        # Might have trailing JS — try truncating
        for end in range(len(config), max(0, len(config)-200), -1):
            try:
                parsed = json.loads(config[:end])
                json.dump(parsed, sys.stdout, indent=2)
                break
            except:
                continue
        else:
            # Dump raw for manual inspection
            print(config, file=sys.stdout)
            print("WARNING: Could not parse as JSON", file=sys.stderr)
else:
    print("No config found in HTML", file=sys.stderr)
    # Dump interesting parts of HTML for debugging
    for pattern in ["text_track", "caption", "subtitle", "\.vtt", "skyfire"]:
        lines = [l.strip() for l in html.split("\n") if re.search(pattern, l, re.IGNORECASE)]
        if lines:
            print(f"\nLines matching '{pattern}':", file=sys.stderr)
            for l in lines[:3]:
                print(f"  {l[:200]}", file=sys.stderr)
    sys.exit(1)
PYEOF

EXTRACT_STATUS=$?
cat "$OUTPUT_DIR/extract_log.txt"

# If Method B found a config URL, fetch it
if [[ -f "$OUTPUT_DIR/config_url.txt" ]]; then
    CONFIG_URL=$(cat "$OUTPUT_DIR/config_url.txt")
    echo "  Fetching config from: ${CONFIG_URL:0:80}..."
    curl -s "${CURL_HEADERS[@]}" "$CONFIG_URL" -o "$OUTPUT_DIR/config.json"
fi

if [[ $EXTRACT_STATUS -ne 0 ]] && [[ ! -s "$OUTPUT_DIR/config.json" ]]; then
    echo ""
    echo "FAILED: Could not extract config. Dumping HTML structure for debugging:"
    echo "  File: $OUTPUT_DIR/embed.html"
    echo "  Size: $(wc -c < "$OUTPUT_DIR/embed.html") bytes"
    echo ""
    echo "  Script tags found:"
    grep -c "<script" "$OUTPUT_DIR/embed.html" || echo "  0"
    echo ""
    echo "  Interesting strings:"
    grep -oi "text.track\|caption\|subtitle\|\.vtt\|skyfire" "$OUTPUT_DIR/embed.html" | sort | uniq -c | sort -rn || echo "  none"
    exit 1
fi

# --- Step 3: Extract text track URLs from config ---
echo ""
echo ">>> Step 3: Extracting text track URLs..."

python3 << 'PYEOF' > "$OUTPUT_DIR/tracks.txt" 2>&1
import json, sys

try:
    with open(f"/tmp/vimeo_captions_{sys.argv[1]}/config.json") as f:
        data = json.load(f)
except (json.JSONDecodeError, FileNotFoundError) as e:
    print(f"ERROR: Cannot parse config: {e}")
    sys.exit(1)

# Navigate the config to find text tracks
# Vimeo config structure: .request.text_tracks[]
tracks = []

# Try multiple paths
for path_fn in [
    lambda d: d.get("request", {}).get("text_tracks", []),
    lambda d: d.get("text_tracks", []),
    lambda d: d.get("captions", []),
    lambda d: d.get("subtitles", []),
]:
    try:
        t = path_fn(data)
        if t:
            tracks = t
            break
    except:
        continue

# Deep search if standard paths fail
if not tracks:
    def find_tracks(obj, depth=0):
        if depth > 10:
            return []
        if isinstance(obj, dict):
            if "text_tracks" in obj:
                return obj["text_tracks"]
            for v in obj.values():
                result = find_tracks(v, depth + 1)
                if result:
                    return result
        elif isinstance(obj, list):
            for item in obj:
                result = find_tracks(item, depth + 1)
                if result:
                    return result
        return []
    tracks = find_tracks(data)

if not tracks:
    print("NO TEXT TRACKS FOUND in config.")
    print("")
    print("This video may not have captions enabled.")
    print("Available top-level keys:", list(data.keys()) if isinstance(data, dict) else "not a dict")
    if isinstance(data, dict) and "request" in data:
        print("request keys:", list(data["request"].keys()))
    sys.exit(1)

print(f"Found {len(tracks)} text track(s):")
for i, track in enumerate(tracks):
    lang = track.get("lang", "unknown")
    kind = track.get("kind", "unknown")
    label = track.get("label", "")
    url = track.get("url", track.get("direct_url", track.get("src", "")))
    print(f"  [{i}] {lang} ({kind}) {label}")
    print(f"      URL: {url}")

    # Save URL to file
    with open(f"/tmp/vimeo_captions_{sys.argv[1]}/track_{i}_{lang}.url", "w") as f:
        f.write(url)

PYEOF "$VIDEO_ID"

TRACK_STATUS=$?

if [[ $TRACK_STATUS -ne 0 ]]; then
    echo "No captions found. Options:"
    echo "  1. Video has no captions uploaded"
    echo "  2. Auto-generated captions need to be triggered via player API"
    echo "  3. Use Whisper fallback: whisper audio.aac --model base --output_format vtt"
    exit 1
fi

# --- Step 4: Download each caption track ---
echo ""
echo ">>> Step 4: Downloading caption files..."

for url_file in "$OUTPUT_DIR"/track_*.url; do
    [[ -f "$url_file" ]] || continue
    TRACK_URL=$(cat "$url_file")
    TRACK_NAME=$(basename "$url_file" .url)

    if [[ -z "$TRACK_URL" ]]; then
        echo "  Skipping $TRACK_NAME — no URL"
        continue
    fi

    # Caption URLs may be relative — prepend Vimeo CDN if needed
    if [[ "$TRACK_URL" == /* ]]; then
        TRACK_URL="https://player.vimeo.com${TRACK_URL}"
    elif [[ "$TRACK_URL" != http* ]]; then
        TRACK_URL="https://player.vimeo.com/video/${VIDEO_ID}/${TRACK_URL}"
    fi

    echo "  Downloading: $TRACK_NAME"
    curl -s "${CURL_HEADERS[@]}" "$TRACK_URL" -o "$OUTPUT_DIR/${TRACK_NAME}.vtt"

    if [[ -s "$OUTPUT_DIR/${TRACK_NAME}.vtt" ]]; then
        LINES=$(wc -l < "$OUTPUT_DIR/${TRACK_NAME}.vtt")
        echo "    OK — $LINES lines"

        # Convert VTT to plain text
        sed '/^WEBVTT/d; /^$/d; /^[0-9][0-9]:[0-9][0-9]/d; /^NOTE/d; /-->/d' \
            "$OUTPUT_DIR/${TRACK_NAME}.vtt" | \
            sed 's/<[^>]*>//g' | \
            awk '!seen[$0]++' > "$OUTPUT_DIR/${TRACK_NAME}.txt"

        echo "    Plain text: $OUTPUT_DIR/${TRACK_NAME}.txt"
    else
        echo "    FAILED — empty response"
    fi
done

echo ""
echo "=== DONE ==="
echo "Files saved to: $OUTPUT_DIR/"
ls -la "$OUTPUT_DIR/"*.vtt "$OUTPUT_DIR/"*.txt 2>/dev/null || echo "No caption files downloaded."
